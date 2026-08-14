import { HttpError } from '../shared/http-error.js';

/** Códigos de PostgreSQL traducidos a respuestas del API. */
const POSTGRES_ERRORS = {
  23505: { status: 409, message: 'Ya existe un registro con esos datos.' },
  23503: { status: 400, message: 'El registro está relacionado con otros datos y no se puede modificar.' },
};

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado.' });
}

// eslint-disable-next-line no-unused-vars -- Express identifica el manejador de errores por su aridad
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  const conocido = POSTGRES_ERRORS[err.code];
  if (conocido) {
    return res.status(conocido.status).json({ error: conocido.message });
  }

  console.error('Error en el servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
}
