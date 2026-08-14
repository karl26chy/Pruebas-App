import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import config from '../config/index.js';
import { compare } from '../shared/password.js';
import { HttpError } from '../shared/http-error.js';
import { institutionBySubdomain } from '../repositories/resource.repository.js';

/** Nunca dejamos salir la contraseña, ni siquiera hasheada. */
const sinPassword = (user) => {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
};

function firmarToken(user) {
  return jwt.sign(
    { sub: user.id, rol: user.rol, email: user.email, institucion_id: user.institucion_id },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

async function findUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return rows[0] || null;
}

/**
 * El login por identificación respeta el aislamiento institucional: la
 * identificación es única POR institución, así que se resuelve el subdominio
 * y se busca dentro de esa institución. Sin subdominio no se puede decidir.
 */
async function findUserByIdentificacion(identificacion, subdominio) {
  if (!subdominio) {
    throw new HttpError(400, 'Para iniciar sesión por identificación debes indicar la institución.');
  }
  const institution = await institutionBySubdomain(subdominio);
  if (!institution) {
    // No revelar si la institución existe: credenciales inválidas genérico.
    return null;
  }
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE LOWER(identificacion) = LOWER($1) AND "institucion_id" = $2',
    [identificacion, institution.id]
  );
  return rows[0] || null;
}

export async function login({ email, identificacion, password, subdominio } = {}) {
  if (!password || (!email && !identificacion)) {
    throw new HttpError(400, 'Correo o identificación y contraseña son requeridos.');
  }

  const user = email ? await findUserByEmail(email) : await findUserByIdentificacion(identificacion, subdominio);

  if (!user || !(await compare(password, user.password))) {
    throw new HttpError(401, 'Credenciales inválidas. Inténtalo de nuevo.');
  }

  if (!user.activo) {
    throw new HttpError(403, 'Tu cuenta está desactivada. Contacta al administrador.');
  }

  return { token: firmarToken(user), user: sinPassword(user) };
}

export async function currentUser(userId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (!rows[0]) throw new HttpError(404, 'Usuario no encontrado.');
  return sinPassword(rows[0]);
}
