const { Op } = require('sequelize');
const { Cliente, Alquiler, Prenda } = require('../models/index');
const { normalizeResult } = require('../utils/normalizeResult');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarEmail(email) {
  if (!EMAIL_REGEX.test(email)) {
    throw { status: 422, code: 'EMAIL_INVALIDO', message: 'El correo electrónico no tiene un formato válido.' };
  }
}

async function crearCliente({ nombre_completo, cedula, telefono, direccion, email }) {
  validarEmail(email);
  const existente = await Cliente.findOne({ where: { cedula } });
  if (existente) {
    throw { status: 409, code: 'CEDULA_DUPLICADA', message: 'La cédula ya está registrada.' };
  }
  return Cliente.create({ nombre_completo, cedula, telefono, direccion, email, created_at: new Date() });
}

async function editarCliente(id, campos) {
  const cliente = await Cliente.findByPk(id);
  if (!cliente) throw { status: 404, code: 'CLIENTE_NO_ENCONTRADO', message: 'Cliente no encontrado.' };
  if (campos.email) validarEmail(campos.email);
  if (campos.cedula && campos.cedula !== cliente.cedula) {
    const existente = await Cliente.findOne({ where: { cedula: campos.cedula } });
    if (existente) throw { status: 409, code: 'CEDULA_DUPLICADA', message: 'La cédula ya está registrada.' };
  }
  await cliente.update(campos);
  return cliente;
}

async function eliminarCliente(id) {
  const cliente = await Cliente.findByPk(id);
  if (!cliente) throw { status: 404, code: 'CLIENTE_NO_ENCONTRADO', message: 'Cliente no encontrado.' };
  const alquilerActivo = await Alquiler.findOne({ where: { cliente_id: id, estado: ['Activo', 'Vencido'] } });
  if (alquilerActivo) {
    throw { status: 409, code: 'CLIENTE_CON_ALQUILERES', message: 'El cliente tiene alquileres activos o vencidos pendientes.' };
  }
  await cliente.destroy();
  return { deleted: true };
}

async function buscarClientes(q) {
  if (!q) return normalizeResult(await Cliente.findAll());
  return normalizeResult(await Cliente.findAll({
    where: {
      [Op.or]: [
        { nombre_completo: { [Op.like]: `%${q}%` } },
        { cedula: { [Op.like]: `%${q}%` } },
      ],
    },
  }));
}

async function obtenerHistorial(id) {
  const cliente = await Cliente.findByPk(id);
  if (!cliente) throw { status: 404, code: 'CLIENTE_NO_ENCONTRADO', message: 'Cliente no encontrado.' };
  return normalizeResult(await Alquiler.findAll({
    where: { cliente_id: id },
    include: [{ model: Prenda, as: 'prenda' }],
    order: [['fecha_alquiler', 'DESC']],
  }));
}

module.exports = { crearCliente, editarCliente, eliminarCliente, buscarClientes, obtenerHistorial };
