import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../db/database.js';
import { updateUserRoleSchema } from '../schemas/auth.schema.js';
import { UserResponse } from '../types/index.js';
import { AppError } from '../middlewares/error.middleware.js';

export function listUsers(req: Request, res: Response, next: NextFunction): void {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY id ASC
    `);

    const users = stmt.all() as unknown as UserResponse[];
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export function updateUserRole(req: Request, res: Response, next: NextFunction): void {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new AppError(400, 'ID do usuário inválido');
    }

    const data = updateUserRoleSchema.parse(req.body);
    const db = getDatabase();

    const existingUser = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(userId) as UserResponse | undefined;
    if (!existingUser) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(data.role, userId);

    res.json({
      message: `Perfil do usuário atualizado para '${data.role}' com sucesso`,
      user: {
        ...existingUser,
        role: data.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

export function deleteUser(req: Request, res: Response, next: NextFunction): void {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new AppError(400, 'ID do usuário inválido');
    }

    // Prevenção: Não permitir que o admin delete a si próprio por engano
    if (req.user && req.user.userId === userId) {
      throw new AppError(400, 'Você não pode excluir sua própria conta de administrador');
    }

    const db = getDatabase();
    const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!existingUser) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({
      message: 'Usuário excluído com sucesso',
      deleted_id: userId,
    });
  } catch (err) {
    next(err);
  }
}
