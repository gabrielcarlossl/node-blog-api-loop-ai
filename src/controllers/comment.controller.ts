import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../db/database.js';
import { createCommentSchema } from '../schemas/comment.schema.js';
import { Comment } from '../types/index.js';
import { AppError } from '../middlewares/error.middleware.js';

export function listCommentsByPost(req: Request, res: Response, next: NextFunction): void {
  try {
    const postId = parseInt(req.params.postId, 10);
    if (isNaN(postId)) {
      throw new AppError(400, 'ID do post inválido');
    }

    const db = getDatabase();

    const postCheck = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!postCheck) {
      throw new AppError(404, 'Post não encontrado');
    }

    const stmt = db.prepare(`
      SELECT c.id, c.post_id, c.author_id, u.name as author_name,
             c.content, c.created_at
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `);

    const comments = stmt.all(postId) as unknown as Comment[];

    res.json({ comments });
  } catch (err) {
    next(err);
  }
}

export function createComment(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    const postId = parseInt(req.params.postId, 10);
    if (isNaN(postId)) {
      throw new AppError(400, 'ID do post inválido');
    }

    const data = createCommentSchema.parse(req.body);
    const db = getDatabase();

    const postCheck = db.prepare('SELECT id, published FROM posts WHERE id = ?').get(postId) as { id: number; published: number } | undefined;
    if (!postCheck) {
      throw new AppError(404, 'Post não encontrado');
    }

    const insertStmt = db.prepare(`
      INSERT INTO comments (post_id, author_id, content)
      VALUES (?, ?, ?)
    `);

    const result = insertStmt.run(postId, req.user.userId, data.content);
    const commentId = Number(result.lastInsertRowid);

    const getStmt = db.prepare(`
      SELECT c.id, c.post_id, c.author_id, u.name as author_name,
             c.content, c.created_at
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `);

    const createdComment = getStmt.get(commentId) as unknown as Comment;

    res.status(201).json({
      message: 'Comentário adicionado com sucesso',
      comment: createdComment,
    });
  } catch (err) {
    next(err);
  }
}

export function deleteComment(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    const commentId = parseInt(req.params.id, 10);
    if (isNaN(commentId)) {
      throw new AppError(400, 'ID do comentário inválido');
    }

    const db = getDatabase();
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as Comment | undefined;

    if (!comment) {
      throw new AppError(404, 'Comentário não encontrado');
    }

    // Regra RBAC: O autor do comentário pode deletar o seu próprio.
    // O Administrador tem poder de moderação e pode deletar qualquer comentário.
    const isAuthor = comment.author_id === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      throw new AppError(403, 'Acesso negado: você só pode excluir seus próprios comentários');
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);

    res.json({
      message: 'Comentário excluído com sucesso',
      deleted_id: commentId,
    });
  } catch (err) {
    next(err);
  }
}
