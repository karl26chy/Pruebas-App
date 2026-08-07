import { post, del, login } from './http.js';

const SUPER_EMAIL = process.env.SUPER_EMAIL || 'karl26chy@gmail.com';
const SUPER_PASSWORD = process.env.SUPER_PASSWORD || 'olafo1234';
const PASSWORD = 'test1234';

const stamp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

async function create(resource, body, token) {
  const res = await post(`/${resource}`, body, token);
  if (res.status !== 201) {
    throw new Error(`No se pudo crear ${resource}: ${res.status} ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

/**
 * Construye un mundo de pruebas completo con dos instituciones aisladas.
 *
 *   A = colegio    (escala 0-10, nota mínima 6)
 *   B = universidad (escala 0-5, nota mínima 3)
 *
 * Cada una con admin, profesor y estudiante propios, para poder verificar
 * el aislamiento multi-institución y el RBAC de escritura.
 */
export async function buildWorld() {
  const superSession = await login(SUPER_EMAIL, SUPER_PASSWORD);
  const su = superSession.token;
  const id = stamp();

  const instA = await create('institutions', {
    nombre: `Colegio Test ${id}`,
    subdominio: `colegiotest${id}`,
    tipo: 'colegio',
    nota_minima_aprobacion: 6,
    activa: true,
  }, su);

  const instB = await create('institutions', {
    nombre: `Universidad Test ${id}`,
    subdominio: `unitest${id}`,
    tipo: 'universidad',
    nota_minima_aprobacion: 3,
    activa: true,
  }, su);

  const mkUser = (rol, tag, institucion_id, extra = {}) => create('users', {
    email: `${tag}.${id}@test.local`,
    password: PASSWORD,
    rol,
    nombre: tag,
    apellido: 'Test',
    institucion_id,
    activo: true,
    ...extra,
  }, su);

  const adminA = await mkUser('admin', 'admina', instA.id);
  const teacherA = await mkUser('teacher', 'teachera', instA.id);
  const teacherA2 = await mkUser('teacher', 'teachera2', instA.id);
  const studentA = await mkUser('student', 'studenta', instA.id, {
    fecha_nacimiento: '2010-05-05',
    genero: 'masculino',
    identificacion: `ID${id}`,
  });
  const studentA2 = await mkUser('student', 'studenta2', instA.id);

  const adminB = await mkUser('admin', 'adminb', instB.id);
  const teacherB = await mkUser('teacher', 'teacherb', instB.id);
  const studentB = await mkUser('student', 'studentb', instB.id);

  const inactiveUser = await mkUser('student', 'inactivo', instA.id, { activo: false });

  const gradeA = await create('grades', {
    institucion_id: instA.id,
    nombre: `6to-${id}`,
    tipo_grado: 'A',
    cupo_maximo: 30,
  }, su);

  const gradeB = await create('grades', {
    institucion_id: instB.id,
    nombre: `Semestre-${id}`,
    tipo_grado: 'B',
    cupo_maximo: 40,
  }, su);

  // Las materias son un catálogo global (la tabla no tiene institucion_id).
  const subjectX = await create('subjects', { nombre: `Matematicas ${id}`, descripcion: 'Test' }, su);
  const subjectY = await create('subjects', { nombre: `Sociales ${id}`, descripcion: 'Test' }, su);

  const assignA = await create('assignments', {
    profesor_id: teacherA.id,
    materia_id: subjectX.id,
    grado_id: gradeA.id,
    institucion_id: instA.id,
  }, su);

  const enrollA = await create('student_grades', {
    estudiante_id: studentA.id,
    grado_id: gradeA.id,
  }, su);

  const evalA = await create('evaluations', {
    institucion_id: instA.id,
    materia_id: subjectX.id,
    grado_id: gradeA.id,
    nombre: 'Parcial 1',
    fecha_evaluacion: '2026-03-01',
    porcentaje: 30,
    periodo: 'Periodo 1',
    creado_por: teacherA.id,
  }, su);

  const evalA2 = await create('evaluations', {
    institucion_id: instA.id,
    materia_id: subjectX.id,
    grado_id: gradeA.id,
    nombre: 'Parcial 2',
    fecha_evaluacion: '2026-04-01',
    porcentaje: 30,
    periodo: 'Periodo 1',
    creado_por: teacherA.id,
  }, su);

  const tokens = {
    super: su,
    adminA: (await login(adminA.email, PASSWORD)).token,
    teacherA: (await login(teacherA.email, PASSWORD)).token,
    teacherA2: (await login(teacherA2.email, PASSWORD)).token,
    studentA: (await login(studentA.email, PASSWORD)).token,
    adminB: (await login(adminB.email, PASSWORD)).token,
    teacherB: (await login(teacherB.email, PASSWORD)).token,
    studentB: (await login(studentB.email, PASSWORD)).token,
  };

  return {
    id,
    password: PASSWORD,
    superEmail: SUPER_EMAIL,
    superPassword: SUPER_PASSWORD,
    tokens,
    inst: { A: instA, B: instB },
    users: { adminA, teacherA, teacherA2, studentA, studentA2, adminB, teacherB, studentB, inactiveUser },
    grades: { A: gradeA, B: gradeB },
    subjects: { X: subjectX, Y: subjectY },
    assignments: { A: assignA },
    enrollments: { A: enrollA },
    evaluations: { A: evalA, A2: evalA2 },
    created: [],
  };
}

/** Registra un recurso creado durante los tests para borrarlo al final. */
export function track(world, resource, id) {
  if (id) world.created.push({ resource, id });
  return id;
}

export async function destroyWorld(world) {
  const su = world.tokens.super;

  // Primero lo que los tests hayan creado, en orden inverso.
  for (const item of [...world.created].reverse()) {
    await del(`/${item.resource}/${item.id}`, su).catch(() => {});
  }

  // Tablas sin claves foráneas: hay que limpiarlas explícitamente.
  for (const ev of [world.evaluations.A, world.evaluations.A2]) {
    await del(`/evaluations/${ev.id}`, su).catch(() => {});
  }
  await del(`/student_grades/${world.enrollments.A.id}`, su).catch(() => {});
  await del(`/assignments/${world.assignments.A.id}`, su).catch(() => {});
  for (const s of [world.subjects.X, world.subjects.Y]) {
    await del(`/subjects/${s.id}`, su).catch(() => {});
  }
  for (const u of Object.values(world.users)) {
    await del(`/users/${u.id}`, su).catch(() => {});
  }
  for (const g of [world.grades.A, world.grades.B]) {
    await del(`/grades/${g.id}`, su).catch(() => {});
  }
  for (const i of [world.inst.A, world.inst.B]) {
    await del(`/institutions/${i.id}`, su).catch(() => {});
  }
}
