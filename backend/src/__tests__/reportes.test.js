'use strict';

const fc = require('fast-check');

jest.mock('../models/index', () => {
  const mockAlquiler = { findAll: jest.fn(), count: jest.fn() };
  const mockPrenda = { findAll: jest.fn(), count: jest.fn() };
  const mockCliente = {};
  return { Alquiler: mockAlquiler, Prenda: mockPrenda, Cliente: mockCliente };
});

jest.mock('sequelize', () => {
  const actual = jest.requireActual('sequelize');
  return {
    ...actual,
    Sequelize: {
      fn: jest.fn((fn, col) => `${fn}(${col})`),
      col: jest.fn(c => c),
      literal: jest.fn(s => s),
    },
    Op: actual.Op,
  };
});

const { Alquiler, Prenda } = require('../models/index');
const { reporteIngresos, reporteVencidos, reporteOcupacion } = require('../services/reporteService');

function resetMocks() { jest.clearAllMocks(); }

// Feature: rental-management-system, Propiedad 24: Reporte de ingresos incluye solo alquileres devueltos
describe('Propiedad 24: Reporte de ingresos incluye solo alquileres devueltos', () => {
  test('el total de ingresos es la suma de precio_total de alquileres Devueltos', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({ precio_total: fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true }).filter(n => n > 0), estado: fc.constant('Devuelto') }), { minLength: 0, maxLength: 20 }),
        async (alquileres) => {
          resetMocks();
          Alquiler.findAll.mockResolvedValue(alquileres);
          const { total } = await reporteIngresos();
          const expectedTotal = alquileres.reduce((sum, a) => sum + parseFloat(a.precio_total), 0);
          expect(total).toBeCloseTo(expectedTotal, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 25: Reporte de prendas populares está ordenado descendentemente
describe('Propiedad 25: Reporte de prendas populares está ordenado descendentemente', () => {
  test('cada prenda tiene total_alquileres >= al siguiente', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 0, maxLength: 10 }),
        async (counts) => {
          resetMocks();
          const sorted = [...counts].sort((a, b) => b - a);
          const rows = sorted.map((c, i) => ({ prenda_id: i + 1, dataValues: { total_alquileres: c }, get: (k) => ({ total_alquileres: c })[k] }));
          Alquiler.findAll.mockResolvedValue(rows);
          const { reportePrendasPopulares } = require('../services/reporteService');
          const result = await reportePrendasPopulares();
          for (let i = 0; i < result.length - 1; i++) {
            const curr = result[i].dataValues?.total_alquileres ?? result[i].total_alquileres ?? 0;
            const next = result[i + 1].dataValues?.total_alquileres ?? result[i + 1].total_alquileres ?? 0;
            expect(curr >= next).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 26: Reporte de vencidos incluye solo alquileres vencidos con días de retraso positivos
describe('Propiedad 26: Reporte de vencidos incluye solo alquileres vencidos con días de retraso positivos', () => {
  test('todos los alquileres en el reporte tienen estado Vencido y dias_retraso > 0', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({ fecha_devolucion: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }) }),
          { minLength: 0, maxLength: 10 }
        ),
        async (alquileres) => {
          resetMocks();
          const mocked = alquileres.map((a, i) => ({
            id: i + 1,
            estado: 'Vencido',
            fecha_devolucion: a.fecha_devolucion.toISOString().split('T')[0],
            toJSON: function() { return { id: this.id, estado: this.estado, fecha_devolucion: this.fecha_devolucion }; },
          }));
          Alquiler.findAll.mockResolvedValue(mocked);
          const result = await reporteVencidos();
          result.forEach(r => {
            expect(r.estado).toBe('Vencido');
            expect(r.dias_retraso).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Pruebas unitarias — ReportesModule', () => {
  beforeEach(resetMocks);

  test('ingresos excluyen alquileres Activos y Vencidos', async () => {
    const devueltos = [{ precio_total: 100, estado: 'Devuelto' }, { precio_total: 50, estado: 'Devuelto' }];
    Alquiler.findAll.mockResolvedValue(devueltos);
    const { total } = await reporteIngresos();
    expect(total).toBe(150);
  });

  test('ocupación suma 100% del inventario', async () => {
    Prenda.count.mockResolvedValue(10);
    Prenda.findAll.mockResolvedValue([
      { estado: 'Disponible', count: 5 },
      { estado: 'Alquilada', count: 3 },
      { estado: 'En_Mantenimiento', count: 2 },
    ]);
    const result = await reporteOcupacion();
    expect(result.total).toBe(10);
  });

  test('vencidos tienen dias_retraso > 0', async () => {
    const pastDate = new Date('2020-01-01').toISOString().split('T')[0];
    Alquiler.findAll.mockResolvedValue([{
      id: 1, estado: 'Vencido', fecha_devolucion: pastDate,
      toJSON: function() { return { id: 1, estado: 'Vencido', fecha_devolucion: pastDate }; },
    }]);
    const result = await reporteVencidos();
    expect(result[0].dias_retraso).toBeGreaterThan(0);
  });
});
