# AI chat box 真实化实现执行方案

## 背景

`packages/plugins/@nocobase/plugin-ai/src/client-v2/block/index.tsx` 当前实现的是 AI chat box 交互原型，模型名为 `AIChatDemo*`。原型已经具备较完整的布局、交互和设置入口，但消息、会话、发送、新会话等仍以 mock 或半真实逻辑为主。

chatbox 底层 runtime/store 已完成基础重构：

- `ChatBoxRuntime` 位于 `ai-employees/chatbox/stores/runtime.tsx`。
- `useChatBoxRuntime()` 为严格模式，无 Provider 会报错。
- runtime-aware hooks/actions 使用 `useResolvedChatBoxRuntime(runtime?)`。
- provider-less 全局入口必须显式传入 `getGlobalChatBoxRuntime()`。
- 不再使用 `useChatConversationsStore` / `useWorkflowTasksStore`。
- 所有 reactive API 从 `@nocobase/flow-engine` 导入，不直接依赖 `@formily/reactive`。

本方案用于把 AI chat box 从原型推进到真实可用的生产实现。原型在生产实现完成和验收前必须继续可用，生产代码不能依赖原型组件或原型模型。

## 目标

- 新增生产版 `AIChatBox*` 模型和组件，与 `AIChatDemo*` 并存。
- 每个 AI chat box 实例拥有独立 `ChatBoxRuntime`，不共享 current conversation、sender draft、员工、模型、附件、上下文等 UI 状态。
- 复用现有真实 chatbox 的 `Messages`、`Sender`、发送、上传、上下文、流式响应、取消、恢复、编辑等能力。
- 区块内会话列表单独实现，只显示 conversations，不显示 workflow task tab。
- 支持 conversation scope：默认当前 block uid，清空 scope 表示不过滤，非空 scope 按 scope 过滤。
- 支持 Add block：新增普通区块默认进入当前 AI chat box 的 Work context，并能和核心区块上下拖拽排序。
- 支持 AI employee task 定向 AI chat box，并确保 task 配置优先级高于 AI chat box 默认配置，直接覆盖，不合并。
- 保持现有全局 floating chatbox 行为不回退。

## 非目标

- 不删除或重命名 `AIChatDemo*`，除非保留兼容导出并作为单独任务处理。
- 不把生产实现建立在原型组件之上。
- 不恢复 JS Item；Actions 只允许 JS Action 和 AI Employee。
- 不引入 `useOptionalChatBoxRuntime`。
- 不重新引入旧 selector store。
- 不改变 legacy v1 client。

## 约束

- 所有新生产代码放在 `src/client-v2` 下。
- 生产模型使用 `AIChatBox*` 命名，原型继续使用 `AIChatDemo*`。
- 核心区块模型命名为 `AIChatBoxCoreModel`，文件命名为 `AIChatBoxCoreModel.tsx`。
- 生产实现建议放在 `packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/`。
- 区块创建 runtime 时必须使用 `createChatBoxRuntime({ mode: 'block' })`。
- 全局 floating chatbox 使用 `getGlobalChatBoxRuntime()`，不得被区块 runtime 污染。
- `ChatBoxRuntime` 增加运行模式属性，推荐：

  ```ts
  type ChatBoxRuntimeMode = 'global' | 'block';
  ```

- `Messages` 根据 runtime mode 判断是否执行 workflow-task readonly 刷新：`global` 保持原行为，`block` 禁用该刷新。
- Sender 状态需要抽出独立 `ChatSenderModel` 放入 runtime。它承载 sender/composer 相关实例状态，避免同一 session 在多个 UI 中共享输入草稿和待发送附件/上下文。
- 区块版 Conversations 单独实现，不复用全局 floating chatbox 的 `Conversations` 组件。
- 新增用户可见字符串必须走 `tExpr()` / `useT()`，并补 `en-US.json`、`zh-CN.json`。
- 新增数据库字段按仓库规则通过 collection schema 同步；只有需要数据回填或行为迁移时才加 migration。
- 提交前必须确认 staged diff，只提交当前任务相关文件，不 stage/revert 无关 dirty。

## 关键设计

### Runtime 模式

