---
title: '扩展服务端 AI 服务'
description: '在 NocoBase Server 中解析 AgentServiceFactory，创建会话，并通过 AI 员工或固定 Agent 执行任务。'
keywords: 'AgentServiceFactory,AIConversationsManager,AgentService,createAIEmployee,createAgent'
---

# 扩展服务端 AI 服务

普通页面应优先使用 `client/extensions/nocobase-ai` 中的组件和现有 `/api/aiEmployee` Transport。工作流适配器、定时任务、应用 Service 或受保护的服务端 Route 需要直接运行 Agent 时，才使用服务端 Factory。

`AgentService` 是应用 Server 内部 API，不是浏览器 API。调用方必须自己确定可信 actor、业务授权、取消和重试策略，不能把 Factory 直接暴露给未经校验的请求参数。

## 公开入口

从插件 Server barrel 只导入公开 Token、会话管理器和调用 Agent 用到的类型：

```ts
import {
  AgentServiceError,
  agentServiceFactoryToken,
  aiConversationsManagerToken,
} from '@nocobase/app-plugin-ai-employee/server';

const conversations = container.resolve(aiConversationsManagerToken);
const factory = container.resolve(agentServiceFactoryToken);
```

同一个入口还导出 `AgentRequest`、`AgentInvokeRequest`、`AgentInvokeResult`、`AgentInvokeInterrupt`、`AgentInterruptAction`、`AgentStreamEvent` 和 `AgentServiceErrorCode` 类型。不要从 `server/agent/*` deep import `AgentServiceFactory`、`AgentContextProvider`、`ConversationProvider` 或持久化实现。

## 调用一个 AI 员工

为需要保留历史的服务端任务，先创建会话，再把 `sessionId` 放进 `state` 交给 `createAIEmployee()`：

```ts
const conversation = await conversations.create({
  userId: actor.id,
  aiEmployee: { username: 'customer-success' },
  title: 'Customer follow-up',
});

const agent = await factory.createAIEmployee({
  username: 'customer-success',
  state: { sessionId: conversation.sessionId },
  actor,
  runtime: { logger },
});

const { message, interrupt } = await agent.invoke({
  userMessages: [
    {
      role: 'user',
      content: 'Review the customer context and propose the next action.',
    },
  ],
  signal,
});
```

`username` 必须是已经注册的员工。`sessionId` 是字符串，连接会话、消息、Tool 状态、分支和 Checkpoint；不要把它转换成 JavaScript `number`，也不要在不同用户之间复用。

`actor` 和 `runtime` 都是必填项。`actor` 决定这个调用以谁的身份读取业务资源，必须来自已认证的请求或可信的任务上下文，不能取自请求参数；Factory 不会再用 Root actor 补上缺省值。`runtime` 提供日志以及调用方的语言和请求头。

`invoke()` 返回 `message`，即这一轮的助手消息；执行没有产生内容时为 `null`。有 Tool 在等待人工确认时，结果里会带 `interrupt`，这时 `message` 是发起这些调用的那一轮，而不是最终答案，所以先检查 `interrupt`。

## 创建固定 Agent

不需要员工角色、知识库和用户上下文，只需要一个固定模型、Prompt、Skill 和 Tool 集合时，可以使用 `createAgent()`：

```ts
const conversation = await conversations.create({
  userId: actor.id,
  title: 'Nightly service summary',
  scope: 'jobs/nightly-summary',
});

const agent = await factory.createAgent({
  sessionId: conversation.sessionId,
  actor,
  runtime: { logger },
  model: { llmService: 'gpt', model: 'gpt-5.6' },
  systemPrompt: 'Summarize only the records supplied by approved Tools.',
  skills: ['service-summary'],
  tools: ['list-service-metrics'],
});

const result = await agent.invoke({
  userMessages: [{ role: 'user', content: 'Prepare the nightly summary.' }],
});
```

`createAgent()` 不查找 Employee，`sessionId`、`actor` 和 `runtime` 都是必填项。它在创建时就解析模型：没有传 `model` 时取第一个启用的模型，一个都没有就在创建时报错。它会激活 `tools` 点名的 Tool 和 `skills` 里各个 Skill 点名的 Tool；传了 `skills` 时还会自动带上 `getSkill`，并在系统提示词里列出这些 Skill，模型遇到匹配的请求时就能加载 Skill 的正文。`getSkill` 只能加载这里给出的 Skill，一个 Skill 要求模型再加载另一个时，两个都要列出，比如 `data-query` 和 `data-metadata`。名字对不上任何已注册 Skill 的会被直接忽略，创建照样成功，只是提示词里没有它，所以要对照设置页核对名字。它默认使用数据库会话持久化。固定 Agent 没有员工的 Tool 预设，每个 Tool 是否需要确认由它自己的 `defaultPermission` 决定：`ALLOW` 直接执行，`ASK`（没有声明时也是 `ASK`）会像员工一样暂停，由 `invoke()` 返回 `interrupt`，再通过 `resumeInvoke()` 继续。

