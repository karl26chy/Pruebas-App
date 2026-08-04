const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const auth = require('../middleware/auth');
const config = require('../config');

const RESOURCES = {
  institutions: {
    cols: ['id', 'nombre', 'subdominio', 'tipo', 'nota_minima_aprobacion', 'activa'],
  },
  users: {
    cols: [
      'id',
      'email',
      'password',
      'rol',
      'nombre',
      'apellido',
      'genero',
      'fecha_nacimiento',
      'identificacion',
      'eps',
      'tipo_sangre',
      'contacto_emergencia',
      'discapacidad',
      'institucion_id',
      'activo',
    ],
  },
  grades: { cols: ['id', 'institucion_id', 'nombre', 'tipo_grado', 'cupo_maximo'] },
  subjects: { cols: ['id', 'nombre', 'descripcion'] },
  assignments: { cols: ['id', 'profesor_id', 'materia_id', 'grado_id', 'institucion_id'] },
  student_grades: { cols: ['id', 'estudiante_id', 'grado_id'] },
  attendance: {
    cols: ['id', 'estudiante_id', 'materia_id', 'grado_id', 'fecha', 'estado', 'registrado_por'],
  },
  marks: {
    cols: [
      'id',
      'estudiante_id',
      'materia_id',
      'grado_id',
      'evaluacion_id',
      'tipo_evaluacion',
      'fecha_evaluacion',
      'porcentaje',
      'nota',
      'periodo',
      'registrado_por',
    ],
  },
  citations: {
    cols: ['id', 'estudiante_id', 'materia_id', 'fecha_citacion', 'motivo', 'estado', 'creado_por'],
  },
  messages: {
    cols: ['id', 'remitente_id', 'destinatario_id', 'materia_id', 'asunto', 'cuerpo', 'leido', 'created_at'],
  },
  evaluations: {
    cols: [
      'id',
      'institucion_id',
      'materia_id',
      'grado_id',
      'nombre',
      'fecha_evaluacion',
      'porcentaje',
      'periodo',
      'creado_por',
    ],
  },
};

const HIDDEN_COLS = { users: ['password'] };
const SENSITIVE_COLS = { users: ['password'] };

const isResource = (r) => Object.prototype.hasOwnProperty.call(RESOURCES, r);
const quote = (c) => '"' + c + '"';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function selectCols(resource) {
  const hidden = HIDDEN_COLS[resource] || [];
  return RESOURCES[resource].cols.filter((c) => !hidden.includes(c)).map(quote).join(', ');
}

function sanitizeRow(resource, row) {
  if (!row) return row;
  const hidden = HIDDEN_COLS[resource] || [];
  for (const c of hidden) {
    delete row[c];
  }
  return row;
}

function generateId() {
  return crypto.randomBytes(5).toString('base64url').replace(/[-_]/g, '').slice(0, 8);
}

function pickColumns(resource, body) {
  const allowed = RESOURCES[resource].cols;
  const out = {};
  for (const col of allowed) {
    if (Object.prototype.hasOwnProperty.call(body || {}, col)) {
      out[col] = body[col];
    }
  }
  return out;
}

async function hashIfPassword(resource, data) {
  if (SENSITIVE_COLS[resource] && Object.prototype.hasOwnProperty.call(data, 'password')) {
    if (data.password) {
      data.password = await bcrypt.hash(String(data.password), 10);
    } else {
      delete data.password;
    }
  }
}

// ---------------------------------------------------------------------------
// Aislamiento multi-institucional: cada usuario solo ve datos de su institución
// ---------------------------------------------------------------------------
function buildScope(resource, user) {
  if (!user || user.rol === 'super_admin') return { where: '', params: [] };

  const instId = user.institucion_id;
  const uid = user.sub;
  if (!instId) return { where: '1 = 0', params: [] };

  switch (resource) {
    case 'users':
    case 'grades':
    case 'assignments':
    case 'evaluations':
      return { where: '"institucion_id" = $1', params: [instId] };
    case 'institutions':
      return { where: '"id" = $1', params: [instId] };
    case 'student_grades':
      return user.rol === 'student'
        ? { where: '"estudiante_id" = $1', params: [uid] }
        : { where: '"grado_id" IN (SELECT id FROM grades WHERE "institucion_id" = $1)', params: [instId] };
    case 'marks':
    case 'attendance':
      return user.rol === 'student'
        ? { where: '"estudiante_id" = $1', params: [uid] }
        : { where: '"grado_id" IN (SELECT id FROM grades WHERE "institucion_id" = $1)', params: [instId] };
    case 'citations':
      return user.rol === 'student'
        ? { where: '"estudiante_id" = $1', params: [uid] }
        : {
            where:
              '("estudiante_id" IN (SELECT id FROM users WHERE "institucion_id" = $1) OR "creado_por" IN (SELECT id FROM users WHERE "institucion_id" = $1))',
            params: [instId],
          };
    case 'messages':
      return { where: '("remitente_id" = $1 OR "destinatario_id" = $1)', params: [uid] };
    default:
      return { where: '', params: [] };
  }
}

