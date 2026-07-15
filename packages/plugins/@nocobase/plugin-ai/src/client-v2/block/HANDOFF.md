# AI chat box real implementation handoff

This handoff is for turning the current AI chat box prototype into a real usable block.

## Current state

The prototype is implemented in `packages/plugins/@nocobase/plugin-ai/src/client-v2/block/index.tsx`.

It is already registered from `packages/plugins/@nocobase/plugin-ai/src/client-v2/plugin.tsx` through:

- `AIChatDemoBlockModel`
- `AIChatDemoMessagesAndSenderBlockModel`
- `AIChatDemoChatContentBlockModel`
- `AIChatDemoMessageListBlockModel`
- `AIChatDemoSenderBlockModel`
- `AIChatDemoConversationListBlockModel`
- `AIChatDemoNewActionModel`

The block can be added from the page block picker and currently focuses on interaction and visual fidelity. It uses some real chatbox pieces, such as `AIEmployeeSwitcher`, `ModelSwitcher`, `useChatBoxActions`, `useChatBoxStore`, `useAIConfigRepository`, and the `WorkContext` selector, but the message list, conversation list, new conversation, and send behavior are still mostly mock/prototype behavior.

## Prototype preservation rules

Do not modify the current prototype in place while building the real version.

The current demo must remain usable in the system until the real AI chat box is complete and accepted. During development, the demo and the production implementation should be available side by side, so product/design review can compare them and users are not blocked by unfinished work.

The production AI chat box must not depend on code or React components from this prototype. Treat `AIChatDemo*` models and demo components as a reference for product behavior only, not as reusable implementation building blocks.

If the prototype blocks the new file layout or model names, move or rename the prototype as a separate demo-only implementation, for example:

- keep `block/index.tsx` as the demo and add production code under `block/ai-chat-box/`
- move the demo to `block/demo/` and keep compatibility exports for the existing demo model names
- keep demo registration under `AIChatDemo*` and register production models under `AIChatBox*`

Whichever structure is chosen, keep both implementations addable/usable until the production implementation fully replaces the demo by explicit decision.

The current file is intentionally broad. The production version should be implemented independently and split into focused files. A reasonable split:

- `index.tsx` or `register.ts` for exports and model registration
- `AIChatBoxBlockModel.tsx`
- `MessagesAndSenderBlockModel.tsx`
- `components/AIChatBoxView.tsx`
- `components/HeaderActions.tsx`
- `components/Messages.tsx`
- `components/Sender.tsx`
- `components/Conversations.tsx`
- `settings.tsx`
- `types.ts`

## Product behavior to preserve

The public name is **AI chat box**.

Default structure:

- The block contains one non-deletable messages-and-sender block by default.
- Messages and sender are one combined draggable block, currently named `AIChatDemoMessagesAndSenderBlockModel`.
- Users can add normal blocks inside the AI chat box through 「Add block」.
- Newly added blocks should be inserted above the messages-and-sender block by default.
- Added blocks and the messages-and-sender block can be reordered vertically by drag and drop.
- Added blocks can be deleted. The messages-and-sender block cannot be deleted.
- The AI chat box itself should have a minimum width around `300px`.

Header behavior:

- Left: conversation list entry button.
- Right: `Actions`, `New conversation`, and, when `Show messages` is false, a message icon button.
- `Actions` can add `JS Action` and `AI Employee`. Do not add `JS Item`.
- `New conversation` sits to the right of `Actions`.
- When `Show messages` is false, the message icon opens messages from the right side.
- The conversation list opens from the left side.
- The old conversation-list red dot is intentionally removed for this block.

Settings behavior:

- The floating settings menu includes:
  - `Edit chat box`
  - `Show messages`
  - `Sender placeholder`
  - `Enable add context`
  - `Enable upload files`
  - `Enable web search`
  - `Enable employee select`
  - `Enable model select`
  - `Show disclaimer`
- Do not show `Appearance` or `Block height` in this block's floating settings.

`Edit chat box` dialog fields:

- `Scope`
- `Background`
- `Default user message`
- `Work context`
- `AI employees`
- `Models`

Sender controls:

- `AI employees` and `Models` in `Edit chat box` restrict what can be selected in the sender.
- `Enable employee select` and `Enable model select` only control whether the selectors are visible.
- `Sender placeholder` opens a separate dialog and has no duplicate label inside that dialog.
- Sender visuals should continue matching the existing chatbox sender.

