---
title: "Complete Example: Create a Built-in AI Employee"
description: "Use a complete example to define a Tool, Skill, system prompt, and built-in AI employee in a NocoBase plugin."
keywords: "NocoBase,Dev Helper,AI employee example,defineTools,defineAIEmployee,SKILLS.md"
---

# Complete Example: Create a Built-in AI Employee

The following complete example creates a built-in AI employee that guides plugin development. The example names the employee `Dev Helper` and configures its Tool, Skill, and system prompt. When a user says “Please greet Alice,” the employee loads the `welcome-developer` Skill, calls the `greetDeveloper` Tool to confirm the name, and then generates a greeting in the user's current language.

:::tip Prerequisites

- [Define a server-side Tool](./define-tool.md) — Learn the basic structure of `defineTools()` and Tools
- [Define a Skill](./define-skill.md) — Learn about `SKILLS.md` and Tool binding
- [Define a built-in AI employee](./define-ai-employee.md) — Learn about `defineAIEmployee()` and employee directories

:::

## Final result

When complete, the plugin provides these capabilities:

- Creates a built-in AI employee named `Dev Helper`
- Automatically binds the `welcome-developer` Skill to the employee
- Uses the Skill to call the `greetDeveloper` Tool and confirm the developer's name
- Generates a greeting and follow-up question in the user's current language

<!-- 需要一张 AI 员工管理页中 Dev Helper 被标记为内置员工的截图 -->

## Final directory structure

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

This example requires no frontend code and no manual registration in `src/server/plugin.ts`.

## Step 1: Define the Tool

Create `src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/greetDeveloper.ts`:

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

## Step 2: Define the Skill

Create `src/ai/ai-employees/dev-helper/skills/welcome-developer/SKILLS.md`:

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

Because `greetDeveloper.ts` is in the current Skill's `tools/` directory, you do not need to add `tools: [greetDeveloper]`.

## Step 3: Define the AI employee profile

Create `src/ai/ai-employees/dev-helper/index.ts`:

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

`username` is the unique identifier in the database. Do not change it casually after release, or NocoBase will treat the new value as a different built-in AI employee.

:::warning Note

The `username` must remain stable and must not conflict with another plugin or existing AI employee. If the database already contains the same `username`, loading the plugin updates that record instead of creating an isolated new employee.

When the plugin reloads, the `category`, `nickname`, `position`, `avatar`, `bio`, `greeting`, default system prompt, Skill and Tool bindings, `chatSettings`, and `sort` from the code may all be written to the database again. For production plugins, use a plugin-prefixed name such as `developer-helper-dev-assistant`.

:::

## Step 4: Define the system prompt

Create `src/ai/ai-employees/dev-helper/prompt.md`:

```md
You are Dev Helper, a NocoBase plugin development guide.

Help users begin with a small, verifiable task.

When the user asks you to greet or welcome a developer, load the `welcome-developer` skill and follow its workflow.

Never claim that a Tool succeeded before receiving its result.
```

The directory relationships now provide automatic binding:

```text
greetDeveloper Tool
  → welcome-developer Skill
  → dev-helper AI employee
```

## Step 5: Enable and verify

Rebuild or restart the development service and confirm that the plugin containing these files is enabled. Then check the AI employee management page:

- `Dev Helper` is listed
- The employee is marked as built-in
- The employee's dedicated Skills include `welcome-developer`
- `greetDeveloper` is available after the Skill loads

Enter the following in a conversation:

```text
请向 Alice 打个招呼。
```

The expected sequence is:

```text
加载 welcome-developer
  → 调用 greetDeveloper({ name: "Alice" })
  → 收到 status: "success" 和 content.name
  → Skill 使用用户当前语言生成问候语
  → 询问接下来要开发什么插件能力
```

Set `defaultPermission: 'ALLOW'` if the Tool should not ask the user for confirmation before every call. For Tools that delete data, modify records in bulk, or have external side effects, keeping the default `ASK` is more appropriate.

## Summary

| File | Responsibility |
| --- | --- |
| `greetDeveloper.ts` | Validates input and returns a structured Tool result |
| `SKILLS.md` | Defines the Tool call and response workflow |
| `prompt.md` | Defines the employee role and global constraints |
| `index.ts` | Defines the built-in AI employee profile |

## Related links

- [AI employee plugin development](./index.md) — Understand the relationship between Tools, Skills, and built-in AI employees
- [Define a server-side Tool](./define-tool.md) — See the complete `defineTools()` configuration
- [Define a Skill](./define-skill.md) — See the fields and format of `SKILLS.md`
- [Define a built-in AI employee](./define-ai-employee.md) — Learn about `defineAIEmployee()` and directory binding
- [Internationalization for AI employee plugins](./internationalization.md) — Add translations for management-interface text in this example
