---
title: "Exemplo completo: criar um funcionário de IA integrado"
description: "Um exemplo completo de como definir uma Tool, uma Skill, um prompt de sistema e um funcionário de IA integrado em um plugin NocoBase."
keywords: "NocoBase,Dev Helper,exemplo de funcionário de IA,defineTools,defineAIEmployee,SKILLS.md"
---

# Exemplo completo: criar um funcionário de IA integrado

Neste exemplo completo, você criará um funcionário de IA integrado que orienta o desenvolvimento de plugins. O funcionário se chamará `Dev Helper` e terá uma Tool, uma Skill e um prompt de sistema. Quando o usuário disser “Cumprimente Alice, por favor”, o funcionário carregará a Skill `welcome-developer`, chamará a Tool `greetDeveloper` para confirmar o nome e gerará uma saudação no idioma atual do usuário.

:::tip Leitura prévia

- [Definir uma Tool no servidor](./define-tool.md) — conheça `defineTools()` e a estrutura básica de uma Tool
- [Definir uma Skill](./define-skill.md) — conheça `SKILLS.md` e o vínculo de Tools
- [Definir um funcionário de IA integrado](./define-ai-employee.md) — conheça `defineAIEmployee()` e o diretório do funcionário

:::

## Resultado final

Quando estiver pronto, o plugin oferecerá as seguintes capacidades:

- Criar um funcionário de IA integrado chamado `Dev Helper`
- Vincular automaticamente a Skill `welcome-developer` ao funcionário
- Confirmar o nome do desenvolvedor chamando a Tool `greetDeveloper` por meio da Skill
- Gerar uma saudação e uma pergunta de acompanhamento no idioma atual do usuário

<!-- É necessária uma captura de tela da página de administração de funcionários de IA mostrando o Dev Helper identificado como funcionário integrado -->

## Estrutura final de diretórios

```text
src/ai/ai-employees/dev-helper/
├── index.ts
├── prompt.md
└── skills/
    └── welcome-developer/
        ├── SKILLS.md
        └── tools/
            └── greetDeveloper.ts
```

Este exemplo não precisa de código no frontend nem de registro manual em `src/server/plugin.ts`.

## Etapa 1: definir a Tool

Crie `src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/greetDeveloper.ts`:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'greetDeveloper',
    description: 'Validate the developer name before the assistant writes a welcome message.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name provided by the user.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: {
        name: args.name,
      },
    };
  },
});
```

## Etapa 2: definir a Skill

Crie `src/ai/ai-employees/dev-helper/skills/welcome-developer/SKILLS.md`:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and guide them to the next NocoBase plugin-development step.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You welcome developers who are starting NocoBase plugin development.

# Workflow

1. Read the developer name from the user's request.
2. If the name is missing, ask the user for it.
3. Call `greetDeveloper` exactly once.
4. Wait for a tool result with `status: "success"`.
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Ask which plugin capability the developer wants to build next, using the same language as the user.

# Constraints

- Do not invent a name.
- Do not claim the Tool succeeded before receiving its result.
- Write both the welcome message and the follow-up question in the same language as the user.
```

Como `greetDeveloper.ts` está no diretório `tools/` da Skill atual, não é necessário declarar também `tools: [greetDeveloper]`.

## Etapa 3: definir o perfil do funcionário de IA

Crie `src/ai/ai-employees/dev-helper/index.ts`:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Welcomes developers and guides them into a small, verifiable plugin-development task.',
  greeting: 'Hello, I can help you begin a NocoBase plugin development task. Who are we welcoming today?',
});
```

`username` é o identificador único no banco de dados. Não o altere sem necessidade depois da publicação, pois o NocoBase tratará o novo valor como outro funcionário de IA integrado.

:::warning Atenção

Além de permanecer estável, o `username` não pode ter o mesmo nome de outro plugin ou funcionário de IA existente. Se o banco de dados já contiver o mesmo `username`, o carregamento do plugin atualizará o registro correspondente em vez de criar um novo funcionário isolado.

Quando o plugin é recarregado, `category`, `nickname`, `position`, `avatar`, `bio`, `greeting`, o prompt de sistema padrão, os vínculos de Skills e Tools, `chatSettings` e `sort` definidos no código podem ser gravados novamente no banco de dados. Para plugins de produção, recomenda-se usar um nome com o prefixo do plugin, como `developer-helper-dev-assistant`.

:::

## Etapa 4: definir o prompt de sistema

Crie `src/ai/ai-employees/dev-helper/prompt.md`:

```md
You are Dev Helper, a NocoBase plugin development guide.

Help users begin with a small, verifiable task.

When the user asks you to greet or welcome a developer, load the `welcome-developer` skill and follow its workflow.

Never claim that a Tool succeeded before receiving its result.
```

Com isso, a relação entre os diretórios estabelece os vínculos automaticamente:

```text
greetDeveloper Tool
  → welcome-developer Skill
  → dev-helper AI employee
```

## Etapa 5: habilitar e verificar

Faça um novo build ou reinicie o serviço de desenvolvimento e confirme se o plugin que contém esses arquivos está habilitado. Depois, verifique na página de administração de funcionários de IA:

- Se `Dev Helper` aparece
- Se o funcionário está identificado como funcionário integrado
- Se as Skills exclusivas do funcionário incluem `welcome-developer`
- Se `greetDeveloper` fica disponível depois que a Skill é carregada

Digite na conversa:

```text
请向 Alice 打个招呼。
```

O fluxo esperado é:

```text
加载 welcome-developer
  → 调用 greetDeveloper({ name: "Alice" })
  → 收到 status: "success" 和 content.name
  → Skill 使用用户当前语言生成问候语
  → 询问接下来要开发什么插件能力
```

Se você não quiser solicitar confirmação ao usuário antes de cada chamada da Tool, defina `defaultPermission: 'ALLOW'`. Para Tools que excluem dados, fazem alterações em lote ou causam efeitos colaterais externos, normalmente é melhor manter `ASK` como padrão.

## Resumo

| Arquivo | Responsabilidade |
| --- | --- |
| `greetDeveloper.ts` | Valida a entrada e retorna um resultado estruturado da Tool |
| `SKILLS.md` | Define o fluxo de chamada da Tool e de resposta |
| `prompt.md` | Define o papel do funcionário e as restrições globais |
| `index.ts` | Define o perfil do funcionário de IA integrado |

## Links relacionados

- [Desenvolvimento de plugins para funcionários de IA](./index.md) — entenda a relação entre Tool, Skill e funcionário de IA integrado
- [Definir uma Tool no servidor](./define-tool.md) — consulte a configuração completa de `defineTools()`
- [Definir uma Skill](./define-skill.md) — consulte os campos e a sintaxe de `SKILLS.md`
- [Definir um funcionário de IA integrado](./define-ai-employee.md) — consulte `defineAIEmployee()` e os vínculos por diretório
- [Internacionalização de plugins para funcionários de IA](./internationalization.md) — adicione traduções aos textos da interface de administração usados no exemplo
