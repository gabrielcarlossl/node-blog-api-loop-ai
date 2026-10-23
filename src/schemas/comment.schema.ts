import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(2, 'O comentário deve ter pelo menos 2 caracteres').max(1000, 'Máximo de 1000 caracteres'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
