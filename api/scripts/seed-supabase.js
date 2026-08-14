import bcrypt from 'bcryptjs';
import pool from '../src/db/pool.js';

const SUPER_EMAIL = process.env.SUPER_EMAIL;
const SUPER_PASSWORD = process.env.SUPER_PASSWORD;
const SUPER_ID = process.env.SUPER_ID || 'usr-super-001';

if (!SUPER_EMAIL || !SUPER_PASSWORD) {
  console.error('Define SUPER_EMAIL y SUPER_PASSWORD en el entorno para crear el Super Admin.');
  process.exit(1);
}

async function run() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [SUPER_EMAIL]
    );

    if (rows.length > 0) {
      console.log('>> Super Admin ya existe.');
      return;
    }

    const hash = await bcrypt.hash(SUPER_PASSWORD, 10);

    await client.query(
      `INSERT INTO users (id, email, password, rol, nombre, apellido, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [SUPER_ID, SUPER_EMAIL, hash, 'super_admin', 'Super', 'Admin', true]
    );

    console.log('>> Super Admin creado correctamente.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Error al crear Super Admin:', err.message);
  process.exit(1);
});
