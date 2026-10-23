import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../db/database.js';
import { createPostSchema, updatePostSchema } from '../schemas/post.schema.js';
import { Post, PostRow, Comment } from '../types/index.js';
import { AppError } from '../middlewares/error.middleware.js';

function formatPost(row: PostRow, comments?: Comment[]): Post {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    author_id: row.author_id,
    author_name: row.author_name,
    published: Boolean(row.published),
    created_at: row.created_at,
    updated_at: row.updated_at,
    ...(comments ? { comments } : {}),
  };
}

export function listPosts(req: Request, res: Response, next: NextFunction): void {
  try {
    const db = getDatabase();
    const user = req.user;

    let rows: PostRow[] = [];

    if (!user || user.role === 'leitor') {
      // Leitores e usuários anônimos só veem posts publicados
      const stmt = db.prepare(`
        SELECT p.id, p.title, p.content, p.author_id, u.name as author_name,
               p.published, p.created_at, p.updated_at
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.published = 1
        ORDER BY p.created_at DESC
      `);
      rows = stmt.all() as unknown as PostRow[];
    } else if (user.role === 'redator') {
      // Redatores veem todos os publicados + seus próprios rascunhos
      const stmt = db.prepare(`
        SELECT p.id, p.title, p.content, p.author_id, u.name as author_name,
               p.published, p.created_at, p.updated_at
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.published = 1 OR p.author_id = ?
        ORDER BY p.created_at DESC
      `);
      rows = stmt.all(user.userId) as unknown as PostRow[];
    } else if (user.role === 'admin') {
      // Admins veem absolutamente tudo (publicados e rascunhos de todos)
      const stmt = db.prepare(`
        SELECT p.id, p.title, p.content, p.author_id, u.name as author_name,
               p.published, p.created_at, p.updated_at
        FROM posts p
        JOIN users u ON p.author_id = u.id
        ORDER BY p.created_at DESC
      `);
      rows = stmt.all() as unknown as PostRow[];
    }

    const posts = rows.map((r) => formatPost(r));
    res.json({ posts });
  } catch (err) {
    next(err);
  }
}

export function getPostById(req: Request, res: Response, next: NextFunction): void {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      throw new AppError(400, 'ID do post inválido');
    }

    const db = getDatabase();
    const postStmt = db.prepare(`
      SELECT p.id, p.title, p.content, p.author_id, u.name as author_name,
             p.published, p.created_at, p.updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `);

    const postRow = postStmt.get(postId) as PostRow | undefined;

    if (!postRow) {
      throw new AppError(404, 'Post não encontrado');
    }

    // Se o post não estiver publicado, só o autor ou um admin podem visualizá-lo
    if (!postRow.published) {
      const isAuthor = req.user && req.user.userId === postRow.author_id;
      const isAdmin = req.user && req.user.role === 'admin';

      if (!isAuthor && !isAdmin) {
        throw new AppError(403, 'Acesso negado: este post é um rascunho não publicado');
      }
    }

    // Busca comentários associados ao post
    const commentsStmt = db.prepare(`
      SELECT c.id, c.post_id, c.author_id, u.name as author_name,
             c.content, c.created_at
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `);

    const comments = commentsStmt.all(postId) as unknown as Comment[];

    res.json({
      post: formatPost(postRow, comments),
    });
  } catch (err) {
    next(err);
  }
}

export function createPost(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    const data = createPostSchema.parse(req.body);
    const db = getDatabase();

    const insertStmt = db.prepare(`
      INSERT INTO posts (title, content, author_id, published)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      data.title,
      data.content,
      req.user.userId,
      data.published ? 1 : 0
    );

    const postId = Number(result.lastInsertRowid);

    const getStmt = db.prepare(`
      SELECT p.id, p.title, p.content, p.author_id, u.name as author_name,
             p.published, p.created_at, p.updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `);

    const createdPostRow = getStmt.get(postId) as unknown as PostRow;

    res.status(201).json({
      message: 'Post criado com sucesso',
      post: formatPost(createdPostRow),
    });
  } catch (err) {
    next(err);
  }
}

export function updatePost(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      throw new AppError(400, 'ID do post inválido');
    }

    const data = updatePostSchema.parse(req.body);
    const db = getDatabase();

    const getStmt = db.prepare('SELECT * FROM posts WHERE id = ?');
    const existing = getStmt.get(postId) as PostRow | undefined;

    if (!existing) {
      throw new AppError(404, 'Post não encontrado');
    }

    // Regra de RBAC: Redatores só podem atualizar os próprios posts. Admin pode atualizar qualquer post.
    if (req.user.role === 'redator' && existing.author_id !== req.user.userId) {
      throw new AppError(403, 'Acesso negado: redatores só podem editar suas próprias postagens');
    }

    const title = data.title ?? existing.title;
    const content = data.content ?? existing.content;
    const publishedNumber: number =
      data.published !== undefined ? (data.published ? 1 : 0) : existing.published;

    const updateStmt = db.prepare(`
      UPDATE posts
      SET title = ?, content = ?, published = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    updateStmt.run(title, content, publishedNumber, postId);

    const updatedStmt = db.prepare(`
      SELECT p.id, p.title, p.content, p.author_id, u.name as author_name,
             p.published, p.created_at, p.updated_at
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `);

    const updatedRow = updatedStmt.get(postId) as unknown as PostRow;

    res.json({
      message: 'Post atualizado com sucesso',
      post: formatPost(updatedRow),
    });
  } catch (err) {
    next(err);
  }
}

export function deletePost(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new AppError(401, 'Usuário não autenticado');
    }

    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      throw new AppError(400, 'ID do post inválido');
    }

    const db = getDatabase();
    const getStmt = db.prepare('SELECT * FROM posts WHERE id = ?');
    const existing = getStmt.get(postId) as PostRow | undefined;

    if (!existing) {
      throw new AppError(404, 'Post não encontrado');
    }

    // Regra de RBAC: Redator só pode deletar post próprio. Admin pode deletar qualquer um.
    if (req.user.role === 'redator' && existing.author_id !== req.user.userId) {
      throw new AppError(403, 'Acesso negado: redatores só podem excluir suas próprias postagens');
    }

    const deleteStmt = db.prepare('DELETE FROM posts WHERE id = ?');
    deleteStmt.run(postId);

    res.json({
      message: 'Post excluído com sucesso',
      deleted_id: postId,
    });
  } catch (err) {
    next(err);
  }
}