## Critical configuration rules

AI employee task configuration has higher priority than AI chat box defaults.

When an AI employee task is triggered inside an AI chat box:

- The task should run in that AI chat box UI/container.
- If the task has its own `Background`, `Default user message`, `Work context`, model, web search, skill settings, attachments, or other task-level settings, those values directly override the AI chat box defaults.
- Do not merge task `Work context` with AI chat box default `Work context`.
- Do not append task settings to AI chat box defaults.
- Only values that are not configured by the task may fall back to AI chat box defaults.

This is a product rule. Do not document or implement a behavior where task configuration "reuses", "combines with", or "merges into" AI chat box defaults.

## Scope semantics

`Scope` is used to filter the conversation list.

Expected behavior:

- Default value should be the current AI chat box block `uid`.
- With the default value, each AI chat box shows conversations created from itself.
- If multiple AI chat boxes use the same scope, they can share a conversation list.
- If scope is cleared, conversation list filtering by AI chat box should be disabled and all relevant conversations should be shown.

Current prototype issue:

- `getChatBoxScope(model)` returns `props.scope || model.uid`.
- The settings handler currently saves `scope: params.scope || ctx.model.uid`.
- That means clearing scope cannot represent "show all conversations".

For the real version, distinguish these states explicitly:

- `undefined` or missing scope means "use default block uid".
- `''` means "show all conversations".
- non-empty string means "filter by this scope".

## Work context semantics

Blocks added through 「Add block」 are default work context for direct sends from this AI chat box.

`Work context` in `Edit chat box` should display the default context set for this AI chat box. It should include:

- blocks manually selected from `Edit chat box`
- blocks added inside the AI chat box through 「Add block」

For direct sends from the AI chat box, use this default work context.

For AI employee task sends, task-level work context overrides this default work context and is not merged with it.

Implementation detail to solve:

- The prototype stores `selectedBlocks` in props.
- It does not yet derive context from actual `bodyBlocks`.
- The real version should normalize context from both configured `selectedBlocks` and current added blocks, de-duplicate by `{ type, uid }`, and preserve user-visible order where possible.

## Real chat integration targets

The existing global chatbox implementation lives under:

- `ai-employees/chatbox/components/ChatBox.tsx`
- `ai-employees/chatbox/components/Messages.tsx`
- `ai-employees/chatbox/components/Sender.tsx`
- `ai-employees/chatbox/components/Conversations.tsx`
- `ai-employees/chatbox/hooks/useChatBoxActions.ts`
- `ai-employees/chatbox/hooks/useChatConversationActions.ts`
- `ai-employees/chatbox/hooks/useChatMessageActions.ts`
- `ai-employees/chatbox/hooks/useChat.ts`
- `ai-employees/chatbox/stores/*`

Prefer extracting configurable lower-level pieces from the existing chatbox instead of forking the UI. The AI chat box block should keep visual parity with the existing chatbox.

Likely changes:

- Make `Sender` accept options for visible controls, placeholder, allowed employees, allowed models, default system message, default user message, default work context, and default scope/from metadata.
- Make `Messages` render against the block's current conversation/session.
- Make `Conversations` accept `scope`, hide workflow-task tabs for the AI chat box use case, and filter by scope.
- Make `useChatBoxActions` support an embedded mode or create block-specific action hooks that reuse `sendMessages`, upload, edit, resend, cancel, resume stream, and new conversation behavior.
- Avoid coupling embedded blocks to global floating chatbox state such as `open`, `expanded`, global `showConversations`, or `chatBoxRef`.

## Store isolation risk

The current chatbox stores are global:

- `useChatBoxStore`
- `useChatConversationsStore`
- `useChatMessagesStore`
- `useChatToolsStore`
- `useWorkflowTasksStore`

The real AI chat box must support multiple instances on the same page. Do not blindly reuse the global store as-is if it makes two AI chat boxes fight over:

- current conversation
- current AI employee
- model
- sender draft
- attachments
- context items
- loading state
- readonly/editing state
- conversation list keyword

Recommended direction:

