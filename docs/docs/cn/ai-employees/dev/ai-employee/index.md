---
title: "AI 员工插件开发"
description: "介绍 NocoBase 插件中 Tool、Skill、内置 AI 员工和前端 Tool UI 的关系、目录约定与学习路径。"
keywords: "NocoBase,AI 员工插件开发,Tool,Skill,defineAIEmployee,src/ai"
---

# AI 员工插件开发

在 NocoBase 中，插件可以把自己的业务能力交给 AI 员工。三个扩展点分别负责不同的层次：

- **Tool（工具）** — 执行查询数据、调用 API、修改记录等具体操作
- **Skill（技能）** — 告诉模型何时使用工具，以及应该按什么步骤完成任务
- **内置 AI 员工（Built-in AI Employee）** — 把角色资料、系统提示词、技能和工具装配成一个开箱即用的员工

通常来说，你不需要手动调用注册接口。把文件放到插件的 `src/ai` 约定目录后，NocoBase 会在加载插件时自动扫描并完成注册。只有当 Tool 需要自定义卡片、弹窗或浏览器端执行逻辑时，才需要在插件的 `src/client-v2/plugin.tsx` 中注册对应的前端组件或执行逻辑。

开始前需要确保应用已经安装并启用 `@nocobase/plugin-ai`，插件代码可以使用 `@nocobase/ai` 和 `@nocobase/actions` 提供的类型与定义函数。

:::tip 前置阅读

- [编写第一个插件](../../../plugin-development/write-your-first-plugin.md) — 如果还没有插件开发经验，先了解插件目录、构建和启用流程
- [AI 员工](../../index.md) — 先熟悉 AI 员工的配置和基本使用方式

:::


## 快速索引

| 我想要…… | 去哪里看 |
| --- | --- |
| 让 AI 调用一个服务端操作 | [定义服务端 Tool](./define-tool.md) |
| 规定多个 Tool 的调用流程 | [定义 Skill](./define-skill.md) |
| 随插件提供一个固定 AI 角色 | [定义内置 AI 员工](./define-ai-employee.md) |
| 查看 Tool、Skill 和员工的完整组合方式 | [完整示例：创建内置 AI 员工](./complete-example.md) |
| 为 Tool 添加确认、选择或编辑界面 | [为 Tool 添加前端交互](./frontend-tool-ui.md) |
| 为 Tool 和 Skill 添加管理界面翻译 | [AI 员工插件国际化](./internationalization.md) |
| 排查注册、绑定和执行问题 | [常见问题](./troubleshooting.md) |

## 先决定要扩展哪一层

Tool、Skill 和内置 AI 员工不是三个彼此独立的功能，而是从底向上逐层组合的能力。并不是每个插件都需要把三层全部实现。

```text
Tool：让 AI 能执行一个具体动作
  ↓
Skill：让 AI 按固定方法完成一类任务
  ↓
内置 AI 员工：把这些能力装配成一个固定角色和使用入口
```

可以按需求判断从哪一层开始：

- 只需要让 AI 查询数据、调用 API 或修改记录，定义 Tool 就够了
- 需要规定工具调用顺序、确认步骤和输出格式，再为这些 Tool 定义 Skill
- 希望插件启用后直接提供一个固定角色，则继续创建内置 AI 员工，并绑定对应的 Skill 和 Tool

三层都使用时，一次任务会按下面的顺序执行：

1. 用户向 AI 员工提出任务
2. AI 员工根据系统提示词判断需要使用哪个 Skill
3. Skill 告诉模型应该调用哪些 Tool，以及按什么顺序调用
4. Tool 执行查询、写入或外部请求，并返回结果
5. AI 员工根据 Tool 结果整理最终回复

Tool 的前端卡片不是第四层能力。它只在 Tool 需要用户确认、选择选项或编辑参数时，为 ToolCall 补充交互界面。

## 把 AI 资源放进 `src/ai`

NocoBase 按目录约定发现插件中的 AI 资源。使用标准插件目录时，把 Tool、Skill 和内置 AI 员工放进 `src/ai` 即可，不需要在 `src/server/plugin.ts` 的 `load()` 中逐个注册。

一个完整目录可以这样组织：

```text
src/ai/
├── tools/
│   └── searchDocs.ts
├── skills/
│   └── document-search/
│       ├── SKILLS.md
│       └── tools/
│           └── readDocument.ts
└── ai-employees/
    ├── translator.ts
    └── developer/
        ├── index.ts
        ├── prompt.md
        ├── skills/
        └── tools/
```

不同位置对应不同的注册方式：

| 文件或目录 | NocoBase 的处理方式 |
| --- | --- |
| `src/ai/tools/<name>.ts` | 注册一个独立 Tool |
| `src/ai/skills/<name>/SKILLS.md` | 注册一个 Skill |
| Skill 目录下的 `tools/` | 注册 Tool，并自动绑定到当前 Skill |
| `src/ai/ai-employees/<name>.ts` | 注册一个单文件内置 AI 员工 |
| `src/ai/ai-employees/<name>/index.ts` | 注册一个目录形式的内置 AI 员工 |
| AI 员工目录下的 `prompt.md` | 作为该员工的默认系统提示词 |
| AI 员工目录下的 `skills/` 和 `tools/` | 注册资源，并自动绑定到当前员工 |

插件加载时，NocoBase 会在执行插件自己的 `load()` 之前按顺序完成这些工作：

1. 扫描并注册 Tool
2. 解析 `SKILLS.md`，把 Skill 目录中的 Tool 绑定到对应 Skill
3. 加载内置 AI 员工，并合并员工目录中的 `prompt.md`、Skill 和 Tool

`src/client-v2` 不属于这套自动扫描目录。只有 Tool 需要前端卡片、弹窗或浏览器端执行逻辑时，才需要在 `src/client-v2/plugin.tsx` 中额外注册。

## 扩展点与目录速查

| 扩展点 | 负责什么 | 默认放在哪里 |
| --- | --- | --- |
| Tool | 执行查询、写入或外部请求等具体操作 | `src/ai/**/tools/` |
| Skill | 规定处理流程、Tool 调用顺序和输出约束 | `src/ai/**/skills/<name>/SKILLS.md` |
| 内置 AI 员工 | 定义固定角色，并装配系统提示词、Skill 和 Tool | `src/ai/ai-employees/` |
| Tool 前端卡片 | 展示 ToolCall，并收集确认、编辑或拒绝操作 | `src/client-v2/` |

默认先实现 Tool。需要固定工作流时增加 Skill，需要固定角色入口时再创建内置 AI 员工；只有 Tool 需要浏览器交互时，才增加前端卡片。

## 相关链接

- [编写第一个插件](../../../plugin-development/write-your-first-plugin.md) — 从零创建并运行一个 NocoBase 插件
- [AI 员工概述](../../index.md) — 了解 AI 员工的使用入口
- [Prompt 工程指南](../../configuration/prompt-engineering-guide.md) — 编写系统提示词和任务约束
