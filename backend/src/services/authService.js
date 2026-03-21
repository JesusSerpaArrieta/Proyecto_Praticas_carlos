'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario, IntentoLogin } = require('../models/index');

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

/**
 * Registra un intento fallido para el email dado.
 * Si alcanza MAX_INTENTOS, establece bloqueado_hasta = ahora + 15 min.
 */
async function registrarIntentoFallido(email) {
  const [registro] = await IntentoLogin.findOrCreate({
    where: { email },
    defaults: { intentos_fallidos: 0, bloqueado_hasta: null, updated_at: new Date() },
  });

  const nuevosIntentos = registro.intentos_fallidos + 1;
  const bloqueado_hasta =
    nuevosIntentos >= MAX_INTENTOS
      ? new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000)
      : null;

  await registro.update({ intentos_fallidos: nuevosIntentos, bloqueado_hasta, updated_at: new Date() });
}

/**
 * Resetea los intentos fallidos tras un login exitoso.
 */
async function resetearIntentos(email) {
  await IntentoLogin.update(
    { intentos_fallidos: 0, bloqueado_hasta: null, updated_at: new Date() },
    { where: { email } }
  );
}

/**
 * Intenta autenticar al usuario con email y password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} JWT token
 * @throws {{ status, code, message }}
 */
async function login(email, password) {
  // 1. Verificar si el email está bloqueado
  const intento = await IntentoLogin.findOne({ where: { email } });
  if (intento && intento.bloqueado_hasta && intento.bloqueado_hasta > new Date()) {
    throw { status: 429, code: 'CUENTA_BLOQUEADA', message: 'Cuenta bloqueada temporalmente. Intente de nuevo en 15 minutos.' };
  }

  // 2. Buscar usuario por email
  const usuario = await Usuario.findOne({ where: { email } });

  // 3. Validar usuario y contraseña (error genérico para no revelar cuál campo falla)
  const passwordValida = usuario ? await bcrypt.compare(password, usuario.password_hash) : false;

  if (!usuario || !passwordValida) {
    await registrarIntentoFallido(email);

    // Re-leer para saber si acaba de bloquearse
    const intentoActualizado = await IntentoLogin.findOne({ where: { email } });
    if (intentoActualizado && intentoActualizado.bloqueado_hasta && intentoActualizado.bloqueado_hasta > new Date()) {
      throw { status: 429, code: 'CUENTA_BLOQUEADA', message: 'Cuenta bloqueada temporalmente. Intente de nuevo en 15 minutos.' };
    }

    throw { status: 401, code: 'CREDENCIALES_INVALIDAS', message: 'Credenciales incorrectas.' };
  }

  // 4. Login exitoso: resetear intentos y generar JWT
  await resetearIntentos(email);

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return token;
}

module.exports = { login };
