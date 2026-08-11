import config from './config/index.js';
import pool from './db/pool.js';
import { createApp } from './app.js';

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('>> Conectado a PostgreSQL.');
  } catch (err) {
    console.error('>> No se pudo conectar a PostgreSQL:', err.message);
    process.exit(1);
  }

  createApp().listen(config.port, '0.0.0.0', () => {
    console.log(`>> API corriendo en http://localhost:${config.port}`);
  });
}

start();
