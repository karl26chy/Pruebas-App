import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import requireAuth from './require-auth.js';

/** Adjunta el usuario si hay token válido; si no, sigue como anónimo. */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      req.user = jwt.verify(token, config.jwtSecret);
    } catch {
      // token inválido/expirado: se trata como usuario anónimo (público)
    }
  }
  next();
}

/** Única lectura pública del API; la necesita la pantalla de login. */
const isPublicRead = (resource, method) => resource === 'institutions' && method === 'GET';

/**
 * Deja pasar sin token solo las lecturas públicas; el resto exige sesión.
 *
 * NOTA: el recurso se extrae de originalUrl por posición, tal y como estaba.
 * Es frágil ante query strings, pero cambiarlo alteraría el comportamiento
 * actual, así que queda pendiente de aprobación.
 */
export function requireAuthOrPublic(req, res, next) {
  const resource = (req.originalUrl || '').split('/')[2];
  if (isPublicRead(resource, req.method)) return optionalAuth(req, res, next);
  return requireAuth(req, res, next);
}
