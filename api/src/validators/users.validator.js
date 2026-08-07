import { HttpError } from '../shared/http-error.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['super_admin', 'admin', 'teacher', 'student'];

export async function validateUser(data) {
  if (data.email !== undefined) {
    const email = String(data.email).trim();
    if (!EMAIL.test(email)) throw new HttpError(400, 'Email inválido.');
    data.email = email;
  }

  if (data.rol !== undefined && !ROLES.includes(data.rol)) {
    throw new HttpError(400, 'Rol inválido.');
  }
}