- Introduce a scoped store/session layer keyed by AI chat box `uid` or another stable instance key.
- Keep message state keyed by `sessionId` where it already is, but isolate draft state and "current" state per chat box instance.
- Keep the global floating chatbox behavior unchanged.

## Server/API work likely needed

The current `aiConversations` collection has no dedicated scope/chat-box field. It has `sessionId`, `from`, `user`, `aiEmployee`, `title`, `options`, `llmActiveState`, `category`, and `read`.

To support AI chat box conversation filtering, add a real field such as `scope` or `chatBoxScope` to `aiConversations`, or define a clearly queryable location under `options` if the existing resource layer supports it well. A dedicated field is easier to filter and index.

Expected API changes:

- Conversation create/send should save the AI chat box scope.
- Conversation list should filter by scope when scope is non-empty.
- Empty scope should mean no scope filter.
- New conversation from the AI chat box should create or prepare a conversation with that scope.
- Existing global chatbox should continue using its current behavior and should not accidentally show scoped block conversations unless intentionally requested.

Also review:

- `server/resource/aiConversations.ts`
- `server/collections/ai-conversations.ts`
- `server/manager/ai-chat-conversation.ts`
- `client-v2/ai-employees/chatbox/hooks/useChatConversationActions.ts`
- `client-v2/ai-employees/chatbox/hooks/useChatMessageActions.ts`

Per repository rules, new collection fields are synced by `yarn nocobase upgrade`. Add a migration only if existing data needs data backfill or behavior-preserving migration.

## AI employee task routing

`AIEmployeeShortcutModel.tsx` already contains the `Edit task` settings and exports `WorkContext`.

Need to implement/finish a `Chat box uid` task setting if it is not already in the task schema. When a task has `Chat box uid`:

- Clicking that task should trigger it in the matching AI chat box block if the block exists on the current page.
- If the block is not mounted, decide the fallback explicitly. Product expectation is likely either no-op with a message or open global chatbox; confirm before implementing fallback.
- Task configuration overrides AI chat box defaults. Do not merge.
- The task should use the AI chat box only as the target UI/container and conversation scope, not as a source of task configuration when task config is present.

Implementation options:

- Register mounted AI chat box instances in a small registry keyed by block `uid`.
- When an AI employee action/task is clicked, look up `chatBoxUid` and dispatch to that instance's action API.
- Keep this registry out of React Provider patterns. Use FlowEngine context, a module-level registry with cleanup on unmount, or an app event bus pattern.

## Model naming

The prototype model names include `Demo` and should stay demo-only:

- `AIChatDemoBlockModel`
- `AIChatDemoMessagesAndSenderBlockModel`
- `AIChatDemoChatContentBlockModel`
- `AIChatDemoMessageListBlockModel`
- `AIChatDemoSenderBlockModel`
- `AIChatDemoConversationListBlockModel`
- `AIChatDemoNewActionModel`

For production, create separate model names:

- `AIChatBoxBlockModel`
- `AIChatBoxMessagesAndSenderBlockModel`
- `AIChatBoxConversationListBlockModel`
- `AIChatBoxActionModel` if needed

Do not rename the demo models in place unless compatibility is preserved. Existing pages that already contain the prototype must continue to render while production work is underway. If a future cleanup removes the demo, do it as a separate explicit step after production acceptance.

## Registration and i18n

Keep registration in `client-v2` only. Do not import from legacy `@nocobase/client`.

All user-facing strings must use `tExpr()` / `useT()` and be present in:

- `packages/plugins/@nocobase/plugin-ai/src/locale/en-US.json`
- `packages/plugins/@nocobase/plugin-ai/src/locale/zh-CN.json`

## Suggested implementation order

1. Preserve the demo as-is or move it into a clearly demo-only location with compatibility exports.
2. Create production `AIChatBox*` models and components without importing demo components.
3. Extract configurable embedded chat UI from existing production chatbox code (`ChatBox`, `Messages`, `Sender`, and `Conversations`) rather than from the demo.
4. Introduce instance-scoped state for embedded AI chat boxes.
5. Add conversation scope persistence and filtering on server/client.
6. Wire real new conversation, conversation list, message loading, send, cancel, edit, copy, and stream resume.
7. Wire default AI chat box settings into direct sends.
8. Wire AI employee task routing by `Chat box uid`, with task config overriding AI chat box defaults.
9. Keep `Actions` limited to `JS Action` and `AI Employee`.
10. Keep demo and production implementations simultaneously usable until production acceptance.
11. Add focused tests around scope filtering, instance isolation, send payload construction, and task override precedence.
12. Run eslint on touched files and the related chatbox/block tests.

