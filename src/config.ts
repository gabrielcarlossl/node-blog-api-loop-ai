import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  jwtSecret: process.env.JWT_SECRET || 'ai-loop-secret-key-change-in-prod-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  databasePath: process.env.DATABASE_PATH || './data/blog.db',
  nodeEnv: process.env.NODE_ENV || 'development',
};
