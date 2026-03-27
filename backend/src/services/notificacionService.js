const { Op } = require('sequelize');
const { Alquiler, Cliente, Prenda } = require('../models/index');
const { normalizeResult } = require('../utils/normalizeResult');

// Obtener alquileres que vencen en exactamente N días
async function obtenerProximosAVencer(dias = 3) {
  const hoy = new Date();
  const fecha = new Date(hoy.getTime() + dias * 86400000).toISOString().split('T')[0];
  const result = await Alquiler.findAll({
    where: { estado: 'Activo', fecha_devolucion: fecha },
    include: [{ model: Cliente, as: 'cliente' }, { model: Prenda, as: 'prenda' }],
  });
  return normalizeResult(result);
}

module.exports = { obtenerProximosAVencer };
