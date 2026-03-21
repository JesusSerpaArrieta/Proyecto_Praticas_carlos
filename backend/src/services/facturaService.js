const { Op } = require('sequelize');
const { Factura, Alquiler, Cliente, Prenda, DañoPrenda } = require('../models/index');
const { normalizeResult } = require('../utils/normalizeResult');

async function generarFactura(alquiler_id) {
  // Verificar que el alquiler existe y está en estado Devuelto
  const alquiler = await Alquiler.findByPk(alquiler_id);
  if (!alquiler) throw { status: 404, code: 'ALQUILER_NO_ENCONTRADO', message: 'Alquiler no encontrado.' };
  if (alquiler.estado !== 'Devuelto') throw { status: 409, code: 'ALQUILER_NO_DEVUELTO', message: 'Solo se puede facturar un alquiler devuelto.' };

  // Idempotente: si ya existe, retornar la existente
  const existenteRaw = await Factura.findOne({ where: { alquiler_id } });
  const existente = existenteRaw && !Array.isArray(existenteRaw) && existenteRaw.value ? existenteRaw.value : existenteRaw;
  if (existente) return { factura: existente, created: false };

  // Obtener siguiente numero_factura
  const maxFactura = await Factura.findOne({ order: [['numero_factura', 'DESC']] });
  const numero_factura = maxFactura ? maxFactura.numero_factura + 1 : 1;

  const factura = await Factura.create({
    alquiler_id,
    numero_factura,
    fecha_emision: new Date().toISOString().split('T')[0],
    created_at: new Date(),
  });

  return { factura, created: true };
}

async function listarFacturas(q) {
  const include = [{
    model: Alquiler,
    as: 'alquiler',
    include: [{ model: Cliente, as: 'cliente' }, { model: Prenda, as: 'prenda' }],
  }];

  if (!q) {
    return normalizeResult(await Factura.findAll({ order: [['fecha_emision', 'DESC']], include }));
  }

  const esNumero = !isNaN(q) && q.trim() !== '';
  if (esNumero) {
    // Buscar por número de factura exacto
    return normalizeResult(await Factura.findAll({
      order: [['fecha_emision', 'DESC']],
      include,
      where: { numero_factura: parseInt(q, 10) },
    }));
  }

  // Buscar por nombre de cliente: traer todas y filtrar en memoria
  // (SQL Server no soporta JOIN con OR en where de nivel superior fácilmente con Sequelize)
  const todas = normalizeResult(await Factura.findAll({ order: [['fecha_emision', 'DESC']], include }));
  const lower = q.toLowerCase();
  return todas.filter(f => {
    const nombre = f.alquiler?.cliente?.nombre_completo || '';
    const cedula = f.alquiler?.cliente?.cedula || '';
    return nombre.toLowerCase().includes(lower) || cedula.toLowerCase().includes(lower);
  });
}

async function obtenerFactura(id) {
  const factura = await Factura.findByPk(id, {
    include: [{
      model: Alquiler, as: 'alquiler',
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Prenda, as: 'prenda' },
        { model: DañoPrenda, as: 'daños' },
      ],
    }],
  });
  if (!factura) throw { status: 404, code: 'FACTURA_NO_ENCONTRADA', message: 'Factura no encontrada.' };
  return factura;
}

module.exports = { generarFactura, listarFacturas, obtenerFactura };
