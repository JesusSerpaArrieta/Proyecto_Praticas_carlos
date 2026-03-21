const { DañoPrenda, Prenda } = require('../models/index');
const { normalizeResult } = require('../utils/normalizeResult');

async function registrarDaño({ prenda_id, alquiler_id, descripcion, foto_url, costo_dano }) {
  const prenda = await Prenda.findByPk(prenda_id);
  if (!prenda) throw { status: 404, code: 'PRENDA_NO_ENCONTRADA', message: 'Prenda no encontrada.' };
  if (!descripcion || !descripcion.trim()) {
    throw { status: 422, code: 'DESCRIPCION_REQUERIDA', message: 'La descripción del daño es requerida.' };
  }
  const costo = costo_dano !== undefined && costo_dano !== '' && Number(costo_dano) >= 0
    ? Number(costo_dano) : null;

  const daño = await DañoPrenda.create({
    prenda_id,
    alquiler_id: alquiler_id || null,
    descripcion: descripcion.trim(),
    foto_url: foto_url || null,
    costo_dano: costo,
    resuelto: false,
  });
  if (prenda.estado !== 'En_Mantenimiento') {
    await prenda.update({ estado: 'En_Mantenimiento' });
  }
  return daño;
}

async function listarDaños(prenda_id) {
  const prenda = await Prenda.findByPk(prenda_id);
  if (!prenda) throw { status: 404, code: 'PRENDA_NO_ENCONTRADA', message: 'Prenda no encontrada.' };
  const result = await DañoPrenda.findAll({
    where: { prenda_id },
    order: [['created_at', 'DESC']],
  });
  return normalizeResult(result);
}

async function marcarResuelto(id) {
  const daño = await DañoPrenda.findByPk(id);
  if (!daño) throw { status: 404, code: 'DAÑO_NO_ENCONTRADO', message: 'Daño no encontrado.' };
  await daño.update({ resuelto: true });

  const pendientes = await DañoPrenda.count({
    where: { prenda_id: daño.prenda_id, resuelto: false },
  });
  if (pendientes === 0) {
    await Prenda.update({ estado: 'Disponible' }, { where: { id: daño.prenda_id } });
  }
  return daño;
}

async function reporteDanos({ desde, hasta } = {}) {
  const { Op } = require('sequelize');
  const where = {};
  if (desde || hasta) {
    where.created_at = {};
    if (desde) where.created_at[Op.gte] = new Date(desde);
    if (hasta) where.created_at[Op.lte] = new Date(hasta + 'T23:59:59');
  }
  const result = await DañoPrenda.findAll({
    where,
    include: [
      { model: Prenda, as: 'prenda', attributes: ['tipo', 'talla', 'color'] },
    ],
    order: [['created_at', 'DESC']],
  });
  const daños = normalizeResult(result);
  const total_costos = daños.reduce((sum, d) => sum + (parseFloat(d.costo_dano) || 0), 0);
  return { daños, total_costos };
}

module.exports = { registrarDaño, listarDaños, marcarResuelto, reporteDanos };
