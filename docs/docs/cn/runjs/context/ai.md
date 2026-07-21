---
title: "ctx.ai"
description: "ctx.ai 在 RunJS 中触发 AI 员工任务，支持直接传入任务内容、指定 AI Chat Box，也支持复用页面上 AI 员工操作中已配置的任务。"
keywords: "ctx.ai,AI employee,uploadFile,attachments,triggerTask,triggerModelTask,chatBoxUid,AI Chat Box,RunJS,NocoBase"
---

# ctx.ai

在 RunJS 中触发 **AI 员工任务**。它适合放在 JSBlock、JSAction 等交互里，让页面上的按钮、表单或业务流程把任务交给指定的 AI 员工。

`ctx.ai` 提供 AI 任务附件上传和任务触发能力。附件上传可以等待结果，但任务触发不会返回 AI 员工任务的执行结果。触发后任务会进入 AI 员工对话流程，后续结果由 AI 员工会话处理。

:::warning 注意

`ctx.ai` 由 AI 插件提供。如果当前应用没有启用 AI 插件，或者当前 RunJS 环境没有加载对应客户端能力，那么 `ctx.ai` 可能不存在。调用前可以先判断 `ctx.ai?.uploadFile`、`ctx.ai?.triggerTask` 或 `ctx.ai?.triggerModelTask`。

:::

## 方法

### ctx.ai.uploadFile()

上传一个文件，并返回可以直接传给 AI 员工任务的附件对象。

```ts
const attachment = await ctx.ai.uploadFile(file, options);
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `file` | `File` | 要上传的浏览器文件对象 |
| `options.onProgress` | `(percent: number) => void` | 上传进度回调，`percent` 范围为 `0` 到 `100` |
| `options.signal` | `AbortSignal` | 用于取消上传的信号 |

上传使用 AI 插件配置的文件存储，并写入 `aiFiles`。返回值包含文件记录的 `id`、`filename`、`url`、`source` 等信息：

```ts
const attachment = await ctx.ai.uploadFile(file, {
  onProgress(percent) {
    console.log('upload progress', percent);
  },
});

// attachment 可以直接放入 message.attachments
```

上传失败时 Promise 会被拒绝，可以通过 `try/catch` 处理。仅从界面文件列表中移除附件不会删除已经写入 `aiFiles` 的记录，这与默认 AI 聊天窗口的行为一致。

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
| `chatBoxUid` | `string` | 指定承载任务的 AI Chat Box 区块 FlowModel uid |
| `open` | `boolean` | 是否打开 AI 员工对话面板 |
| `auto` | `boolean` | 是否按 AI 员工操作的自动触发语义处理 |

`Task` 常用字段如下：

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 任务标题 |
| `message.system` | `string` | 系统消息，用于约束 AI 员工的角色和输出要求 |
| `message.user` | `string` | 用户消息，也就是本次任务的主要指令 |
| `message.attachments` | `Attachment[]` | 任务使用的附件，通常来自 `ctx.ai.uploadFile()` |
| `message.workContext` | `ContextItem[]` | 任务使用的页面区块上下文 |
| `autoSend` | `boolean` | 是否自动发送任务消息 |
| `webSearch` | `boolean` | 是否允许本次任务使用 Web search |
| `model` | `{ llmService: string; model: string } \| null` | 指定本次任务使用的模型 |
| `skillSettings` | `SkillSettings` | 指定本次任务使用的 skills / tools 配置 |

### 指定 AI Chat Box

在 `triggerTask()` 的顶层参数中设置 `chatBoxUid`，可以让任务在页面上指定的 AI Chat Box 区块中触发，而不是打开全局 AI 员工对话框。

```ts
const chatBoxUid = 'AI_CHAT_BOX_BLOCK_UID';

ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  chatBoxUid,
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
    },
  ],
});
```

使用 `chatBoxUid` 时需要注意：

- `chatBoxUid` 是 `triggerTask()` 的顶层参数，不要放在 `tasks` 数组的具体任务上。
- 传入的 uid 必须是 AI Chat Box 外层区块的 FlowModel uid，不是区块内部子模型或 AI 员工操作的 uid。
- 目标 AI Chat Box 必须已在当前页面上挂载。如果找不到对应区块，NocoBase 会显示错误，且不会回退到全局对话框。

如果不设置 `chatBoxUid`，任务会按默认行为在全局 AI 员工对话框中触发。

### 在 JS 区块中上传并发送附件

下面的示例在 JS 区块中渲染文件上传、任务说明和发送按钮。文件上传完成后，会作为 `message.attachments` 传给 AI 员工：

```tsx
if (!ctx.ai?.uploadFile || !ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI 员工任务 API 不可用。'));
  return;
}

