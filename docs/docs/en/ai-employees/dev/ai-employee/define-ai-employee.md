---
title: "Define a Built-in AI Employee"
description: "Explains how NocoBase plugins use defineAIEmployee, prompt.md, skills, and tools directories to create built-in AI employees."
keywords: "NocoBase,built-in AI employee,defineAIEmployee,prompt.md,AIEmployeeOptions,Nathan"
---

# Define a Built-in AI Employee

A built-in AI employee is registered with its plugin. When the plugin loads for the first time, NocoBase creates the corresponding employee record and marks it as built-in. On later plugin loads, the employee's default profile, prompt, Skills, and Tools are updated from the code.

## Single-file and directory forms

Use a single file when the profile is simple and does not need a separate prompt or dedicated resources:

```text
src/ai/ai-employees/lina.ts
```

Use a directory when you need `prompt.md`, dedicated Skills, or dedicated Tools:

```text
src/ai/ai-employees/nathan/
├── index.ts
├── prompt.md
├── skills/
└── tools/
```

The directory form is better suited to long-term maintenance.

## Use `defineAIEmployee()`

In `index.ts`, use `defineAIEmployee()` from `@nocobase/ai`:

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

The main fields are:

| Field | Purpose |
| --- | --- |
| `username` | Unique AI employee identifier; required and must remain stable over time |
| `category` | Employee category, such as `developer` or `business` |
| `description` | Internal description and retrieval information |
| `avatar` | Avatar identifier |
| `nickname` | Name displayed to users |
| `position` | Job title |
| `bio` | Short biography |
| `greeting` | Greeting for a new conversation |
| `systemPrompt` | Default system prompt |
| `skills` | Explicitly bound Skill names |
| `tools` | Explicitly bound Tool configuration |
| `chatSettings` | Chat settings such as whether Skills and Tools are enabled and which system-prompt mode is used |
| `sort` | Sort order for built-in employees |

The current type of `tools` is an array of objects:

```ts
tools: [
  { name: 'greetDeveloper' },
  { name: 'customDataExporter', autoCall: true }, // customDataExporter 的 scope 必须是 CUSTOM
]
```

`autoCall` only overrides the current AI employee's call permission for a `CUSTOM` Tool. For `GENERAL` and `SPECIFIED` Tools, runtime behavior still follows the Tool's own `defaultPermission`. If a `CUSTOM` Tool has no employee-level configuration, it also falls back to the Tool's own `defaultPermission`.

Tools discovered automatically in the directory are normalized to `{ name: 'toolName' }`.

## Put long prompts in `prompt.md`

When an AI employee uses the directory form, put its system prompt in the sibling `prompt.md` file:

```text
src/ai/ai-employees/dev-helper/prompt.md
```

```md
You are Dev Helper, a NocoBase plugin development guide.

Help the user break a plugin requirement into small, verifiable steps.

When the user asks you to welcome a developer, load the `welcome-developer` skill and follow it.

Never claim that a Tool succeeded before receiving its result.
```

When `prompt.md` exists, it overrides `systemPrompt` in `index.ts`. Long prompts are easier to review in a Markdown file and avoid escaping problems in TypeScript template strings.

## Built-in AI employee example: Nathan

The employee profile in `packages/plugins/@nocobase/plugin-flow-engine/src/ai/ai-employees/nathan/index.ts` is short:

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

Nathan's full capabilities come from other resources in the same directory:

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

The loading process automatically completes three levels of binding:

1. Files in `tools/` are registered as Tools
2. The Tools are automatically bound to the `frontend-developer` Skill
3. The Skill is automatically bound to Nathan

As a result, `index.ts` does not need to list the complete `skills` and `tools` configuration again.

## Related links

- [AI employee plugin development](./index.md) — Understand the relationship between built-in AI employees, Tools, and Skills
- [Define a Skill](./define-skill.md) — Create a dedicated Skill for an employee
- [Complete example: Create a built-in AI employee](./complete-example.md) — See the complete employee directory and registration process
- [Internationalization for AI employee plugins](./internationalization.md) — Learn how localization differs for employee profiles and Tool and Skill text
