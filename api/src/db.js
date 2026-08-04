const { Pool, types } = require('pg');
const config = require('./config');

types.setTypeParser(1700, parseFloat);

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de Postgres:', err);
});

module.exports = pool;
