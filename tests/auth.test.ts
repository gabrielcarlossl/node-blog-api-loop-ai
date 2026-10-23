import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { setupTestEnvironment, teardownTestEnvironment, TestContext } from './helpers.js';

describe('Autenticação e Perfis (/auth)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  it('deve registrar um novo usuário com papel padrão "leitor"', async () => {
    const res = await request(ctx.app)
      .post('/auth/register')
      .send({
        name: 'Novo Leitor',
        email: 'novoleitor@test.com',
        password: 'senhaSegura123',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.role).toBe('leitor');
    expect(res.body).toHaveProperty('token');
  });

  it('deve permitir registrar usuário com perfil "redator"', async () => {
    const res = await request(ctx.app)
      .post('/auth/register')
      .send({
        name: 'Novo Redator',
        email: 'novoredator@test.com',
        password: 'senhaSegura123',
        role: 'redator',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('redator');
  });

  it('não deve permitir cadastro com email duplicado (409 Conflict)', async () => {
    const res = await request(ctx.app)
      .post('/auth/register')
      .send({
        name: 'Admin Duplicado',
        email: 'admin@test.com', // Já existe no setup
        password: 'outrasenha123',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Já existe um usuário');
  });

  it('deve fazer login com sucesso e retornar token JWT', async () => {
    const res = await request(ctx.app)
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('admin@test.com');
  });

  it('deve rejeitar login com senha incorreta (401)', async () => {
    const res = await request(ctx.app)
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'senha_errada_aqui',
      });

    expect(res.status).toBe(401);
  });

  it('deve retornar perfil do usuário autenticado em /auth/me', async () => {
    const res = await request(ctx.app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${ctx.tokens.redator}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('redator@test.com');
    expect(res.body.user.role).toBe('redator');
  });

  it('deve negar acesso a /auth/me sem token (401)', async () => {
    const res = await request(ctx.app).get('/auth/me');
    expect(res.status).toBe(401);
  });
});
