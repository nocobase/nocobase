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

The block can be added from the page block picker and currently focuses on interaction and visual fidelity. It uses some real chatbox pieces, such as `AIEmployeeSwitcher`, `ModelSwitcher`, `useChatBoxRuntime`, `useChatBoxActions`, `useAIConfigRepository`, and the `WorkContext` selector, but the message list, conversation list, new conversation, and send behavior are still mostly mock/prototype behavior.

`useChatBoxRuntime()` is now strict. Any prototype or production surface that renders chatbox components using this hook must be under `ChatBoxRuntimeProvider` or pass an explicit `ChatBoxRuntime` through runtime-aware hooks. Do not add an implicit global fallback.

The current demo has been adapted for this strict runtime mode: `AIChatDemoBlockModel` and the standalone `AIChatDemoSenderBlockModel` each create and provide their own demo `ChatBoxRuntime`.

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

## Runtime and store state after refactor

The chatbox state management refactor is complete enough for the real AI chat box block to build on top of it. The old selector stores are no longer production APIs:

- do not import or reintroduce `useChatConversationsStore`
- do not import or reintroduce `useWorkflowTasksStore`
- do not add a `useOptionalChatBoxRuntime`
- keep all reactive APIs imported from `@nocobase/flow-engine`, not from `@formily/reactive`

The current runtime/store layer is:

- `ChatBoxRuntime` in `ai-employees/chatbox/stores/runtime.tsx`
- `createChatBoxRuntime()` creates an isolated runtime object
- `getGlobalChatBoxRuntime()` returns the stable global floating chatbox runtime only
- `ChatBoxRuntimeProvider` provides a runtime through React context
- `useChatBoxRuntime()` is strict and throws without a provider
- `useResolvedChatBoxRuntime(runtime?)` prefers an explicit runtime, then context, and throws if neither exists

The runtime owns these model instances:

- `ChatBoxModel`
- `ChatConversationModel`
- `ChatMessageModel`
- `ChatToolCallModel`
- `ChatToolModel`
- `WorkflowTaskModel`

Runtime-aware hooks/actions now resolve through runtime instead of hidden global selector stores:

- `useChatBoxActions(runtime?)`
- `useChatConversationActions(runtime?)`
- `useChatMessageActions(runtime?)`
- `useWorkflowTasks(runtime?)`
- `useChat(sessionId?, runtime?)`
- `useUploadFiles(runtime?)`
- `useToolCallActions(runtime?)`

Provider-less global chatbox entrypoints must keep passing `getGlobalChatBoxRuntime()` explicitly where needed. Embedded AI chat box blocks should not use the global runtime. Create one runtime per mounted block instance, for example with `createChatBoxRuntime()`, then either:

- wrap the embedded chat UI in `ChatBoxRuntimeProvider`, or
- pass the runtime explicitly through every runtime-aware hook/component.

Prefer the provider approach for the embedded block because several existing chatbox components still call `useChatBoxRuntime()` directly. Components such as `Sender`, `Conversations`, and `AIEmployeeSwitcher` read from the current runtime context; their internal hooks already pass the resolved runtime onward where needed.

The real AI chat box must still support multiple instances on the same page. Do not let two AI chat boxes share a runtime unless that is an explicit product decision. A shared conversation `scope` may make blocks show the same conversation list, but it should not automatically share UI state such as:

- current AI employee
- model
- sender draft
- attachments
- context items
- loading state
- readonly/editing state
- conversation list keyword

Message, tool-call, conversation, and workflow state already live under the runtime models. Message and tool-call state remain keyed by `sessionId` inside their models, while the owning runtime isolates the "current" state and draft/UI state for each chatbox instance.

The old public `useChatConversationsStore` export was removed from both v2 and legacy client entrypoints. If any build or test still references it, migrate that code to an explicit `ChatBoxRuntime` or delete obsolete selector-store tests.

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
4. Create one `ChatBoxRuntime` per production AI chat box instance and wrap the embedded chat UI with `ChatBoxRuntimeProvider`.
5. Add conversation scope persistence and filtering on server/client.
6. Wire real new conversation, conversation list, message loading, send, cancel, edit, copy, and stream resume.
7. Wire default AI chat box settings into direct sends.
8. Wire AI employee task routing by `Chat box uid`, with task config overriding AI chat box defaults.
9. Keep `Actions` limited to `JS Action` and `AI Employee`.
10. Keep demo and production implementations simultaneously usable until production acceptance.
11. Add focused tests around scope filtering, runtime instance isolation, send payload construction, and task override precedence.
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
- Multiple AI chat box instances on one page use separate `ChatBoxRuntime` instances and do not share current conversation, sender draft, selected employee/model, attachments, or context items.
- Header spacing and sender spacing remain visually consistent with existing chatbox.
- Existing global chatbox behavior is not regressed.

## References already used

- Prototype Feishu doc: https://nocobase.feishu.cn/docx/IHHIdS3k3oTvp0xMHwgc0Xzen16
- Local product draft: `storage/ai-chat-box-doc/ai-chat-box-plan.md`
- Runtime/store refactor notes: `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/RUNTIME_REFACTOR_PLAN.md`
