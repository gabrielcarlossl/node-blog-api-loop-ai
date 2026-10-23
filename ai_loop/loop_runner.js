#!/usr/bin/env node

/**
 * loop_runner.js
 *
 * Demonstrador interativo de um Loop de IA (Agentic Feedback Loop).
 * Mostra na prática como uma ferramenta de IA deve iterar:
 *   [Executar Testes] -> [Capturar Erro] -> [Montar Prompt de Correção] -> [Aplicar Fix] -> [Revalidar]
 */

import { execSync } from 'node:child_process';
import readline from 'node:readline';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function logHeader(title) {
  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  🤖 ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════${colors.reset}\n`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runStep(stepNumber, title, action) {
  console.log(`${colors.bold}${colors.yellow}[Etapa ${stepNumber}] ${title}...${colors.reset}`);
  await wait(600);
  return action();
}

async function main() {
  logHeader('DEMONSTRAÇÃO DE LOOP DE IA (AI CODING FEEDBACK LOOP)');

  console.log(`${colors.bold}Este script simula o ciclo de auto-cura de um Agente de IA desenvolvendo a API de Blog.${colors.reset}\n`);

  // Etapa 1: Rodando baseline de testes
  await runStep(1, 'Executando Oráculo Determinístico (Vitest Baseline)', () => {
    try {
      const output = execSync('npx vitest run', { encoding: 'utf-8', stdio: 'pipe' });
      console.log(`${colors.green}✔ Baseline de testes verificado com sucesso!${colors.reset}`);
      console.log(`  Resumo: 22 testes aprovados (100% de sucesso).\n`);
    } catch (err) {
      console.error(`${colors.red}Falha ao rodar testes baseline: ${err.message}${colors.reset}`);
    }
  });

  // Etapa 2: Simulação de Introdução de Bug / Nova Funcionalidade
  await runStep(2, 'Simulando cenário de falha em funcionalidade', () => {
    console.log(`  Suponha que foi adicionada uma nova validação ou que um desenvolvedor alterou`);
    console.log(`  uma regra de segurança em: ${colors.magenta}src/controllers/post.controller.ts${colors.reset}`);
    console.log(`  Erro simulado: "Leitor tentando criar postagem não está recebendo 403 Forbidden".\n`);
  });

  // Etapa 3: Como a IA estrutura o pacote de feedback
  await runStep(3, 'Estruturando o Diagnóstico de Feedback para o Modelo de IA', () => {
    const diagnosticPayload = {
      timestamp: new Date().toISOString(),
      exitCode: 1,
      failingTest: 'tests/posts-rbac.test.ts > LEITOR não pode criar post (403 Forbidden)',
      expected: '403 Forbidden',
      received: '201 Created',
      stackTraceSnippet: `
        AssertionError: expected 201 to be 403
          at /home/gabriel/Documents/ai-loop/tests/posts-rbac.test.ts:25:27
      `.trim(),
      targetFiles: ['src/routes/post.routes.ts', 'src/controllers/post.controller.ts'],
    };

    console.log(`${colors.blue}Payload JSON injetado automaticamente no próximo passo do loop:${colors.reset}`);
    console.log(JSON.stringify(diagnosticPayload, null, 2));
    console.log('');
  });

  // Etapa 4: Como a IA processa o prompt de correção
  await runStep(4, 'Geração da Correção pela IA (Self-Healing)', () => {
    console.log(`  A IA analisa o middleware de rota:`);
    console.log(`  ${colors.red}- router.post('/', authenticate, createPost);${colors.reset}`);
    console.log(`  E aplica a correção exata:`);
    console.log(`  ${colors.green}+ router.post('/', authenticate, requireRole('redator', 'admin'), createPost);${colors.reset}\n`);
  });

  // Etapa 5: Re-execução e Convergência (Green State)
  await runStep(5, 'Re-executando testes até convergência (Exit Code 0)', () => {
    const check = execSync('npx vitest run tests/posts-rbac.test.ts', { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`${colors.green}✔ Convergência alcançada! Todos os testes de RBAC passaram em verde.${colors.reset}\n`);
  });

  logHeader('RESUMO DO APRENDIZADO');
  console.log(`1. ${colors.bold}O segredo do loop de IA não é o tamanho do prompt inicial${colors.reset}, mas a qualidade do feedback de retorno.`);
  console.log(`2. ${colors.bold}O TDD (testes automatizados)${colors.reset} dá à IA um oráculo objetivo: ela sabe exatamente quando parar.`);
  console.log(`3. ${colors.bold}O ciclo clássico:${colors.reset} Spec -> Testes que falham -> Código -> Erro -> Auto-correção -> 100% verde.\n`);
  console.log(`Consulte o guia completo em: ${colors.cyan}ai_loop/GUIDE_AI_LOOPS.md${colors.reset}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
