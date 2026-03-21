const { generarFactura, listarFacturas, obtenerFactura } = require('../services/facturaService');
const { generarFacturaPDF } = require('../services/pdfService');

async function listar(req, res) {
  try {
    const facturas = await listarFacturas(req.query.q);
    res.json(facturas);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function crear(req, res) {
  try {
    const { alquiler_id } = req.body;
    if (!alquiler_id) return res.status(422).json({ error: true, code: 'CAMPO_REQUERIDO', message: 'alquiler_id es requerido.' });
    const { factura, created } = await generarFactura(alquiler_id);
    res.status(created ? 201 : 200).json(factura);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message || 'Error al generar factura.' });
  }
}

async function exportarPDF(req, res) {
  try {
    const factura = await obtenerFactura(req.params.id);
    const buffer = await generarFacturaPDF(factura);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="factura-${factura.numero_factura}.pdf"` });
    res.send(buffer);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function actualizarEstadoPago(req, res) {
  try {
    const { Factura } = require('../models/index');
    const { estado_pago } = req.body;
    if (!['Pendiente', 'Pagado'].includes(estado_pago)) {
      return res.status(422).json({ error: true, code: 'ESTADO_INVALIDO', message: 'estado_pago debe ser Pendiente o Pagado.' });
    }
    const factura = await Factura.findByPk(req.params.id);
    if (!factura) return res.status(404).json({ error: true, code: 'FACTURA_NO_ENCONTRADA', message: 'Factura no encontrada.' });
    await factura.update({ estado_pago });
    res.json(factura);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

module.exports = { listar, crear, exportarPDF, actualizarEstadoPago };