const { React } = ctx.libs;
const { useState } = React;
const { Button, Card, Input, Space, Upload } = ctx.libs.antd;
const { InboxOutlined, SendOutlined } = ctx.libs.antdIcons;

const AttachmentTask = () => {
  const [prompt, setPrompt] = useState('');
  const [fileList, setFileList] = useState([]);

  const uploadAttachment = async ({ file, onError, onProgress, onSuccess }) => {
    try {
      const attachment = await ctx.ai.uploadFile(file, {
        onProgress(percent) {
          onProgress?.({ percent });
        },
      });
      onSuccess?.(attachment);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(ctx.t('文件上传失败')));
    }
  };

  const sendTask = () => {
    const attachments = fileList
      .filter((file) => file.status === 'done' && file.response)
      .map((file) => file.response);

    if (!prompt.trim()) {
      ctx.message.warning(ctx.t('请输入任务说明'));
      return;
    }

    ctx.ai.triggerTask({
      aiEmployee: 'viz',
      open: true,
      tasks: [
        {
          title: ctx.t('分析上传的文件'),
          message: {
            user: prompt.trim(),
            attachments,
          },
          autoSend: true,
        },
      ],
    });
    setPrompt('');
    setFileList([]);
  };

  const uploading = fileList.some((file) => file.status === 'uploading');

  return (
    <Card title={ctx.t('AI 文件分析')}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Upload.Dragger
          multiple
          fileList={fileList}
          customRequest={uploadAttachment}
          onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p>{ctx.t('点击或拖拽文件到此处上传')}</p>
        </Upload.Dragger>
        <Input.TextArea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={ctx.t('请输入希望 AI 完成的任务')}
          autoSize={{ minRows: 3, maxRows: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          disabled={uploading || !prompt.trim()}
          onClick={sendTask}
        >
          {ctx.t('发送给 AI')}
        </Button>
      </Space>
    </Card>
  );
};

ctx.render(<AttachmentTask />);
```

如果设置 `autoSend: false`，附件和任务说明会进入 AI 聊天窗口草稿，不会立即发送。

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
| `options.attachments` | `Attachment[]` | 动态追加到预配置任务的附件 |

这个方法会从目标模型读取 AI 员工和任务配置。它适合复用页面上已经配置好的 AI 员工操作——运营人员可以在界面里调整任务内容，JSBlock 只负责触发。

`triggerModelTask()` 的 `options` 不接收 `chatBoxUid`。如果要在指定 AI Chat Box 中触发，需要在目标 AI 员工操作的对应任务上配置 `chatBoxUid`。`triggerModelTask()` 读取该任务时会一并复用此字段。

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI 员工任务 API 不可用。'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
  attachments,
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
- `uploadFile()` 返回 Promise，必须等上传完成后再触发需要这些附件的任务。
- `aiEmployee` 字符串只按 `AIEmployee.username` 精确匹配，不按昵称、职位或翻译后的名称匹配。
- `triggerModelTask()` 的 `taskIndex` 从 `0` 开始。
- `triggerModelTask()` 读取的是目标 AI 员工操作模型上的任务配置。任务需要使用工作上下文时，请在该任务配置里设置 `message.workContext`。
- `triggerTask()` 的顶层 `chatBoxUid` 必须指向当前已挂载的 AI Chat Box 区块。
- `triggerModelTask()` 不接收顶层 `chatBoxUid`，它会继续使用预设 Task 上的 `chatBoxUid`。
- `triggerModelTask()` 的动态附件会追加到预配置任务已有的 `message.attachments`，不会修改原任务配置。

## 相关

- [ctx.message](./message.md)：触发前后展示轻量提示
- [ctx.render](./render.md)：在 JSBlock 中渲染按钮或表单
- [ctx.model](./model.md)：获取当前 FlowModel 信息
