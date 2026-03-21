const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { listar, crear, exportarPDF, actualizarEstadoPago } = require('../controllers/facturaController');

router.use(authMiddleware);

router.get('/', listar);
router.post('/', crear);
router.get('/:id/pdf', exportarPDF);
router.patch('/:id/estado-pago', actualizarEstadoPago);

module.exports = router;