## Acceptance checklist

- A page can add `AI chat box` from the block picker.
- The current demo remains usable during development, or is preserved under a demo-only path with compatibility exports.
- The production implementation does not import from demo models/components.
- The block default content is messages-and-sender, as one draggable/non-deletable block.
- 「Add block」 inserts normal blocks above messages-and-sender by default.
- Added blocks can be dragged relative to messages-and-sender and deleted.
- Added blocks automatically appear in the AI chat box default `Work context`.
- Direct sends include AI chat box defaults: scope, Background, Default user message, Work context, selected employee/model restrictions, web search, attachments, and context controls.
- AI employee task sends use task configuration first and directly override AI chat box defaults without merging.
- `Scope` default is block `uid`; clearing scope shows all relevant conversations.
- `AI employees` and `Models` restrict sender selector choices.
- `Enable employee select`, `Enable model select`, `Enable add context`, `Enable upload files`, `Enable web search`, and `Show disclaimer` control sender UI only.
- `Show messages = false` hides inline messages and shows a right-side messages drawer button.
- Conversation list only shows conversations, no workflow task tab.
- Header spacing and sender spacing remain visually consistent with existing chatbox.
- Existing global chatbox behavior is not regressed.

## References already used

- Prototype Feishu doc: https://nocobase.feishu.cn/docx/IHHIdS3k3oTvp0xMHwgc0Xzen16
- Local product draft: `storage/ai-chat-box-doc/ai-chat-box-plan.md`

## Prompt for next session

Use this prompt to continue in a new session:

```text
我们现在要把 `packages/plugins/@nocobase/plugin-ai/src/client-v2/block` 里的 AI chat box 从交互原型开发成真实可用版本。

请先阅读：
- 根目录 `AGENTS.md`，如果有 `AGENTS.local.md` 也要读
- `packages/plugins/@nocobase/plugin-ai/src/client-v2/block/HANDOFF.md`
- 当前 prototype：`packages/plugins/@nocobase/plugin-ai/src/client-v2/block/index.tsx`
- 现有 chatbox：`packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/components/{ChatBox,Messages,Sender,Conversations}.tsx`
- chatbox hooks/stores：`packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/hooks` 和 `stores`
- AI employee task 设置：`packages/plugins/@nocobase/plugin-ai/src/client-v2/models/ai-employees/AIEmployeeShortcutModel.tsx`
- conversation server/resource/collection：`packages/plugins/@nocobase/plugin-ai/src/server/resource/aiConversations.ts` 和 `src/server/collections/ai-conversations.ts`

目标：
- 当前 demo 不要直接改坏。需要调整结构时，可以把 demo 重命名或移动到 demo-only 目录，但必须保持现有 demo 可用。
- 新成品不能依赖当前原型里的任何代码或组件。`AIChatDemo*` 只能作为行为参考，不作为生产实现依赖。
- 施工完成前，demo 和成品要能同时在系统中添加/使用。
- 保留当前 AI chat box 的交互和样式，但接入真实 chatbox 消息、会话、发送、上传、上下文、模型/员工选择、流式响应等能力。
- 支持多个 AI chat box 实例，不要让它们共用全局 current conversation / sender draft / context / attachment 等状态导致互相影响。
- Add block 添加的区块默认进入当前 AI chat box 的 Work context，并且可以和 messages-and-sender 整体上下拖拽排序。
- Actions 只能添加 JS Action 和 AI Employee，不要恢复 JS Item。
- Show messages=false 时，右上角消息按钮从右侧划入 messages。
- 会话列表只保留 conversations，不要 workflow task tab。
- Scope 默认是当前 block uid；scope 清空表示不按 scope 过滤，显示所有相关会话。
- AI employee task 的配置优先级高于 AI chat box 默认配置，直接覆盖，不合并。尤其是 Work context 不能把任务和 AI chat box 两边合并。

请先给出实现计划和需要确认的产品决策。得到确认后再改代码。改代码后按仓库规则跑 touched files eslint 和相关测试。
```
