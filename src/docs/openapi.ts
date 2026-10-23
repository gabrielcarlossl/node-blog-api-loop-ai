export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Blog API com RBAC (Leitor, Redator, Admin)',
    version: '1.0.0',
    description: `
API REST de Blog com autenticação JWT e controle de acesso baseado em papéis (RBAC).

### Perfis de Acesso:
- **leitor**: Acesso de leitura a posts publicados e capacidade de criar/deletar seus próprios comentários.
- **redator**: Todas as capacidades do leitor + criar posts, editar e deletar seus próprios posts.
- **admin**: Controle total do sistema: moderação de qualquer post e comentário, e gestão de usuários e papéis.
    `,
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor Local',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Insira seu token JWT gerado em /auth/login ou /auth/register',
      },
    },
    schemas: {
      Role: {
        type: 'string',
        enum: ['leitor', 'redator', 'admin'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Ana Silva' },
          email: { type: 'string', example: 'ana@example.com' },
          role: { $ref: '#/components/schemas/Role' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Aprendendo Loops de IA' },
          content: { type: 'string', example: 'Como estruturar ciclos de auto-cura em software...' },
          author_id: { type: 'integer', example: 2 },
          author_name: { type: 'string', example: 'Carlos Redator' },
          published: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          post_id: { type: 'integer', example: 1 },
          author_id: { type: 'integer', example: 3 },
          author_name: { type: 'string', example: 'Mariana Leitora' },
          content: { type: 'string', example: 'Excelente artigo!' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Cadastrar novo usuário',
        tags: ['Autenticação'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'João Silva' },
                  email: { type: 'string', example: 'joao@example.com' },
                  password: { type: 'string', example: 'senha123' },
                  role: { $ref: '#/components/schemas/Role', default: 'leitor' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuário cadastrado com sucesso' },
          409: { description: 'Email já cadastrado' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Fazer login e obter token JWT',
        tags: ['Autenticação'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'joao@example.com' },
                  password: { type: 'string', example: 'senha123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login aprovado e token retornado' },
          401: { description: 'Credenciais inválidas' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Obter perfil do usuário autenticado',
        tags: ['Autenticação'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Dados do usuário' },
          401: { description: 'Não autorizado' },
        },
      },
    },
    '/posts': {
      get: {
        summary: 'Listar posts (filtrado por perfil)',
        tags: ['Posts'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lista de posts' },
        },
      },
      post: {
        summary: 'Criar novo post (Exige: redator ou admin)',
        tags: ['Posts'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', example: 'Meu Primeiro Artigo' },
                  content: { type: 'string', example: 'Conteúdo detalhado do post...' },
                  published: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Post criado com sucesso' },
          403: { description: 'Acesso negado para leitores' },
        },
      },
    },
    '/posts/{id}': {
      get: {
        summary: 'Obter post por ID com comentários',
        tags: ['Posts'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Post detalhado' },
          403: { description: 'Post é rascunho e usuário não tem permissão' },
          404: { description: 'Post não encontrado' },
        },
      },
      put: {
        summary: 'Atualizar post (Exige: dono do post ou admin)',
        tags: ['Posts'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  published: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Post atualizado' },
          403: { description: 'Redator tentando editar post de outro autor' },
        },
      },
      delete: {
        summary: 'Excluir post (Exige: dono do post ou admin)',
        tags: ['Posts'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Post excluído' },
          403: { description: 'Acesso negado' },
        },
      },
    },
    '/posts/{postId}/comments': {
      get: {
        summary: 'Listar comentários de um post',
        tags: ['Comentários'],
        parameters: [{ name: 'postId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Lista de comentários' } },
      },
      post: {
        summary: 'Adicionar comentário em um post (Autenticado: leitor, redator, admin)',
        tags: ['Comentários'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'postId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', example: 'Ótima postagem!' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Comentário criado' } },
      },
    },
    '/comments/{id}': {
      delete: {
        summary: 'Excluir comentário (Exige: autor do comentário ou admin moderador)',
        tags: ['Comentários'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Comentário excluído' },
          403: { description: 'Acesso negado' },
        },
      },
    },
    '/admin/users': {
      get: {
        summary: 'Listar todos os usuários do sistema (Exclusivo Admin)',
        tags: ['Administração'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de usuários' } },
      },
    },
    '/admin/users/{id}/role': {
      patch: {
        summary: 'Alterar perfil/cargo de um usuário (Exclusivo Admin)',
        tags: ['Administração'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { $ref: '#/components/schemas/Role' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Perfil atualizado' } },
      },
    },
    '/admin/users/{id}': {
      delete: {
        summary: 'Excluir usuário do sistema (Exclusivo Admin)',
        tags: ['Administração'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Usuário excluído' } },
      },
    },
  },
};
