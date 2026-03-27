const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { listar, crear, devolucion, extender } = require('../controllers/alquilerController');
const { obtenerProximosAVencer } = require('../services/notificacionService');

router.use(authMiddleware);

router.get('/', listar);
router.post('/', crear);
router.patch('/:id/devolucion', devolucion);
router.patch('/:id/extender', extender);

// Alquileres que vencen en los próximos N días (default 3)
router.get('/proximos-a-vencer', async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 3;
    const data = await obtenerProximosAVencer(dias);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
