import pg from 'pg';
import config from '../config/index.js';

const { Pool, types } = pg;

// NUMERIC llega como string desde pg; lo convertimos a número para que las
// notas y porcentajes viajen al cliente como valores numéricos.
types.setTypeParser(1700, parseFloat);

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de Postgres:', err);
});

export default pool;
