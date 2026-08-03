---
title: "Define a Server-side Tool"
description: "Explains defineTools, scope, schema, invoke, permissions, and directory registration for NocoBase AI employee server-side Tools."
keywords: "NocoBase,AI employee Tool,defineTools,ToolsOptions,Zod,invoke"
---

# Define a Server-side Tool

## Minimal Tool structure

Define a server-side Tool with `defineTools()` from `@nocobase/ai`. The following Tool accepts a name and returns a greeting:

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

If the file path is `src/ai/tools/greetDeveloper.ts`, the loader uses the filename `greetDeveloper` as the final Tool name. Even if `definition.name` contains another value, registration overrides it with the filename.

Therefore, keep the filename, `definition.name`, the name referenced by the Skill, and the name registered on the frontend consistent by default.

## Tool options

The main `defineTools()` options are:

| Option | Purpose | Default |
| --- | --- | --- |
| `scope` | Determines the Tool's availability scope | Required |
| `execution` | Specifies whether the logic runs on the `backend` or `frontend` | `backend` |
| `defaultPermission` | Allows the Tool directly or asks for confirmation before a call | `ASK` |
| `silence` | Hides the Tool call indicator in the conversation | `false` |
| `introduction` | Title and description displayed in the management interface | Uses the Tool name |
| `definition` | Provides the name, description, and parameter schema to the model | Required |
| `invoke` | Actual execution logic of the Tool | Required |

The selected `scope` directly affects how the Tool enters an AI employee's context:

| `scope` | Usage |
| --- | --- |
| `GENERAL` | Shared by all AI employees, usually for general foundational capabilities |
| `SPECIFIED` | Available only to a Skill or AI employee that binds the Tool |
| `CUSTOM` | Administrators can add it manually in AI employee configuration and set it to “Ask” or “Allow” |

Use `SPECIFIED` by default. Use `GENERAL` only when every AI employee definitely needs the capability. Use `CUSTOM` when administrators should select it per employee.

## `definition` is written for the model

`definition.description` and `definition.schema` affect whether the model selects the Tool and how it constructs arguments. The description should explain three things:

- When to call the Tool
- What each argument represents
- Which tasks the Tool should not handle

Zod is recommended for the parameter schema:

```ts
schema: z.object({
  query: z.string().describe('A specific search query.'),
  limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of records to return.'),
})
```

The Tool name must also remain stable. Skills, AI employee configurations, frontend cards, and saved chat messages all locate it by name.

## What `invoke()` receives

A server-side `invoke()` receives three arguments:

```ts
invoke: async (ctx, args, runtime) => {
  // ctx：当前 NocoBase action Context
  // args：模型根据 schema 生成的参数
  // runtime.toolCallId：当前 ToolCall ID
  // runtime.writer(chunk)：流式写出中间结果
}
```

Through `ctx`, you can access the current application, database, authentication information, and action arguments. For example:

```ts
const repository = ctx.app.db.getRepository('posts');
const currentUser = ctx.auth?.user;
const values = ctx.action?.params?.values;
```

A Tool should return a structure that clearly indicates success or failure. Built-in Tools commonly use this shape:

```ts
return {
  status: 'success',
  content: result,
};
```

For expected business failures, return a clear status and reason instead of making the model guess whether the operation succeeded.

## Directory-based Tools

A Tool can use a directory instead of a single file:

```text
src/ai/tools/documentSearch/
├── index.ts
└── description.md
```

`index.ts` exports the result of `defineTools()` by default. When `description.md` exists, its entire content overrides `definition.description`, making it suitable for longer Tool instructions.

The directory name `documentSearch` becomes the final registered name.

## Built-in Tool example: `subAgentWebSearch`

`packages/plugins/@nocobase/plugin-ai/src/ai/tools/subAgentWebSearch.ts` demonstrates a complete server-side Tool:

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

This implementation demonstrates several reusable practices:

- Use `SPECIFIED` to limit the Tool to designated employees or Skills
- Use Zod to constrain model-generated arguments
- Read the current AI conversation configuration from `ctx.action.params.values`
- Put multiple independent queries into one ToolCall and run them concurrently with `Promise.all()`
- Return structured results with clear provenance for the higher-level model to process

## Related links

- [AI employee plugin development](./index.md) — Choose which capability layer to extend
- [Define a Skill](./define-skill.md) — Use a Skill to organize the call flow for multiple Tools
- [Complete example: Create a built-in AI employee](./complete-example.md) — See a runnable Tool example
- [Add frontend interaction to a Tool](./frontend-tool-ui.md) — Add confirmation and selection UI to a ToolCall
