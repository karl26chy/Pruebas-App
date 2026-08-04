const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    console.log('DEBUG AUTH 401 - URL:', req.originalUrl, '- auth header:', header || '(vacío)', '- all headers:', JSON.stringify(req.headers));
    return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión expirada o inválida. Inicia sesión de nuevo.' });
  }
};
