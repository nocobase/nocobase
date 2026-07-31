---
title: "定义内置 AI 员工"
description: "介绍 NocoBase 插件如何使用 defineAIEmployee、prompt.md、skills 和 tools 目录创建内置 AI 员工。"
keywords: "NocoBase,内置 AI 员工,defineAIEmployee,prompt.md,AIEmployeeOptions,Nathan"
---

# 定义内置 AI 员工

内置 AI 员工随插件一起注册。插件第一次加载时，NocoBase 会创建对应员工记录，并标记为内置员工；后续插件加载会根据代码更新员工的默认资料、提示词、技能和工具。

## 单文件和目录两种形式

资料简单、不需要独立提示词和专属资源时，可以使用单文件：

```text
src/ai/ai-employees/lina.ts
```

需要 `prompt.md`、专属 Skill 或专属 Tool 时，使用目录：

```text
src/ai/ai-employees/nathan/
├── index.ts
├── prompt.md
├── skills/
└── tools/
```

目录形式更适合长期维护。

## 使用 `defineAIEmployee()`

`index.ts` 使用 `@nocobase/ai` 提供的 `defineAIEmployee()`：

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

主要字段如下：

| 字段 | 作用 |
| --- | --- |
| `username` | AI 员工唯一标识，必填且需要长期稳定 |
| `category` | 员工分类，比如 `developer` 或 `business` |
| `description` | 内部描述和检索信息 |
| `avatar` | 头像标识 |
| `nickname` | 对用户展示的名字 |
| `position` | 职位 |
| `bio` | 简介 |
| `greeting` | 新对话问候语 |
| `systemPrompt` | 默认系统提示词 |
| `skills` | 显式绑定的 Skill 名称 |
| `tools` | 显式绑定的 Tool 配置 |
| `chatSettings` | 是否启用 Skill、Tool，以及系统提示词模式等聊天设置 |
| `sort` | 内置员工排序 |

当前 `tools` 的类型是对象数组：

```ts
tools: [
  { name: 'greetDeveloper' },
  { name: 'customDataExporter', autoCall: true }, // customDataExporter 的 scope 必须是 CUSTOM
]
```

`autoCall` 只用于覆盖当前 AI 员工对 `CUSTOM` Tool 的调用权限。对于 `GENERAL` 和 `SPECIFIED` Tool，运行时仍然以 Tool 自身的 `defaultPermission` 为准；如果 `CUSTOM` Tool 没有员工级配置，也会回退到 Tool 自身的 `defaultPermission`。

目录中自动发现的 Tool 会被规范化为 `{ name: 'toolName' }`。

## 把长提示词放进 `prompt.md`

如果 AI 员工使用目录形式，可以把系统提示词放进同级的 `prompt.md`：

```text
src/ai/ai-employees/dev-helper/prompt.md
```

```md
You are Dev Helper, a NocoBase plugin development guide.

Help the user break a plugin requirement into small, verifiable steps.

When the user asks you to welcome a developer, load the `welcome-developer` skill and follow it.

Never claim that a Tool succeeded before receiving its result.
```

`prompt.md` 存在时会覆盖 `index.ts` 中的 `systemPrompt`。长提示词放在 Markdown 文件里更容易审阅，也能避免 TypeScript 模板字符串中的转义问题。

## 内置 AI 员工示例：Nathan

`packages/plugins/@nocobase/plugin-flow-engine/src/ai/ai-employees/nathan/index.ts` 的员工资料很短：

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

Nathan 的完整能力来自同一目录下的其他资源：

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

加载过程会自动完成三层绑定：

1. `tools/` 中的文件注册为 Tool
2. Tool 自动绑定到 `frontend-developer` Skill
3. Skill 自动绑定到 Nathan

因此，`index.ts` 不需要重复列出整套 `skills` 和 `tools`。

## 相关链接

- [AI 员工插件开发](./index.md) — 了解内置 AI 员工和 Tool、Skill 的关系
- [定义 Skill](./define-skill.md) — 创建员工专属 Skill
- [完整示例：创建内置 AI 员工](./complete-example.md) — 查看完整员工目录和注册过程
- [AI 员工插件国际化](./internationalization.md) — 了解员工资料与 Tool、Skill 文案的本地化差异
