# Guia Definitivo: Como Criar e Utilizar Loops de IA para Produção de Código

## 1. O que é um "Loop de IA" (AI Coding Loop)?

A maioria dos desenvolvedores usa IA de forma **linear** (one-shot):
1. Escreve um prompt pedindo uma tela ou endpoint.
2. Copia o código gerado.
3. Cola no editor, roda o projeto e descobre que quebrou.
4. Tenta consertar manualmente ou manda uma mensagem confusa para a IA: *"deu erro"*.

**Um Loop de IA substitui esse processo frágil por um ciclo fechado e determinístico**:

```
 ┌────────────────────────────────────────────────────────┐
 │                   1. ESPECIFICAÇÃO                     │
 │          Contratos de API, Schemas e Regras            │
 └──────────────────────────┬─────────────────────────────┘
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │                 2. TESTES PRIMEIRO (TDD)               │
 │           Escrever casos de teste que falham           │
 └──────────────────────────┬─────────────────────────────┘
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │                 3. GERAÇÃO DE CÓDIGO                   │
 │           IA escreve a implementação mínima            │
 └──────────────────────────┬─────────────────────────────┘
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │           4. AVALIAÇÃO DETERMINÍSTICA                  │
 │       Execução de Compilador, Linter e Testes          │
 └─────────────┬───────────────────────────┬──────────────┘
               │                           │
          [❌ FALHOU]                  [✅ PASSOU]
               │                           │
               ▼                           ▼
 ┌───────────────────────────┐   ┌────────────────────────┐
 │     5. AUTO-CORREÇÃO      │   │ 6. ENTREGA / COMMIT    │
 │ Stacktrace + Código Atual │   │  Funcionalidade Pronta │
 │    alimentam o próximo    │   └────────────────────────┘
 │       passo do loop       │
 └─────────────┬─────────────┘
               │
               └─────────► Retorna ao Passo 3
```

---

## 2. Os Três Pilares de um Loop de IA Eficiente

### Pilar 1: O Oráculo Determinístico (Ground Truth)
Modelos de linguagem são probabilísticos. Eles não sabem por intuição se uma rota `PUT /posts/:id` respeitou a regra de perfil de `redator`.
- **Quem sabe?** O compilador TypeScript (`tsc`) e o executor de testes (`vitest` / `jest` / `pytest`).
- **A regra de ouro**: **Nunca encerre um loop perguntando à IA se o código está certo.** Encerre o loop quando o comando de testes retornar `Exit Code 0`.

### Pilar 2: TDD como Âncora (Test-Driven Development)
Quando você pede para a IA criar o teste **antes** da funcionalidade:
1. Você força a especificação clara das entradas, saídas e status HTTP esperados (ex: `403 Forbidden` quando leitor tenta criar post).
2. O teste serve como o trilho do trem: a IA não pode fugir do escopo porque qualquer desvio causará falha nos testes.

### Pilar 3: Contexto Enxuto no Feedback de Erro
Quando um teste falha, **não reenvie todo o projeto**. O prompt de autocorreção deve conter apenas:
- O arquivo que falhou e suas linhas relevantes.
- A stack trace exata emitida pelo teste ou pelo compilador.
- A instrução direta: *"Modifique apenas o trecho necessário para fazer o teste X passar, preservando as outras funcionalidades"*.

---

## 3. Os Quatro Padrões de Loops de IA

### Padrão 1: O Loop TDD Básico (Red-Green-Refactor com IA)

1. **Passo Red**: 
   > *"Com base na especificação da rota `DELETE /comments/:id`, escreva um teste em Vitest cobrindo: 1) Autor deletando o próprio comentário (200), 2) Outro usuário tentando deletar (403), 3) Administrador moderando e deletando (200). Não implemente o controller ainda."*
2. **Passo Green**:
   > *"Aqui está o teste recém-criado e o erro retornado pelo Vitest: `Cannot find module comment.controller`. Implemente o controller e a rota para fazer todos os testes passarem."*
