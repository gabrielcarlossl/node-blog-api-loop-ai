import { DatabaseSync } from 'node:sqlite';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { setTestDatabase, closeDatabase } from '../src/db/database.js';
import { hashPassword, generateToken } from '../src/core/security.js';
import { Role } from '../src/types/index.js';

export interface TestContext {
  app: ReturnType<typeof createApp>;
  db: DatabaseSync;
  tokens: {
    admin: string;
    redator: string;
    redator2: string;
    leitor: string;
  };
  users: {
    adminId: number;
    redatorId: number;
    redator2Id: number;
    leitorId: number;
  };
}

export async function setupTestEnvironment(): Promise<TestContext> {
  const db = new DatabaseSync(':memory:');
  setTestDatabase(db);

  const passwordHash = await hashPassword('password123');

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

  const adminRes = insertUser.run('Admin User', 'admin@test.com', passwordHash, 'admin');
  const redatorRes = insertUser.run('Redator User', 'redator@test.com', passwordHash, 'redator');
  const redator2Res = insertUser.run('Redator 2 User', 'redator2@test.com', passwordHash, 'redator');
  const leitorRes = insertUser.run('Leitor User', 'leitor@test.com', passwordHash, 'leitor');

  const adminId = Number(adminRes.lastInsertRowid);
  const redatorId = Number(redatorRes.lastInsertRowid);
  const redator2Id = Number(redator2Res.lastInsertRowid);
  const leitorId = Number(leitorRes.lastInsertRowid);

  const tokens = {
    admin: generateToken({ userId: adminId, email: 'admin@test.com', role: 'admin' }),
    redator: generateToken({ userId: redatorId, email: 'redator@test.com', role: 'redator' }),
    redator2: generateToken({ userId: redator2Id, email: 'redator2@test.com', role: 'redator' }),
    leitor: generateToken({ userId: leitorId, email: 'leitor@test.com', role: 'leitor' }),
  };

  const app = createApp();

  return {
    app,
    db,
    tokens,
    users: { adminId, redatorId, redator2Id, leitorId },
  };
}

export function teardownTestEnvironment(): void {
  closeDatabase();
}
