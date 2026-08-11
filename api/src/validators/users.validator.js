import { HttpError } from '../shared/http-error.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['super_admin', 'admin', 'teacher', 'student'];

/** Catálogo oficial de tipos de documento. Los códigos se guardan en la BD. */
export const DOCUMENT_TYPES = ['CC', 'TI', 'CE', 'PA', 'PPT'];

export async function validateUser(data, existingRow) {
  if (data.email !== undefined) {
    const email = String(data.email).trim();
    if (!EMAIL.test(email)) throw new HttpError(400, 'Email inválido.');
    data.email = email;
  }

  if (data.rol !== undefined && !ROLES.includes(data.rol)) {
    throw new HttpError(400, 'Rol inválido.');
  }

  if (data.tipo_documento !== undefined) {
    if (!DOCUMENT_TYPES.includes(data.tipo_documento)) {
      throw new HttpError(400, 'Tipo de documento inválido.');
    }
  }

  // Al crear, el estudiante debe declarar su tipo de documento.
  const esEstudiante = (data.rol ?? existingRow?.rol) === 'student';
  const creando = !existingRow;
  if (creando && esEstudiante && !data.tipo_documento) {
    throw new HttpError(400, 'Tipo de documento requerido.');
  }
}
