const { login } = require('../services/authService');
const { tokenBlacklist } = require('../utils/tokenBlacklist');
const bcrypt = require('bcrypt');
const { Usuario } = require('../models');

async function loginHandler(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(422).json({ error: true, code: 'CAMPOS_REQUERIDOS', message: 'Email y contraseña son requeridos.' });
    }
    const token = await login(email, password);
    return res.status(200).json({ token });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: true, code: err.code || 'ERROR', message: err.message || 'Error interno.' });
  }
}

function logoutHandler(req, res) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    tokenBlacklist.add(token);
  }
  return res.status(200).json({ message: 'Sesión cerrada.' });
}

async function cambiarPasswordHandler(req, res) {
  try {
    const { password_actual, password_nuevo } = req.body;
    if (!password_actual || !password_nuevo) {
      return res.status(422).json({ error: true, code: 'CAMPOS_REQUERIDOS', message: 'Ambas contraseñas son requeridas.' });
    }
    if (password_nuevo.length < 6) {
      return res.status(422).json({ error: true, code: 'PASSWORD_CORTO', message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }
    const usuario = await Usuario.findByPk(req.user.id);
    if (!usuario) return res.status(404).json({ error: true, message: 'Usuario no encontrado.' });
    const valido = await bcrypt.compare(password_actual, usuario.password_hash);
    if (!valido) return res.status(401).json({ error: true, code: 'PASSWORD_INCORRECTO', message: 'La contraseña actual es incorrecta.' });
    const password_hash = await bcrypt.hash(password_nuevo, 10);
    await usuario.update({ password_hash });
    return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
}

module.exports = { loginHandler, logoutHandler, cambiarPasswordHandler };
