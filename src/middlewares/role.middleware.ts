import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/index.js';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuário não autenticado',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Acesso negado. Seu perfil atual é '${req.user.role}', mas esta operação requer: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}
