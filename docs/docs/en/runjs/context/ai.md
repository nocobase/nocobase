---
title: "ctx.ai"
description: "Use ctx.ai in RunJS to trigger AI employee tasks, either with inline task content or with tasks configured on an AI employee action."
keywords: "ctx.ai,AI employee,triggerTask,triggerModelTask,RunJS,NocoBase"
---

# ctx.ai

Use `ctx.ai` in RunJS to trigger **AI employee tasks**. It works well in JSBlock, JSAction, and other interactions where a button, form, or business flow needs to hand work to a specific AI employee.

`ctx.ai` only triggers tasks. It does not return the execution result of the AI employee task. After the call, the task enters the AI employee conversation flow, and the result is handled by the AI employee session.

:::warning Note

`ctx.ai` is provided by the AI plugin. If the AI plugin is not enabled, or the current RunJS environment has not loaded the corresponding client capability, `ctx.ai` may not exist. You can check `ctx.ai?.triggerTask` or `ctx.ai?.triggerModelTask` before calling it.

:::

## Methods

### ctx.ai.triggerTask()

Trigger an AI employee task directly.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Parameter | Type | Description |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | AI employee. When a string is passed, NocoBase matches `AIEmployee.username` exactly, and the AI employee must be accessible to the current user. |
| `tasks` | `Task[]` | Tasks to trigger. |
| `open` | `boolean` | Whether to open the AI employee conversation panel. |
| `auto` | `boolean` | Whether to use the auto-trigger semantics of an AI employee action. |

Common `Task` fields:

| Field | Type | Description |
|------|------|------|
| `title` | `string` | Task title. |
| `message.system` | `string` | System message, used to constrain the AI employee's role and output requirements. |
| `message.user` | `string` | User message, which is the main instruction for this task. |
| `message.workContext` | `ContextItem[]` | Page block context used by the task. |
| `autoSend` | `boolean` | Whether to send the task message automatically. |
| `webSearch` | `boolean` | Whether Web search is allowed for this task. |
| `model` | `{ llmService: string; model: string } \| null` | Model used by this task. |
| `skillSettings` | `SkillSettings` | Skills and tools available to this task. |

### Add Page Block Context

`message.workContext` currently passes page blocks. Put the FlowModel uid of the target page block into it:

```ts
message: {
  user: 'Review the current users table and summarize operational risks.',
  workContext: [
    {
      type: 'flow-model',
      uid: 'USERS_TABLE_BLOCK_UID',
    },
  ],
}
```

| Field | Description |
|------|------|
| `type` | Fixed to `flow-model`, meaning this item is a page block context. |
| `uid` | FlowModel uid of the page block, such as a table block, detail block, or chart block. |

If you want to use the current JSBlock itself as context, use the current model uid:

```ts
workContext: [
  {
    type: 'flow-model',
    uid: ctx.model.uid,
  },
],
```

Usually, `message.workContext` should be placed inside the `message` of a concrete task. `triggerModelTask()` reuses the task configured on the target AI employee action, so it also reads `message.workContext` from that task.

### Specify Model

`model` specifies the model for a single task. If omitted, the AI employee's default model configuration is used. Passing `null` means no task-level model is specified.

```ts
model: {
  llmService: 'openai-main',
  model: 'gpt-4.1',
}
```

### Configure Skills / Tools

`skillSettings` specifies the skills and tools available to a single task. If omitted, the AI employee's own capability configuration is used.

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: ['business-analysis-report'],
  tools: ['businessReportGenerator'],
}
```

To explicitly disable all skills or tools for this task, pass empty arrays and keep the version fields:

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: [],
  tools: [],
}
```

The following example asks `viz` to generate a handoff brief and opens the AI employee conversation panel:

```ts
if (!ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Daily operations handoff brief'),
      message: {
        system:
          'You prepare reusable daily operations handoff briefs. Focus on risks, blockers, decisions, owners, and next actions.',
        user: [
          "Prepare today's operations handoff brief.",
          'Cover customer escalations, SLA risks, approvals, and follow-up owners.',
          'Return a concise brief that can be posted to the team channel.',
        ].join('\n'),
      },
      autoSend: true,
      webSearch: false,
    },
  ],
});

ctx.message.success(ctx.t('AI employee task triggered.'));
```

If `aiEmployee` is a string, NocoBase matches accessible AI employees by `username` exactly. If no match is found, the task is not triggered and a warning is printed to the console.

### ctx.ai.triggerModelTask()

Read a task from an AI employee action model on the page and trigger it.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Parameter | Type | Description |
|------|------|------|
| `uid` | `string` | FlowModel uid of the AI employee action. |
| `taskIndex` | `number` | Task index, starting from `0`. |
| `options.open` | `boolean` | Whether to open the AI employee conversation panel. |
| `options.auto` | `boolean` | Whether to use the auto-trigger semantics of an AI employee action. |

This method reads the AI employee and task configuration from the target model. It is useful when the task has already been configured on an AI employee action on the page, and RunJS only needs to trigger it.

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

If the target model does not exist, has no AI employee configured, or the specified index has no task, no task is triggered and a warning is printed to the console.

## Which Method to Use

| Scenario | Recommended method |
|------|------|
| Task content is assembled dynamically in RunJS, such as from form values. | `ctx.ai.triggerTask()` |
| The task has already been configured on an AI employee action on the page, and RunJS only triggers it. | `ctx.ai.triggerModelTask()` |
| Business users need to adjust task content without changing code. | `ctx.ai.triggerModelTask()` |
| The AI employee, prompt, or sending behavior needs to be decided at runtime. | `ctx.ai.triggerTask()` |

## Notes

- `triggerTask()` and `triggerModelTask()` are fire-and-forget. They do not return the execution result of the AI employee task.
- `aiEmployee` strings only match `AIEmployee.username` exactly. They do not match nicknames, job titles, or translated names.
- `triggerModelTask()` uses a `0`-based `taskIndex`.
- `triggerModelTask()` reads task configuration from the target AI employee action model. If the task needs work context, configure `message.workContext` on that task.

## Related

- [ctx.message](./message.md): Show lightweight prompts before and after triggering tasks.
- [ctx.render](./render.md): Render buttons or forms in JSBlock.
- [ctx.model](./model.md): Get current FlowModel information.
