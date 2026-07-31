---
title: "Definir uma Tool no servidor"
description: "Apresenta defineTools, scope, schema, invoke, permissões e registro por diretório para Tools de funcionários de IA no servidor do NocoBase."
keywords: "NocoBase,Tool de funcionário de IA,defineTools,ToolsOptions,Zod,invoke"
---

# Definir uma Tool no servidor

## Estrutura mínima de uma Tool

Uma Tool no servidor usa `@nocobase/ai`, que fornece a função `defineTools()`. A Tool abaixo recebe um nome e retorna uma saudação:

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
    description: 'Generate a short greeting for the developer named by the user.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name to greet.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: `Hello ${args.name}, welcome to NocoBase plugin development!`,
    };
  },
});
```

Se o caminho do arquivo for `src/ai/tools/greetDeveloper.ts`, o carregador usará o nome de arquivo `greetDeveloper` como nome final da Tool. Mesmo que `definition.name` contenha outro valor, ele será substituído pelo nome do arquivo durante o registro.

Por isso, mantenha por padrão o mesmo nome no arquivo, em `definition.name`, nas referências da Skill e no registro no frontend.

## Opções de configuração da Tool

As principais opções de `defineTools()` são:

| Configuração | Função | Valor padrão |
| --- | --- | --- |
| `scope` | Determina o escopo de uso da Tool | Obrigatório |
| `execution` | Define se a lógica é executada no `backend` ou no `frontend` | `backend` |
| `defaultPermission` | Permite a chamada direta ou solicita confirmação antes de chamar a Tool | `ASK` |
| `silence` | Define se o aviso de chamada da Tool fica oculto na conversa | `false` |
| `introduction` | Título e descrição exibidos na interface de administração | Usa o nome da Tool |
| `definition` | Nome, descrição e schema de parâmetros fornecidos ao modelo | Obrigatório |
| `invoke` | Lógica que executa de fato a Tool | Obrigatório |

A escolha de `scope` afeta diretamente a forma como a Tool entra no contexto do funcionário de IA:

| `scope` | Forma de uso |
| --- | --- |
| `GENERAL` | Compartilhada por todos os funcionários de IA; normalmente usada para capacidades básicas gerais |
| `SPECIFIED` | Disponível somente para Skills ou funcionários de IA vinculados a essa Tool |
| `CUSTOM` | Pode ser adicionada manualmente pelo administrador na configuração do funcionário de IA, com a opção “Perguntar” ou “Permitir” |

Recomenda-se usar `SPECIFIED` por padrão. Use `GENERAL` somente quando todos os funcionários de IA realmente precisarem dessa capacidade; use `CUSTOM` quando o administrador precisar escolher por funcionário.

## `definition` é destinada ao modelo

`definition.description` e `definition.schema` afetam tanto a escolha da Tool pelo modelo quanto a construção dos parâmetros. A descrição deve esclarecer três pontos:

- Quando chamar a Tool
- O que cada parâmetro representa
- Quais tarefas não devem ser processadas por essa Tool

Recomenda-se usar Zod no schema de parâmetros:

```ts
schema: z.object({
  query: z.string().describe('A specific search query.'),
  limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of records to return.'),
})
```

O nome da Tool também deve permanecer estável. Skills, configurações de funcionários de IA, cartões no frontend e mensagens de conversa já salvas localizam a Tool pelo nome.

## O que `invoke()` pode acessar

No servidor, `invoke()` recebe três parâmetros:

```ts
invoke: async (ctx, args, runtime) => {
  // ctx：当前 NocoBase action Context
  // args：模型根据 schema 生成的参数
  // runtime.toolCallId：当前 ToolCall ID
  // runtime.writer(chunk)：流式写出中间结果
}
```

Por meio de `ctx`, é possível acessar o aplicativo atual, o banco de dados, as informações de autenticação e os parâmetros da action. Por exemplo:

```ts
const repository = ctx.app.db.getRepository('posts');
const currentUser = ctx.auth?.user;
const values = ctx.action?.params?.values;
```

A Tool deve retornar uma estrutura que permita identificar sucesso ou falha. As Tools integradas normalmente usam este formato:

```ts
return {
  status: 'success',
  content: result,
};
```

Quando ocorrer uma falha de negócio previsível, retorne também um status e um motivo claros, sem deixar que o modelo deduza se a operação foi bem-sucedida.

## Usar um diretório para descrições longas

Além de um único arquivo, uma Tool também pode usar um diretório:

```text
src/ai/tools/documentSearch/
├── index.ts
└── description.md
```

`index.ts` exporta por padrão o resultado de `defineTools()`. Quando `description.md` existe, todo o conteúdo desse arquivo substitui `definition.description`, o que é adequado para instruções de uso mais longas.

O nome do diretório, `documentSearch`, torna-se o nome final do registro.

## Exemplo de Tool integrada: `subAgentWebSearch`

O arquivo `packages/plugins/@nocobase/plugin-ai/src/ai/tools/subAgentWebSearch.ts` apresenta uma Tool completa no servidor:

```ts
export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Web search")}}',
    about: '{{t("Use web search to quickly find up-to-date information from the internet.")}}',
  },
  definition: {
    name: 'subAgentWebSearch',
    description: 'Search the web for current information...',
    schema: z.object({
      query: z.array(z.string()),
    }),
  },
  invoke: async (ctx, args) => {
    // 获取 AI 插件和当前会话使用的模型配置。
    const pluginAI = ctx.app.pm.get('ai') as PluginAIServer;
    const { model } = ctx.action?.params?.values ?? {};
    const { provider } = await pluginAI.aiManager.getLLMService({
      ...model,
      webSearch: true,
      reasoning: { mode: 'off' },
    });

    // 独立查询并行执行，最后统一返回。
    const result = await Promise.all(
      args.query.map(async (query) => {
        const content = await provider.invoke(/* messages */);
        return { query, result: content.text };
      }),
    );

    return { status: 'success', content: result };
  },
});
```

Essa implementação apresenta algumas práticas reutilizáveis:

- Usar `SPECIFIED` para disponibilizar a ferramenta somente a funcionários ou habilidades específicas
- Usar Zod para restringir os parâmetros gerados pelo modelo
- Ler a configuração da conversa de IA atual em `ctx.action.params.values`
- Reunir várias consultas independentes em um único ToolCall e executá-las em paralelo com `Promise.all()`
- Retornar resultados estruturados e com origem clara para que o modelo da camada superior continue o processamento

## Links relacionados

- [Desenvolvimento de plugins para funcionários de IA](./index.md) — escolha a camada de capacidade que precisa ser ampliada
- [Definir uma Skill](./define-skill.md) — organize com uma Skill o fluxo de chamada de várias Tools
- [Exemplo completo: criar um funcionário de IA integrado](./complete-example.md) — veja um exemplo executável de Tool
- [Adicionar interação no frontend a uma Tool](./frontend-tool-ui.md) — adicione uma interface de confirmação e seleção ao ToolCall
