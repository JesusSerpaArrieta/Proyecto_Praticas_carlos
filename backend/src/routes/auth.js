const express = require('express');
const router = express.Router();
const { loginHandler, logoutHandler, cambiarPasswordHandler } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/login', loginHandler);
router.post('/logout', authMiddleware, logoutHandler);
router.post('/cambiar-password', authMiddleware, cambiarPasswordHandler);

module.exports = router;