`ChatBoxRuntime` 增加 `mode`：

- `global`：全局 floating chatbox。
- `block`：AI chat box 区块。

`Messages`、hooks 和后续扩展可以通过 `runtime.mode` 判断运行环境。当前必须先用于禁用 block 模式下的 workflow-task readonly 刷新。

### Sender 状态模型

新增 `ChatSenderModel`，放入 `ChatBoxRuntime`。建议迁移或新增的状态包括：

- `senderValue`
- `senderRef`
- `senderPlaceholder`
- `isShowSenderHint`
- `isEditingMessage`
- `editingMessageId`
- 待发送 `attachments`
- 待发送 `contextItems`
- 待发送 `systemMessage`
- 待发送 `skillSettings`

迁移需要谨慎分步进行，先保持全局 chatbox 行为不变，再让区块基于该模型隔离 sender/composer 状态。

### 生产模型结构

建议新增：

- `AIChatBoxBlockModel`
- `AIChatBoxCoreModel`

默认结构：

- `AIChatBoxBlockModel.subModels.bodyBlocks` 中包含一个不可删除的 `AIChatBoxCoreModel`。
- `AIChatBoxCoreModel` 渲染 messages + sender。
- 普通 Add block 新增到 `bodyBlocks` 中，默认移动到 core 上方。
- 普通 block 和 core 可上下拖拽排序。

### Work context

直接发送使用 AI chat box 默认 Work context：

- Edit chat box 中手动选择的 `selectedBlocks`
- 当前 AI chat box 内通过 Add block 添加的普通 block

运行时归一化规则：

- 按 `{ type, uid }` 去重。
- 保留用户可见顺序。
- 删除 block 后不再出现在默认 Work context。
- AI employee task 有自己的 Work context 时，直接覆盖 AI chat box 默认 Work context，不合并。

### Scope

区分三种状态：

- `undefined` 或缺省：运行时使用当前 block uid。
- `''`：不过滤 scope，显示所有相关 conversations。
- 非空字符串：按该 scope 过滤。

建议新增 `aiConversations.scope` 字段，create 时写入，list 时按参数过滤。

### Conversations

区块版 Conversations 单独实现：

- 只显示 conversations。
- 不显示 workflow task tab。
- 不显示旧红点。
- 支持 search、打开、重命名、删除。
- 打开会话只写当前 block runtime，不影响全局 chatbox 或其他 block。

### AI employee task

AI employee task 需要支持 `Chat box uid`：

- 当前页面存在目标 AI chat box 时，在目标 block runtime 内触发任务。
- task 配置优先级高于 AI chat box 默认配置，直接覆盖，不合并。
- 找不到目标 block 时的 fallback 需要产品确认。当前建议：提示找不到目标 AI chat box，不回退全局 chatbox。

## 测试要求

每个大任务完成后必须：

1. 更新本文档任务状态。
2. 运行 touched files eslint：

   ```bash
   yarn eslint --fix <touched-files>
   ```

3. 运行相关测试：

   ```bash
   yarn test <related-test-file> --run --reporter=verbose
   ```

4. 如涉及 server/resource，运行相关 server 测试；不要并行跑 server tests。
5. 确认 staged diff 后提交当前任务。

重点测试范围：

- 全局 chatbox 行为不回退。
- runtime mode：global 保持 workflow-task readonly 刷新，block 禁用该刷新。
- Sender 状态隔离：多个 runtime 不共享 sender draft、附件、上下文、编辑状态。
- 同一个 sessionId 的消息/流式状态按预期读取。
- scope 过滤：默认 uid、相同 scope、清空 scope。
- Add block 进入 Work context。
- task 配置覆盖 AI chat box 默认配置，尤其 Work context 不合并。
- 区块 Conversations 不显示 workflow task tab。
- Actions 只允许 JS Action 和 AI Employee。

## 状态说明

- `Pending`：未开始。
- `In Progress`：正在实施。
- `Done`：已实现、已测试、已更新文档状态并提交。
- `Blocked`：需要产品或技术决策。

## 任务拆分

### T0. 清理和确认当前工作区

状态：`Done`

依赖：无

小任务：

