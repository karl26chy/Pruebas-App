const express = require('express');
const cors = require('cors');
const config = require('./config');
const pool = require('./db');
const authRouter = require('./routes/auth');
const { makeResourceRouter, HttpError } = require('./routes/resources');

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

app.use('/api', makeResourceRouter());

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado.' });
});

app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'El registro está relacionado con otros datos y no se puede modificar.' });
  }
  console.error('Error en el servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('>> Conectado a PostgreSQL.');
  } catch (err) {
    console.error('>> No se pudo conectar a PostgreSQL:', err.message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`>> API corriendo en http://localhost:${config.port}`);
  });
}

start();
