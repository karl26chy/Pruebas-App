import { pickColumns, secretCols } from '../repositories/registry.js';
import * as repo from '../repositories/resource.repository.js';
import { buildReadScope } from '../policies/read-scope.policy.js';
import { authorizeWrite } from '../policies/write-access.policy.js';
import { validateRow } from '../validators/index.js';
import { notFound } from '../shared/http-error.js';
import { hash } from '../shared/password.js';

/**
 * Casos de uso sobre cualquier recurso del catálogo.
 * Orquesta siempre en el mismo orden: autorizar → validar → persistir.
 */

/** Hashea in situ las columnas secretas; una vacía se descarta del update. */
async function hashSecrets(resource, data) {
  for (const col of secretCols(resource)) {
    if (!Object.prototype.hasOwnProperty.call(data, col)) continue;
    if (data[col]) {
      data[col] = await hash(data[col]);
    } else {
      delete data[col];
    }
  }
}

export function listAll(resource, user) {
  return repo.list(resource, buildReadScope(resource, user));
}

export async function getById(resource, id, user) {
  const row = await repo.findById(resource, id, buildReadScope(resource, user));
  if (!row) throw notFound();
  return row;
}

export async function create(resource, body, user) {
  const data = pickColumns(resource, body);
  await authorizeWrite(resource, data, null, user);
  await validateRow(resource, data, null);
  await hashSecrets(resource, data);
  return repo.insert(resource, data);
}

export async function replace(resource, id, body, user) {
  const existing = await repo.findRaw(resource, id);
  if (!existing) throw notFound();

  const data = pickColumns(resource, body);
  await authorizeWrite(resource, data, existing, user);
  await validateRow(resource, data, existing);
  await hashSecrets(resource, data);

  const row = await repo.update(resource, id, data);
  if (!row) throw notFound();
  return row;
}

export async function destroy(resource, id, user) {
  const existing = await repo.findRaw(resource, id);
  if (!existing) throw notFound();

  await authorizeWrite(resource, {}, existing, user);

  const row = await repo.remove(resource, id);
  if (!row) throw notFound();
  return row;
}