3. **Passo Feedback (se falhar)**:
   > *"O teste 'Outro usuário tentando deletar' falhou com: `expected 403, received 200`. Analise a checagem de autor no controller e corrija."*

---

### Padrão 2: O Loop de Auto-Cura Autônomo (Self-Healing Loop)

Neste padrão, você utiliza um script simples (Node.js ou Bash) acoplado a uma CLI de IA (ou à API do Gemini/OpenAI/Claude):

```bash
#!/bin/bash
# loop.sh - Executa testes e retroalimenta o modelo até passar
MAX_TENTATIVAS=5
TENTATIVA=1

while [ $TENTATIVA -le $MAX_TENTATIVAS ]; do
  echo "▶️ [Ciclo $TENTATIVA] Rodando testes..."
  ERRO=$(npm test 2>&1)
  
  if [ $? -eq 0 ]; then
    echo "🎉 SUCESSO! Todos os testes passaram no ciclo $TENTATIVA."
    exit 0
  fi

  echo "❌ Falha detectada. Invocando IA com o traceback..."
  # Envia $ERRO + arquivos modificados para o agente corrigir
  node ./scripts/ai_fix.js "$ERRO"
  
  TENTATIVA=$((TENTATIVA + 1))
done

echo "⚠️ Limite de tentativas atingido. Intervenção humana necessária."
exit 1
```

---

### Padrão 3: O Loop de Duplo Agente (Planner + Coder)

Para funcionalidades complexas, divida o problema em dois papéis de IA:

1. **Agente Planejador (Planner)**:
   - Analisa os requisitos.
   - Escreve os casos de teste e a lista de tarefas granulares (checklist).
   - Bloqueia até que o usuário valide.
2. **Agente Executor (Coder)**:
   - Pega uma tarefa por vez.
   - Escreve o código.
   - Roda o comando de validação (`npm test`, `tsc`).
   - Só marca a tarefa como concluída quando o comando retornar verde.

---

## 4. Templates de Prompts para Usar no seu Editor (Cursor, Antigravity, Aider)

### Template A: Inicialização de Funcionalidade (Spec + Contrato)
```markdown
Quero implementar uma nova funcionalidade na API do Blog: [NOME_DA_FUNCIONALIDADE].

Regras de Negócio:
- Perfil leitor: [O que pode/não pode]
- Perfil redator: [O que pode/não pode]
- Perfil admin: [O que pode/não pode]

Fluxo de Trabalho Obrigatório (Loop de IA):
1. Crie os schemas Zod de entrada e saída.
2. Crie o arquivo de teste em `tests/[NOME].test.ts` com todos os cenários de sucesso e falha (RBAC).
3. Execute `npm test` para confirmar que os testes falharam pelos motivos corretos (Red).
4. Implemente o controller e rotas correspondentes.
5. Execute `npx tsc --noEmit && npm test` até que 100% dos testes passem (Green).
```

### Template B: Prompt de Auto-Correção (Feedback Loop)
```markdown
O teste automatizado falhou com a seguinte saída:

[COLE AQUI A SAÍDA DO TERMINAL / VITEST / TSC]

Arquivo relevante: [CAMINHO_DO_ARQUIVO]

Objetivo:
- Analise a causa raiz da falha sem quebrar outros testes.
- Altere apenas o arquivo necessário.
- Explique brevemente o porquê da correção.
```

---

## 5. Como Usar o Demonstador Prático deste Projeto

Este repositório inclui um demonstrador interativo de Loop de Auto-Cura:
```bash
npm run ai-loop:demo
```

Ele simula o comportamento de um agente autônomo:
1. Inspeciona o estado atual dos testes.
2. Cria intencionalmente um cenário com falha controlada.
3. Captura o erro no formato consumível por uma LLM.
4. Gera e aplica o patch corretivo.
5. Re-executa os testes e atinge a convergência verde (100% aprovado).
