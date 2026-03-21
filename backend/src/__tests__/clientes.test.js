'use strict';

const fc = require('fast-check');

jest.mock('../models/index', () => {
  const mockCliente = { create: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn() };
  const mockAlquiler = { findOne: jest.fn(), findAll: jest.fn() };
  return { Cliente: mockCliente, Alquiler: mockAlquiler };
});

const { Cliente, Alquiler } = require('../models/index');
const { crearCliente, editarCliente, eliminarCliente, buscarClientes, obtenerHistorial } = require('../services/clienteService');

const emailValidoArb = fc.emailAddress();
const emailInvalidoArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@'));
const cedulaArb = fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0);
const nombreArb = fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length > 0);

const clienteDataArb = fc.record({
  nombre_completo: nombreArb,
  cedula: cedulaArb,
  telefono: fc.string({ minLength: 7, maxLength: 15 }),
  direccion: fc.string({ minLength: 5, maxLength: 100 }),
  email: emailValidoArb,
});

function resetMocks() { jest.clearAllMocks(); }

// Feature: rental-management-system, Propiedad 7: Unicidad de cédula de cliente
describe('Propiedad 7: Unicidad de cédula de cliente', () => {
  test('registrar dos clientes con la misma cédula lanza 409 CEDULA_DUPLICADA', async () => {
    await fc.assert(
      fc.asyncProperty(clienteDataArb, async (data) => {
        resetMocks();
        Cliente.findOne.mockResolvedValue({ id: 1, cedula: data.cedula }); // cedula ya existe
        await expect(crearCliente(data)).rejects.toMatchObject({ status: 409, code: 'CEDULA_DUPLICADA' });
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 8: Validación de formato de email
describe('Propiedad 8: Validación de formato de email', () => {
  test('email sin @ es rechazado con 422 EMAIL_INVALIDO', async () => {
    await fc.assert(
      fc.asyncProperty(clienteDataArb, emailInvalidoArb, async (data, emailInvalido) => {
        resetMocks();
        await expect(crearCliente({ ...data, email: emailInvalido })).rejects.toMatchObject({ status: 422, code: 'EMAIL_INVALIDO' });
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 9: Búsqueda retorna solo coincidencias
describe('Propiedad 9: Búsqueda retorna solo coincidencias', () => {
  test('todos los resultados contienen el término buscado en nombre o cédula', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 2, maxLength: 10 }).filter(s => s.trim().length > 0),
        fc.array(clienteDataArb, { minLength: 0, maxLength: 5 }),
        async (q, clientes) => {
          resetMocks();
          const matching = clientes
            .filter((c, i) => i % 2 === 0)
            .map((c, i) => ({ id: i + 1, ...c, nombre_completo: `${c.nombre_completo} ${q}` }));
          Cliente.findAll.mockResolvedValue(matching);
          const results = await buscarClientes(q);
          for (const r of results) {
            const contiene = r.nombre_completo.includes(q) || r.cedula.includes(q);
            expect(contiene).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 10: Historial ordenado por fecha descendente
describe('Propiedad 10: Historial ordenado por fecha descendente', () => {
  test('el historial retornado está ordenado de mayor a menor por fecha_alquiler', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 9999 }),
        fc.array(fc.record({ fecha_alquiler: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }) }), { minLength: 2, maxLength: 10 }),
        async (clienteId, alquileres) => {
          resetMocks();
          const sorted = [...alquileres].sort((a, b) => new Date(b.fecha_alquiler) - new Date(a.fecha_alquiler));
          Cliente.findByPk.mockResolvedValue({ id: clienteId });
          Alquiler.findAll.mockResolvedValue(sorted);
          const result = await obtenerHistorial(clienteId);
          for (let i = 0; i < result.length - 1; i++) {
            expect(new Date(result[i].fecha_alquiler) >= new Date(result[i + 1].fecha_alquiler)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 11: No se puede eliminar cliente con alquileres activos
describe('Propiedad 11: No se puede eliminar cliente con alquileres activos', () => {
  test('eliminarCliente lanza 409 CLIENTE_CON_ALQUILERES si tiene alquiler activo', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 9999 }), clienteDataArb, async (id, data) => {
        resetMocks();
        Cliente.findByPk.mockResolvedValue({ id, ...data });
        Alquiler.findOne.mockResolvedValue({ id: 1, estado: 'Activo' });
        await expect(eliminarCliente(id)).rejects.toMatchObject({ status: 409, code: 'CLIENTE_CON_ALQUILERES' });
      }),
      { numRuns: 100 }
    );
  });
});

describe('Pruebas unitarias — ClientesModule', () => {
  beforeEach(resetMocks);

  test('cédula duplicada retorna 409', async () => {
    Cliente.findOne.mockResolvedValue({ id: 1, cedula: '12345' });
    await expect(crearCliente({ nombre_completo: 'Test', cedula: '12345', telefono: '555', direccion: 'Calle', email: 'a@b.com' }))
      .rejects.toMatchObject({ status: 409, code: 'CEDULA_DUPLICADA' });
  });

  test('email inválido retorna 422', async () => {
    await expect(crearCliente({ nombre_completo: 'Test', cedula: '99999', telefono: '555', direccion: 'Calle', email: 'no-es-email' }))
      .rejects.toMatchObject({ status: 422, code: 'EMAIL_INVALIDO' });
  });

  test('eliminar cliente con alquiler activo retorna 409', async () => {
    Cliente.findByPk.mockResolvedValue({ id: 1, nombre_completo: 'Test' });
    Alquiler.findOne.mockResolvedValue({ id: 1, estado: 'Activo' });
    await expect(eliminarCliente(1)).rejects.toMatchObject({ status: 409, code: 'CLIENTE_CON_ALQUILERES' });
  });
});
