import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestEnvironment, teardownTestEnvironment, TestContext } from './helpers.js';

describe('Gestão de Usuários Exclusiva do Admin (/admin/users)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  it('LEITOR e REDATOR não podem listar usuários (403 Forbidden)', async () => {
    const resLeitor = await request(ctx.app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${ctx.tokens.leitor}`);

    expect(resLeitor.status).toBe(403);

    const resRedator = await request(ctx.app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${ctx.tokens.redator}`);

    expect(resRedator.status).toBe(403);
  });

  it('ADMINISTRADOR pode listar todos os usuários', async () => {
    const res = await request(ctx.app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${ctx.tokens.admin}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThanOrEqual(4);
  });

  it('ADMINISTRADOR pode promover um LEITOR para REDATOR', async () => {
    const res = await request(ctx.app)
      .patch(`/admin/users/${ctx.users.leitorId}/role`)
      .set('Authorization', `Bearer ${ctx.tokens.admin}`)
      .send({ role: 'redator' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('redator');
  });

  it('ADMINISTRADOR pode excluir um usuário', async () => {
    const res = await request(ctx.app)
      .delete(`/admin/users/${ctx.users.redator2Id}`)
      .set('Authorization', `Bearer ${ctx.tokens.admin}`);

    expect(res.status).toBe(200);
    expect(res.body.deleted_id).toBe(ctx.users.redator2Id);
  });
});
