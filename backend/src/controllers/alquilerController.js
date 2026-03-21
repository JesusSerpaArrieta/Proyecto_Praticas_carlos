const { registrarAlquiler, registrarDevolucion, extenderAlquiler, listarAlquileres } = require('../services/alquilerService');

async function listar(req, res) {
  try {
    const { estado, desde, hasta } = req.query;
    const result = await listarAlquileres({ estado, desde, hasta });
    // Sequelize mssql a veces devuelve { value: [], Count: N }
    const alquileres = Array.isArray(result) ? result : (result.value || []);
    res.json(alquileres);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function crear(req, res) {
  try {
    const alquiler = await registrarAlquiler(req.body);
    res.status(201).json(alquiler);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function devolucion(req, res) {
  try {
    const alquiler = await registrarDevolucion(req.params.id, req.body);
    res.json(alquiler);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function extender(req, res) {
  try {
    const alquiler = await extenderAlquiler(req.params.id, req.body);
    res.json(alquiler);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

module.exports = { listar, crear, devolucion, extender };
