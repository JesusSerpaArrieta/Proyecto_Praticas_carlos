const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { listar, crear, editar, eliminar, historial } = require('../controllers/clienteController');

router.use(authMiddleware);

router.get('/', listar);
router.post('/', crear);
router.put('/:id', editar);
router.delete('/:id', eliminar);
router.get('/:id/historial', historial);

module.exports = router;
