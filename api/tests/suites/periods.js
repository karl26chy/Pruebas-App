import { get, post, put, del } from '../helpers/http.js';
import { track } from '../helpers/fixtures.js';
import { query as dbQuery } from '../helpers/db.js';
import { suite, test, equal, ok, expectError } from '../helpers/runner.js';

/**
 * Sistema de periodos académicos:
 *  · una institución tiene UN SOLO periodo abierto (el "actual");
 *  · abrir un periodo cierra los demás de la misma institución (transaccional);
 *  · las evaluaciones se asocian automáticamente al único periodo abierto;
 *  · sobre un periodo cerrado no se puede crear/modificar/eliminar ni
 *    evaluaciones ni notas (409);
 *  · un periodo con evaluaciones o notas asociadas no se puede eliminar (409);
 *  · un admin jamás manipula periodos de otra institución.
 */
export default async function periodsSuite(world) {
  suite('Periodos académicos');

  const { A: instA, B: instB } = world.inst;
  const adminA = world.tokens.adminA;
  const adminB = world.tokens.adminB;
  const teacherA = world.tokens.teacherA;

  const mkPeriod = async (institucion_id, token, over = {}) => {
    const res = await post('/academic_periods', {
      institucion_id,
      nombre: 'Periodo 1',
      numero: 1,
      anio: 2026,
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-12-31',
      activo: false,
      ...over,
    }, token);
    return res;
  };

  const baseEval = (over = {}) => ({
    institucion_id: instA.id,
    materia_id: world.subjects.X.id,
    grado_id: world.grades.A.id,
    nombre: `Eval ${world.id}`,
    fecha_evaluacion: '2026-05-01',
    porcentaje: 10,
    creado_por: world.users.teacherA.id,
    ...over,
  });

  const baseMark = (over = {}) => ({
    estudiante_id: world.users.studentA.id,
    materia_id: world.subjects.X.id,
    grado_id: world.grades.A.id,
    tipo_evaluacion: 'Parcial',
    fecha_evaluacion: '2026-05-02',
    porcentaje: 10,
    nota: 7,
    registrado_por: world.users.teacherA.id,
    ...over,
  });

  // ---- Evaluaciones -------------------------------------------------------

  await test('crear evaluación en un periodo abierto (con periodo_id) es válido', async () => {
    const per = (await mkPeriod(instA.id, adminA, { activo: true })).data;
    track(world, 'academic_periods', per.id);

    const res = await post('/evaluations', baseEval({ periodo_id: per.id }), teacherA);
    equal(res.status, 201, 'status');
    equal(res.data.periodo_id, per.id, 'queda asociada al periodo');
    track(world, 'evaluations', res.data.id);
  });

  await test('crear evaluación sin periodo_id se asigna al único periodo abierto', async () => {
    const per = (await mkPeriod(instA.id, adminA, { activo: true })).data;
    track(world, 'academic_periods', per.id);

    const res = await post('/evaluations', baseEval(), teacherA);
    equal(res.status, 201, 'status');
    equal(res.data.periodo_id, per.id, 'se asigna el único abierto');
    equal(res.data.periodo, per.nombre, 'se copia el nombre del periodo');
    equal(res.data.anio, String(per.anio), 'se copia el año del periodo');
    track(world, 'evaluations', res.data.id);
  });

  await test('crear evaluación sin periodo abierto devuelve 409', async () => {
    // Cierra temporalmente el único periodo abierto de instB.
    await put(`/academic_periods/${world.periods.B.id}`, {
      institucion_id: instB.id, nombre: 'Periodo 1', numero: 1, anio: 2026, activo: false,
    }, adminB);

    expectError(
      await post('/evaluations', {
        institucion_id: instB.id, materia_id: world.subjects.X.id,
        grado_id: world.grades.B.id, nombre: `Eval ${world.id}`,
        fecha_evaluacion: '2026-05-01', porcentaje: 10, creado_por: world.users.adminB.id,
      }, adminB),
      409,
      'No hay un periodo académico abierto para esta institución.'
    );

    // Restaura el periodo abierto de instB.
    await put(`/academic_periods/${world.periods.B.id}`, {
      institucion_id: instB.id, nombre: 'Periodo 1', numero: 1, anio: 2026, activo: true,
    }, adminB);
  });

  await test('crear evaluación con varios periodos abiertos devuelve 409', async () => {
    // Estado heredado/inconsistente: se inyecta un segundo periodo abierto en
    // instB directamente en la base de pruebas (no reproducible vía API).
    const injectedId = `legacy${world.id}`.slice(0, 20);
    await dbQuery(
      `INSERT INTO academic_periods (id, "institucion_id", nombre, numero, anio, activo)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [injectedId, instB.id, 'Periodo Extra', 9, 2026]
    );

    try {
      expectError(
        await post('/evaluations', {
          institucion_id: instB.id, materia_id: world.subjects.X.id,
          grado_id: world.grades.B.id, nombre: `Eval ${world.id}`,
          fecha_evaluacion: '2026-05-01', porcentaje: 10, creado_por: world.users.adminB.id,
        }, adminB),
        409,
        'Hay más de un periodo académico abierto; revisa la configuración de periodos.'
      );
    } finally {
      await dbQuery('DELETE FROM academic_periods WHERE id = $1', [injectedId]);
    }
  });

  await test('modificar evaluación de un periodo cerrado devuelve 409', async () => {
    const per = (await mkPeriod(instA.id, adminA, { activo: true })).data;
    track(world, 'academic_periods', per.id);

    const ev = (await post('/evaluations', baseEval({ periodo_id: per.id }), teacherA)).data;
    track(world, 'evaluations', ev.id);

    await put(`/academic_periods/${per.id}`, {
      institucion_id: instA.id, nombre: 'Periodo 1', numero: 1, anio: 2026, activo: false,
    }, adminA);

    expectError(
      await put(`/evaluations/${ev.id}`, baseEval({ periodo_id: per.id, nombre: 'Cambiada' }), teacherA),
      409,
      'El periodo está cerrado; no se pueden crear o modificar evaluaciones.'
    );
  });

  await test('eliminar evaluación de un periodo cerrado devuelve 409', async () => {
    const per = (await mkPeriod(instA.id, adminA, { activo: true })).data;
    track(world, 'academic_periods', per.id);

    const ev = (await post('/evaluations', baseEval({ periodo_id: per.id }), teacherA)).data;
    track(world, 'evaluations', ev.id);

    await put(`/academic_periods/${per.id}`, {
      institucion_id: instA.id, nombre: 'Periodo 1', numero: 1, anio: 2026, activo: false,
    }, adminA);

    expectError(
      await del(`/evaluations/${ev.id}`, teacherA),
      409,
      'El periodo está cerrado; no se puede eliminar la evaluación.'
    );
  });

  // ---- Notas --------------------------------------------------------------

  await test('crear nota de una evaluación de periodo cerrado devuelve 409', async () => {
    const per = (await mkPeriod(instA.id, adminA, { activo: true })).data;
    track(world, 'academic_periods', per.id);

    const ev = (await post('/evaluations', baseEval({ periodo_id: per.id }), teacherA)).data;
    track(world, 'evaluations', ev.id);

    await put(`/academic_periods/${per.id}`, {
      institucion_id: instA.id, nombre: 'Periodo 1', numero: 1, anio: 2026, activo: false,
    }, adminA);

    expectError(
      await post('/marks', baseMark({ evaluacion_id: ev.id }), teacherA),
      409,
      'El periodo está cerrado; no se pueden registrar o modificar notas.'
    );
  });

  await test('modificar nota de una evaluación de periodo cerrado devuelve 409', async () => {
    const per = (await mkPeriod(instA.id, adminA, { activo: true })).data;
    track(world, 'academic_periods', per.id);

    const ev = (await post('/evaluations', baseEval({ periodo_id: per.id }), teacherA)).data;
    track(world, 'evaluations', ev.id);

    const mark = (await post('/marks', baseMark({ evaluacion_id: ev.id }), teacherA)).data;
    track(world, 'marks', mark.id);

    await put(`/academic_periods/${per.id}`, {
      institucion_id: instA.id, nombre: 'Periodo 1', numero: 1, anio: 2026, activo: false,
    }, adminA);

    expectError(
      await put(`/marks/${mark.id}`, baseMark({ evaluacion_id: ev.id, nota: 8 }), teacherA),
      409,
      'El periodo está cerrado; no se pueden registrar o modificar notas.'
    );
  });

  await test('eliminar nota de una evaluación de periodo cerrado devuelve 409', async () => {
    const per = (await mkPeriod(instA.id, adminA, { activo: true })).data;
    track(world, 'academic_periods', per.id);

    const ev = (await post('/evaluations', baseEval({ periodo_id: per.id }), teacherA)).data;
    track(world, 'evaluations', ev.id);

    const mark = (await post('/marks', baseMark({ evaluacion_id: ev.id }), teacherA)).data;
    track(world, 'marks', mark.id);

    await put(`/academic_periods/${per.id}`, {
      institucion_id: instA.id, nombre: 'Periodo 1', numero: 1, anio: 2026, activo: false,
    }, adminA);

    expectError(
      await del(`/marks/${mark.id}`, teacherA),
      409,
      'El periodo está cerrado; no se puede eliminar la nota.'
    );
  });

  // ---- Apertura de periodos ------------------------------------------------

  await test('abrir un periodo cierra los demás de la misma institución', async () => {
    const p1 = (await mkPeriod(instA.id, adminA, { nombre: 'Periodo 1', numero: 1 })).data;
    const p2 = (await mkPeriod(instA.id, adminA, { nombre: 'Periodo 2', numero: 2 })).data;
    const p3 = (await mkPeriod(instA.id, adminA, { nombre: 'Periodo 3', numero: 3 })).data;
    track(world, 'academic_periods', p1.id);
    track(world, 'academic_periods', p2.id);
    track(world, 'academic_periods', p3.id);

    const res = await put(`/academic_periods/${p2.id}`, {
      institucion_id: instA.id, nombre: 'Periodo 2', numero: 2, anio: 2026, activo: true,
    }, adminA);
    equal(res.status, 200, 'status');
    equal(res.data.activo, true, 'p2 queda abierto');

    const lista = (await get('/academic_periods', adminA)).data;
    const abiertos = lista.filter(p => p.activo);
    equal(abiertos.length, 1, 'solo un periodo abierto en la institución');
    equal(abiertos[0].id, p2.id, 'el abierto es p2');
    const otros = lista.filter(p => [p1.id, p3.id, world.periods.A.id].includes(p.id));
    ok(otros.every(p => p.activo === false), 'los demás (incluido el abierto anterior) quedan cerrados');
  });

  await test('un admin no puede abrir el periodo de otra institución', async () => {
    const per = (await mkPeriod(instA.id, adminA)).data;
    track(world, 'academic_periods', per.id);

    expectError(
      await put(`/academic_periods/${per.id}`, {
        institucion_id: instA.id, nombre: 'Periodo 1', numero: 1, anio: 2026, activo: true,
      }, adminB),
      403
    );
  });

  // ---- Borrado de periodos -------------------------------------------------

  await test('eliminar un periodo sin datos asociados es válido', async () => {
    const per = (await mkPeriod(instA.id, adminA)).data;

    const res = await del(`/academic_periods/${per.id}`, adminA);
    equal(res.status, 200, 'status');
    equal(res.data.id, per.id, 'devuelve la fila borrada');
  });

  await test('eliminar un periodo con evaluaciones o notas devuelve 409', async () => {
    const per = (await mkPeriod(instA.id, adminA, { activo: true })).data;
    track(world, 'academic_periods', per.id);

    const ev = (await post('/evaluations', baseEval({ periodo_id: per.id }), teacherA)).data;
    track(world, 'evaluations', ev.id);

    expectError(
      await del(`/academic_periods/${per.id}`, adminA),
      409
    );
  });
}
