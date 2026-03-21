const { Op } = require('sequelize');
const { sequelize, Alquiler, Prenda, Cliente, Factura } = require('../models/index');
const { normalizeResult } = require('../utils/normalizeResult');

function calcularDias(fechaAlquiler, fechaDevolucion) {
  const inicio = new Date(fechaAlquiler);
  const fin = new Date(fechaDevolucion);
  return Math.round((fin - inicio) / (1000 * 60 * 60 * 24));
}

async function registrarAlquiler({ cliente_id, prenda_id, fecha_alquiler, fecha_devolucion, notas = null }) {
  if (fecha_devolucion <= fecha_alquiler) {
    throw { status: 422, code: 'FECHA_INVALIDA', message: 'La fecha de devolución debe ser posterior a la fecha de alquiler.' };
  }
  const hoy = new Date().toISOString().split('T')[0];
  if (fecha_alquiler < hoy) {
    throw { status: 422, code: 'FECHA_PASADA', message: 'La fecha de alquiler no puede ser en el pasado.' };
  }

  const t = await sequelize.transaction();
  try {
    const prenda = await Prenda.findByPk(prenda_id, { transaction: t });
    if (!prenda) throw { status: 404, code: 'PRENDA_NO_ENCONTRADA', message: 'Prenda no encontrada.' };
    if (prenda.estado !== 'Disponible') {
      throw { status: 409, code: 'PRENDA_NO_DISPONIBLE', message: 'La prenda no está disponible.' };
    }

    const dias = calcularDias(fecha_alquiler, fecha_devolucion);
    const precio_total = parseFloat(prenda.precio_por_dia) * dias;

    const alquiler = await Alquiler.create(
      { cliente_id, prenda_id, fecha_alquiler, fecha_devolucion, precio_total, estado: 'Activo', notas },
      { transaction: t }
    );
    await prenda.update({ estado: 'Alquilada' }, { transaction: t });
    await t.commit();
    return alquiler;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function registrarDevolucion(id, { con_daño = false, descripcion_daño = '', foto_url_daño = '', costo_dano = null } = {}) {
  const alquiler = await Alquiler.findByPk(id);
  if (!alquiler) throw { status: 404, code: 'ALQUILER_NO_ENCONTRADO', message: 'Alquiler no encontrado.' };
  if (alquiler.estado !== 'Activo' && alquiler.estado !== 'Vencido') {
    throw { status: 409, code: 'ALQUILER_YA_DEVUELTO', message: 'El alquiler ya fue devuelto.' };
  }

  if (con_daño && !descripcion_daño.trim()) {
    throw { status: 422, code: 'DESCRIPCION_REQUERIDA', message: 'Debe describir el daño al registrar una devolución con daño.' };
  }

  const t = await sequelize.transaction();
  try {
    await alquiler.update({ estado: 'Devuelto' }, { transaction: t });
    const nuevoEstadoPrenda = con_daño ? 'En_Mantenimiento' : 'Disponible';
    await Prenda.update({ estado: nuevoEstadoPrenda }, { where: { id: alquiler.prenda_id }, transaction: t });

    if (con_daño) {
      const { DañoPrenda } = require('../models/index');
      const costo = costo_dano !== null && costo_dano !== '' && Number(costo_dano) >= 0
        ? Number(costo_dano) : null;
      await DañoPrenda.create({
        prenda_id: alquiler.prenda_id,
        alquiler_id: alquiler.id,
        descripcion: descripcion_daño.trim(),
        foto_url: foto_url_daño || null,
        costo_dano: costo,
        resuelto: false,
      }, { transaction: t });
    }

    await t.commit();
    return alquiler;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function listarAlquileres({ estado, desde, hasta } = {}) {
  const where = {};
  if (estado) where.estado = estado;
  if (desde || hasta) {
    where.fecha_alquiler = {};
    if (desde) where.fecha_alquiler[Op.gte] = desde;
    if (hasta) where.fecha_alquiler[Op.lte] = hasta;
  }
  const result = await Alquiler.findAll({ where, include: [{ model: Cliente, as: 'cliente' }, { model: Prenda, as: 'prenda' }, { model: Factura, as: 'factura' }] });
  return normalizeResult(result);
}

async function marcarVencidos() {
  const hoy = new Date().toISOString().split('T')[0];
  await Alquiler.update(
    { estado: 'Vencido' },
    { where: { estado: 'Activo', fecha_devolucion: { [Op.lt]: hoy } } }
  );
}

async function extenderAlquiler(id, { nueva_fecha_devolucion }) {
  const alquiler = await Alquiler.findByPk(id, { include: [{ model: Prenda, as: 'prenda' }] });
  if (!alquiler) throw { status: 404, code: 'ALQUILER_NO_ENCONTRADO', message: 'Alquiler no encontrado.' };
  if (alquiler.estado !== 'Activo' && alquiler.estado !== 'Vencido') {
    throw { status: 409, code: 'ALQUILER_NO_EXTENSIBLE', message: 'Solo se pueden extender alquileres activos o vencidos.' };
  }
  if (nueva_fecha_devolucion <= alquiler.fecha_alquiler) {
    throw { status: 422, code: 'FECHA_INVALIDA', message: 'La nueva fecha de devolución debe ser posterior a la fecha de alquiler.' };
  }

  const dias = calcularDias(alquiler.fecha_alquiler, nueva_fecha_devolucion);
  const precio_total = parseFloat(alquiler.prenda.precio_por_dia) * dias;

  await alquiler.update({ fecha_devolucion: nueva_fecha_devolucion, precio_total, estado: 'Activo' });
  return alquiler;
}

module.exports = { registrarAlquiler, registrarDevolucion, extenderAlquiler, listarAlquileres, marcarVencidos };
