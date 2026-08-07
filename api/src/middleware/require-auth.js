import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/** Exige un JWT válido y deja el payload en req.user. */
export default function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión expirada o inválida. Inicia sesión de nuevo.' });
  }
}
