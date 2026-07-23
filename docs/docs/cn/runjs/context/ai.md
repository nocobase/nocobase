---
title: "ctx.ai"
description: "ctx.ai 在 RunJS 中触发 AI 员工任务，支持直接传入任务内容，也支持复用页面上 AI 员工操作中已配置的任务。"
keywords: "ctx.ai,AI employee,triggerTask,triggerModelTask,RunJS,NocoBase"
---

# ctx.ai

在 RunJS 中触发 **AI 员工任务**。它适合放在 JSBlock、JSAction 等交互里，让页面上的按钮、表单或业务流程把任务交给指定的 AI 员工。

`ctx.ai` 只提供任务触发能力，不会返回 AI 员工任务的执行结果。调用后任务会进入 AI 员工对话流程，后续结果由 AI 员工会话处理。

:::warning 注意

`ctx.ai` 由 AI 插件提供。如果当前应用没有启用 AI 插件，或者当前 RunJS 环境没有加载对应客户端能力，那么 `ctx.ai` 可能不存在。调用前可以先判断 `ctx.ai?.triggerTask` 或 `ctx.ai?.triggerModelTask`。

:::

## 方法

### ctx.ai.triggerTask()

直接触发一个 AI 员工任务。

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

其中：

| 参数 | 类型 | 说明 |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | AI 员工。传字符串时按 `AIEmployee.username` 精确匹配，且必须是当前用户可访问的 AI 员工 |
| `tasks` | `Task[]` | 要触发的任务列表 |
| `open` | `boolean` | 是否打开 AI 员工对话面板 |
| `auto` | `boolean` | 是否按 AI 员工操作的自动触发语义处理 |

`Task` 常用字段如下：

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 任务标题 |
| `message.system` | `string` | 系统消息，用于约束 AI 员工的角色和输出要求 |
| `message.user` | `string` | 用户消息，也就是本次任务的主要指令 |
| `message.workContext` | `ContextItem[]` | 任务使用的页面区块上下文 |
| `autoSend` | `boolean` | 是否自动发送任务消息 |
| `webSearch` | `boolean` | 是否允许本次任务使用 Web search |
| `model` | `{ llmService: string; model: string } \| null` | 指定本次任务使用的模型 |
| `skillSettings` | `SkillSettings` | 指定本次任务使用的 skills / tools 配置 |

### 添加页面区块上下文

`message.workContext` 当前用于传入页面区块。把目标页面区块的 FlowModel uid 放进去即可：

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

其中：

| 字段 | 说明 |
|------|------|
| `type` | 固定为 `flow-model`，表示这是一个页面区块上下文 |
| `uid` | 页面区块对应的 FlowModel uid，比如表格区块、详情区块或图表区块的 uid |

如果任务要分析一个用户表格区块，那么把该表格区块的 uid 放到 `uid`：

```ts
const usersTableBlockUid = 'vymk028tmkf';

ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Weekly access review'),
      message: {
        system: 'You prepare weekly operations reviews from the current NocoBase page context.',
        user: 'Review the users table and call out account hygiene risks, missing contact data, and follow-up actions.',
        workContext: [
          {
            type: 'flow-model',
            uid: usersTableBlockUid,
          },
        ],
      },
      autoSend: true,
    },
  ],
});
```

如果要把当前 JSBlock 自己作为上下文，可以使用当前模型的 uid：

```ts
workContext: [
  {
    type: 'flow-model',
    uid: ctx.model.uid,
  },
],
```

通常来说，`message.workContext` 应放在具体任务的 `message` 里。`triggerModelTask()` 复用的是目标 AI 员工操作中已配置的任务，因此也会读取该任务里的 `message.workContext`。

### 指定模型

`model` 用来为单个任务指定模型。省略时使用 AI 员工的默认模型配置；传 `null` 表示不指定任务级模型。

```ts
model: {
  llmService: 'openai-main',
  model: 'gpt-4.1',
}
```

其中：

| 字段 | 说明 |
|------|------|
| `llmService` | 模型服务标识，需要使用当前应用中已启用的模型服务 |
| `model` | 模型名称，需要是该模型服务下可用的模型 |

完整示例：

