const { Prenda } = require('../models/index');
const { normalizeResult } = require('../utils/normalizeResult');

const ESTADOS_MANUALES = ['Disponible', 'En_Mantenimiento'];

async function crearPrenda({ tipo, talla, color, precio_por_dia, foto_url }) {
  if (!precio_por_dia || Number(precio_por_dia) <= 0) {
    throw { status: 422, code: 'PRECIO_INVALIDO', message: 'El precio debe ser mayor a cero.' };
  }
  return Prenda.create({ tipo, talla, color, precio_por_dia, foto_url: foto_url || null, estado: 'Disponible' });
}

async function editarPrenda(id, campos) {
  const prenda = await Prenda.findByPk(id);
  if (!prenda) throw { status: 404, code: 'PRENDA_NO_ENCONTRADA', message: 'Prenda no encontrada.' };
  if (campos.precio_por_dia !== undefined && Number(campos.precio_por_dia) <= 0) {
    throw { status: 422, code: 'PRECIO_INVALIDO', message: 'El precio debe ser mayor a cero.' };
  }
  await prenda.update(campos);
  return prenda;
}

async function eliminarPrenda(id) {
  const prenda = await Prenda.findByPk(id);
  if (!prenda) throw { status: 404, code: 'PRENDA_NO_ENCONTRADA', message: 'Prenda no encontrada.' };
  if (prenda.estado === 'Alquilada') {
    throw { status: 409, code: 'PRENDA_ALQUILADA', message: 'No se puede eliminar una prenda con alquiler activo.' };
  }
  await prenda.destroy();
  return { deleted: true };
}

async function listarPrendas({ estado, tipo, talla, color } = {}) {
  const where = {};
  if (estado !== undefined) where.estado = estado;
  if (tipo !== undefined) where.tipo = tipo;
  if (talla !== undefined) where.talla = talla;
  if (color !== undefined) where.color = color;
  return normalizeResult(await Prenda.findAll({ where }));
}

async function cambiarEstado(id, nuevoEstado) {
  if (!ESTADOS_MANUALES.includes(nuevoEstado)) {
    throw { status: 422, code: 'ESTADO_INVALIDO', message: `Estado no válido. Permitidos: ${ESTADOS_MANUALES.join(', ')}.` };
  }
  const prenda = await Prenda.findByPk(id);
  if (!prenda) throw { status: 404, code: 'PRENDA_NO_ENCONTRADA', message: 'Prenda no encontrada.' };
  await prenda.update({ estado: nuevoEstado });
  return prenda;
}

module.exports = { crearPrenda, editarPrenda, eliminarPrenda, listarPrendas, cambiarEstado };
