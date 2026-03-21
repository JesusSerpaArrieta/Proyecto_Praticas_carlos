const { crearPrenda, editarPrenda, eliminarPrenda, listarPrendas, cambiarEstado } = require('../services/prendaService');
const { getDisponibilidad, getPrendasAlquiladas } = require('../services/disponibilidadService');

async function disponibilidad(req, res) {
  try {
    const data = await getDisponibilidad();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function prendasAlquiladas(req, res) {
  try {
    const data = await getPrendasAlquiladas();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function listar(req, res) {
  try {
    const { estado, tipo, talla, color } = req.query;
    const prendas = await listarPrendas({ estado, tipo, talla, color });
    res.json(prendas);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function crear(req, res) {
  try {
    const prenda = await crearPrenda(req.body);
    res.status(201).json(prenda);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function editar(req, res) {
  try {
    const prenda = await editarPrenda(req.params.id, req.body);
    res.json(prenda);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function eliminar(req, res) {
  try {
    const result = await eliminarPrenda(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

async function patchEstado(req, res) {
  try {
    const prenda = await cambiarEstado(req.params.id, req.body.estado);
    res.json(prenda);
  } catch (err) {
    res.status(err.status || 500).json({ error: true, code: err.code, message: err.message });
  }
}

module.exports = { listar, crear, editar, eliminar, patchEstado, disponibilidad, prendasAlquiladas };
