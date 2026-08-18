import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'production' && (!databaseUrl || databaseUrl.trim() === '')) {
  throw new Error(
    '[ERROR CRÍTICO] La variable de entorno DATABASE_URL es requerida en producción.'
  );
}

export default {
  port: process.env.PORT || 5000,
  // El fallback a localhost queda solo para desarrollo/pruebas.
  databaseUrl: databaseUrl || 'postgres://platform:platform@localhost:5432/platform',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
};
