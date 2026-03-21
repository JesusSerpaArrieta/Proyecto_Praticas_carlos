'use strict';

const fc = require('fast-check');

jest.mock('../models/index', () => {
  const mockPrenda = { findAll: jest.fn(), findByPk: jest.fn(), update: jest.fn() };
  const mockAlquiler = {};
  const mockCliente = {};
  return { Prenda: mockPrenda, Alquiler: mockAlquiler, Cliente: mockCliente };
});

// Mock sequelize for Sequelize.fn/col
jest.mock('sequelize', () => {
  const actual = jest.requireActual('sequelize');
  return { ...actual, Sequelize: { fn: jest.fn((fn, col) => `${fn}(${col})`), col: jest.fn(c => c) } };
});

const { Prenda } = require('../models/index');
const { getDisponibilidad } = require('../services/disponibilidadService');
const { cambiarEstado } = require('../services/prendaService');

function resetMocks() { jest.clearAllMocks(); }

// Feature: rental-management-system, Propiedad 19: Los conteos de disponibilidad suman el total del inventario
describe('Propiedad 19: Los conteos de disponibilidad suman el total del inventario', () => {
  test('Disponible + Alquilada + En_Mantenimiento = total de prendas', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          disponible: fc.integer({ min: 0, max: 50 }),
          alquilada: fc.integer({ min: 0, max: 50 }),
          mantenimiento: fc.integer({ min: 0, max: 50 }),
        }),
        async ({ disponible, alquilada, mantenimiento }) => {
          resetMocks();
          const rows = [
            { estado: 'Disponible', total: disponible },
            { estado: 'Alquilada', total: alquilada },
            { estado: 'En_Mantenimiento', total: mantenimiento },
          ].filter(r => r.total > 0);
          Prenda.findAll.mockResolvedValue(rows);
          const result = await getDisponibilidad();
          const suma = result.Disponible + result.Alquilada + result.En_Mantenimiento;
          const total = disponible + alquilada + mantenimiento;
          expect(suma).toBe(total);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 20: Round-trip de estado de mantenimiento
describe('Propiedad 20: Round-trip de estado de mantenimiento', () => {
  test('cambiar a En_Mantenimiento y luego a Disponible restaura el estado', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 9999 }), async (id) => {
        resetMocks();
        const prenda = { id, estado: 'Disponible', update: jest.fn().mockImplementation(async (f) => { Object.assign(prenda, f); return prenda; }) };
        Prenda.findByPk.mockResolvedValue(prenda);

        // Cambiar a mantenimiento
        const enMant = await cambiarEstado(id, 'En_Mantenimiento');
        expect(enMant.estado).toBe('En_Mantenimiento');

        // Cambiar de vuelta a disponible
        const disponible = await cambiarEstado(id, 'Disponible');
        expect(disponible.estado).toBe('Disponible');
      }),
      { numRuns: 100 }
    );
  });
});

describe('Pruebas unitarias — DisponibilidadModule', () => {
  beforeEach(resetMocks);

  test('prenda en mantenimiento no aparece en disponibles', async () => {
    const prenda = { id: 1, estado: 'Disponible', update: jest.fn().mockImplementation(async (f) => { Object.assign(prenda, f); return prenda; }) };
    Prenda.findByPk.mockResolvedValue(prenda);
    const result = await cambiarEstado(1, 'En_Mantenimiento');
    expect(result.estado).toBe('En_Mantenimiento');
    expect(result.estado).not.toBe('Disponible');
  });

  test('cambio a Disponible la incluye nuevamente', async () => {
    const prenda = { id: 1, estado: 'En_Mantenimiento', update: jest.fn().mockImplementation(async (f) => { Object.assign(prenda, f); return prenda; }) };
    Prenda.findByPk.mockResolvedValue(prenda);
    const result = await cambiarEstado(1, 'Disponible');
    expect(result.estado).toBe('Disponible');
  });
});
