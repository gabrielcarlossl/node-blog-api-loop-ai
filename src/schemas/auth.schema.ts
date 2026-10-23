import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['leitor', 'redator', 'admin']).optional().default('leitor'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['leitor', 'redator', 'admin'], {
    errorMap: () => ({ message: "O perfil deve ser 'leitor', 'redator' ou 'admin'" }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
