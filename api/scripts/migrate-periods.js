/**
 * Migración ADITIVA e idempotente para el sistema de periodos académicos.
 *
 * NO borra nada, NO cierra periodos y NO añade constraints. Solo:
 *   1. Crea índices de soporte.
 *   2. Deriva `anio` de `fecha_evaluacion` donde falte.
 *   3. Vincula evaluaciones a su periodo por (institución, nombre, año).
 *   4. Copia el periodo de la evaluación a sus marcas cuando falta.
 *   5. Reporta lo que queda para decisión manual (instituciones con 0 o
 *      varios periodos abiertos, huérfanos, evaluaciones sin periodo).
 *
 * Ejecutar SOLO de forma manual, tras hacer un backup:
 *   node scripts/migrate-periods.js
 */
import pool from '../src/db/pool.js';

async function run() {
  console.log('== Migración de periodos académicos (aditiva) ==\n');

  console.log('>> Índices');
  const indices = [
    'CREATE INDEX IF NOT EXISTS idx_periodos_institucion ON academic_periods("institucion_id")',
    'CREATE INDEX IF NOT EXISTS idx_evaluaciones_institucion ON evaluations("institucion_id")',
    'CREATE INDEX IF NOT EXISTS idx_evaluaciones_periodo ON evaluations("periodo_id")',
    'CREATE INDEX IF NOT EXISTS idx_marks_periodo ON marks("periodo_id")',
  ];
  for (const sql of indices) {
    await pool.query(sql);
    console.log('   ok:', sql.split('ON ')[1]);
  }

  console.log('\n>> Backfill de anio (evaluations)');
  const anio = await pool.query(
    `UPDATE evaluations
     SET anio = LEFT(fecha_evaluacion, 4)
     WHERE anio IS NULL AND fecha_evaluacion ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'`
  );
  console.log('   filas actualizadas:', anio.rowCount);

  console.log('\n>> Vinculación de evaluaciones (periodo_id)');
  const sinLink = await pool.query(
    `SELECT e.id, e."institucion_id", e.periodo, e.anio
     FROM evaluations e
     WHERE e."periodo_id" IS NULL AND e.periodo IS NOT NULL AND e.anio ~ '^[0-9]{4}$'`
  );
  let vinculadas = 0;
  for (const ev of sinLink.rows) {
    const { rows } = await pool.query(
      `SELECT id FROM academic_periods
       WHERE "institucion_id" = $1 AND "anio" = $2
         AND LOWER(BTRIM(nombre)) = LOWER(BTRIM($3))
       LIMIT 1`,
      [ev.institucion_id, Number(ev.anio), ev.periodo]
    );
    if (rows.length === 0) continue;
    await pool.query('UPDATE evaluations SET "periodo_id" = $1 WHERE id = $2', [rows[0].id, ev.id]);
    vinculadas++;
  }
  console.log('   evaluaciones vinculadas:', vinculadas);

  console.log('\n>> Copia de periodo_id a marks');
  const marks = await pool.query(
    `UPDATE marks m
     SET "periodo_id" = e."periodo_id",
         periodo = COALESCE(m.periodo, e.periodo),
         anio = COALESCE(m.anio, e.anio)
     FROM evaluations e
     WHERE m."evaluacion_id" = e.id
       AND m."periodo_id" IS NULL
       AND e."periodo_id" IS NOT NULL`
  );
  console.log('   marks actualizados:', marks.rowCount);

  console.log('\n== Reporte (NO se corrige nada) ==');

  const porInstitucion = await pool.query(
    `SELECT "institucion_id",
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE activo) AS abiertos
     FROM academic_periods
     GROUP BY "institucion_id"`
  );
  const conCero = porInstitucion.rows.filter((r) => r.abiertos === 0);
  const conVarios = porInstitucion.rows.filter((r) => r.abiertos > 1);
  console.log('   instituciones con 0 periodos abiertos :', conCero.length);
  console.log('   instituciones con más de 1 abierto    :', conVarios.length);
  for (const r of conVarios) {
    console.log('      → institución', r.institucion_id, `(${r.abiertos} abiertos de ${r.total} periodos)`);
  }

  const huerfanosEval = await pool.query(
    `SELECT COUNT(*)::int AS n FROM evaluations e
     LEFT JOIN academic_periods ap ON ap.id = e."periodo_id"
     WHERE e."periodo_id" IS NOT NULL AND ap.id IS NULL`
  );
  const huerfanosMarks = await pool.query(
    `SELECT COUNT(*)::int AS n FROM marks m
     LEFT JOIN academic_periods ap ON ap.id = m."periodo_id"
     WHERE m."periodo_id" IS NOT NULL AND ap.id IS NULL`
  );
  console.log('   evaluaciones con periodo_id huérfano  :', huerfanosEval.rows[0].n);
  console.log('   marks con periodo_id huérfano         :', huerfanosMarks.rows[0].n);

  const sinPeriodo = await pool.query(
    `SELECT COUNT(*)::int AS n FROM evaluations WHERE "periodo_id" IS NULL`
  );
  console.log('   evaluaciones sin periodo asociado     :', sinPeriodo.rows[0].n);

  const ejemplo = await pool.query(
    `SELECT "institucion_id", periodo, anio, COUNT(*)::int AS cantidad
     FROM evaluations WHERE "periodo_id" IS NULL
     GROUP BY "institucion_id", periodo, anio
     ORDER BY cantidad DESC LIMIT 20`
  );
  if (ejemplo.rows.length > 0) {
    console.log('\n   Ejemplos de evaluaciones sin periodo (primeros 20 grupos):');
    for (const r of ejemplo.rows) {
      console.log('      institución', r.institucion_id, `| periodo='${r.periodo}' | anio=${r.anio} |`, r.cantidad);
    }
  }

  console.log('\n== Fin. Revisar el reporte antes de decidir el periodo actual de cada institución ==');
}

run().catch((err) => {
  console.error('Error durante la migración:', err.message);
  process.exit(1);
});
