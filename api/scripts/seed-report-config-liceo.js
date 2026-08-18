/**
 * Seed LOCAL de la configuración de boletín para la institución demo
 * (subdominio "alegria"): asocia la plantilla institucional
 * "liceo_alegre_juventud", los colores extraídos del logo (#887030 / #303030),
 * la rectora y la URL del logo. Es idempotente (upsert por institucion_id +
 * tipo_documento).
 *
 * Ejecutar SOLO contra la base local:
 *   node scripts/seed-report-config-liceo.js
 */
import pool from '../src/db/pool.js';

const SUBDOMINIO = process.env.LICEO_SUBDOMINIO || 'alegria';

async function run() {
  const { rows } = await pool.query('SELECT id, nombre FROM institutions WHERE LOWER(subdominio) = LOWER($1)', [SUBDOMINIO]);
  if (rows.length === 0) {
    console.error(`No se encontró la institución con subdominio "${SUBDOMINIO}".`);
    process.exit(1);
  }
  const inst = rows[0];

  const id = `rc-${inst.id}-boletin`;
  const now = new Date().toISOString();
  const config = JSON.stringify({
    template: 'liceo_alegre_juventud',
    primaryColor: '#887030',
    secondaryColor: '#303030',
    showLogo: true,
    showAttendance: true,
    showEvaluations: true,
    showTeacher: true,
    rectora: 'EMMA LUZ PEÑARANDA OSORIO',
  });

  await pool.query(
    `INSERT INTO institution_report_configs
       (id, institucion_id, tipo_documento, config, logo_url, version, activo, created_at, updated_at)
     VALUES ($1, $2, 'boletin', $3::jsonb, '/logo_liceo_alegre_juventud.png', 1, true, $4, $4)
     ON CONFLICT ("institucion_id", "tipo_documento")
     DO UPDATE SET config = EXCLUDED.config, logo_url = EXCLUDED.logo_url,
                   version = institution_report_configs.version + 1,
                   activo = true, updated_at = EXCLUDED.updated_at`,
    [id, inst.id, config, now]
  );

  console.log(`Config de boletín (plantilla liceo_alegre_juventud) asociada a "${inst.nombre}" (${inst.id}).`);
  await pool.end();
}

run().catch((err) => {
  console.error('Error durante el seed:', err.message);
  process.exit(1);
});
