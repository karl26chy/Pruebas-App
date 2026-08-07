import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

/**
 * Ensambla la aplicación Express sin abrir ningún puerto, para que pueda
 * montarse también desde pruebas o desde otro proceso.
 */
export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Toda respuesta del API depende del token, y la caché del navegador se
  // indexa por URL: sin esto, tras cerrar sesión el siguiente usuario podría
  // recibir del disco los datos del anterior.
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('Vary', 'Authorization');
    next();
  });

  app.use('/api', routes);
  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