```ts
ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Model-specific review'),
      message: {
        user: 'Prepare a concise risk review for this page context.',
      },
      model: {
        llmService: 'openai-main',
        model: 'gpt-4.1',
      },
    },
  ],
});
```

### 配置 skills / tools

`skillSettings` 用来为单个任务指定可用的 skills 和 tools。省略时使用 AI 员工自身的能力配置。

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: ['business-analysis-report'],
  tools: ['businessReportGenerator'],
}
```

其中：

| 字段 | 说明 |
|------|------|
| `skillsVersion` | skills 配置版本，当前使用 `2` |
| `toolsVersion` | tools 配置版本，当前使用 `2` |
| `skills` | 本次任务允许使用的 skill 名称列表 |
| `tools` | 本次任务允许使用的 tool 名称列表 |

如果要明确禁用本次任务的所有 skills 或 tools，可以传空数组并保留版本字段：

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: [],
  tools: [],
}
```

完整示例：

```ts
ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Generate business report'),
      message: {
        user: 'Generate a weekly business report from the current page context.',
        workContext: [
          {
            type: 'flow-model',
            uid: 'USERS_TABLE_BLOCK_UID',
          },
        ],
      },
      skillSettings: {
        skillsVersion: 2,
        toolsVersion: 2,
        skills: ['business-analysis-report'],
        tools: ['businessReportGenerator'],
      },
      autoSend: true,
    },
  ],
});
```

下面的示例会让 `viz` 生成一份交接简报，并打开 AI 员工对话面板：

```ts
if (!ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI 员工任务 API 不可用。'));
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

ctx.message.success(ctx.t('AI 员工任务已触发。'));
```

如果 `aiEmployee` 传字符串，NocoBase 会按 `username` 精确查找当前用户可访问的 AI 员工。找不到时不会触发任务，并会在控制台输出警告。

### ctx.ai.triggerModelTask()

从页面上已配置的 AI 员工操作模型中读取任务并触发。

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

其中：

| 参数 | 类型 | 说明 |
|------|------|------|
| `uid` | `string` | AI 员工操作对应的 FlowModel uid |
| `taskIndex` | `number` | 任务下标，从 `0` 开始 |
| `options.open` | `boolean` | 是否打开 AI 员工对话面板 |
| `options.auto` | `boolean` | 是否按 AI 员工操作的自动触发语义处理 |

这个方法会从目标模型读取 AI 员工和任务配置。它适合复用页面上已经配置好的 AI 员工操作——运营人员可以在界面里调整任务内容，JSBlock 只负责触发。

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI 员工任务 API 不可用。'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
});

ctx.message.success(ctx.t('已触发配置好的 AI 员工任务。'));
```

如果目标模型不存在、没有配置 AI 员工，或指定下标没有对应任务，则不会触发任务，并会在控制台输出警告。

## 选择哪个方法

| 场景 | 推荐方法 |
|------|----------|
| 任务内容由 RunJS 动态组装，比如读取表单值后生成提示词 | `ctx.ai.triggerTask()` |
| 任务已经在页面的 AI 员工操作中配置好，RunJS 只负责点击触发 | `ctx.ai.triggerModelTask()` |
| 需要让业务人员不用改代码就能调整任务内容 | `ctx.ai.triggerModelTask()` |
| 需要根据当前交互临时决定 AI 员工、提示词或发送方式 | `ctx.ai.triggerTask()` |

## 注意事项

- `triggerTask()` 和 `triggerModelTask()` 都是 fire-and-forget，不返回 AI 员工任务的执行结果。
- `aiEmployee` 字符串只按 `AIEmployee.username` 精确匹配，不按昵称、职位或翻译后的名称匹配。
- `triggerModelTask()` 的 `taskIndex` 从 `0` 开始。
- `triggerModelTask()` 读取的是目标 AI 员工操作模型上的任务配置。任务需要使用工作上下文时，请在该任务配置里设置 `message.workContext`。

## 相关

- [ctx.message](./message.md)：触发前后展示轻量提示
- [ctx.render](./render.md)：在 JSBlock 中渲染按钮或表单
- [ctx.model](./model.md)：获取当前 FlowModel 信息
