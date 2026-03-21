const { reporteIngresos, reportePrendasPopulares, reporteVencidos, reporteOcupacion } = require('../services/reporteService');
const { reporteDanos } = require('../services/dañoService');
const { generarReportePDF } = require('../services/pdfService');

async function ingresos(req, res) {
  try {
    const data = await reporteIngresos({ desde: req.query.desde, hasta: req.query.hasta });
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function prendasPopulares(req, res) {
  try {
    const data = await reportePrendasPopulares();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function vencidos(req, res) {
  try {
    const data = await reporteVencidos();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function ocupacion(req, res) {
  try {
    const data = await reporteOcupacion();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function danos(req, res) {
  try {
    const data = await reporteDanos({ desde: req.query.desde, hasta: req.query.hasta });
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function exportarPDF(req, res) {
  try {
    const tipo = req.params.tipo;
    const servicios = { ingresos: reporteIngresos, 'prendas-populares': reportePrendasPopulares, vencidos: reporteVencidos, ocupacion: reporteOcupacion };
    if (!servicios[tipo]) return res.status(404).json({ error: true, code: 'TIPO_INVALIDO', message: 'Tipo de reporte no válido.' });
    const datos = await servicios[tipo]({ desde: req.query.desde, hasta: req.query.hasta });
    const buffer = await generarReportePDF(tipo, datos);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-${tipo}.pdf"` });
    res.send(buffer);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

module.exports = { ingresos, prendasPopulares, vencidos, ocupacion, danos, exportarPDF };
