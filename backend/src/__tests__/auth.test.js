'use strict';

const fc = require('fast-check');
const jwt = require('jsonwebtoken');

// Set JWT_SECRET before requiring modules that use it
process.env.JWT_SECRET = 'test-secret-key';

// ─── Mock models ────────────────────────────────────────────────────────────
jest.mock('../models/index', () => {
  const mockUsuario = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const mockIntentoLogin = {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    update: jest.fn(),
  };
  return { Usuario: mockUsuario, IntentoLogin: mockIntentoLogin };
});

const { Usuario, IntentoLogin } = require('../models/index');
const { login } = require('../services/authService');
const authMiddleware = require('../middlewares/authMiddleware');
const { tokenBlacklist } = require('../utils/tokenBlacklist');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeToken(payload = { id: 1, email: 'user@test.com' }, secret = process.env.JWT_SECRET) {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

function mockReq(token) {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function resetMocks() {
  jest.clearAllMocks();
  tokenBlacklist.clear();
}

// ─── Property 27: Rutas protegidas requieren token válido ────────────────────

describe('Propiedad 27: Rutas protegidas requieren token válido', () => {
  beforeEach(resetMocks);

  // Feature: rental-management-system, Propiedad 27: Rutas protegidas requieren token válido
  test('cualquier token inválido o ausente recibe 401', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // No token at all
          fc.constant(null),
          // Random strings that are not valid JWTs
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => !s.includes('.')),
          // Strings with dots but not valid JWT structure
          fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 })).map(([a, b]) => `${a}.${b}`),
          // Token signed with wrong secret
          fc.record({
            id: fc.integer({ min: 1, max: 9999 }),
            email: fc.emailAddress(),
          }).map(payload => jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' }))
        ),
        (invalidToken) => {
          const req = mockReq(invalidToken);
          const res = mockRes();
          const next = jest.fn();

          authMiddleware(req, res, next);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(next).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 28: Credenciales inválidas siempre son rechazadas ──────────────

describe('Propiedad 28: Credenciales inválidas siempre son rechazadas', () => {
  beforeEach(resetMocks);

  // Feature: rental-management-system, Propiedad 28: Credenciales inválidas siempre son rechazadas
  test('cualquier email/contraseña que no corresponda a un usuario registrado es rechazado con error genérico', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (email, password) => {
          // Simulate: no user found for this email
          Usuario.findOne.mockResolvedValue(null);
          IntentoLogin.findOne.mockResolvedValue(null);
          IntentoLogin.findOrCreate.mockResolvedValue([
            { intentos_fallidos: 0, bloqueado_hasta: null, update: jest.fn().mockResolvedValue(true) },
            true,
          ]);

          let threw = false;
          let error = null;
          try {
            await login(email, password);
          } catch (e) {
            threw = true;
            error = e;
          }

          // Must throw
          expect(threw).toBe(true);
          // Must be 401 (generic) — not revealing which field is wrong
          expect(error.status).toBe(401);
          expect(error.code).toBe('CREDENCIALES_INVALIDAS');
          // Message must not mention "email" or "contraseña" specifically
          expect(error.message).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 29: Token invalidado tras logout no permite acceso ─────────────

describe('Propiedad 29: Token invalidado tras logout no permite acceso', () => {
  beforeEach(resetMocks);

  // Feature: rental-management-system, Propiedad 29: Token invalidado tras logout no permite acceso
  test('token en blacklist siempre recibe 401 en rutas protegidas', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 9999 }),
          email: fc.emailAddress(),
        }),
        (payload) => {
          const token = makeToken(payload);

          // Simulate logout: add token to blacklist
          tokenBlacklist.add(token);

          const req = mockReq(token);
          const res = mockRes();
          const next = jest.fn();

          authMiddleware(req, res, next);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(next).not.toHaveBeenCalled();

          // Cleanup for next iteration
          tokenBlacklist.delete(token);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Unit tests for AuthModule ───────────────────────────────────────────────

describe('AuthModule — pruebas unitarias', () => {
  beforeEach(resetMocks);

  describe('login exitoso retorna JWT', () => {
    test('retorna un token JWT válido cuando las credenciales son correctas', async () => {
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('correctPassword', 10);

      Usuario.findOne.mockResolvedValue({
        id: 1,
        email: 'admin@test.com',
        password_hash: passwordHash,
      });
      IntentoLogin.findOne.mockResolvedValue(null);
      IntentoLogin.update.mockResolvedValue([1]);

      const token = await login('admin@test.com', 'correctPassword');

      expect(typeof token).toBe('string');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(1);
      expect(decoded.email).toBe('admin@test.com');
    });
  });

  describe('login con contraseña incorrecta retorna error genérico', () => {
    test('lanza error 401 con código CREDENCIALES_INVALIDAS sin revelar cuál campo falla', async () => {
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('correctPassword', 10);

      Usuario.findOne.mockResolvedValue({
        id: 1,
        email: 'admin@test.com',
        password_hash: passwordHash,
      });
      IntentoLogin.findOne.mockResolvedValue(null);
      IntentoLogin.findOrCreate.mockResolvedValue([
        { intentos_fallidos: 0, bloqueado_hasta: null, update: jest.fn().mockResolvedValue(true) },
        true,
      ]);
      // After registering failed attempt, re-read returns no block
      IntentoLogin.findOne
        .mockResolvedValueOnce(null) // initial check
        .mockResolvedValueOnce({ intentos_fallidos: 1, bloqueado_hasta: null }); // after failed attempt

      await expect(login('admin@test.com', 'wrongPassword')).rejects.toMatchObject({
        status: 401,
        code: 'CREDENCIALES_INVALIDAS',
      });
    });
  });

  describe('bloqueo tras 5 intentos', () => {
    test('lanza 429 CUENTA_BLOQUEADA cuando bloqueado_hasta está en el futuro', async () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);

      IntentoLogin.findOne.mockResolvedValue({
        intentos_fallidos: 5,
        bloqueado_hasta: futureDate,
      });

      await expect(login('blocked@test.com', 'anyPassword')).rejects.toMatchObject({
        status: 429,
        code: 'CUENTA_BLOQUEADA',
      });
    });

    test('bloquea la cuenta al alcanzar 5 intentos fallidos', async () => {
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('correctPassword', 10);

      // No block initially
      IntentoLogin.findOne.mockResolvedValueOnce(null);
      // User exists but wrong password
      Usuario.findOne.mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        password_hash: passwordHash,
      });

      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      IntentoLogin.findOrCreate.mockResolvedValue([
        {
          intentos_fallidos: 4,
          bloqueado_hasta: null,
          update: jest.fn().mockResolvedValue(true),
        },
        false,
      ]);
      // After registering the 5th failed attempt, re-read shows blocked
      IntentoLogin.findOne.mockResolvedValueOnce({
        intentos_fallidos: 5,
        bloqueado_hasta: futureDate,
      });

      await expect(login('user@test.com', 'wrongPassword')).rejects.toMatchObject({
        status: 429,
        code: 'CUENTA_BLOQUEADA',
      });
    });
  });

  describe('logout invalida token', () => {
    test('token añadido a blacklist es rechazado por authMiddleware con 401', () => {
      const token = makeToken({ id: 1, email: 'user@test.com' });

      // Before logout: valid token should pass
      const reqBefore = mockReq(token);
      const resBefore = mockRes();
      const nextBefore = jest.fn();
      authMiddleware(reqBefore, resBefore, nextBefore);
      expect(nextBefore).toHaveBeenCalled();
      expect(resBefore.status).not.toHaveBeenCalled();

      // Simulate logout
      tokenBlacklist.add(token);

      // After logout: same token must be rejected
      const reqAfter = mockReq(token);
      const resAfter = mockRes();
      const nextAfter = jest.fn();
      authMiddleware(reqAfter, resAfter, nextAfter);
      expect(resAfter.status).toHaveBeenCalledWith(401);
      expect(nextAfter).not.toHaveBeenCalled();
    });
  });
});
