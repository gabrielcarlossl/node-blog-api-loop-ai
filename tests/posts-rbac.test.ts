import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestEnvironment, teardownTestEnvironment, TestContext } from './helpers.js';

describe('Posts e Controle de Acesso por Perfil (/posts)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  it('LEITOR não pode criar post (403 Forbidden)', async () => {
    const res = await request(ctx.app)
      .post('/posts')
      .set('Authorization', `Bearer ${ctx.tokens.leitor}`)
      .send({
        title: 'Tentativa de Post por Leitor',
        content: 'Conteúdo de teste que não deveria ser salvo...',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Seu perfil atual é 'leitor'");
  });

  it('REDATOR pode criar post com sucesso (201 Created)', async () => {
    const res = await request(ctx.app)
      .post('/posts')
      .set('Authorization', `Bearer ${ctx.tokens.redator}`)
      .send({
        title: 'Post do Redator 1',
        content: 'Conteúdo válido criado pelo redator autorizado.',
        published: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.post.title).toBe('Post do Redator 1');
    expect(res.body.post.author_id).toBe(ctx.users.redatorId);
  });

  it('REDATOR pode editar seu próprio post', async () => {
    // 1. Cria post com redator 1
    const createRes = await request(ctx.app)
      .post('/posts')
      .set('Authorization', `Bearer ${ctx.tokens.redator}`)
      .send({
        title: 'Título Original',
        content: 'Conteúdo original do artigo.',
      });

    const postId = createRes.body.post.id;

    // 2. Edita com o mesmo redator 1
    const editRes = await request(ctx.app)
      .put(`/posts/${postId}`)
      .set('Authorization', `Bearer ${ctx.tokens.redator}`)
      .send({
        title: 'Título Editado com Sucesso',
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.post.title).toBe('Título Editado com Sucesso');
  });

  it('REDATOR NÃO pode editar post de outro redator (403 Forbidden)', async () => {
    // 1. Redator 1 cria post
    const createRes = await request(ctx.app)
      .post('/posts')
      .set('Authorization', `Bearer ${ctx.tokens.redator}`)
      .send({
        title: 'Post do Redator 1',
        content: 'Conteúdo protegido contra outros redatores.',
      });

    const postId = createRes.body.post.id;

    // 2. Redator 2 tenta editar o post do Redator 1
    const editRes = await request(ctx.app)
      .put(`/posts/${postId}`)
      .set('Authorization', `Bearer ${ctx.tokens.redator2}`)
      .send({
        title: 'Tentativa de Hack por Redator 2',
      });

    expect(editRes.status).toBe(403);
    expect(editRes.body.message).toContain('redatores só podem editar suas próprias postagens');
  });

  it('ADMINISTRADOR pode editar post de qualquer autor', async () => {
    // 1. Redator 1 cria post
    const createRes = await request(ctx.app)
      .post('/posts')
      .set('Authorization', `Bearer ${ctx.tokens.redator}`)
      .send({
        title: 'Post do Redator 1',
        content: 'Conteúdo antes da moderação do admin.',
      });

    const postId = createRes.body.post.id;

    // 2. Admin altera o post
    const editRes = await request(ctx.app)
      .put(`/posts/${postId}`)
      .set('Authorization', `Bearer ${ctx.tokens.admin}`)
      .send({
        title: 'Título Moderado pelo Administrador',
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.post.title).toBe('Título Moderado pelo Administrador');
  });

  it('ADMINISTRADOR pode excluir post de qualquer autor', async () => {
    const createRes = await request(ctx.app)
      .post('/posts')
      .set('Authorization', `Bearer ${ctx.tokens.redator}`)
      .send({
        title: 'Post para Deletar',
        content: 'Este post será removido pelo admin.',
      });

    const postId = createRes.body.post.id;

    const delRes = await request(ctx.app)
      .delete(`/posts/${postId}`)
      .set('Authorization', `Bearer ${ctx.tokens.admin}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.deleted_id).toBe(postId);
  });

  it('LEITOR anônimo ou autenticado NÃO vê rascunhos (published=false)', async () => {
    // 1. Redator cria um rascunho
    await request(ctx.app)
      .post('/posts')
      .set('Authorization', `Bearer ${ctx.tokens.redator}`)
      .send({
        title: 'Rascunho Secreto',
        content: 'Não deve ser visto por leitores comuns.',
        published: false,
      });

    // 2. Leitor lista posts
    const listRes = await request(ctx.app)
      .get('/posts')
      .set('Authorization', `Bearer ${ctx.tokens.leitor}`);

    expect(listRes.status).toBe(200);
    const secretPost = listRes.body.posts.find((p: any) => p.title === 'Rascunho Secreto');
    expect(secretPost).toBeUndefined();
  });
});