暂停的运行由 checkpointer 保存。默认存在插件自己的数据表里，之后为同一个 `sessionId` 新建的 Agent 也能恢复它。需要换地方时传 `checkpointer`，比如不想让短时任务的暂停状态写进数据库。用工厂提供的方法获取：`factory.getMemorySaver()` 只存在当前进程里，只有同一个 `AgentService` 能恢复；`factory.getDatabaseCheckpointSaver()` 存在插件的数据表里。不要自己用 `@langchain/langgraph` 创建：这个选项的类型来自插件自己依赖的那份 `@langchain/langgraph`，别的副本创建出来的 saver 可能对不上。自己实现的 saver（比如存到别的存储）也要继承同一个包里的 `BaseCheckpointSaver`。

`createAIEmployee()` 不接受 checkpointer：员工的暂停状态始终存在插件的数据表里，因为在聊天或会话中心里确认 Tool、恢复运行时，都会重建 Agent，并从那里读取；子 Agent 不保存暂停状态，它的暂停交给调用它的 Agent 处理。

## 无人值守运行

从任务、定时器或工作流里运行 Agent 时，没有人在旁边确认。插件只提供 AI 能力，任务怎么调度、结果写到哪里由调用方决定；下面只是插件对调用方的要求。

**用 `invoke()`，不用 `stream()`。** `stream()` 只有被消费时才会推进，无人消费就会停在一个打开的会话上。需要结构化结果时，传 Zod `responseFormat` 并读取 `structuredResponse`。

**用一个真实存在、并且有授权的用户运行。** 任务背后没有登录用户，但 Agent 仍然需要一个。会话的 `userId` 指向用户表，随便编一个 id 会在 `conversations.create` 时失败；数据工具按这个用户在授权服务里的权限读取数据，不看 `isRoot`，没有授权的用户只会读到一个空目录，而不会报错。建议为任务建一个专用的服务账号，只授予任务需要读写的权限，再把这个用户作为 `actor` 传入，`roles` 填这个账号真实的角色名，`isRoot` 填 `false`。

**说清楚今天是哪一天。** 按日期工作的任务（昨天的订单、本月的合计）要传 `state.timezone`，值是 IANA 时区名，比如 `Asia/Shanghai`。员工系统提示词里的当前日期和数据 Tool 对日期的处理都按它来；不传时按服务器自己的时区，部署环境常常是 UTC。

**传入 `AbortSignal`，由调用方负责取消。** `signal` 会和服务自己的控制器合并，任何一方都能停止运行。用外部系统已有的取消信号，例如任务超时或关机钩子。除了 200 步的递归上限，没有内置的时长限制。abort 之后只有正在生成的那一轮助手消息会被丢弃：用户消息在运行开始时已经保存，之前各步的助手消息和 Tool 结果也已保存，执行过的 Tool 副作用已经发生。所以重试前先读会话，看运行进行到哪一步，并依赖 Tool 自身可以安全地重复调用。取消信号触发时还在执行的 Tool，会被记成 `status: 'error'`、内容是取消原因，但它的工作可能已经完成：记录显示失败，副作用却可能已经发生，所以判断进度要看 Tool 写入的业务数据，不能只看这个状态。

**事先决定中断怎么处理。** 最可靠的做法是让运行根本不会中断，也就是清楚它能用到的每一个 Tool：

- `createAgent()` 只能用到它点名的 Tool、Skill 点名的 Tool，以及有 Skill 时自动带上的 `getSkill`；多个 Skill 互相引用时要全部列出，`getSkill` 只加载给出的那些。只点名声明了 `defaultPermission: 'ALLOW'`、并且在服务端执行的 Tool：`execution: 'frontend'` 的 Tool 只能在浏览器里执行，不管权限怎么声明都会中断。
- `createAIEmployee()` 还会带上所有 `GENERAL` Tool，其中会中断的有：`suggestions` 需要确认；`formFiller` 要在浏览器里执行；其他没有声明 `ALLOW` 的 `GENERAL` Tool 也一样，包括配置了 MCP 服务之后，名字不以 `get` 开头的 MCP Tool，因为 MCP Tool 都以 `GENERAL` 注册。用会话级的 `skillSettings` 列出这次运行允许使用的 Tool，就能把它们排除掉：

