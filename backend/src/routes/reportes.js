const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { ingresos, prendasPopulares, vencidos, ocupacion, danos, exportarPDF } = require('../controllers/reporteController');

router.use(authMiddleware);

router.get('/ingresos', ingresos);
router.get('/prendas-populares', prendasPopulares);
router.get('/vencidos', vencidos);
router.get('/ocupacion', ocupacion);
router.get('/danos', danos);
router.get('/:tipo/pdf', exportarPDF);

module.exports = router;
