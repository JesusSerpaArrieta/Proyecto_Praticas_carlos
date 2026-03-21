const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { listar, crear, devolucion, extender } = require('../controllers/alquilerController');

router.use(authMiddleware);

router.get('/', listar);
router.post('/', crear);
router.patch('/:id/devolucion', devolucion);
router.patch('/:id/extender', extender);

module.exports = router;
