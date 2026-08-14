import pg from 'pg';
import config from '../config/index.js';

const { Pool, types } = pg;

// NUMERIC llega como string desde pg; lo convertimos a número para que las
// notas y porcentajes viajen al cliente como valores numéricos.
types.setTypeParser(1700, parseFloat);

const url = new URL(config.databaseUrl);
const isLocal =
  url.hostname === 'localhost' ||
  url.hostname === '127.0.0.1' ||
  url.hostname === '::1';

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de Postgres:', err);
});

export default pool;
