const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

const SCHEMA = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
const SEED_FILE = path.join(__dirname, '..', 'db.json');

const COLLECTION_TABLES = [
  'institutions',
  'users',
  'grades',
  'subjects',
  'assignments',
  'student_grades',
  'attendance',
  'marks',
  'citations',
  'messages',
  'evaluations',
];

async function run() {
  const client = await pool.connect();
  try {
    console.log('>> Creando esquema de tablas...');
    await client.query(SCHEMA);

    let totalCount = 0;
    for (const table of COLLECTION_TABLES) {
      const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
      totalCount += rows[0].count;
    }
    if (totalCount > 0) {
      console.log(`>> La base ya tiene datos (${totalCount} registros). Seed omitido.`);
      return;
    }

    console.log('>> Sembrando datos desde db.json...');
    const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));

    for (const table of COLLECTION_TABLES) {
      const records = Array.isArray(seed[table]) ? seed[table] : [];
      if (records.length === 0) continue;

      for (const record of records) {
        const data = { ...record };

        if (table === 'users' && data.password) {
          data.password = await bcrypt.hash(String(data.password), 10);
        }
        if (table === 'users' && data.contacto_emergencia && typeof data.contacto_emergencia === 'object') {
          data.contacto_emergencia = JSON.stringify(data.contacto_emergencia);
        }

        const cols = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => '$' + (i + 1)).join(', ');

        await client.query(
          `INSERT INTO ${table} (${cols.map((c) => '"' + c + '"').join(', ')}) VALUES (${placeholders})`,
          values
        );
      }
      console.log(`   ${table}: ${records.length} registros`);
    }

    console.log('>> Seed completado.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Error durante el setup:', err);
  process.exit(1);
});
