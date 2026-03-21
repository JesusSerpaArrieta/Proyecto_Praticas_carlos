const { crearCliente, editarCliente, eliminarCliente, buscarClientes, obtenerHistorial } = require('../services/clienteService');

async function listar(req, res) {
  try {
    const clientes = await buscarClientes(req.query.q);
    res.json(clientes);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function crear(req, res) {
  try {
    const cliente = await crearCliente(req.body);
    res.status(201).json(cliente);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function editar(req, res) {
  try {
    const cliente = await editarCliente(req.params.id, req.body);
    res.json(cliente);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function eliminar(req, res) {
  try {
    const result = await eliminarCliente(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function historial(req, res) {
  try {
    const alquileres = await obtenerHistorial(req.params.id);
    res.json(alquileres);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

module.exports = { listar, crear, editar, eliminar, historial };
