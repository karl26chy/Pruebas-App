/** Error de dominio que el manejador central traduce a una respuesta HTTP. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message) => new HttpError(400, message);
export const forbidden = (message = 'No autorizado.') => new HttpError(403, message);
export const notFound = (message = 'Recurso no encontrado.') => new HttpError(404, message);
