const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const { Alquiler, Cliente, Prenda } = require('../models/index');
const { normalizeResult } = require('../utils/normalizeResult');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

// Enviar email de recordatorio
async function enviarEmailRecordatorio(alquiler) {
  const cliente = alquiler.cliente;
  if (!cliente?.email) return { skipped: true, reason: 'sin email' };

  const dias = Math.ceil(
    (new Date(alquiler.fecha_devolucion) - new Date()) / (1000 * 60 * 60 * 24)
  );

  await transporter.sendMail({
    from: `"Las Togas" <${process.env.GMAIL_USER}>`,
    to: cliente.email,
    subject: `Recordatorio: devolución de toga en ${dias} día${dias !== 1 ? 's' : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Las Togas — Recordatorio de devolución</h2>
        <p>Hola <strong>${cliente.nombre_completo}</strong>,</p>
        <p>Te recordamos que debes devolver la siguiente prenda en <strong>${dias} día${dias !== 1 ? 's' : ''}</strong>:</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0"><strong>Prenda:</strong> ${alquiler.prenda?.tipo} · Talla ${alquiler.prenda?.talla}</p>
          <p style="margin:8px 0 0"><strong>Fecha de devolución:</strong> ${alquiler.fecha_devolucion}</p>
        </div>
        <p>Si necesitas extender el alquiler, comunícate con nosotros.</p>
        <p style="color:#888;font-size:12px;margin-top:24px">Las Togas — Sistema de Gestión de Alquiler</p>
      </div>
    `,
  });

  return { sent: true, to: cliente.email };
}

// Cron: enviar recordatorios para alquileres que vencen en 1, 2 y 3 días
async function enviarRecordatoriosDiarios() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  for (const dias of [1, 2, 3]) {
    const alquileres = await obtenerProximosAVencer(dias);
    for (const a of alquileres) {
      try {
        await enviarEmailRecordatorio(a);
        console.log(`Email enviado a ${a.cliente?.email} — vence en ${dias}d`);
      } catch (err) {
        console.error(`Error enviando email alquiler #${a.id}:`, err.message);
      }
    }
  }
}

module.exports = { obtenerProximosAVencer, enviarRecordatoriosDiarios };
