const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { listar, crear, editar, eliminar, patchEstado, disponibilidad, prendasAlquiladas } = require('../controllers/prendaController');
const { listar: listarDaños, crear: crearDaño, resolver: resolverDaño } = require('../controllers/dañoController');

router.use(authMiddleware);

router.get('/disponibilidad', disponibilidad);
router.get('/alquiladas', prendasAlquiladas);
router.get('/', listar);
router.post('/', crear);
router.put('/:id', editar);
router.delete('/:id', eliminar);
router.patch('/:id/estado', patchEstado);

// Daños
router.get('/:id/danos', listarDaños);
router.post('/:id/danos', crearDaño);
router.patch('/:id/danos/:danoId/resolver', resolverDaño);

module.exports = router;
