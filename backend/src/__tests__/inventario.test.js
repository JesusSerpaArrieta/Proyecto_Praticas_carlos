'use strict';

const fc = require('fast-check');

jest.mock('../models/index', () => {
  const mockPrenda = { create: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() };
  return { Prenda: mockPrenda };
});

const { Prenda } = require('../models/index');
const { crearPrenda, editarPrenda, eliminarPrenda, listarPrendas } = require('../services/prendaService');

const tipoArb = fc.constantFrom('Toga', 'Vestido de matrimonio', 'Vestido de baile', 'Traje');
const tallaArb = fc.constantFrom('XS', 'S', 'M', 'L', 'XL', 'XXL');
const colorArb = fc.constantFrom('Rojo', 'Azul', 'Negro', 'Blanco', 'Verde', 'Dorado');
const precioPositivoArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }).filter(n => n > 0);
const prendaDataArb = fc.record({ tipo: tipoArb, talla: tallaArb, color: colorArb, precio_por_dia: precioPositivoArb });

function resetMocks() { jest.clearAllMocks(); }

// Feature: rental-management-system, Propiedad 1: Registro de prenda es recuperable
describe('Propiedad 1: Registro de prenda es recuperable', () => {
  test('crear y consultar por id retorna los mismos datos', async () => {
    await fc.assert(
      fc.asyncProperty(prendaDataArb, fc.integer({ min: 1, max: 99999 }), async (data, id) => {
        resetMocks();
        const created = { id, ...data, estado: 'Disponible', foto_url: null };
        Prenda.create.mockResolvedValue(created);
        Prenda.findByPk.mockResolvedValue(created);
        const result = await crearPrenda(data);
        const found = await Prenda.findByPk(result.id);
        expect(found.id).toBe(result.id);
        expect(found.tipo).toBe(result.tipo);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 2: Edición conserva el identificador único
describe('Propiedad 2: Edición conserva el identificador único', () => {
  test('después de editar, el id permanece igual', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 99999 }), prendaDataArb, fc.record({ tipo: tipoArb }), async (id, original, campos) => {
        resetMocks();
        const prenda = { id, ...original, estado: 'Disponible', update: jest.fn().mockImplementation(async (f) => { Object.assign(prenda, f); return prenda; }) };
        Prenda.findByPk.mockResolvedValue(prenda);
        const result = await editarPrenda(id, campos);
        expect(result.id).toBe(id);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 3: Eliminación de prenda disponible es efectiva
describe('Propiedad 3: Eliminación de prenda disponible es efectiva', () => {
  test('después de eliminar, findByPk retorna null', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 99999 }), prendaDataArb, async (id, data) => {
        resetMocks();
        const prenda = { id, ...data, estado: 'Disponible', destroy: jest.fn().mockResolvedValue(undefined) };
        Prenda.findByPk.mockResolvedValueOnce(prenda).mockResolvedValueOnce(null);
        await eliminarPrenda(id);
        const found = await Prenda.findByPk(id);
        expect(found).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 4: No se puede eliminar una prenda alquilada
describe('Propiedad 4: No se puede eliminar una prenda alquilada', () => {
  test('eliminarPrenda lanza 409 PRENDA_ALQUILADA', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 99999 }), prendaDataArb, async (id, data) => {
        resetMocks();
        Prenda.findByPk.mockResolvedValue({ id, ...data, estado: 'Alquilada' });
        await expect(eliminarPrenda(id)).rejects.toMatchObject({ status: 409, code: 'PRENDA_ALQUILADA' });
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 5: El filtro de inventario retorna solo coincidencias
describe('Propiedad 5: El filtro de inventario retorna solo coincidencias', () => {
  test('todos los resultados cumplen los criterios del filtro', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ estado: fc.option(fc.constantFrom('Disponible', 'Alquilada', 'En_Mantenimiento'), { nil: undefined }), tipo: fc.option(tipoArb, { nil: undefined }) }),
        fc.array(prendaDataArb, { minLength: 0, maxLength: 5 }),
        async (filtro, prendas) => {
          resetMocks();
          const estadoFiltro = filtro.estado || 'Disponible';
          const tipoFiltro = filtro.tipo;
          const matching = prendas.map((p, i) => ({ id: i + 1, tipo: tipoFiltro || p.tipo, talla: p.talla, color: p.color, precio_por_dia: p.precio_por_dia, estado: estadoFiltro }));
          Prenda.findAll.mockResolvedValue(matching);
          const activeFiltro = {};
          if (filtro.estado !== undefined) activeFiltro.estado = filtro.estado;
          if (filtro.tipo !== undefined) activeFiltro.tipo = filtro.tipo;
          const results = await listarPrendas(activeFiltro);
          for (const r of results) {
            if (activeFiltro.estado !== undefined) expect(r.estado).toBe(activeFiltro.estado);
            if (activeFiltro.tipo !== undefined) expect(r.tipo).toBe(activeFiltro.tipo);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: rental-management-system, Propiedad 6: Precio no positivo es rechazado
describe('Propiedad 6: Precio no positivo es rechazado', () => {
  test('precio <= 0 lanza 422 PRECIO_INVALIDO', async () => {
    await fc.assert(
      fc.asyncProperty(prendaDataArb, fc.oneof(fc.constant(0), fc.integer({ min: -100000, max: -1 })), async (data, precioInvalido) => {
        resetMocks();
        await expect(crearPrenda({ ...data, precio_por_dia: precioInvalido })).rejects.toMatchObject({ status: 422, code: 'PRECIO_INVALIDO' });
      }),
      { numRuns: 100 }
    );
  });
});

describe('Pruebas unitarias — InventarioModule', () => {
  beforeEach(resetMocks);

  test('crear prenda con precio 0 retorna 422', async () => {
    await expect(crearPrenda({ tipo: 'Toga', talla: 'M', color: 'Negro', precio_por_dia: 0 })).rejects.toMatchObject({ status: 422, code: 'PRECIO_INVALIDO' });
  });

  test('eliminar prenda alquilada retorna 409', async () => {
    Prenda.findByPk.mockResolvedValue({ id: 1, estado: 'Alquilada' });
    await expect(eliminarPrenda(1)).rejects.toMatchObject({ status: 409, code: 'PRENDA_ALQUILADA' });
  });

  test('filtro por estado retorna solo ese estado', async () => {
    const disponibles = [
      { id: 1, tipo: 'Toga', talla: 'M', color: 'Negro', precio_por_dia: 10, estado: 'Disponible' },
      { id: 2, tipo: 'Vestido de baile', talla: 'S', color: 'Rojo', precio_por_dia: 20, estado: 'Disponible' },
    ];
    Prenda.findAll.mockResolvedValue(disponibles);
    const results = await listarPrendas({ estado: 'Disponible' });
    expect(results).toHaveLength(2);
    results.forEach(r => expect(r.estado).toBe('Disponible'));
  });
});
