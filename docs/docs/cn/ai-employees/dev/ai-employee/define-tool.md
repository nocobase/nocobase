---
title: "定义服务端 Tool"
description: "介绍 NocoBase AI 员工服务端 Tool 的 defineTools、scope、schema、invoke、权限和目录注册方式。"
keywords: "NocoBase,AI 员工 Tool,defineTools,ToolsOptions,Zod,invoke"
---

# 定义服务端 Tool

在 NocoBase 中，**Tool（工具）**负责执行查询、写入或外部请求等具体操作。服务端 Tool 通常使用 `@nocobase/ai` 提供的 `defineTools()` 定义，并放在插件的 `src/ai/**/tools/` 目录中。

## Tool 的最小结构

服务端 Tool 使用 `@nocobase/ai` 提供的 `defineTools()` 定义。下面的 Tool 接收一个名字，并返回一段问候语：

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

如果文件路径是 `src/ai/tools/greetDeveloper.ts`，加载器会把文件名 `greetDeveloper` 作为最终 Tool 名称。即使 `definition.name` 写成了其他值，注册时也会被文件名覆盖。

因此，默认让文件名、`definition.name`、Skill 中引用的名字和前端注册的名字保持一致。

## Tool 配置项

`defineTools()` 的主要配置如下：

| 配置 | 作用 | 默认值 |
| --- | --- | --- |
| `scope` | 决定 Tool 的可用范围 | 必填 |
| `execution` | 指定逻辑在 `backend` 还是 `frontend` 执行 | `backend` |
| `defaultPermission` | Tool 调用前是直接允许还是请求确认 | `ASK` |
| `silence` | 是否隐藏对话中的 Tool 调用提示 | `false` |
| `introduction` | 管理界面展示的标题和说明 | 使用 Tool 名称 |
| `definition` | 提供给模型的名称、描述和参数 schema | 必填 |
| `invoke` | Tool 的实际执行逻辑 | 必填 |

`scope` 的选择会直接影响 Tool 怎样进入 AI 员工上下文：

| `scope` | 使用方式 |
| --- | --- |
| `GENERAL` | 所有 AI 员工共享，通常用于通用基础能力 |
| `SPECIFIED` | 只有绑定该 Tool 的 Skill 或 AI 员工可以使用 |
| `CUSTOM` | 管理员可以在 AI 员工配置中手动添加，并设置「询问」或「允许」 |

默认推荐 `SPECIFIED`。只有确定每个 AI 员工都需要这个能力时，才使用 `GENERAL`；希望管理员按员工选择时，则使用 `CUSTOM`。

## `definition` 是写给模型看的

`definition.description` 和 `definition.schema` 会影响模型是否选择这个 Tool，以及怎样构造参数。描述需要说清三件事：

- 什么情况下调用
- 每个参数代表什么
- 哪些事情不应该由这个 Tool 处理

参数 schema 推荐使用 Zod：

```ts
schema: z.object({
  query: z.string().describe('A specific search query.'),
  limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of records to return.'),
})
```

Tool 名称也需要保持稳定。Skill、AI 员工配置、前端卡片和已经保存的聊天消息都会通过名称找到它。

## `invoke()` 能拿到什么

服务端 `invoke()` 接收三个参数：

```ts
invoke: async (ctx, args, runtime) => {
  // ctx：当前 NocoBase action Context
  // args：模型根据 schema 生成的参数
  // runtime.toolCallId：当前 ToolCall ID
  // runtime.writer(chunk)：流式写出中间结果
}
```

通过 `ctx` 可以访问当前应用、数据库、认证信息和 action 参数。比如：

```ts
const repository = ctx.app.db.getRepository('posts');
const currentUser = ctx.auth?.user;
const values = ctx.action?.params?.values;
```

Tool 应该返回可判断成功或失败的结构。内置 Tool 通常使用下面的形状：

```ts
return {
  status: 'success',
  content: result,
};
```

遇到可预期的业务失败时，也应该返回清楚的状态和原因，不要让模型猜测操作是否成功。

## 使用目录保存长描述

Tool 除了单文件形式，也可以使用目录：

```text
src/ai/tools/documentSearch/
├── index.ts
└── description.md
```

`index.ts` 默认导出 `defineTools()` 的结果。`description.md` 存在时，它的完整内容会覆盖 `definition.description`，适合保存较长的 Tool 使用说明。

目录名 `documentSearch` 会成为最终注册名称。

## 内置 Tool 示例：`subAgentWebSearch`

`packages/plugins/@nocobase/plugin-ai/src/ai/tools/subAgentWebSearch.ts` 展示了一个完整的服务端 Tool：

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

这个实现有几个可以复用的做法：

- 用 `SPECIFIED` 限制工具只进入指定员工或技能
- 用 Zod 约束模型生成的参数
- 从 `ctx.action.params.values` 读取当前 AI 会话配置
- 把多个互不依赖的查询放进一次 ToolCall，并通过 `Promise.all()` 并行执行
- 返回来源明确的结构化结果，让上层模型继续整理


## 相关链接

- [AI 员工插件开发](./index.md) — 选择需要扩展的能力层次
- [定义 Skill](./define-skill.md) — 用 Skill 组织多个 Tool 的调用流程
- [完整示例：创建内置 AI 员工](./complete-example.md) — 查看可运行的 Tool 示例
- [为 Tool 添加前端交互](./frontend-tool-ui.md) — 为 ToolCall 添加确认、选择和编辑界面
