import rateLimit from 'express-rate-limit';

/** Freno anti fuerza bruta en el login. */
export default rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 1 minuto.' },
});