// ---------------------------------------------------------------------------
// RBAC de escritura: quién puede crear/editar/borrar cada recurso
// ---------------------------------------------------------------------------
async function authorizeWrite(resource, data, existingRow, user) {
  if (!user || user.rol === 'super_admin') return;

  const instId = user.institucion_id;
  if (!instId) throw new HttpError(403, 'No autorizado.');

  const gradeInst = async (gid) => {
    const { rows } = await pool.query('SELECT "institucion_id" FROM grades WHERE id = $1', [gid]);
    return rows[0] ? rows[0].institucion_id : null;
  };

  switch (resource) {
    case 'institutions':
      throw new HttpError(403, 'Solo el Super Administrador puede gestionar instituciones.');

    case 'users': {
      if (user.rol !== 'admin') throw new HttpError(403, 'No autorizado.');
      const targetInst = data.institucion_id ?? existingRow?.institucion_id;
      const targetRol = data.rol ?? existingRow?.rol;
      if (targetInst !== instId) throw new HttpError(403, 'No autorizado.');
      if (targetRol === 'super_admin') throw new HttpError(403, 'No autorizado.');
      return;
    }

    case 'grades':
    case 'subjects':
    case 'assignments':
    case 'student_grades': {
      if (user.rol !== 'admin') throw new HttpError(403, 'Solo un administrador puede gestionar este recurso.');
      const targetInst = data.institucion_id ?? existingRow?.institucion_id;
      if (targetInst !== instId) throw new HttpError(403, 'No autorizado.');
      return;
    }

    case 'marks': {
      if (user.rol === 'student') throw new HttpError(403, 'Los estudiantes no pueden registrar notas.');
      const gid = data.grado_id ?? existingRow?.grado_id;
      const mid = data.materia_id ?? existingRow?.materia_id;
      if (!gid) throw new HttpError(400, 'Falta grado_id.');
      const gi = await gradeInst(gid);
      if (gi !== instId) throw new HttpError(403, 'No autorizado.');
      if (user.rol === 'admin') return;
      if (user.rol === 'teacher') {
        const { rows } = await pool.query(
          'SELECT 1 FROM assignments WHERE "profesor_id" = $1 AND "materia_id" = $2 AND "grado_id" = $3',
          [user.sub, mid, gid]
        );
        if (rows.length === 0) throw new HttpError(403, 'No tienes asignada esta materia y grado.');
        return;
      }
      throw new HttpError(403, 'No autorizado.');
    }

    case 'attendance':
    case 'evaluations': {
      if (user.rol === 'student') throw new HttpError(403, 'No autorizado.');
      const gid = data.grado_id ?? existingRow?.grado_id;
      if (!gid) throw new HttpError(400, 'Falta grado_id.');
      const gi = await gradeInst(gid);
      if (gi !== instId) throw new HttpError(403, 'No autorizado.');
      if (user.rol === 'teacher') {
        const mid = data.materia_id ?? existingRow?.materia_id;
        const { rows } = await pool.query(
          'SELECT 1 FROM assignments WHERE "profesor_id" = $1 AND "materia_id" = $2 AND "grado_id" = $3',
          [user.sub, mid, gid]
        );
        if (rows.length === 0) throw new HttpError(403, 'No tienes asignada esta materia y grado.');
      }
      return;
    }

    case 'citations': {
      if (user.rol === 'student') throw new HttpError(403, 'Los estudiantes no pueden crear citaciones.');
      const studentId = data.estudiante_id ?? existingRow?.estudiante_id;
      const { rows } = await pool.query('SELECT "institucion_id" FROM users WHERE id = $1', [studentId]);
      if (!rows[0] || rows[0].institucion_id !== instId) throw new HttpError(403, 'No autorizado.');
      return;
    }

    case 'messages':
      return;

    default:
      return;
  }
}