- T0.1 查看 `git status --short` 和 `git diff --stat`。
- T0.2 区分已有未提交的 demo runtime 适配、handoff 文档、无关 `yarn.lock`。
- T0.3 如决定保留 demo runtime 适配，运行 touched TSX eslint 和相关 runtime/public API 测试。
- T0.4 将 demo runtime 适配单独提交，避免和生产实现混在一起。

测试：

- `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/block/index.tsx`
- 相关 runtime/public API 测试，如当前仓库已有对应测试文件则运行。

测试结果：

- `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/block/index.tsx` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-global-behavior.test.tsx --run --reporter=verbose` 通过。

提交要求：

- 只提交 demo runtime 适配相关文件。
- 不提交无关 `yarn.lock`，除非确认它属于当前任务。

### T1. runtime mode 与 ChatSenderModel 基础能力

状态：`Done`

依赖：T0

小任务：

- T1.1 为 `ChatBoxRuntime` 增加 `mode: 'global' | 'block'`。
- T1.2 `getGlobalChatBoxRuntime()` 创建 `mode: 'global'` runtime。
- T1.3 后续区块 runtime 创建接口支持 `mode: 'block'`。
- T1.4 新增 `ChatSenderModel` 并挂入 runtime。
- T1.5 梳理 sender/composer 状态从 `ChatBoxModel` / `ChatMessageModel` 迁移到 `ChatSenderModel` 的边界。
- T1.6 先保证全局 chatbox 使用 `ChatSenderModel` 后行为不变。
- T1.7 `Messages` 根据 `runtime.mode` 禁用 block 模式下 workflow-task readonly 刷新。

测试：

- 新增或更新 runtime/store 测试，覆盖 `mode` 默认值和全局 runtime 稳定性。
- 覆盖 `ChatSenderModel` 状态读写、reset、隔离。
- 覆盖 `Messages` 在 `block` mode 下不调用 workflow-task readonly 刷新。
- 运行 touched files eslint。

测试结果：

- `yarn eslint --fix` touched T1 files 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/components/__tests__/Messages.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-global-behavior.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/AIEmployeeShortcut.test.tsx --run --reporter=verbose` 通过。

### T2. 生产 AIChatBox 模型和文件骨架

状态：`Done`

依赖：T1

小任务：

- T2.1 新建 `block/ai-chat-box/` 目录。
- T2.2 新建 `types.ts`、`utils.ts`、`settings.tsx`、`index.ts`。
- T2.3 实现 `AIChatBoxBlockModel.tsx`。
- T2.4 实现 `AIChatBoxCoreModel.tsx`。
- T2.5 在 `plugin.tsx` 注册生产 `AIChatBox*` 模型，保留 `AIChatDemo*`。
- T2.6 确认 block picker 中生产入口和 demo 入口的展示策略。如需要调整 demo label，先确认产品决策。

测试：

- 模型注册相关测试，如已有 FlowEngine model 注册测试则补充。
- 手动或自动验证生产模型可以创建，demo 仍可渲染。
- 运行 touched files eslint。

测试结果：

- `yarn eslint --fix` touched T2 files 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/settings-registration.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/ai-employee-action-model.test.ts --run --reporter=verbose` 通过。

### T3. AIChatBoxBlockView 布局与 Add block 行为

状态：`Done`

依赖：T2

小任务：

- T3.1 实现 `components/AIChatBoxView.tsx`。
- T3.2 实现 header：左侧 conversation list，右侧 Actions、New conversation、Show messages=false 的消息按钮。
- T3.3 实现 body slot 和 DnD。
- T3.4 Add block 只允许普通 blocks，过滤当前生产 `AIChatBoxBlockModel` 和 demo `AIChatDemoBlockModel`，避免嵌套。
- T3.5 新增 block 默认移动到 core 上方。
- T3.6 core 不可删除但可拖拽排序。
- T3.7 Actions 只允许 `JSActionModel` 和 `AIEmployeeActionModel`。

测试：

- Add block 菜单过滤测试。
- 新增 block 插入位置测试。
- core 不可删除测试。
- Actions 类型过滤测试。
- 运行 touched files eslint。

测试结果：

- `yarn eslint --fix` touched T3 TS/TSX files 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/AIChatBoxView.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/settings-registration.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose` 通过。

