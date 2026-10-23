# 🚀 Blog API com RBAC & Metodologia de Loops de IA

Uma API REST completa desenvolvida em **Node.js (v24)** e **TypeScript**, implementando autenticação JWT, controle de acesso baseado em papéis (RBAC) com três perfis distintos (**Leitor**, **Redator** e **Admin**), banco de dados SQLite nativo (`node:sqlite`), documentação interativa OpenAPI/Swagger e uma suíte completa de testes automatizados com **Vitest**.

Além da API, este repositório contém um módulo didático focado em **Loops de IA para Engenharia de Software (AI Coding Loops)**.

---

## 📋 Sumário
- [Arquitetura e Perfis (RBAC)](#-arquitetura-e-perfis-rbac)
- [Instalação e Execução](#-instalação-e-execução)
- [Contas de Demonstração (Seed)](#-contas-de-demonstração-seed)
- [Documentação Swagger Interativa](#-documentação-swagger-interativa)
- [Testes Automatizados](#-testes-automatizados)
- [Loops de IA (Como Construir Código com IA)](#-loops-de-ia-como-construir-código-com-ia)
- [Endpoints da API](#-endpoints-da-api)

---

## 🛡️ Arquitetura e Perfis (RBAC)

A API possui 3 perfis de usuários com restrições rígidas:

| Funcionalidade | Leitor (`leitor`) | Redator (`redator`) | Administrador (`admin`) |
| :--- | :---: | :---: | :---: |
| **Registrar / Login / Perfil (`/auth`)** | ✅ | ✅ | ✅ |
| **Listar posts publicados** | ✅ | ✅ | ✅ |
| **Ver seus próprios rascunhos** | ❌ | ✅ | ✅ |
| **Ver rascunhos de terceiros** | ❌ | ❌ | ✅ |
| **Criar novos posts** | ❌ | ✅ | ✅ |
| **Editar / Excluir posts próprios** | ❌ | ✅ | ✅ |
| **Editar / Excluir posts de outros autores** | ❌ | ❌ | ✅ |
| **Publicar ou despublicar qualquer post** | ❌ | ❌ | ✅ |
| **Comentar em posts** | ✅ | ✅ | ✅ |
| **Excluir próprio comentário** | ✅ | ✅ | ✅ |
| **Moderar / Excluir comentários alheios** | ❌ | ❌ | ✅ |
| **Listar todos os usuários do sistema** | ❌ | ❌ | ✅ |
| **Alterar cargo/perfil de outros usuários** | ❌ | ❌ | ✅ |
| **Excluir usuários** | ❌ | ❌ | ✅ |

---

## ⚙️ Instalação e Execução

### Pré-requisitos
- Node.js v22+ ou v24+ (utiliza `node:sqlite` nativo sem necessidade de compilar binários)
- npm v10+

### Instalação
```bash
git clone <url-do-repositorio>
cd ai-loop
npm install
```

### Iniciar o Servidor em Modo Desenvolvimento
```bash
npm run dev
```
O servidor iniciará em: **`http://localhost:3000`**  
A documentação interativa Swagger estará em: **`http://localhost:3000/docs`**

---

## 👥 Contas de Demonstração (Seed)

Ao iniciar a aplicação pela primeira vez, o banco é populado automaticamente com as seguintes credenciais:

| Perfil | Email | Senha | Poderes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@blog.com` | `admin123` | Acesso total: moderação, gestão de usuários e posts |
| **Redator** | `redator@blog.com` | `redator123` | Criação e edição de posts próprios |
| **Leitor** | `leitor@blog.com` | `leitor123` | Leitura de posts publicados e comentários |

---

## 📖 Documentação Swagger Interativa

Acesse no navegador:
```
http://localhost:3000/docs
```
1. Faça login em `/auth/login` com uma das contas acima.
2. Copie o `token` retornado.
3. Clique no botão verde **Authorize** no topo do Swagger e cole o token no formato:
   ```
   Bearer SEU_TOKEN_AQUI
   ```
4. Teste qualquer endpoint respeitando as regras de permissão.

---

## 🧪 Testes Automatizados

A suíte de testes cobre 100% da matriz de permissões RBAC, autenticação JWT e validação de dados:

```bash
# Executa todos os testes uma única vez
npm test

# Executa os testes em modo observador (watch) para TDD
npm run test:watch
```

---

## 🤖 Loops de IA (Como Construir Código com IA)

O diretório [`ai_loop/`](./ai_loop/) contém um guia completo e um script interativo que explica como sair do modelo de "perguntas e respostas" soltas para um **Loop Autônomo de Desenvolvimento de Software**.

### Como testar o Loop Interativo:
```bash
npm run ai-loop:demo
```

### Leia o Guia Completo:
Consulte [`ai_loop/GUIDE_AI_LOOPS.md`](./ai_loop/GUIDE_AI_LOOPS.md) para aprender:
1. **O Ciclo de Feedback Determinístico**: Como o TDD atua como oráculo de verdade para a IA.
2. **Auto-Cura (Self-Healing)**: Como alimentar stacktraces e erros de compilador no modelo até atingir 100% de sucesso.
3. **Templates Prontos**: Prompts otimizados para Cursor, Aider, Antigravity e agentes autônomos.

---

## 🛣️ Endpoints da API

### Autenticação (`/auth`)
- `POST /auth/register` - Cadastro de usuário (default: `leitor`)
- `POST /auth/login` - Autenticação e geração de token JWT
- `GET /auth/me` - Perfil do usuário logado (requer token)

### Posts (`/posts`)
- `GET /posts` - Listagem de posts (público / filtrado por perfil)
- `GET /posts/:id` - Detalhes do post com comentários
- `POST /posts` - Criação de post (**redator** ou **admin**)
- `PUT /posts/:id` - Atualização (**autor** ou **admin**)
- `DELETE /posts/:id` - Exclusão (**autor** ou **admin**)

### Comentários
- `GET /posts/:postId/comments` - Listar comentários do post
- `POST /posts/:postId/comments` - Comentar (**autenticado**)
- `DELETE /comments/:id` - Excluir comentário (**autor** ou **admin**)

### Administração (`/admin/users`)
- `GET /admin/users` - Listar todos os usuários (**exclusivo admin**)
- `PATCH /admin/users/:id/role` - Alterar papel de usuário (**exclusivo admin**)
- `DELETE /admin/users/:id` - Deletar usuário (**exclusivo admin**)
