---
title: "AI Employee Plugin Development"
description: "Explains the relationships, directory conventions, and learning path for Tools, Skills, built-in AI employees, and frontend Tool UI in NocoBase plugins."
keywords: "NocoBase,AI employee plugin development,Tool,Skill,defineAIEmployee,src/ai"
---

# AI Employee Plugin Development

In NocoBase, plugins can make their business capabilities available to AI employees. Three extension points cover different layers:

- **Tool** — Performs specific operations such as querying data, calling APIs, and modifying records
- **Skill** — Tells the model when to use Tools and which steps to follow to complete a task
- **Built-in AI Employee** — Assembles a role profile, system prompt, Skills, and Tools into an employee that is ready to use

Usually, you do not need to call registration APIs manually. Put files in the plugin's conventional `src/ai` directories, and NocoBase automatically scans and registers them when the plugin loads. You only need to register the corresponding frontend component or execution logic in `src/client-v2/plugin.tsx` when a Tool requires a custom card, modal, or browser-side execution.

Before you begin, make sure the application has installed and enabled `@nocobase/plugin-ai`. Plugin code can use the types and definition functions provided by `@nocobase/ai` and `@nocobase/actions`.

:::tip Prerequisites

- [Write your first plugin](../../../plugin-development/write-your-first-plugin.md) — If you are new to plugin development, start with the plugin directory, build, and activation workflow
- [AI employees](../../index.md) — Learn how to configure and use AI employees first

:::


## Quick index

| I want to... | Read this |
| --- | --- |
| Let AI call a server-side operation | [Define a server-side Tool](./define-tool.md) |
| Specify the call sequence for multiple Tools | [Define a Skill](./define-skill.md) |
| Provide a fixed AI role with a plugin | [Define a built-in AI employee](./define-ai-employee.md) |
| See how a Tool, Skill, and employee work together | [Complete example: Create a built-in AI employee](./complete-example.md) |
| Add confirmation, selection, or editing UI to a Tool | [Add frontend interaction to a Tool](./frontend-tool-ui.md) |
| Add management-interface translations for Tools and Skills | [Internationalization for AI employee plugins](./internationalization.md) |
| Troubleshoot registration, binding, and execution | [Troubleshooting AI employee plugin development](./troubleshooting.md) |

## Decide which layer to extend first

Tools, Skills, and built-in AI employees are not three separate features. They form layers that build on one another from the bottom up. Not every plugin needs to implement all three.

```text
Tool：让 AI 能执行一个具体动作
  ↓
Skill：让 AI 按固定方法完成一类任务
  ↓
内置 AI 员工：把这些能力装配成一个固定角色和使用入口
```

Choose the starting layer based on your requirements:

- If AI only needs to query data, call an API, or modify records, defining a Tool is enough
- If you need to specify Tool call order, confirmation steps, and output format, define a Skill for those Tools
- If the plugin should provide a fixed role immediately after it is enabled, create a built-in AI employee and bind the corresponding Skills and Tools

When all three layers are used, a task follows this sequence:

1. The user gives the AI employee a task
2. The AI employee uses its system prompt to decide which Skill is needed
3. The Skill tells the model which Tools to call and in what order
4. The Tool performs a query, write, or external request and returns the result
5. The AI employee prepares the final response from the Tool result

A frontend Tool card is not a fourth capability layer. It only adds an interaction UI to a ToolCall when the Tool needs the user to confirm, select an option, or edit arguments.

## Put AI resources under `src/ai`

NocoBase discovers a plugin's AI resources by directory convention. With the standard plugin layout, put Tools, Skills, and built-in AI employees under `src/ai`; you do not need to register them one by one in `load()` in `src/server/plugin.ts`.

A complete directory can be organized like this:

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

Each location uses a different registration method:

| File or directory | How NocoBase handles it |
| --- | --- |
| `src/ai/tools/<name>.ts` | Registers an independent Tool |
| `src/ai/skills/<name>/SKILLS.md` | Registers a Skill |
| `tools/` under a Skill directory | Registers Tools and automatically binds them to the current Skill |
| `src/ai/ai-employees/<name>.ts` | Registers a single-file built-in AI employee |
| `src/ai/ai-employees/<name>/index.ts` | Registers a directory-based built-in AI employee |
| `prompt.md` under an AI employee directory | Provides the employee's default system prompt |
| `skills/` and `tools/` under an AI employee directory | Registers resources and automatically binds them to the current employee |

When a plugin loads, NocoBase completes these steps before running the plugin's own `load()` method:

1. Scan and register Tools
2. Parse `SKILLS.md` and bind Tools in each Skill directory to that Skill
3. Load built-in AI employees and merge the `prompt.md`, Skills, and Tools in each employee directory

`src/client-v2` is not part of this automatic scanning convention. Register something there only when a Tool needs a frontend card, modal, or browser-side execution logic.

## Extension points and directory quick reference

| Extension point | Responsibility | Default location |
| --- | --- | --- |
| Tool | Performs specific operations such as queries, writes, and external requests | `src/ai/**/tools/` |
| Skill | Specifies the workflow, Tool call order, and output constraints | `src/ai/**/skills/<name>/SKILLS.md` |
| Built-in AI employee | Defines a fixed role and assembles its system prompt, Skills, and Tools | `src/ai/ai-employees/` |
| Frontend Tool card | Displays a ToolCall and collects confirmation, edits, or rejection | `src/client-v2/` |

Implement the Tool first by default. Add a Skill when you need a fixed workflow, then create a built-in AI employee when you need a fixed role entry point. Add a frontend card only when the Tool requires browser interaction.

## Related links

- [Write your first plugin](../../../plugin-development/write-your-first-plugin.md) — Create and run a NocoBase plugin from scratch
- [AI employees overview](../../index.md) — Learn where to access and use AI employees
- [Prompt engineering guide](../../configuration/prompt-engineering-guide.md) — Write system prompts and task constraints