### T4. Settings 与 Work context 归一化

状态：`Done`

依赖：T3

小任务：

- T4.1 实现生产 `Edit chat box` 设置。
- T4.2 支持字段：Scope、Background、Default user message、Work context、AI employees、Models。
- T4.3 实现浮动设置项：Show messages、Sender placeholder、Enable add context、Enable upload files、Enable web search、Enable employee select、Enable model select、Show disclaimer。
- T4.4 不显示 Appearance 和 Block height。
- T4.5 实现 Work context 归一化工具：`selectedBlocks + bodyBlocks`，去重并保序。
- T4.6 Sender placeholder 使用独立 dialog，dialog 内不重复 label。
- T4.7 补充 i18n。

测试：

- scope 三态解析测试。
- Work context 归一化测试。
- 设置保存测试。
- i18n key 检查。
- 运行 touched files eslint。

测试结果：

- `yarn eslint --fix` touched T4 TS/TSX files 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/settings.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/AIChatBoxView.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/settings-registration.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose` 通过。

### T5. Sender 和 Messages 接入真实 runtime

状态：`Done`

依赖：T4

小任务：

- T5.1 实现 `components/MessagesAndSender.tsx`。
- T5.2 `AIChatBoxCoreModel` 渲染 `MessagesAndSender`。
- T5.3 复用现有 `Messages`，传入或读取 block runtime mode，使用区块容器样式。
- T5.4 扩展现有 `Sender` 支持 block 配置：placeholder、控件开关、allowed employees、allowed models、默认 system message、默认 user message、默认 Work context、scope。
- T5.5 Sender 使用 `ChatSenderModel` 保存当前 runtime 的 sender/composer 状态。
- T5.6 直接发送时合成 AI chat box 默认配置。
- T5.7 保持全局 `Sender` 默认行为不变。

测试：

- 两个 runtime 的 sender draft 隔离测试。
- allowed employees/models 限制测试。
- 控件开关显示测试。
- direct send payload 构造测试。
- 全局 sender 回归测试。
- 运行 touched files eslint。

测试结果：

- `yarn eslint --fix` touched T5 TS/TSX files 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/components/__tests__/Sender.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/MessagesAndSender.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/components/__tests__/Messages.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/AIChatBoxView.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-global-behavior.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/settings.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/settings-registration.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose` 通过。

### T6. 区块 Conversations 单独实现

状态：`Done`

依赖：T5

小任务：

- T6.1 新建 `components/Conversations.tsx`。
- T6.2 支持搜索、打开、重命名、删除。
- T6.3 不显示 workflow task tab。
- T6.4 不显示旧 unread 红点。
- T6.5 打开会话时只更新当前 block runtime。
- T6.6 根据 scope 参数请求会话列表。
- T6.7 左侧面板按 prototype 行为打开/关闭。

测试：

- 不渲染 workflow task tab 测试。
- 打开会话只更新当前 runtime 测试。
- 搜索/重命名/删除行为测试。
- 运行 touched files eslint。

测试结果：

- `yarn eslint --fix` touched T6 TS/TSX files 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/Conversations.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/AIChatBoxView.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-global-behavior.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/components/__tests__/Messages.test.tsx --run --reporter=verbose` 通过。

### T7. conversation scope 服务端与客户端接入

状态：`Done`

依赖：T6

小任务：

- T7.1 在 `ai-conversations` collection 增加 `scope` 字段。
- T7.2 conversation create 保存 scope。
- T7.3 conversation list 支持 scope 过滤。
- T7.4 清空 scope 表示不过滤 scope。
- T7.5 全局 chatbox 默认不按 scope 过滤，继续显示 scoped 与 unscoped conversations；只有明确传入非空 scope 时才过滤。
- T7.6 更新 client hooks/action 参数。

测试：

- server resource list scope 过滤测试。
- create 保存 scope 测试。
- 清空 scope 不过滤测试。
- 全局 chatbox 不传 scope 时不过滤 scoped conversations 测试。
- 运行 touched files eslint 和相关 server/client tests。

测试结果：

- `yarn eslint --fix` touched T7 TS/TSX files 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/server/__tests__/ai-conversations-scope.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/components/__tests__/Sender.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/MessagesAndSender.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/Conversations.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-global-behavior.test.tsx --run --reporter=verbose` 通过。