```ts
// 这次运行可以使用的全部 Tool，包括 Skill 会激活的 Tool。
// data-query 会让模型先加载 data-metadata，所以两者的 Tool 都要列出
const skillSettings = {
  toolsVersion: 1,
  tools: [
    'getSkill',
    'getDataSources',
    'getCollectionNames',
    'getCollectionMetadata',
    'searchFieldMetadata',
    'dataSourceQuery',
    'dataSourceCounting',
    'dataQuery',
  ],
  skillsVersion: 1,
  skills: ['data-query', 'data-metadata'],
};

const conversation = await conversations.create({
  userId: actor.id,
  aiEmployee: { username: 'customer-success' },
  title: 'Nightly customer review',
  options: { skillSettings },
});

const agent = await factory.createAIEmployee({
  username: 'customer-success',
  state: { sessionId: conversation.sessionId, timezone: 'Asia/Shanghai' },
  actor,
  runtime: { logger },
  skillSettings,
});
```

会话也要写入同一份 `skillSettings`。Agent 上的这份只管这一次运行；之后通过 HTTP 发起的运行，比如在聊天或会话中心里确认 Tool、恢复或重试，都会按会话上的那份重建 Agent，会话上没有的话，就会以员工的全部 Tool 继续运行。

这个列表只能在员工已有的 Tool 里做减法，不能添加员工没有的 Tool；它同时作用于基础 Tool 和 Skill 激活的 Tool，所以 Skill 的 Tool 也要列进去。一个 Skill 要求模型再加载另一个 Skill 时（比如 `data-query` 和 `data-metadata`），整条链上的 Tool 都要列出，否则模型中途会拿到「Tool unavailable.」，运行不会报错，只会得出一个猜出来的结果。有两类 Tool 不受它限制：系统 Tool（`getSkill`、`subAgentWebSearch`、`knowledge-base-retrieve`、`aiEmployeeWorkflowTaskOutput`），仍受各自的开关控制；以及 `loadFrontendTool` 和 `executeFrontendTool`，它们只在会话带有前端工具清单时出现，出现就一定会中断，所以服务端运行不要传前端工具清单。`toolsVersion` 只影响空列表：有它时 `tools: []` 只保留系统 Tool，没有它时空列表等于不过滤。`skills` 加 `skillsVersion` 以同样的方式收窄 Skill：只把列出的 Skill 提供给 `getSkill` 并写进提示词，带着 `skillsVersion` 的空列表表示一个都不提供，这样只该按一套流程运行的任务不会拿到其他流程。

确实需要一个会确认的 Tool 时，调用方就是在替用户做决定，要按每个 action 明确给出决定，并且只给出 action 允许的决定：

```ts
let result = await agent.invoke({ userMessages });
// 恢复之后，运行可能在下一个 Tool 上再次暂停，所以要限制轮数
for (let round = 0; result.interrupt; round++) {
  if (round >= 5) {
    throw new Error(
      `Still paused after ${round} decisions: ${conversation.sessionId}`,
    );
  }
  const { id, actions } = result.interrupt;
  result = await agent.resumeInvoke({
    userDecisions: {
      interruptId: id,
      decisions: actions.map((action) =>
        action.toolCall?.name === 'draft-reply' &&
        action.allowedDecisions?.includes('approve')
          ? { type: 'approve' }
          : { type: 'reject', message: 'Not allowed in an unattended run' },
      ),
    },
  });
}
```

模型如果一直调用被拒绝的 Tool，没有上限的循环会一直转下去；超过上限后运行保持暂停，调用记录都在，留给人来查看。

action 只标识 Tool 调用（`toolCall.id` 和 `toolCall.name`），不带参数；需要按参数做决定时，从同一个结果的 `message.toolCalls` 里按 `id` 取。一个既没有恢复、也没有人处理的运行会一直保持暂停。不要往这个会话里直接发新的一轮，另开一个会话，或者恢复原来的那个。

**区分失败类型。** 运行失败时抛出 `AgentServiceError`，调用方按 `code` 和 `retryable` 决定是否重试。模型问题在哪一步暴露，取决于用哪个工厂方法：`createAgent()` 在创建时就完整解析模型和 LLM 服务，模型缺失或不可用会在创建时以 `CONFIGURATION_ERROR` 失败；`createAIEmployee()` 只有在一个可用模型都没有时才在创建时失败，即员工自己列了模型但全部停用，或者员工没列模型、而且没有任何服务启用了模型。模型能解析出来、但指向的服务跑不起来（比如它的 Provider 已不再注册）时，要到 `invoke()` 或 `stream()` 执行时才以同样的 `CONFIGURATION_ERROR` 失败。所以创建和执行都要放进 `try`。员工 `username` 不存在则在创建时抛出普通的 `Error`，这是调用方的错误，不是可以重试的状态：

