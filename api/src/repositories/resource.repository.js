import pool from '../db/pool.js';
import { generateId } from '../shared/ids.js';
import { quote, selectColumns, sanitizeRow } from './registry.js';

/**
 * Única capa que habla SQL. Recibe el alcance de lectura ya resuelto por la
 * política correspondiente y no conoce roles, HTTP ni reglas de negocio.
 */

export async function list(resource, scope) {
  const where = scope.where ? `WHERE ${scope.where}` : '';
  const { rows } = await pool.query(
    `SELECT ${selectColumns(resource)} FROM ${quote(resource)} ${where} ORDER BY id`,
    scope.params
  );
  return rows;
}

export async function findById(resource, id, scope) {
  const where = scope.where ? `${scope.where} AND` : '';
  const { rows } = await pool.query(
    `SELECT ${selectColumns(resource)} FROM ${quote(resource)} WHERE ${where} id = $${scope.params.length + 1}`,
    [...scope.params, id]
  );
  return rows[0];
}

/** Fila completa y sin sanear: solo para comprobaciones internas. */
export async function findRaw(resource, id) {
  const { rows } = await pool.query(`SELECT * FROM ${quote(resource)} WHERE id = $1`, [id]);
  return rows[0];
}

export async function insert(resource, data) {
  if (!data.id) data.id = generateId();

  const cols = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, i) => '$' + (i + 1)).join(', ');

  const { rows } = await pool.query(
    `INSERT INTO ${quote(resource)} (${cols.map(quote).join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return sanitizeRow(resource, rows[0]);
}

export async function update(resource, id, data) {
  delete data.id;

  const cols = Object.keys(data);
  if (cols.length === 0) {
    // Sin columnas que actualizar se devuelve la fila tal cual está.
    // OJO: esta rama no sanea la fila; ver «defecto conocido» en tests/suites/crud.js.
    const { rows } = await pool.query(`SELECT * FROM ${quote(resource)} WHERE id = $1`, [id]);
    return rows[0];
  }

  const values = Object.values(data);
  const setClause = cols.map((col, i) => `${quote(col)} = $${i + 1}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE ${quote(resource)} SET ${setClause} WHERE id = $${cols.length + 1} RETURNING *`,
    [...values, id]
  );
  return sanitizeRow(resource, rows[0]);
}

export async function remove(resource, id) {
  const { rows } = await pool.query(
    `DELETE FROM ${quote(resource)} WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] ? sanitizeRow(resource, rows[0]) : undefined;
}

// --- Consultas puntuales que necesitan las políticas de escritura ---------

export async function institutionOfGrade(gradeId) {
  const { rows } = await pool.query('SELECT "institucion_id" FROM grades WHERE id = $1', [gradeId]);
  return rows[0] ? rows[0].institucion_id : null;
}

export async function institutionOfUser(userId) {
  const { rows } = await pool.query('SELECT "institucion_id" FROM users WHERE id = $1', [userId]);
  return rows[0] ? rows[0].institucion_id : null;
}

export async function hasAssignment(teacherId, subjectId, gradeId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM assignments WHERE "profesor_id" = $1 AND "materia_id" = $2 AND "grado_id" = $3',
    [teacherId, subjectId, gradeId]
  );
  return rows.length > 0;
}

export async function gradingScaleFor(gradeId) {
  const { rows } = await pool.query(
    'SELECT i."tipo" FROM grades g JOIN institutions i ON i.id = g."institucion_id" WHERE g.id = $1',
    [gradeId]
  );
  return rows[0] ? rows[0].tipo : null;
}