// ---------------------------------------------------------------------------
// Validación de datos por recurso
// ---------------------------------------------------------------------------
async function validateRow(resource, data, existingRow) {
  if (resource === 'marks') {
    if (!data.evaluacion_id && !existingRow?.evaluacion_id) {
      throw new HttpError(400, 'La evaluación es obligatoria para registrar notas.');
    }
    if (data.nota !== undefined) {
      if (typeof data.nota !== 'number' || Number.isNaN(data.nota)) {
        throw new HttpError(400, 'La nota debe ser un número.');
      }
      const gid = data.grado_id ?? existingRow?.grado_id;
      if (!gid) throw new HttpError(400, 'Falta grado_id.');
      const { rows } = await pool.query(
        'SELECT i."tipo" FROM grades g JOIN institutions i ON i.id = g."institucion_id" WHERE g.id = $1',
        [gid]
      );
      if (!rows[0]) throw new HttpError(400, 'Grado no encontrado.');
      const max = rows[0].tipo === 'universidad' ? 5 : 10;
      if (data.nota < 0 || data.nota > max) {
        throw new HttpError(400, `La nota debe estar entre 0 y ${max}.`);
      }
    }
    if (data.porcentaje !== undefined) {
      if (typeof data.porcentaje !== 'number' || Number.isNaN(data.porcentaje) || data.porcentaje < 0 || data.porcentaje > 100) {
        throw new HttpError(400, 'El porcentaje debe estar entre 0 y 100.');
      }
    }
  }

  if (resource === 'users') {
    if (data.email !== undefined) {
      const email = String(data.email).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HttpError(400, 'Email inválido.');
      }
      data.email = email;
    }
    if (data.rol !== undefined && !['super_admin', 'admin', 'teacher', 'student'].includes(data.rol)) {
      throw new HttpError(400, 'Rol inválido.');
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers CRUD
// ---------------------------------------------------------------------------
async function insertRow(resource, data) {
  await hashIfPassword(resource, data);
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

async function updateRow(resource, id, data) {
  await hashIfPassword(resource, data);
  delete data.id;

  const cols = Object.keys(data);
  if (cols.length === 0) {
    const { rows } = await pool.query(`SELECT * FROM ${quote(resource)} WHERE id = $1`, [id]);
    return rows[0];
  }

  const values = Object.values(data);
  const setClause = cols.map((c, i) => `${quote(c)} = $${i + 1}`).join(', ');
  const { rows } = await pool.query(
    `UPDATE ${quote(resource)} SET ${setClause} WHERE id = $${cols.length + 1} RETURNING *`,
    [...values, id]
  );
  return sanitizeRow(resource, rows[0]);
}

async function getRow(resource, id) {
  const { rows } = await pool.query(`SELECT * FROM ${quote(resource)} WHERE id = $1`, [id]);
  return rows[0];
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const isPublicRead = (resource, method) => resource === 'institutions' && method === 'GET';

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, config.jwtSecret);
    } catch {
      // token inválido/expirado: se trata como usuario anónimo (público)
    }
  }
  next();
}

function requireAuthOrPublic(req, res, next) {
  const resource = (req.originalUrl || '').split('/')[2];
  if (isPublicRead(resource, req.method)) return optionalAuth(req, res, next);
  return auth(req, res, next);
}

const router = express.Router();
router.use(requireAuthOrPublic);

router.get('/:resource', async (req, res, next) => {
  const { resource } = req.params;
  if (!isResource(resource)) return next();
  try {
    const scope = buildScope(resource, req.user);
    const where = scope.where ? `WHERE ${scope.where}` : '';
    const { rows } = await pool.query(
      `SELECT ${selectCols(resource)} FROM ${quote(resource)} ${where} ORDER BY id`,
      scope.params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:resource/:id', async (req, res, next) => {
  const { resource, id } = req.params;
  if (!isResource(resource)) return next();
  try {
    const scope = buildScope(resource, req.user);
    const where = scope.where ? `${scope.where} AND` : '';
    const { rows } = await pool.query(
      `SELECT ${selectCols(resource)} FROM ${quote(resource)} WHERE ${where} id = $${scope.params.length + 1}`,
      [...scope.params, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Recurso no encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:resource', async (req, res, next) => {
  const { resource } = req.params;
  if (!isResource(resource)) return next();
  try {
    const data = pickColumns(resource, req.body);
    await authorizeWrite(resource, data, null, req.user);
    await validateRow(resource, data, null);
    const row = await insertRow(resource, data);
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

router.put('/:resource/:id', async (req, res, next) => {
  const { resource, id } = req.params;
  if (!isResource(resource)) return next();
  try {
    const existing = await getRow(resource, id);
    if (!existing) return res.status(404).json({ error: 'Recurso no encontrado.' });
    const data = pickColumns(resource, req.body);
    await authorizeWrite(resource, data, existing, req.user);
    await validateRow(resource, data, existing);
    const row = await updateRow(resource, id, data);
    if (!row) return res.status(404).json({ error: 'Recurso no encontrado.' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.patch('/:resource/:id', async (req, res, next) => {
  const { resource, id } = req.params;
  if (!isResource(resource)) return next();
  try {
    const existing = await getRow(resource, id);
    if (!existing) return res.status(404).json({ error: 'Recurso no encontrado.' });
    const data = pickColumns(resource, req.body);
    await authorizeWrite(resource, data, existing, req.user);
    await validateRow(resource, data, existing);
    const row = await updateRow(resource, id, data);
    if (!row) return res.status(404).json({ error: 'Recurso no encontrado.' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.delete('/:resource/:id', async (req, res, next) => {
  const { resource, id } = req.params;
  if (!isResource(resource)) return next();
  try {
    const existing = await getRow(resource, id);
    if (!existing) return res.status(404).json({ error: 'Recurso no encontrado.' });
    await authorizeWrite(resource, {}, existing, req.user);
    const { rows } = await pool.query(
      `DELETE FROM ${quote(resource)} WHERE id = $1 RETURNING *`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Recurso no encontrado.' });
    res.json(sanitizeRow(resource, rows[0]));
  } catch (err) {
    next(err);
  }
});

module.exports = { makeResourceRouter: () => router, isResource, HttpError };
