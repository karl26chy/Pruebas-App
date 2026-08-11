CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  subdominio TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL,
  nota_minima_aprobacion NUMERIC DEFAULT 6,
  activa BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  rol TEXT NOT NULL,
  nombre TEXT,
  apellido TEXT,
  genero TEXT,
  fecha_nacimiento TEXT,
  identificacion TEXT,
  tipo_documento TEXT,
  eps TEXT,
  tipo_sangre TEXT,
  contacto_emergencia JSONB,
  discapacidad TEXT,
  institucion_id TEXT REFERENCES institutions(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY,
  institucion_id TEXT REFERENCES institutions(id) ON DELETE CASCADE,
  nombre TEXT,
  tipo_grado TEXT
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  nombre TEXT,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  profesor_id TEXT,
  materia_id TEXT,
  grado_id TEXT,
  institucion_id TEXT
);

CREATE TABLE IF NOT EXISTS student_grades (
  id TEXT PRIMARY KEY,
  estudiante_id TEXT,
  grado_id TEXT
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  estudiante_id TEXT,
  materia_id TEXT,
  grado_id TEXT,
  fecha TEXT,
  estado TEXT,
  registrado_por TEXT
);

CREATE TABLE IF NOT EXISTS marks (
  id TEXT PRIMARY KEY,
  estudiante_id TEXT,
  materia_id TEXT,
  grado_id TEXT,
  evaluacion_id TEXT,
  tipo_evaluacion TEXT,
  fecha_evaluacion TEXT,
  porcentaje NUMERIC,
  nota NUMERIC,
  periodo TEXT,
  registrado_por TEXT
);

CREATE TABLE IF NOT EXISTS citations (
  id TEXT PRIMARY KEY,
  estudiante_id TEXT,
  materia_id TEXT,
  fecha_citacion TEXT,
  motivo TEXT,
  estado TEXT,
  creado_por TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  remitente_id TEXT,
  destinatario_id TEXT,
  materia_id TEXT,
  asunto TEXT,
  cuerpo TEXT,
  leido BOOLEAN DEFAULT false,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  institucion_id TEXT,
  materia_id TEXT,
  grado_id TEXT,
  nombre TEXT,
  fecha_evaluacion TEXT,
  porcentaje NUMERIC,
  periodo TEXT,
  creado_por TEXT
);

-- Periodos académicos por institución (catálogo; la administración es fase 2).
CREATE TABLE IF NOT EXISTS academic_periods (
  id TEXT PRIMARY KEY,
  institucion_id TEXT,
  nombre TEXT,
  numero NUMERIC,
  anio NUMERIC,
  fecha_inicio TEXT,
  fecha_fin TEXT,
  activo BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_users_institucion ON users(institucion_id);
CREATE INDEX IF NOT EXISTS idx_grades_institucion ON grades(institucion_id);
CREATE INDEX IF NOT EXISTS idx_marks_estudiante ON marks(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_attendance_estudiante ON attendance(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_citations_estudiante ON citations(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinatario ON messages(destinatario_id);

-- Un estudiante solo puede tener una nota por evaluación
CREATE UNIQUE INDEX IF NOT EXISTS uq_marks_student_evaluation ON marks (estudiante_id, evaluacion_id);

-- Migración idempotente: añade tipo_documento a bases ya creadas.
ALTER TABLE users ADD COLUMN IF NOT EXISTS tipo_documento TEXT;

-- Migración idempotente: elimina el cupo máximo de grados (ya no se usa).
ALTER TABLE grades DROP COLUMN IF EXISTS cupo_maximo;

-- Migración idempotente: año académico y periodo_id para el historial.
ALTER TABLE marks ADD COLUMN IF NOT EXISTS anio TEXT;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS periodo_id TEXT;

-- Backfill idempotente del año a partir de la fecha de la evaluación.
-- Solo actualiza filas sin año y con fecha válida YYYY-MM-DD; el resto queda NULL.
UPDATE marks
SET anio = LEFT(fecha_evaluacion, 4)
WHERE anio IS NULL AND fecha_evaluacion ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}';

-- Migración idempotente: año académico y periodo_id para las evaluaciones.
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS anio TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS periodo_id TEXT;

-- Backfill idempotente del año de las evaluaciones desde su fecha.
UPDATE evaluations
SET anio = LEFT(fecha_evaluacion, 4)
WHERE anio IS NULL AND fecha_evaluacion ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}';
