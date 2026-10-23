import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestEnvironment, teardownTestEnvironment, TestContext } from './helpers.js';

describe('Comentários e Moderação por Perfil (/comments)', () => {
  let ctx: TestContext;
  let postId: number;

  beforeEach(async () => {
    ctx = await setupTestEnvironment();

    // Cria um post publicado para os testes de comentário
    const res = await request(ctx.app)
      .post('/posts')
      .set('Authorization', `Bearer ${ctx.tokens.redator}`)
      .send({
        title: 'Post para Comentários',
        content: 'Conteúdo aberto para discussão de leitores e autores.',
        published: true,
      });

    postId = res.body.post.id;
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  it('LEITOR pode adicionar comentário no post', async () => {
    const res = await request(ctx.app)
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${ctx.tokens.leitor}`)
      .send({
        content: 'Comentário muito positivo do leitor!',
      });

    expect(res.status).toBe(201);
    expect(res.body.comment.content).toBe('Comentário muito positivo do leitor!');
    expect(res.body.comment.author_id).toBe(ctx.users.leitorId);
  });

  it('LEITOR pode deletar seu próprio comentário', async () => {
    // 1. Leitor cria comentário
    const createRes = await request(ctx.app)
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${ctx.tokens.leitor}`)
      .send({ content: 'Meu comentário que vou deletar' });

    const commentId = createRes.body.comment.id;

    // 2. Leitor deleta
    const delRes = await request(ctx.app)
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${ctx.tokens.leitor}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.deleted_id).toBe(commentId);
  });

  it('LEITOR NÃO pode deletar comentário de outro usuário (403 Forbidden)', async () => {
    // 1. Redator comenta
    const createRes = await request(ctx.app)
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${ctx.tokens.redator}`)
      .send({ content: 'Comentário do autor do post' });

    const commentId = createRes.body.comment.id;

    // 2. Leitor tenta deletar o comentário do autor
    const delRes = await request(ctx.app)
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${ctx.tokens.leitor}`);

    expect(delRes.status).toBe(403);
    expect(delRes.body.message).toContain('você só pode excluir seus próprios comentários');
  });

  it('ADMINISTRADOR pode deletar qualquer comentário (Moderação)', async () => {
    // 1. Leitor cria comentário inadequado
    const createRes = await request(ctx.app)
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${ctx.tokens.leitor}`)
      .send({ content: 'Spam ou comentário ofensivo' });

    const commentId = createRes.body.comment.id;

    // 2. Admin modera e deleta
    const delRes = await request(ctx.app)
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${ctx.tokens.admin}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toBe('Comentário excluído com sucesso');
  });
});
