---
title: "Definir um funcionário de IA integrado"
description: "Apresenta como um plugin NocoBase pode criar um funcionário de IA integrado com defineAIEmployee, prompt.md e os diretórios skills e tools."
keywords: "NocoBase,funcionário de IA integrado,defineAIEmployee,prompt.md,AIEmployeeOptions,Nathan"
---

# Definir um funcionário de IA integrado

Um funcionário de IA integrado é registrado junto com o plugin. Na primeira vez que o plugin é carregado, o NocoBase cria o registro correspondente e o identifica como funcionário integrado; nos carregamentos seguintes, atualiza o perfil, o prompt, as habilidades e as ferramentas padrão conforme o código.

## Formato de arquivo único ou de diretório

Se o perfil for simples e não precisar de um prompt separado ou de recursos exclusivos, use um único arquivo:

```text
src/ai/ai-employees/lina.ts
```

Se precisar de `prompt.md`, uma Skill exclusiva ou uma Tool exclusiva, use um diretório:

```text
src/ai/ai-employees/nathan/
├── index.ts
├── prompt.md
├── skills/
└── tools/
```

O formato de diretório é mais adequado para manutenção de longo prazo.

## Usar `defineAIEmployee()`

Em `index.ts`, use `@nocobase/ai`, que fornece a função `defineAIEmployee()`:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Helps developers understand plugin structure and complete small development tasks.',
  greeting: 'Hello, I can help you start a NocoBase plugin development task. What would you like to build?',
});
```

Os principais campos são:

| Campo | Função |
| --- | --- |
| `username` | Identificador único do funcionário de IA; é obrigatório e deve permanecer estável a longo prazo |
| `category` | Categoria do funcionário, como `developer` ou `business` |
| `description` | Descrição interna e informações de busca |
| `avatar` | Identificador do avatar |
| `nickname` | Nome exibido aos usuários |
| `position` | Cargo |
| `bio` | Apresentação |
| `greeting` | Saudação de uma nova conversa |
| `systemPrompt` | Prompt de sistema padrão |
| `skills` | Nomes de Skills vinculadas explicitamente |
| `tools` | Configuração de Tools vinculadas explicitamente |
| `chatSettings` | Configurações da conversa, como habilitação de Skills e Tools e modo do prompt de sistema |
| `sort` | Ordem dos funcionários integrados |

Atualmente, `tools` é um array de objetos:

```ts
tools: [
  { name: 'greetDeveloper' },
  { name: 'customDataExporter', autoCall: true }, // customDataExporter 的 scope 必须是 CUSTOM
]
```

`autoCall` serve apenas para substituir a permissão do funcionário de IA atual para chamar uma Tool com escopo `CUSTOM`. Para Tools `GENERAL` e `SPECIFIED`, o runtime continua respeitando o `defaultPermission` da própria Tool. Se uma Tool `CUSTOM` não tiver uma configuração no nível do funcionário, também será usado o `defaultPermission` da própria Tool.

Uma Tool encontrada automaticamente no diretório é normalizada como `{ name: 'toolName' }`.

## Colocar prompts longos em `prompt.md`

Se o funcionário de IA usar o formato de diretório, o prompt de sistema pode ficar no arquivo `prompt.md` do mesmo nível:

```text
src/ai/ai-employees/dev-helper/prompt.md
```

```md
You are Dev Helper, a NocoBase plugin development guide.

Help the user break a plugin requirement into small, verifiable steps.

When the user asks you to welcome a developer, load the `welcome-developer` skill and follow it.

Never claim that a Tool succeeded before receiving its result.
```

Quando `prompt.md` existe, ele substitui em `index.ts` o valor de `systemPrompt`. Manter prompts longos em um arquivo Markdown facilita a revisão e evita problemas de escape em template strings TypeScript.

## Exemplo de funcionário de IA integrado: Nathan

O perfil do funcionário em `packages/plugins/@nocobase/plugin-flow-engine/src/ai/ai-employees/nathan/index.ts` é bem curto:

```ts
export default defineAIEmployee({
  username: 'nathan',
  category: 'developer',
  description: 'AI employee for coding',
  avatar: 'nocobase-002-male',
  nickname: 'Nathan',
  position: 'Frontend code engineer',
  greeting: 'Hello, I’m Nathan, your frontend code engineer...',
});
```

Todas as capacidades de Nathan vêm dos outros recursos no mesmo diretório:

```text
nathan/
├── index.ts
├── prompt.md
└── skills/
    └── frontend-developer/
        ├── SKILLS.md
        └── tools/
            ├── getContextApis.ts
            ├── getContextEnvs.ts
            ├── getContextVars.ts
            ├── lintAndTestJS.ts
            ├── patchJSCode.ts
            ├── readJSCode.ts
            └── writeJSCode.ts
```

O processo de carregamento estabelece automaticamente o vínculo entre as três camadas:

1. Os arquivos em `tools/` são registrados como Tools
2. As Tools são vinculadas automaticamente à Skill `frontend-developer`
3. A Skill é vinculada automaticamente a Nathan

Por isso, `index.ts` não precisa repetir a lista completa de `skills` e `tools`.

## Links relacionados

- [Desenvolvimento de plugins para funcionários de IA](./index.md) — entenda a relação entre funcionários de IA integrados, Tools e Skills
- [Definir uma Skill](./define-skill.md) — crie uma Skill exclusiva para o funcionário
- [Exemplo completo: criar um funcionário de IA integrado](./complete-example.md) — veja o diretório completo do funcionário e o processo de registro
- [Internacionalização de plugins para funcionários de IA](./internationalization.md) — entenda as diferenças de localização entre o perfil do funcionário e os textos de Tools e Skills
