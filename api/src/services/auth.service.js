import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import config from '../config/index.js';
import { compare } from '../shared/password.js';
import { HttpError } from '../shared/http-error.js';

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

export async function login(email, password) {
  if (!email || !password) {
    throw new HttpError(400, 'Email y contraseña son requeridos.');
  }

  const { rows } = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  const user = rows[0];

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
