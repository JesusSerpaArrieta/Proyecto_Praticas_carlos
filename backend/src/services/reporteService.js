const { Op, Sequelize } = require('sequelize');
const { Alquiler, Prenda, Cliente, sequelize } = require('../models/index');
const { normalizeResult } = require('../utils/normalizeResult');

async function reporteIngresos({ desde, hasta } = {}) {
  const where = { estado: 'Devuelto' };
  if (desde || hasta) {
    where.fecha_alquiler = {};
    if (desde) where.fecha_alquiler[Op.gte] = desde;
    if (hasta) where.fecha_alquiler[Op.lte] = hasta;
  }
  const alquileres = normalizeResult(await Alquiler.findAll({
    where,
    include: [
      { model: Cliente, as: 'cliente', attributes: ['nombre_completo'] },
      { model: Prenda, as: 'prenda', attributes: ['tipo'] },
    ],
  }));
  const total = alquileres.reduce((sum, a) => sum + parseFloat(a.precio_total), 0);
  // Devolver array de filas para el frontend
  return alquileres.map(a => ({
    id: a.id,
    periodo: a.fecha_alquiler,
    cliente: a.cliente?.nombre_completo,
    prenda: a.prenda?.tipo,
    total_ingresos: parseFloat(a.precio_total),
    cantidad_alquileres: 1,
  }));
}

async function reportePrendasPopulares() {
  // SQL Server requiere que todas las columnas no agregadas estén en GROUP BY
  const rows = await sequelize.query(`
    SELECT
      p.id,
      p.tipo,
      p.talla,
      p.color,
      COUNT(a.id) AS total_alquileres
    FROM prendas p
    LEFT JOIN alquileres a ON a.prenda_id = p.id
    GROUP BY p.id, p.tipo, p.talla, p.color
    ORDER BY total_alquileres DESC
  `, { type: Sequelize.QueryTypes.SELECT });
  return rows;
}

async function reporteVencidos() {
  const hoy = new Date().toISOString().split('T')[0];
  const alquileres = normalizeResult(await Alquiler.findAll({
    where: { estado: 'Vencido' },
    include: [
      { model: Cliente, as: 'cliente', attributes: ['nombre_completo'] },
      { model: Prenda, as: 'prenda', attributes: ['tipo'] },
    ],
  }));
  return alquileres.map(a => {
    const dias_retraso = Math.max(1, Math.round((new Date(hoy) - new Date(a.fecha_devolucion)) / 86400000));
    return { ...a.toJSON(), dias_retraso };
  });
}

async function reporteOcupacion() {
  const total = await Prenda.count();
  if (total === 0) return [];
  const rows = await Prenda.findAll({
    attributes: ['estado', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
    group: ['estado'],
    raw: true,
  });
  return rows.map(r => ({
    estado: r.estado,
    cantidad: parseInt(r.count, 10),
    porcentaje: (parseInt(r.count, 10) / total) * 100,
  }));
}

module.exports = { reporteIngresos, reportePrendasPopulares, reporteVencidos, reporteOcupacion };