### T8. 新会话、发送、取消、恢复流式响应完整联调

状态：`Done`

依赖：T7

小任务：

- T8.1 New conversation 使用当前 block runtime 清空当前会话和 sender/composer 状态。
- T8.2 direct send 创建带 scope 的 conversation。
- T8.3 发送后当前 block runtime 切到新 session。
- T8.4 cancel/resume stream/edit message 使用当前 block runtime。
- T8.5 copy/edit 等 message 操作保持现有行为。
- T8.6 保持全局 chatbox 行为不变。

测试：

- 新会话行为测试。
- 创建会话后 currentConversation 隔离测试。
- 流式响应进入正确 session 测试。
- cancel/resume/edit 回归测试。
- 运行 touched files eslint。

测试结果：

- `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/hooks/__tests__/chatbox-actions.test.tsx` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/hooks/__tests__/chatbox-actions.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/components/__tests__/Sender.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/MessagesAndSender.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/Conversations.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/components/__tests__/Messages.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-global-behavior.test.tsx --run --reporter=verbose` 通过。

### T9. AI employee task 定向 AI chat box

状态：`Done`

依赖：T8

小任务：

- T9.1 在 task settings 增加 `Chat box uid` 字段。
- T9.2 新增 mounted AI chat box registry，按 block uid 注册 runtime/action API。
- T9.3 block mount 注册，unmount 清理。
- T9.4 AI employee task 触发时查找目标 chat box。
- T9.5 task 配置覆盖 AI chat box 默认配置。
- T9.6 Work context 不合并。
- T9.7 找不到目标 chat box 的 fallback 按确认后的产品决策实现。

测试：

- task 指定 chat box uid 路由测试。
- task 配置覆盖测试。
- Work context 不合并测试。
- unmount 清理 registry 测试。
- 运行 touched files eslint。

测试结果：

- `yarn eslint --fix` touched T9 TS/TSX files 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/mounted-chat-boxes.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/AIChatBoxView.registry.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/AIEmployeeShortcut.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/ai-employee-action-model.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/AIChatBoxView.test.ts --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/hooks/__tests__/chatbox-actions.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/block/ai-chat-box/__tests__/MessagesAndSender.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-global-behavior.test.tsx --run --reporter=verbose` 通过。
- `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose` 通过。

### T10. 最终回归与验收

状态：`Pending`

依赖：T9

小任务：

- T10.1 运行相关 block/chatbox/runtime/server tests。
- T10.2 运行 touched files eslint。
- T10.3 手动验证全局 floating chatbox。
- T10.4 手动验证 demo 仍可添加和使用。
- T10.5 手动验证生产 AI chat box 可添加和使用。
- T10.6 验证多个生产 AI chat box 实例隔离。
- T10.7 更新 `HANDOFF.md` 或验收记录。

测试：

- 覆盖上述全部回归。
- 最终提交前确认 staged diff。

## 已确认产品决策

- D1：demo 入口改名，避免和生产 `AI chat box` 同名混淆。
- D2：全局 chatbox 不隐藏 scoped block conversations。
- D3：scope 清空后的 “所有相关 conversations” 包含全局 unscoped conversations 和其他 scoped block conversations。
- D4：task 指定 `Chat box uid` 但目标未挂载时，提示找不到目标，不回退全局 chatbox。
- D5：Add block 自动进入 Work context 后，不提供单独排除该 block 的能力；删除 block 才移除默认上下文。

## 执行规则

每个大任务必须独立完成：

1. 开始前把本文档对应任务状态改为 `In Progress`。
2. 完成实现。
3. 运行该任务要求的 eslint 和测试。
4. 把任务状态改为 `Done`，补充必要测试备注。
5. `git status` 和 `git diff --staged` 确认后提交。

不得把多个大任务混在一个提交中。不得 stage 或 revert 用户已有无关 dirty。
