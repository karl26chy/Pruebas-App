import { post, put, del } from '../helpers/http.js';
import { suite, test, equal, expectError, contains } from '../helpers/runner.js';

/**
 * Límite de porcentaje de las evaluaciones:
 *  · la suma de porcentajes de las evaluaciones de una misma materia + grado
 *    + periodo no puede superar 100%;
 *  · se valida al crear y al modificar (409); el borrado solo reduce la suma;
 *  · el porcentaje individual debe estar entre 1 y 100 (400);
 *  · el límite es por agrupación: otra materia o periodo con la misma suma
 *    no bloquea.
 *
 * La suite es autocontenida: crea su propio periodo abierto y restaura el
 * estado del mundo (periodo A abierto como único) al final.
 */
export default async function evaluationsSuite(world) {
  suite('Evaluaciones: suma de porcentajes');

  const { A: instA } = world.inst;
  const adminA = world.tokens.adminA;
  const teacherA = world.tokens.teacherA;
  const periodA = world.periods.A;

  const per = (await post('/academic_periods', {
    institucion_id: instA.id,
    nombre: 'Periodo Eval',
    numero: 7,
    anio: 2026,
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    activo: true,
  }, adminA)).data;

  const baseEval = (over = {}) => ({
    institucion_id: instA.id,
    materia_id: world.subjects.X.id,
    grado_id: world.grades.A.id,
    nombre: `Eval ${world.id}`,
    fecha_evaluacion: '2026-05-01',
    porcentaje: 10,
    periodo_id: per.id,
    creado_por: world.users.teacherA.id,
    ...over,
  });

  const creados = [];

  try {
    await test('crear evaluación que mantiene la suma en 100% es válido', async () => {
      const ev = (await post('/evaluations', baseEval({ porcentaje: 60 }), teacherA)).data;
      equal(ev.porcentaje, 60, 'porcentaje guardado');
      creados.push({ resource: 'evaluations', id: ev.id });
    });

    await test('crear evaluación que supera 100% devuelve 409', async () => {
      // 60 + 41 = 101 > 100
      const res = await post('/evaluations', baseEval({ porcentaje: 41 }), teacherA);
      expectError(res, 409, 'La suma de porcentajes de esta materia, grado y período no puede superar 100%. Actual: 60% — solo quedan 40%.');
    });

    await test('crear evaluación que deja el total exacto en 100% es válido', async () => {
      // 60 + 40 = 100
      const ev = (await post('/evaluations', baseEval({ porcentaje: 40 }), teacherA)).data;
      equal(ev.porcentaje, 40, 'porcentaje guardado');
      creados.push({ resource: 'evaluations', id: ev.id });
    });

    await test('editar una evaluación manteniendo la suma en 100% es válido', async () => {
      // La otra evaluación (60) + nuevo 40 = 100
      const res = await put(`/evaluations/${creados[1].id}`, baseEval({ porcentaje: 40 }), teacherA);
      equal(res.status, 200, 'status');
      equal(res.data.porcentaje, 40, 'el porcentaje quedó actualizado');
    });

    await test('editar una evaluación que supera 100% devuelve 409', async () => {
      // La otra evaluación (60) + nuevo 41 = 101 > 100
      const res = await put(`/evaluations/${creados[1].id}`, baseEval({ porcentaje: 41 }), teacherA);
      expectError(res, 409, 'La suma de porcentajes de esta materia, grado y período no puede superar 100%. Actual: 60% — solo quedan 40%.');
    });

    await test('porcentaje fuera del rango 1-100 devuelve 400', async () => {
      expectError(
        await put(`/evaluations/${creados[1].id}`, baseEval({ porcentaje: 0 }), teacherA),
        400,
        'El porcentaje debe estar entre 1 y 100.'
      );
      expectError(
        await put(`/evaluations/${creados[1].id}`, baseEval({ porcentaje: 150 }), teacherA),
        400,
        'El porcentaje debe estar entre 1 y 100.'
      );
    });

    await test('otra materia con el mismo periodo no bloquea', async () => {
      const materia = (await post('/subjects', {
        nombre: `Artes ${world.id}`, descripcion: 'Test', institucion_id: instA.id,
      }, adminA)).data;
      creados.push({ resource: 'subjects', id: materia.id });

      const ev = (await post('/evaluations', baseEval({
        materia_id: materia.id, porcentaje: 100, creado_por: world.users.adminA.id,
      }), adminA)).data;
      equal(ev.porcentaje, 100, 'el 100% es válido porque es otra materia');
      creados.push({ resource: 'evaluations', id: ev.id });
    });

    await test('el mensaje de 409 informa el total actual y lo que queda', async () => {
      const ev = (await post('/evaluations', baseEval({
        materia_id: world.subjects.Y.id, porcentaje: 100, creado_por: world.users.adminA.id,
      }), adminA)).data;
      creados.push({ resource: 'evaluations', id: ev.id });

      const res = await post('/evaluations', baseEval({
        materia_id: world.subjects.Y.id, porcentaje: 1, creado_por: world.users.adminA.id,
      }), adminA);
      equal(res.status, 409, 'status');
      contains(res.data.error, 'Actual: 100%', 'informa el total actual');
      contains(res.data.error, 'solo quedan 0%', 'informa lo que queda');
    });

    await test('misma materia y grado con otro periodo no bloquea', async () => {
      const otroPer = (await post('/academic_periods', {
        institucion_id: instA.id,
        nombre: 'Periodo 2',
        numero: 2,
        anio: 2026,
        fecha_inicio: '2026-05-01',
        fecha_fin: '2026-12-31',
        activo: true,
      }, adminA)).data;

      const ev = (await post('/evaluations', baseEval({ periodo_id: otroPer.id, porcentaje: 100 }), teacherA)).data;
      equal(ev.porcentaje, 100, 'el 100% es válido porque es otro periodo');

      // Limpieza local: se borra la evaluación, se restaura el periodo de la
      // suite como único abierto y se elimina el periodo extra.
      await del(`/evaluations/${ev.id}`, teacherA);
      await put(`/academic_periods/${per.id}`, {
        institucion_id: instA.id, nombre: per.nombre, numero: per.numero,
        anio: per.anio, activo: true,
      }, adminA);
      await del(`/academic_periods/${otroPer.id}`, adminA);
    });
  } finally {
    // Limpieza: primero las evaluaciones y materias (con su periodo aún
    // abierto), luego se restaura el periodo A como único abierto y se
    // elimina el periodo de la suite.
    for (const item of [...creados].reverse()) {
      await del(`/${item.resource}/${item.id}`, adminA).catch(() => {});
    }
    await put(`/academic_periods/${periodA.id}`, {
      institucion_id: instA.id, nombre: periodA.nombre, numero: periodA.numero,
      anio: periodA.anio, activo: true,
    }, adminA).catch(() => {});
    await del(`/academic_periods/${per.id}`, adminA).catch(() => {});
  }
}
