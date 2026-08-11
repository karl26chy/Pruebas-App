import crypto from 'node:crypto';

/** Identificador corto y legible, del mismo formato que usa el seed. */
export function generateId() {
  return crypto.randomBytes(5).toString('base64url').replace(/[-_]/g, '').slice(0, 8);
}
