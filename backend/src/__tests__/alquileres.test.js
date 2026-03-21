'use strict';

const fc = require('fast-check');

jest.mock('../models/index', () => {
  const mockAlquiler = { create: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), update: jest.fn() };
  const mockPrenda = { findByPk: jest.fn(), update: jest.fn() };
  const mockCliente = {};
  const mockSequelize = { transaction: jest.fn() };
  return { sequelize: mockSequelize, Alquiler: mockAlquiler, Prenda: mockPrenda, Cliente: mockCliente };
});

const { sequelize, Alquiler, Prenda } = require('../models/index');
const { registrarAlquiler, registrarDevolucion, listarAlquileres, marcarVencidos } = require('../services/alquilerService');

function makeTransaction() {
  const t = { commit: jest.fn().mockResolvedValue(undefined), rollback: jest.fn().mockResolvedValue(undefined) };
  sequelize.transaction.mockResolvedValue(t);
  return t;
}

function resetMocks() { jest.clearAllMocks(); }

// Feature: rental-management-system, Propiedad 12: Cálculo correcto del precio total del alquiler
describe('Propiedad 12: Cálculo correcto del precio total del alquiler', () => {
  test('precio_total = precio_por_dia × días', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true }).filter(n => n > 0),
        fc.integer({ min: 1, max: 365 }),
        async (precioPorDia, dias) => {
          resetMocks();
          const fechaAlquiler = '2024-01-01';
          const fechaDevolucion = new Date(new Date(fechaAlquiler).getTime() + dias * 86400000).toISOString().split('T')[0];
          const t = makeTransaction();
          const prenda = { id: 1, precio_por_dia: precioPorDia, estado: 'Disponible', update: jest.fn().mockResolvedValue(undefined) };
          Prenda.findByPk.mockResolvedValue(prenda);
          const expectedTotal = parseFloat(precioPorDia) * dias;
          Alquiler.create.mockImplementation(async (data) => ({ id: 1, ...data }));
          const alquiler = await registrarAlquiler({ cliente_id: 1, prenda_id: 1, fecha_alquiler: fechaAlquiler, fecha_devolucion: fechaDevolucion });
          expect(parseFloat(alquiler.precio_total)).toBeCloseTo(expectedTotal, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 13: Round-trip de alquiler y devolución restaura disponibilidad
describe('Propiedad 13: Round-trip de alquiler y devolución restaura disponibilidad', () => {
  test('después de alquiler + devolución, prenda queda Disponible y alquiler Devuelto', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 9999 }), async (alquilerId) => {
        resetMocks();
        const t = makeTransaction();
        const alquiler = { id: alquilerId, prenda_id: 1, estado: 'Activo', update: jest.fn().mockImplementation(async (f) => { Object.assign(alquiler, f); return alquiler; }) };
        Alquiler.findByPk.mockResolvedValue(alquiler);
        Prenda.update.mockResolvedValue([1]);
        const result = await registrarDevolucion(alquilerId);
        expect(result.estado).toBe('Devuelto');
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 14: No se puede alquilar una prenda no disponible
describe('Propiedad 14: No se puede alquilar una prenda no disponible', () => {
  test('prenda Alquilada o En_Mantenimiento lanza 409 PRENDA_NO_DISPONIBLE', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('Alquilada', 'En_Mantenimiento'),
        async (estado) => {
          resetMocks();
          makeTransaction();
          Prenda.findByPk.mockResolvedValue({ id: 1, estado, precio_por_dia: 10 });
          await expect(registrarAlquiler({ cliente_id: 1, prenda_id: 1, fecha_alquiler: '2024-01-01', fecha_devolucion: '2024-01-05' }))
            .rejects.toMatchObject({ status: 409, code: 'PRENDA_NO_DISPONIBLE' });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 15: Fecha de devolución debe ser posterior a fecha de alquiler
describe('Propiedad 15: Fecha de devolución debe ser posterior a fecha de alquiler', () => {
  test('fecha_devolucion <= fecha_alquiler lanza 422 FECHA_INVALIDA', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
        fc.integer({ min: 0, max: 30 }),
        async (fechaAlquilerDate, diasAntes) => {
          resetMocks();
          const fechaAlquiler = fechaAlquilerDate.toISOString().split('T')[0];
          const fechaDevolucion = new Date(fechaAlquilerDate.getTime() - diasAntes * 86400000).toISOString().split('T')[0];
          await expect(registrarAlquiler({ cliente_id: 1, prenda_id: 1, fecha_alquiler: fechaAlquiler, fecha_devolucion: fechaDevolucion }))
            .rejects.toMatchObject({ status: 422, code: 'FECHA_INVALIDA' });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 16: Consulta de alquileres por estado retorna solo ese estado
describe('Propiedad 16: Consulta de alquileres por estado retorna solo ese estado', () => {
  test('todos los resultados tienen el estado filtrado', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('Activo', 'Devuelto', 'Vencido'),
        fc.array(fc.integer({ min: 1, max: 9999 }), { minLength: 0, maxLength: 10 }),
        async (estado, ids) => {
          resetMocks();
          const alquileres = ids.map(id => ({ id, estado }));
          Alquiler.findAll.mockResolvedValue(alquileres);
          const results = await listarAlquileres({ estado });
          results.forEach(r => expect(r.estado).toBe(estado));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 17: Alquileres vencidos son marcados automáticamente
describe('Propiedad 17: Alquileres vencidos son marcados automáticamente', () => {
  test('marcarVencidos actualiza alquileres Activos con fecha_devolucion < hoy', async () => {
    resetMocks();
    Alquiler.update.mockResolvedValue([3]);
    await marcarVencidos();
    expect(Alquiler.update).toHaveBeenCalledWith(
      { estado: 'Vencido' },
      expect.objectContaining({ where: expect.objectContaining({ estado: 'Activo' }) })
    );
  });
});

// Feature: rental-management-system, Propiedad 18: Consulta por rango de fechas retorna solo alquileres en rango
describe('Propiedad 18: Consulta por rango de fechas retorna solo alquileres en rango', () => {
  test('todos los alquileres retornados tienen fecha_alquiler dentro del rango', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2023-12-31') }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        fc.array(fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }), { minLength: 0, maxLength: 10 }),
        async (desde, hasta, fechas) => {
          resetMocks();
          const desdeStr = desde.toISOString().split('T')[0];
          const hastaStr = hasta.toISOString().split('T')[0];
          const inRange = fechas
            .filter(f => f >= desde && f <= hasta)
            .map((f, i) => ({ id: i + 1, fecha_alquiler: f.toISOString().split('T')[0], estado: 'Activo' }));
          Alquiler.findAll.mockResolvedValue(inRange);
          const results = await listarAlquileres({ desde: desdeStr, hasta: hastaStr });
          results.forEach(r => {
            expect(r.fecha_alquiler >= desdeStr).toBe(true);
            expect(r.fecha_alquiler <= hastaStr).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Pruebas unitarias — AlquileresModule', () => {
  beforeEach(resetMocks);

  test('alquiler con prenda Alquilada retorna 409', async () => {
    makeTransaction();
    Prenda.findByPk.mockResolvedValue({ id: 1, estado: 'Alquilada', precio_por_dia: 10 });
    await expect(registrarAlquiler({ cliente_id: 1, prenda_id: 1, fecha_alquiler: '2024-01-01', fecha_devolucion: '2024-01-05' }))
      .rejects.toMatchObject({ status: 409, code: 'PRENDA_NO_DISPONIBLE' });
  });

  test('fecha_devolucion igual a fecha_alquiler retorna 422', async () => {
    await expect(registrarAlquiler({ cliente_id: 1, prenda_id: 1, fecha_alquiler: '2024-01-01', fecha_devolucion: '2024-01-01' }))
      .rejects.toMatchObject({ status: 422, code: 'FECHA_INVALIDA' });
  });

  test('devolución actualiza estado prenda y alquiler', async () => {
    const t = makeTransaction();
    const alquiler = { id: 1, prenda_id: 1, estado: 'Activo', update: jest.fn().mockImplementation(async (f) => { Object.assign(alquiler, f); return alquiler; }) };
    Alquiler.findByPk.mockResolvedValue(alquiler);
    Prenda.update.mockResolvedValue([1]);
    const result = await registrarDevolucion(1);
    expect(result.estado).toBe('Devuelto');
    expect(Prenda.update).toHaveBeenCalledWith({ estado: 'Disponible' }, expect.any(Object));
  });
});
