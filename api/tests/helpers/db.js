import pg from 'pg';

const DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://platform:platform@localhost:55432/platform';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

/**
 * Consulta directa a la base de pruebas. Solo se usa para inyectar estados
 * que ya no se pueden reproducir vía API (p. ej. varios periodos abiertos
 * heredados) y para limpiarlos. Jamás toca producción.
 */
export const query = (sql, params) => pool.query(sql, params);
