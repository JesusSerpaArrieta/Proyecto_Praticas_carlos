const { registrarDaño, listarDaños, marcarResuelto } = require('../services/dañoService');

async function listar(req, res) {
  try {
    const daños = await listarDaños(req.params.id);
    res.json(daños);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function crear(req, res) {
  try {
    const daño = await registrarDaño({ prenda_id: req.params.id, ...req.body });
    res.status(201).json(daño);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function resolver(req, res) {
  try {
    const daño = await marcarResuelto(req.params.danoId);
    res.json(daño);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

module.exports = { listar, crear, resolver };
