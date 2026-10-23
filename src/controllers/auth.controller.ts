import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../db/database.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import { hashPassword, comparePassword, generateToken } from '../core/security.js';
import { User, UserResponse } from '../types/index.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const db = getDatabase();

    const existingUserStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const existing = existingUserStmt.get(data.email) as { id: number } | undefined;

    if (existing) {
      throw new AppError(409, 'Já existe um usuário cadastrado com este e-mail');
    }

    const hashedPassword = await hashPassword(data.password);
    const insertStmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertStmt.run(data.name, data.email, hashedPassword, data.role);
    const userId = Number(result.lastInsertRowid);

    const token = generateToken({
      userId,
      email: data.email,
      role: data.role,
    });

    const userResponse: UserResponse = {
      id: userId,
      name: data.name,
      email: data.email,
      role: data.role,
      created_at: new Date().toISOString(),
    };

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: userResponse,
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const db = getDatabase();

    const userStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = userStmt.get(data.email) as User | undefined;

    if (!user) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    const isMatch = await comparePassword(data.password, user.password_hash);
    if (!isMatch) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };

    res.json({
      message: 'Login realizado com sucesso',
      user: userResponse,
      token,
    });
  } catch (err) {
    next(err);
  }
}

export function getMe(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    const db = getDatabase();
    const userStmt = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?');
    const user = userStmt.get(req.user.userId) as UserResponse | undefined;

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}