| `code`                  | 含义                                | `retryable` |
| ----------------------- | ----------------------------------- | ----------- |
| `GRAPH_RECURSION_ERROR` | 达到 200 步上限                     | `true`      |
| `EMPTY_RESPONSE`        | `stream()` 没有产生任何内容         | `true`      |
| `CONFIGURATION_ERROR`   | 没有可用的模型、LLM 服务或 Provider | `false`     |
| `PROVIDER_ERROR`        | 其他失败，包括 Provider 本身的错误  | `false`     |
| `ABORTED`               | 取消信号触发，同时 `aborted` 为真   | `false`     |

`EMPTY_RESPONSE` 只来自 `stream()`，`invoke()` 遇到同样情况时返回 `message: null`，需要自己检查。`PROVIDER_ERROR` 的 `retryable: false` 只表示不值得立即重试，因为 Provider 客户端已经重试过瞬时故障；隔几分钟、带退避的重试仍然可能成功。记录日志时读 `rootMessage`，它是错误链里最具体的那条消息。

通过 HTTP 调用聊天接口时，流一旦打开就返回 200，运行失败不会反映在状态码上，而是以 SSE 的 `error` 事件送达，失败来自 Agent 时事件里带着同样的 `code`。按 `code` 判断，不要匹配 `body` 的文字。

## 流式执行和取消

`stream()` 返回异步迭代器。把请求取消信号传给 Agent，并在连接关闭时调用 `abort()`：

```ts
try {
  for await (const event of agent.stream({
    userMessages: [{ role: 'user', content: 'Generate a service summary.' }],
    signal: request.signal,
  })) {
    await output.write(event);
  }
} finally {
  agent.abort('stream closed');
}
```

HTTP Route 不应直接把内部事件对象原样暴露给客户端。普通聊天已经由插件的 SSE Adapter 处理缓存、恢复和协议转换；自定义 Route 需要定义自己的稳定响应 Contract。

## Agent 的内部边界

Factory 创建的 `AgentService` 组合四个职责：

| Contract                 | 职责                                                      |
| ------------------------ | --------------------------------------------------------- |
| Agent Context Provider   | 解析当前会话、模型、系统 Prompt 和本次可发现 Tool         |
| Conversation Provider    | 编排消息、Tool 决策、线程和流式缓存                       |
| Conversation Persistence | 保存会话、普通消息、Tool 消息和 Usage Event               |
| Agent Service            | 构建标准中间件顺序，并提供 invoke、stream、resume 和 fork |

标准调用不要替换这些边界。特别是中间件排序由 `AgentService` 拥有，应用不能通过传入任意 middleware 改写安全和持久化顺序。

## 自定义持久化

`createAgent()` 内部支持自定义 `ConversationPersistence`，但该 Contract 当前没有从插件 Server barrel 导出。没有稳定公开扩展包时，不要通过 deep import 实现自定义存储。

需要新增正式持久化后端时，应先把 Contract 作为公开 API 提升，并保持以下不变量：

- assistant 消息和 Usage Event 在同一事务边界写入
- Usage 写入失败时回滚对应消息
- Tool 调用状态和消息顺序保持不变
- Snowflake 和 Message ID 始终保持字符串精度
- 重试、恢复、分支和 Checkpoint 语义保持一致

## 生命周期和错误处理

在 ServiceProvider 的 `boot()` 或业务方法中通过 Container 解析 Factory，不要在模块顶层缓存跨应用实例的对象。长时间任务要响应应用 Shutdown，停止输入、取消活动执行，再释放调用方自己拥有的资源。

模型、员工、Tool 或 Skill 不存在时让调用明确失败，不要静默切换另一模型或新建一套 `AIManager`。带写入副作用的任务在重试前先检查会话和 Tool 状态，避免网络断开造成重复执行。

## 相关链接

- [定义自己的 AI 员工](./development/index.md) — 注册 Factory 可以使用的 Employee、Skill 和 Tool
- [注册 Tool](./development/tool.md) — 实现 actor 和权限边界
- [LLM 服务配置](./configuration/llm.md) — 准备 `ModelRef` 引用的服务
- [聊天框](./components/chat.md) — 普通页面的首选接入方式
