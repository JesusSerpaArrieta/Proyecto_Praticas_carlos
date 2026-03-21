const jwt = require('jsonwebtoken');
const { tokenBlacklist } = require('../utils/tokenBlacklist');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, code: 'NO_TOKEN', message: 'Token requerido.' });
  }

  const token = authHeader.slice(7);

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: true, code: 'TOKEN_INVALIDO', message: 'Token inválido o expirado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: true, code: 'TOKEN_INVALIDO', message: 'Token inválido o expirado.' });
  }
}

module.exports = authMiddleware;
