import { Router } from 'express';
import {
  listPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/post.controller.js';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Leitura: pública ou com autorização opcional (para visualizar rascunhos próprios)
router.get('/', optionalAuthenticate, listPosts);
router.get('/:id', optionalAuthenticate, getPostById);

// Escrita: Apenas 'redator' e 'admin'
router.post('/', authenticate, requireRole('redator', 'admin'), createPost);
router.put('/:id', authenticate, requireRole('redator', 'admin'), updatePost);
router.delete('/:id', authenticate, requireRole('redator', 'admin'), deletePost);

export default router;
