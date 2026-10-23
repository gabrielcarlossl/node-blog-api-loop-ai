import { Router } from 'express';
import {
  listCommentsByPost,
  createComment,
  deleteComment,
} from '../controllers/comment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Comentários por post
router.get('/posts/:postId/comments', listCommentsByPost);
router.post('/posts/:postId/comments', authenticate, createComment);

// Exclusão de comentário (autor ou admin)
router.delete('/comments/:id', authenticate, deleteComment);

export default router;
