const { Sequelize } = require('sequelize');
const { Prenda, Alquiler, Cliente } = require('../models/index');
const { normalizeResult } = require('../utils/normalizeResult');

async function getDisponibilidad() {
  const rows = await Prenda.findAll({
    attributes: ['estado', [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']],
    group: ['estado'],
    raw: true,
  });
  const result = { Disponible: 0, Alquilada: 0, En_Mantenimiento: 0 };
  rows.forEach(r => { result[r.estado] = parseInt(r.total, 10); });
  return result;
}

async function getPrendasAlquiladas() {
  return normalizeResult(await Prenda.findAll({
    where: { estado: 'Alquilada' },
    include: [{
      model: Alquiler,
      as: 'alquileres',
      where: { estado: 'Activo' },
      include: [{ model: Cliente, as: 'cliente', attributes: ['nombre_completo'] }],
      attributes: ['fecha_devolucion'],
    }],
  }));
}

module.exports = { getDisponibilidad, getPrendasAlquiladas };
