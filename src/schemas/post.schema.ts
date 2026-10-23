import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres'),
  published: z.boolean().optional().default(false),
});

export const updatePostSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres').optional(),
  content: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres').optional(),
  published: z.boolean().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
