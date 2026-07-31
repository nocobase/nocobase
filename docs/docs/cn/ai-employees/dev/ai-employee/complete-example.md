---
title: "完整示例：创建内置 AI 员工"
description: "通过一个完整示例，在 NocoBase 插件中定义 Tool、Skill、系统提示词和内置 AI 员工。"
keywords: "NocoBase,Dev Helper,AI 员工示例,defineTools,defineAIEmployee,SKILLS.md"
---

# 完整示例：创建内置 AI 员工

下面通过一个完整示例，创建一名负责引导插件开发的内置 AI 员工。这个示例将员工命名为 `Dev Helper`，并为它配置 Tool、Skill 和系统提示词。用户说“请向 Alice 打个招呼”时，员工会加载 `welcome-developer` Skill，调用 `greetDeveloper` Tool 确认姓名，再使用用户当前的语言生成问候语。

:::tip 前置阅读

- [定义服务端 Tool](./define-tool.md) — 了解 `defineTools()` 和 Tool 的基本结构
- [定义 Skill](./define-skill.md) — 了解 `SKILLS.md` 和 Tool 绑定
- [定义内置 AI 员工](./define-ai-employee.md) — 了解 `defineAIEmployee()` 和员工目录

:::

## 最终效果

完成后，这个插件会提供下面的能力：

- 创建名为 `Dev Helper` 的内置 AI 员工
- 为员工自动绑定 `welcome-developer` Skill
- 通过 Skill 调用 `greetDeveloper` Tool 确认开发者姓名
- 根据用户当前使用的语言生成问候语和后续问题

<!-- 需要一张 AI 员工管理页中 Dev Helper 被标记为内置员工的截图 -->

## 最终目录结构

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

这个示例不需要前端代码，也不需要在 `src/server/plugin.ts` 中手动注册。

## 第一步：定义 Tool

创建 `src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/greetDeveloper.ts`：

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

## 第二步：定义 Skill

创建 `src/ai/ai-employees/dev-helper/skills/welcome-developer/SKILLS.md`：

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

因为 `greetDeveloper.ts` 位于当前 Skill 的 `tools/` 目录，不需要再写 `tools: [greetDeveloper]`。

## 第三步：定义 AI 员工资料

创建 `src/ai/ai-employees/dev-helper/index.ts`：

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

`username` 是数据库中的唯一标识。发布后不要随意修改，否则 NocoBase 会把新值当成另一个内置 AI 员工。

:::warning 注意

`username` 不仅要保持稳定，还需要避免和其他插件或已有 AI 员工重名。如果数据库中已经存在相同的 `username`，插件加载时会更新对应记录，而不是创建一个彼此隔离的新员工。

重新加载插件时，代码中的 `category`、`nickname`、`position`、`avatar`、`bio`、`greeting`、默认系统提示词、Skill 和 Tool 绑定、`chatSettings` 以及 `sort` 都可能重新写入数据库。正式插件推荐使用带插件前缀的名称，比如 `developer-helper-dev-assistant`。

:::

## 第四步：定义系统提示词

创建 `src/ai/ai-employees/dev-helper/prompt.md`：

```md
You are Dev Helper, a NocoBase plugin development guide.

Help users begin with a small, verifiable task.

When the user asks you to greet or welcome a developer, load the `welcome-developer` skill and follow its workflow.

Never claim that a Tool succeeded before receiving its result.
```

至此，目录关系已经完成自动绑定：

```text
greetDeveloper Tool
  → welcome-developer Skill
  → dev-helper AI employee
```

## 第五步：启用并验证

重新构建或重启开发服务，并确认包含这些文件的插件已经启用。然后到 AI 员工管理页面检查：

- 可以看到 `Dev Helper`
- 员工被标记为内置员工
- 员工的专属 Skill 中包含 `welcome-developer`
- Skill 加载后可以使用 `greetDeveloper`

在对话中输入：

```text
请向 Alice 打个招呼。
```

预期流程如下：

```text
加载 welcome-developer
  → 调用 greetDeveloper({ name: "Alice" })
  → 收到 status: "success" 和 content.name
  → Skill 使用用户当前语言生成问候语
  → 询问接下来要开发什么插件能力
```

如果不希望 Tool 每次调用前请求用户确认，设置 `defaultPermission: 'ALLOW'`。涉及删除、批量修改或外部副作用的 Tool，默认保留 `ASK` 更合适。

## 小结

| 文件 | 负责什么 |
| --- | --- |
| `greetDeveloper.ts` | 验证输入并返回结构化 Tool 结果 |
| `SKILLS.md` | 规定 Tool 调用和回复流程 |
| `prompt.md` | 定义员工角色和全局约束 |
| `index.ts` | 定义内置 AI 员工资料 |

## 相关链接

- [AI 员工插件开发](./index.md) — 了解 Tool、Skill 和内置 AI 员工的关系
- [定义服务端 Tool](./define-tool.md) — 查看 `defineTools()` 的完整配置
- [定义 Skill](./define-skill.md) — 查看 `SKILLS.md` 的字段和写法
- [定义内置 AI 员工](./define-ai-employee.md) — 查看 `defineAIEmployee()` 和目录绑定
- [AI 员工插件国际化](./internationalization.md) — 为示例中的管理界面文案添加翻译
