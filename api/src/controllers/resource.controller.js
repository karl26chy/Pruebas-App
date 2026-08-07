import { isResource } from '../repositories/registry.js';
import * as service from '../services/resource.service.js';

/**
 * Traduce HTTP ↔ casos de uso. No contiene reglas de negocio ni SQL.
 * Un recurso desconocido se deja pasar para que lo atienda el 404 general.
 */
const handle = (status, run) => async (req, res, next) => {
  const { resource, id } = req.params;
  if (!isResource(resource)) return next();
  try {
    res.status(status).json(await run({ resource, id, body: req.body, user: req.user }));
  } catch (err) {
    next(err);
  }
};

export const list = handle(200, ({ resource, user }) => service.listAll(resource, user));

export const getOne = handle(200, ({ resource, id, user }) => service.getById(resource, id, user));

export const create = handle(201, ({ resource, body, user }) => service.create(resource, body, user));

export const replace = handle(200, ({ resource, id, body, user }) => service.replace(resource, id, body, user));

export const destroy = handle(200, ({ resource, id, user }) => service.destroy(resource, id, user));
