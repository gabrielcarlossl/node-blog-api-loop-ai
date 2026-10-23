import { Router } from 'express';
import { listUsers, updateUserRole, deleteUser } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Todas as rotas de usuários exigem autenticação e perfil 'admin'
router.use(authenticate, requireRole('admin'));

router.get('/', listUsers);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
