import 'dotenv/config';

export default {
  port: process.env.PORT || 5000,
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://platform:platform@localhost:5432/platform',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
};
