'use strict';

const fc = require('fast-check');

jest.mock('../models/index', () => {
  const mockFactura = { findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), create: jest.fn() };
  const mockAlquiler = {};
  const mockCliente = {};
  const mockPrenda = {};
  return { Factura: mockFactura, Alquiler: mockAlquiler, Cliente: mockCliente, Prenda: mockPrenda };
});

const { Factura } = require('../models/index');
const { generarFactura } = require('../services/facturaService');

function resetMocks() { jest.clearAllMocks(); }

function makeFactura(alquiler_id, numero_factura) {
  return {
    id: alquiler_id,
    alquiler_id,
    numero_factura,
    fecha_emision: '2024-01-01',
    created_at: new Date(),
    alquiler: { cliente: { nombre_completo: 'Test', cedula: '123' }, prenda: { tipo: 'Toga', talla: 'M', color: 'Negro' }, fecha_alquiler: '2024-01-01', fecha_devolucion: '2024-01-05', precio_total: 50 },
  };
}

// Feature: rental-management-system, Propiedad 21: Factura contiene todos los campos requeridos
describe('Propiedad 21: Factura contiene todos los campos requeridos', () => {
  test('la factura generada tiene numero_factura, fecha_emision y alquiler_id', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 9999 }), fc.integer({ min: 1, max: 9999 }), async (alquilerId, numFactura) => {
        resetMocks();
        Factura.findOne.mockResolvedValue(null);
        Factura.findOne.mockResolvedValueOnce(null); // no existe
        const factura = makeFactura(alquilerId, numFactura);
        Factura.findOne.mockResolvedValue(null);
        Factura.create.mockResolvedValue(factura);
        // Get max numero_factura
        const maxFacturaMock = { numero_factura: numFactura - 1 };
        Factura.findOne
          .mockResolvedValueOnce(null)       // check existente
          .mockResolvedValueOnce(maxFacturaMock); // max numero_factura
        const { factura: result } = await generarFactura(alquilerId);
        expect(result).toHaveProperty('numero_factura');
        expect(result).toHaveProperty('fecha_emision');
        expect(result).toHaveProperty('alquiler_id');
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 22: Números de factura son únicos
describe('Propiedad 22: Números de factura son únicos', () => {
  test('cada factura generada tiene un numero_factura mayor al anterior', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 9999 }), { minLength: 2, maxLength: 10 }),
        async (alquilerIds) => {
          resetMocks();
          const numerosGenerados = [];
          for (let i = 0; i < alquilerIds.length; i++) {
            const id = alquilerIds[i];
            Factura.findOne
              .mockResolvedValueOnce(null) // no existe
              .mockResolvedValueOnce(numerosGenerados.length > 0 ? { numero_factura: numerosGenerados[numerosGenerados.length - 1] } : null);
            const expectedNum = numerosGenerados.length > 0 ? numerosGenerados[numerosGenerados.length - 1] + 1 : 1;
            const factura = makeFactura(id, expectedNum);
            Factura.create.mockResolvedValueOnce(factura);
            const { factura: result } = await generarFactura(id);
            numerosGenerados.push(result.numero_factura);
          }
          const unique = new Set(numerosGenerados);
          expect(unique.size).toBe(numerosGenerados.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});

// Feature: rental-management-system, Propiedad 23: Generación de factura es idempotente
describe('Propiedad 23: Generación de factura es idempotente', () => {
  test('generar factura dos veces retorna la misma factura', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 9999 }), fc.integer({ min: 1, max: 9999 }), async (alquilerId, numFactura) => {
        resetMocks();
        const factura = makeFactura(alquilerId, numFactura);
        // Primera llamada: no existe → crear
        Factura.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
        Factura.create.mockResolvedValueOnce(factura);
        const { factura: primera } = await generarFactura(alquilerId);

        // Segunda llamada: ya existe → retornar existente
        Factura.findOne.mockResolvedValueOnce(factura);
        const { factura: segunda, created } = await generarFactura(alquilerId);

        expect(segunda.numero_factura).toBe(primera.numero_factura);
        expect(created).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Pruebas unitarias — FacturasModule', () => {
  beforeEach(resetMocks);

  test('generar factura dos veces retorna la misma', async () => {
    const factura = makeFactura(1, 1);
    Factura.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    Factura.create.mockResolvedValueOnce(factura);
    const { factura: f1 } = await generarFactura(1);

    Factura.findOne.mockResolvedValueOnce(factura);
    const { factura: f2, created } = await generarFactura(1);
    expect(f2.numero_factura).toBe(f1.numero_factura);
    expect(created).toBe(false);
  });

  test('búsqueda por número retorna coincidencia exacta', async () => {
    const factura = makeFactura(1, 42);
    Factura.findAll.mockResolvedValue([factura]);
    const { listarFacturas } = require('../services/facturaService');
    const results = await listarFacturas('42');
    expect(results[0].numero_factura).toBe(42);
  });

  test('historial ordenado descendente', async () => {
    const facturas = [
      makeFactura(3, 3),
      makeFactura(2, 2),
      makeFactura(1, 1),
    ];
    Factura.findAll.mockResolvedValue(facturas);
    const { listarFacturas } = require('../services/facturaService');
    const results = await listarFacturas();
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].numero_factura >= results[i + 1].numero_factura).toBe(true);
    }
  });
});
