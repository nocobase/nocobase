# Chatbox runtime store refactor plan

## Background

The current chatbox state is held by several global stores created with `createObservableStore`:

- `chat-box`
- `chat-messages`
- `chat-tool-call`
- `chat-tools`

This works for the existing global floating chatbox, but it makes the state source implicitly global. Before building embedded AI chat box blocks, the chatbox runtime needs an explicit instance boundary so different UI containers can provide different state instances through context.

This plan only covers the underlying store/runtime/context refactor. It does not include any AI chat box block implementation, block models, scope filtering, server changes, or product behavior for embedded blocks. Those will be planned separately after this foundation is complete.

## Goals

- Replace `createObservableStore`-based chatbox stores with reactive model classes defined through `define`.
- Make chatbox runtime state injectable through `ChatBoxContext`.
- Keep the existing global floating chatbox behavior unchanged by providing a global runtime instance from `ChatBoxLayout`.
- Prepare for future per-block runtime instances without implementing block features in this phase.
- Preserve shared message rendering state for the same `sessionId` by keeping `ChatMessageModel` as a shared runtime dependency.
- Use `observer` for React render tracking instead of selector hooks.
- Keep tests focused on preserving existing global chatbox behavior during the refactor.

## Non-goals

- Do not build or register the production AI chat box block.
- Do not change conversation server APIs, scope semantics, or database schema.
- Do not implement per-block runtime creation in production UI.
- Do not change product behavior of the existing global floating chatbox.
- Do not introduce selector hooks as the primary render subscription mechanism.

## Constraints

- Import `define`, `observable`, `action`, and other reactive APIs from `@nocobase/flow-engine`, not from `@formily/reactive`. `@nocobase/flow-engine` re-exports the reactive APIs and should be the dependency boundary for this plugin code.
- Prefer `observable.shallow` for object, array, and map-like state unless a field explicitly needs deep observation.
- Use `observable.ref` for primitive scalar fields where shallow/deep semantics do not add value.
- All React components that read runtime model state during render must be wrapped with `observer`.
- Hooks and actions must read state from the current runtime at execution time instead of capturing stale values.
- Static global calls such as `useChatBoxStore.getState()` must be removed from shared runtime-aware code, except for narrowly scoped compatibility code that is explicitly global-only.
- The global chatbox must receive a global runtime from `ChatBoxLayout`.
- Future block runtimes should be able to provide their own `ChatBoxModel`, `ChatToolModel`, and UI-instance models while sharing the global `ChatMessageModel`.

## Testing Strategy

The test suite must protect the original global chatbox behavior while the internals change.

Test focus:

- Existing global chatbox store behavior still works through the global runtime.
- Global chatbox open/close, expanded/collapsed, current employee, sender draft, model selection, readonly state, and conversation state still update rendered UI.
- Message state remains keyed by `sessionId`.
- Opening the same `sessionId` reads the same message state.
- Draft/new-conversation message state still works for the existing global chatbox.
- Sending a message still creates or uses the expected conversation and keeps streaming updates in the expected session state.
- Upload, context, web search, cancel, resume stream, and edit-message behavior keep their existing business behavior.
- Tool modal/tool call state continues to work for the global chatbox.
- Websocket-driven unread count and task-status refresh behavior remains unchanged.

Required verification after source changes:

- Run touched-file eslint with `yarn eslint --fix <touched files>`.
- Run existing related store tests under `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/`.
- Run related chatbox component/hook tests if present or added.
- Add tests for the new model/runtime/context behavior where existing tests cannot cover the refactor.

## Status Legend

- `Pending`: not started.
- `In Progress`: actively being worked on.
- `Done`: implemented, tests run, document status updated, and committed.
- `Blocked`: cannot proceed without a product or technical decision.

## Task Plan

### T1. Establish Runtime Model Design

Status: `Done`

Dependencies: none

Small tasks:

- T1.1 Define the runtime ownership model:
  - `ChatBoxModel`: UI-instance state.
  - `ChatMessageModel`: shared session/message state.
  - `ChatToolCallModel`: session/message keyed tool-call state unless proven UI-instance-only.
  - `ChatToolModel`: UI-instance tool modal and active tool state.
- T1.2 Map every field from the current stores to its new model and ownership boundary.
- T1.3 Decide each field annotation: `observable.shallow`, `observable.ref`, `observable.computed`, or `action`.
- T1.4 Document any global-only compatibility surfaces that must remain temporarily.

Design mapping:

- Runtime ownership:
  - `ChatBoxModel` owns chatbox UI instance state. A future embedded chatbox block can create a separate instance for open/expanded/layout, current employee, sender draft, selected model, editing state, refs, roles, readonly flags, debug panel, and task variables.
  - `ChatMessageModel` owns shared message/session state. It is shared by the global runtime and future block runtimes so the same `sessionId` resolves to the same messages, loading flags, draft state, attachments, context items, stream state, editor refs, and flow context.
  - `ChatToolCallModel` owns shared tool-call invoke state keyed by session and message. It must be shared like `ChatMessageModel` because tool-call decisions and streaming updates are session/message scoped, not visual-container scoped.
  - `ChatToolModel` owns tool UI instance state plus message-derived tool indexes for the current UI runtime. `toolsByName` and `toolsByMessageId` are recomputed from the current runtime's rendered messages; `openToolModal`, `activeTool`, `activeMessageId`, and `adjustArgs` are UI instance state.

Field mapping:

| Current store | Current field | New model | Ownership | Annotation |
|---|---|---|---|---|
| `chat-box` | `open` | `ChatBoxModel.open` | UI instance | `observable.ref` |
| `chat-box` | `expanded` | `ChatBoxModel.expanded` | UI instance | `observable.ref` |
| `chat-box` | `collapsed` | `ChatBoxModel.collapsed` | UI instance | `observable.ref` |
| `chat-box` | `showConversations` | `ChatBoxModel.showConversations` | UI instance | `observable.ref` |
| `chat-box` | `minimize` | `ChatBoxModel.minimize` | UI instance | `observable.ref` |
| `chat-box` | `currentEmployee` | `ChatBoxModel.currentEmployee` | UI instance | `observable.ref` |
| `chat-box` | `senderValue` | `ChatBoxModel.senderValue` | UI instance | `observable.ref` |
| `chat-box` | `senderPlaceholder` | `ChatBoxModel.senderPlaceholder` | UI instance | `observable.ref` |
| `chat-box` | `roles` | `ChatBoxModel.roles` | UI instance | `observable.shallow` |
| `chat-box` | `taskVariables` | `ChatBoxModel.taskVariables` | UI instance | `observable.shallow` |
| `chat-box` | `isEditingMessage` | `ChatBoxModel.isEditingMessage` | UI instance | `observable.ref` |
| `chat-box` | `editingMessageId` | `ChatBoxModel.editingMessageId` | UI instance | `observable.ref` |
| `chat-box` | `chatBoxRef` | `ChatBoxModel.chatBoxRef` | UI instance | `observable.ref` |
| `chat-box` | `senderRef` | `ChatBoxModel.senderRef` | UI instance | `observable.ref` |
| `chat-box` | `showCodeHistory` | `ChatBoxModel.showCodeHistory` | UI instance | `observable.ref` |
| `chat-box` | `model` | `ChatBoxModel.model` | UI instance | `observable.ref` |
| `chat-box` | `showDebugPanel` | `ChatBoxModel.showDebugPanel` | UI instance | `observable.ref` |
| `chat-box` | `readonly` | `ChatBoxModel.readonly` | UI instance | `observable.ref` |
| `chat-box` | `isShowSenderHint` | `ChatBoxModel.isShowSenderHint` | UI instance | `observable.ref` |
| `chat-messages` | `sessions` | `ChatMessageModel.sessions` | shared session state | `observable.shallow` |
| `chat-messages` | `editorRef` | `ChatMessageModel.editorRef` | shared chat editor registry | `observable.shallow` |
| `chat-messages` | `currentEditorRefUid` | `ChatMessageModel.currentEditorRefUid` | shared editor selection | `observable.ref` |
| `chat-messages` | `flowContext` | `ChatMessageModel.flowContext` | shared flow context | `observable.ref` |
| `chat-messages` session | `messages` | `ChatMessageModel.sessions[sessionKey].messages` | shared session state | replace through shallow session object |
| `chat-messages` session | `messagesLoading` | `ChatMessageModel.sessions[sessionKey].messagesLoading` | shared session state | replace through shallow session object |
| `chat-messages` session | `messagesError` | `ChatMessageModel.sessions[sessionKey].messagesError` | shared session state | replace through shallow session object |
| `chat-messages` session | `messagesMeta` | `ChatMessageModel.sessions[sessionKey].messagesMeta` | shared session state | replace through shallow session object |
| `chat-messages` session | `attachments` | `ChatMessageModel.sessions[sessionKey].attachments` | shared session state | replace through shallow session object |
| `chat-messages` session | `contextItems` | `ChatMessageModel.sessions[sessionKey].contextItems` | shared session state | replace through shallow session object |
| `chat-messages` session | `systemMessage` | `ChatMessageModel.sessions[sessionKey].systemMessage` | shared session state | replace through shallow session object |
| `chat-messages` session | `responseLoading` | `ChatMessageModel.sessions[sessionKey].responseLoading` | shared session state | replace through shallow session object |
| `chat-messages` session | `abortController` | `ChatMessageModel.sessions[sessionKey].abortController` | shared session state | replace through shallow session object |
| `chat-messages` session | `skillSettings` | `ChatMessageModel.sessions[sessionKey].skillSettings` | shared session state | replace through shallow session object |
| `chat-messages` session | `webSearching` | `ChatMessageModel.sessions[sessionKey].webSearching` | shared session state | replace through shallow session object |
| `chat-messages` session | `backgroundWorking` | `ChatMessageModel.sessions[sessionKey].backgroundWorking` | shared session state | replace through shallow session object |
| `chat-messages` session | `resumeStreamFailed` | `ChatMessageModel.sessions[sessionKey].resumeStreamFailed` | shared session state | replace through shallow session object |
| `chat-tool-call` | `sessions` | `ChatToolCallModel.sessions` | shared session/message tool-call state | `observable.shallow` |
| `chat-tool-call` session | `toolCalls` | `ChatToolCallModel.sessions[sessionKey].toolCalls` | shared session/message tool-call state | replace through shallow session object |
| `chat-tools` | `toolsByName` | `ChatToolModel.toolsByName` | UI instance, derived from current runtime messages | `observable.shallow` |
| `chat-tools` | `toolsByMessageId` | `ChatToolModel.toolsByMessageId` | UI instance, derived from current runtime messages | `observable.shallow` |
| `chat-tools` | `openToolModal` | `ChatToolModel.openToolModal` | UI instance | `observable.ref` |
| `chat-tools` | `activeTool` | `ChatToolModel.activeTool` | UI instance | `observable.ref` |
| `chat-tools` | `activeMessageId` | `ChatToolModel.activeMessageId` | UI instance | `observable.ref` |
| `chat-tools` | `adjustArgs` | `ChatToolModel.adjustArgs` | UI instance | `observable.shallow` |

Action mapping:

| Current store | Current action | New model action | Annotation |
|---|---|---|---|
| `chat-box` | `setOpen`, `setExpanded`, `setCollapsed`, `setShowConversations`, `setMinimize` | same names on `ChatBoxModel` | `action` |
| `chat-box` | `setCurrentEmployee`, `setSenderValue`, `setSenderPlaceholder`, `setTaskVariables`, `setRoles`, `addRole` | same names on `ChatBoxModel` | `action` |
| `chat-box` | `setIsEditingMessage`, `setEditingMessageId` | same names on `ChatBoxModel` | `action` |
| `chat-box` | `setChatBoxRef`, `setSenderRef`, `setShowCodeHistory`, `setModel`, `setShowDebugPanel`, `setReadonly`, `setShowSenderHint` | same names on `ChatBoxModel` | `action` |
| `chat-messages` | `setEditorRef`, `setCurrentEditorRefUid`, `setFlowContext` | same names on `ChatMessageModel` | `action` |
| `chat-messages` | `getSessionState` | same name on `ChatMessageModel` | normal method; returns a cloned snapshot |
| `chat-messages` | `resetSessionState`, `migrateSessionState` | same names on `ChatMessageModel` | `action` |
| `chat-messages` | `setSessionMessages`, `setSessionMessagesLoading`, `setSessionMessagesError`, `setSessionMessagesMeta`, `setSessionAttachments`, `setSessionContextItems`, `setSessionSystemMessage`, `setSessionResponseLoading`, `setSessionBackgroundWorking`, `setSessionResumeStreamFailed`, `setSessionAbortController`, `setSessionSkillSettings`, `setSessionWebSearching` | same names on `ChatMessageModel` | `action` |
| `chat-messages` | `addSessionMessage`, `addSessionMessages`, `updateSessionLastMessage`, `removeSessionMessage` | same names on `ChatMessageModel` | `action` |
| `chat-messages` | `addSessionAttachments`, `removeSessionAttachment`, `addSessionContextItems`, `addContextItems`, `removeSessionContextItem` | same names on `ChatMessageModel` | `action` |
| `chat-messages` | `addSessionSubAgentMessage`, `addSessionSubAgentMessages`, `updateSessionLastSubAgentMessage`, `updateSessionSubAgentConversationStatus` | same names on `ChatMessageModel` | `action` |
| `chat-tool-call` | `getSessionState`, `isAllWaiting`, `isInterrupted`, `getInvokeStatus` | same names on `ChatToolCallModel` | normal read methods; `getSessionState` returns a cloned snapshot |
| `chat-tool-call` | `resetSessionState`, `migrateSessionState`, `updateToolCallInvokeStatus` | same names on `ChatToolCallModel` | `action` |
| `chat-tools` | `updateTools`, `setOpenToolModal`, `setActiveTool`, `setActiveMessageId`, `setAdjustArgs` | same names on `ChatToolModel` | `action` |

Computed/read helpers:

- `ChatMessageModel` should expose a read helper equivalent to `resolveSessionState` so `useChat(sessionId)` can read the current session at render/execution time. If a computed field is useful, limit it to parameterless values; session-specific reads should stay methods because they require `sessionId`.
- `ChatToolCallModel` should keep `isAllWaiting`, `isInterrupted`, and `getInvokeStatus` as read methods rather than computed properties because they are keyed by `sessionId`, `messageId`, and `toolCallId`.
- `ChatToolModel` can keep `toolsByName` and `toolsByMessageId` as stored shallow indexes updated by `updateTools(messages)` for behavioral equivalence. A later cleanup can evaluate computed indexes, but T2 should preserve the existing explicit update behavior.

Temporary compatibility surfaces:

- Keep the `useChat()` facade shape during migration, including `for(sessionId)`, action method names, `getState()`, and the nested `use.*` accessors if needed for incremental component migration. Its data source must move from `useChatMessagesStore` to the current runtime `chatMessageModel`.
- Keep global runtime factory/getter as the only intentionally global boundary for the existing floating chatbox. It may use `getOrCreateGlobalStore` or an equivalent global singleton helper.
- Store-like exports (`useChatBoxStore`, `useChatMessagesStore`, `useChatToolCallStore`, `useChatToolsStore`) may remain until T6 only as explicit compatibility adapters if T2-T4 need staged migration. Shared runtime-aware code must not keep implicit `getState()` or `.use.*` reads from those adapters after T4.
- `createObservableStore` and `create-selectors.ts` remain only until all chatbox store consumers have moved to model/context/observer tracking.

Tests:

- No runtime tests required for design-only work.
- Verification on 2026-07-15:
  - Runtime tests: not run; T1 is design-only.
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/RUNTIME_REFACTOR_PLAN.md`: attempted, but the current ESLint configuration parses `.md` as JavaScript and fails at line 1 with `Parsing error: Invalid character`.
- Update this document status and commit the design mapping once completed.

### T2. Implement Model Classes

Status: `Done`

Dependencies: T1

Small tasks:

- T2.1 Implement `ChatBoxModel` with fields and actions equivalent to the current `chat-box` store.
- T2.2 Implement `ChatMessageModel` with fields and actions equivalent to the current `chat-messages` store.
- T2.3 Implement `ChatToolCallModel` with fields and actions equivalent to the current `chat-tool-call` store.
- T2.4 Implement `ChatToolModel` with fields and actions equivalent to the current `chat-tools` store.
- T2.5 Preserve existing method names where practical to keep hook migration mechanical.
- T2.6 Keep behavior equivalent for resets, migration between draft and real session, message append/update/remove, attachment/context mutation, and tool-call migration.

Tests:

- Add or update unit tests covering each model's current store behavior.
- Cover shallow replacement behavior for object/map fields that should not deep-track nested mutations.
- Cover `ChatMessageModel` session isolation and session migration.
- Run touched-file eslint and related model tests.
- Verification on 2026-07-15:
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-box.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-messages.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-tool-call.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-tools.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts`: passed.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/global-store.test.ts --run --reporter=verbose`: passed, 3 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/observable-store.test.tsx --run --reporter=verbose`: passed, 3 tests.
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/RUNTIME_REFACTOR_PLAN.md`: attempted, but the current ESLint configuration parses `.md` as JavaScript and fails at line 1 with `Parsing error: Invalid character`.
- Update this document status and commit after tests pass.

### T3. Add Runtime Context

Status: `Done`

Dependencies: T2

Small tasks:

- T3.1 Define `ChatBoxRuntime` type containing:
  - `chatBoxModel`
  - `chatMessageModel`
  - `chatToolCallModel`
  - `chatToolModel`
- T3.2 Create global runtime factory/getter using the existing global singleton helper or an equivalent singleton boundary.
- T3.3 Create `ChatBoxContext`.
- T3.4 Create `ChatBoxRuntimeProvider`.
- T3.5 Create `useChatBoxRuntime()` with a clear fallback/error policy.
- T3.6 Wrap the existing `ChatBoxLayout` global chatbox tree with the global runtime provider.

Tests:

- Add context tests verifying provider returns the provided runtime.
- Add a test verifying the global runtime is stable across repeated access.
- Add a test verifying `ChatBoxLayout` renders with the provider in place.
- Run touched-file eslint and related tests.
- Verification on 2026-07-15:
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/runtime.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/components/ChatBoxLayout.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx`: passed.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx --run --reporter=verbose`: passed, 4 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/global-store.test.ts --run --reporter=verbose`: passed, 3 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/observable-store.test.tsx --run --reporter=verbose`: passed, 3 tests.
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/RUNTIME_REFACTOR_PLAN.md`: attempted, but the current ESLint configuration parses `.md` as JavaScript and fails at line 1 with `Parsing error: Invalid character`.
- Update this document status and commit after tests pass.

### T4. Migrate Store Consumers To Runtime Models

Status: `Done`

Dependencies: T3

Small tasks:

- T4.1 Replace `useChatBoxStore` usage in components/hooks with `useChatBoxRuntime().chatBoxModel`.
- T4.2 Replace `useChatMessagesStore` usage with `useChatBoxRuntime().chatMessageModel`.
- T4.3 Replace `useChatToolCallStore` usage with `useChatBoxRuntime().chatToolCallModel`.
- T4.4 Replace `useChatToolsStore` usage with `useChatBoxRuntime().chatToolModel`.
- T4.5 Wrap all components that read runtime model fields during render with `observer`.
- T4.6 Rewrite actions/hooks so they read model state at execution time and do not rely on stale closures.
- T4.7 Remove or isolate old `.use.*`, `getState()`, `setState()`, and selector-style store calls from migrated code.

Tests:

- Add or update component tests proving render updates when model fields change.
- Cover at least sender draft, current employee, current conversation, model selection, web search, messages, and tool modal state.
- Run touched-file eslint and related component/hook tests.
- Verification on 2026-07-15:
  - `yarn eslint --fix <touched TS/TSX files>`: passed.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx --run --reporter=verbose`: passed, 5 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/global-store.test.ts --run --reporter=verbose`: passed, 3 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/observable-store.test.tsx --run --reporter=verbose`: passed, 3 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/suggestions-options-card.test.tsx --run --reporter=verbose`: passed, 2 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/business-report-card.test.tsx --run --reporter=verbose`: passed, 2 tests.
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/RUNTIME_REFACTOR_PLAN.md`: attempted, but the current ESLint configuration parses `.md` as JavaScript and fails at line 1 with `Parsing error: Invalid character`.
- Update this document status and commit after tests pass.

### T5. Preserve Global Chatbox Behavior

Status: `Done`

Dependencies: T4

Small tasks:

- T5.1 Verify `ChatButton` opens the global chatbox.
- T5.2 Verify `ChatBoxLayout` still handles expanded/mobile/non-expanded rendering.
- T5.3 Verify `ChatBox` header actions still work.
- T5.4 Verify `Conversations` list/search/open/delete/rename behavior remains unchanged.
- T5.5 Verify `Messages` loading, rendering, scroll-to-bottom, background working hint, and websocket status update behavior remains unchanged.
- T5.6 Verify `Sender` submit, cancel, upload, paste-upload, context, web search, employee switch, model switch, and edit-message behavior remains unchanged.
- T5.7 Verify `ToolModal`, `ToolCard`, and tool-call state still behave as before.

Tests:

- Run all related existing tests for chatbox stores, hooks, and components.
- Add regression tests for any behavior not covered by existing tests.
- Run touched-file eslint and related tests.
- Verification on 2026-07-15:
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-global-behavior.test.tsx`: passed.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-global-behavior.test.tsx --run --reporter=verbose`: passed, 1 test.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/global-store.test.ts --run --reporter=verbose`: passed, 3 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/observable-store.test.tsx --run --reporter=verbose`: passed, 3 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/suggestions-options-card.test.tsx --run --reporter=verbose`: passed, 2 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/business-report-card.test.tsx --run --reporter=verbose`: passed, 2 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/__tests__/utils.test.ts --run --reporter=verbose`: passed, 3 tests.
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/RUNTIME_REFACTOR_PLAN.md`: attempted, but the current ESLint configuration parses `.md` as JavaScript and fails at line 1 with `Parsing error: Invalid character`.
- Update this document status and commit after tests pass.

### T6. Remove Obsolete Store Infrastructure

Status: `Done`

Dependencies: T5

Small tasks:

- T6.1 Remove `createObservableStore` usage from chatbox stores.
- T6.2 Remove obsolete selector-style exports that are no longer used.
- T6.3 Keep only explicitly required compatibility exports for external plugin consumers, if any are discovered.
- T6.4 Update client-v2 public exports if necessary.
- T6.5 Search for stale imports and static calls across `plugin-ai`.

Tests:

- Run repository search to ensure old chatbox store APIs are gone or intentionally isolated.
- Run touched-file eslint.
- Run related tests.
- Verification on 2026-07-15:
  - Removed `useChatBoxStore`, `useChatMessagesStore`, `useChatToolCallStore`, and `useChatToolsStore` facade exports and their old compatibility tests.
  - Removed the public `useChatBoxStore` and `useChatMessagesStore` exports from `src/client-v2/index.tsx` and updated the public API contract test accordingly.
  - `createObservableStore` and `create-selectors.ts` remain because `chat-conversations` and `workflow-tasks` still use them; these stores are outside the four runtime model stores migrated in this phase.
  - `rg "useChatBoxStore|useChatMessagesStore|useChatToolCallStore|useChatToolsStore" packages/plugins/@nocobase/plugin-ai/src/client-v2 -g '*.ts' -g '*.tsx'`: no matches.
  - `rg "createObservableStore|create-selectors" packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores -g '*.ts' -g '*.tsx'`: only `chat-conversations`, `workflow-tasks`, and `create-selectors.ts` remain.
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-box.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-messages.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-tool-call.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-tools.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/index.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts`: passed.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-global-behavior.test.tsx --run --reporter=verbose`: passed, 1 test.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts --run --reporter=verbose`: passed, 4 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/global-store.test.ts --run --reporter=verbose`: passed, 3 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose`: passed, 2 tests.
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/RUNTIME_REFACTOR_PLAN.md`: attempted, but the current ESLint configuration parses `.md` as JavaScript and fails at line 1 with `Parsing error: Invalid character`.
- Update this document status and commit after tests pass.

### T7. Final Regression Pass

Status: `Done`

Dependencies: T6

Small tasks:

- T7.1 Run the full related chatbox test set.
- T7.2 Run any broader plugin-ai tests that cover AI employee shortcuts, coding/data-modeling triggers, and chatbox integration.
- T7.3 Manually smoke-test the global floating chatbox in the v2 UI if a local server is available.
- T7.4 Confirm no AI chat box block work was included.
- T7.5 Update this document with final status and residual risks.

Tests:

- `yarn eslint --fix <all touched source/test files>`
- Related `yarn test <test-file>` commands for modified tests.
- Manual smoke notes if performed.
- Verification on 2026-07-15:
  - `rg "useChatBoxStore|useChatMessagesStore|useChatToolCallStore|useChatToolsStore" packages/plugins/@nocobase/plugin-ai/src/client-v2 -g '*.ts' -g '*.tsx'`: no matches.
  - `rg "@formily/reactive" packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/tools packages/plugins/@nocobase/plugin-ai/src/client-v2/block -g '*.ts' -g '*.tsx'`: no matches.
  - `yarn eslint --fix <all touched source/test files>`: passed.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx --run --reporter=verbose`: passed, 6 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-global-behavior.test.tsx --run --reporter=verbose`: passed, 1 test.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts --run --reporter=verbose`: passed, 4 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/global-store.test.ts --run --reporter=verbose`: passed, 3 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/__tests__/utils.test.ts --run --reporter=verbose`: passed, 3 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/business-report-card.test.tsx --run --reporter=verbose`: passed, 2 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/suggestions-options-card.test.tsx --run --reporter=verbose`: passed, 2 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/public-api-contract.test.ts --run --reporter=verbose`: passed, 2 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/AIEmployeeShortcut.test.tsx --run --reporter=verbose`: passed, 2 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/tools-registration.test.ts --run --reporter=verbose`: passed, 4 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/sub-agent-dispatch-card.test.tsx --run --reporter=verbose`: passed, 2 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/form-filler/tools.test.ts --run --reporter=verbose`: passed, 3 tests.
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/RUNTIME_REFACTOR_PLAN.md`: attempted, but the current ESLint configuration parses `.md` as JavaScript and fails at line 1 with `Parsing error: Invalid character`.
  - Manual v2 UI smoke test was not performed because no local NocoBase dev server was started for this final pass.
  - No AI chat box block production implementation, conversation server API, scope semantics, or database schema changes were included in this phase.
- Update this document status and commit after tests pass.

### T8. Support Explicit Runtime Injection For Provider-less Entrypoints

Status: `Done`

Dependencies: T7

Problem:

- Some AI employee entrypoints are rendered by Flow models or external plugins in arbitrary UI locations, such as `AIEmployeeShortcutModel`, `AIEmployeeButtonModel`, and data-visualization's `DaraButton`.
- These entrypoints can call chatbox hooks before or outside any `ChatBoxRuntimeProvider`.
- The fix must not make `useChatBoxRuntime()` silently fall back to the global runtime, because future block chatboxes need missing providers to fail loudly instead of writing into the wrong runtime.

Design decision:

- Keep `useChatBoxRuntime()` strict for chatbox-internal components.
- Add `useResolvedChatBoxRuntime(runtime?)` for hooks/actions. It directly reads `ChatBoxContext`, prefers an explicitly passed runtime, then the context runtime, and throws if neither exists.
- Do not add a separate `useOptionalChatBoxRuntime` wrapper unless multiple call sites need optional context reads.
- Update chatbox hooks/actions to accept an optional `ChatBoxRuntime` parameter and resolve through `useResolvedChatBoxRuntime(runtime)`.
- Update provider-less entrypoints to pass `getGlobalChatBoxRuntime()` explicitly. Future embedded chatbox blocks can pass their block runtime explicitly or provide it through `ChatBoxRuntimeProvider`.

Tests:

- Run touched-file eslint.
- Run related chatbox runtime and AI employee shortcut tests.
- Run data-visualization dirty refresh tests for the `DaraButton` integration.
- Verification on 2026-07-16:
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/AIEmployeeShortcut.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/AddContextButton.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/ai-coding/AICodingButton.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/hooks/useChat.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/hooks/useChatBoxActions.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/hooks/useChatMessageActions.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/hooks/useToolCallActions.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/runtime.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/data-modeling/setup.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/models/ai-employees/AIEmployeeShortcutModel.tsx packages/plugins/@nocobase/plugin-data-visualization/src/client-v2/flow/components/DaraButton.tsx`: passed.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx --run --reporter=verbose`: passed, 8 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/__tests__/AIEmployeeShortcut.test.tsx --run --reporter=verbose`: passed, 2 tests.
  - `yarn test packages/plugins/@nocobase/plugin-data-visualization/src/client-v2/flow/models/__tests__/ChartBlockModel.dirtyRefresh.test.ts --run --reporter=verbose`: passed, 16 tests.
  - `rg "useChatBoxStore|useChatMessagesStore|useChatToolCallStore|useChatToolsStore|useOptionalChatBoxRuntime" packages/plugins/@nocobase/plugin-ai/src/client-v2 packages/plugins/@nocobase/plugin-data-visualization/src/client-v2 -g '*.ts' -g '*.tsx'`: no matches.
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/RUNTIME_REFACTOR_PLAN.md`: attempted, but the current ESLint configuration parses `.md` as JavaScript and fails at line 1 with `Parsing error: Invalid character`.
- Update this document status and commit after tests pass.

### T9. Design Conversation And Workflow Runtime Ownership

Status: `Done`

Dependencies: T8

Problem:

- `useChatConversationsStore` and `useWorkflowTasksStore` still use `createObservableStore` and selector-style `.use.*` APIs.
- `useChatConversationActions` and `useWorkflowTasks` implicitly read those global stores.
- Runtime-aware hooks should accept the same explicit `ChatBoxRuntime` injection pattern added in T8.
- Future embedded chatbox blocks must be able to own their active conversation/workflow UI state without silently reading or writing a global singleton.

Small tasks:

- T9.1 Decide runtime ownership for conversation fields:
  - `currentConversation`
  - `conversations`
  - `keyword`
  - `webSearch`
  - `conversationSegmented`
  - `unreadCount`
- T9.2 Decide runtime ownership for workflow task fields:
  - `workflowTasks`
  - `currentWorkflowTask`
  - `unreadCount`
  - `loading`
  - `keyword`
  - `selectedJobStatus`
- T9.3 Document field annotations for new model classes, using `observable.shallow` for arrays/objects and `observable.ref` for primitives.
- T9.4 Decide whether unread counts remain runtime-local UI state or need a future shared/global service. Do not change server APIs in this phase.
- T9.5 Update `ChatBoxRuntime` design to include conversation and workflow task runtime dependencies.

Design direction:

- Add `ChatConversationModel` to own conversation list UI state and the currently active conversation for the current runtime.
- Add `WorkflowTaskModel` to own workflow task list UI state and the currently active workflow task for the current runtime.
- Keep `ChatMessageModel` and `ChatToolCallModel` shared by `sessionId` as already designed.
- Keep `useChatBoxRuntime()` strict. Runtime-aware hooks should accept `runtime?: ChatBoxRuntime` and resolve through `useResolvedChatBoxRuntime(runtime)`.
- Do not reintroduce selector APIs as the primary render subscription mechanism.

Design mapping:

- Runtime ownership:
  - `ChatConversationModel` owns conversation list UI state for one chatbox runtime. `currentConversation`, `conversations`, `keyword`, `webSearch`, and `conversationSegmented` must be runtime-local so a future embedded chatbox can select a session, filter its list, and toggle web search without mutating the global floating chatbox UI.
  - `WorkflowTaskModel` owns workflow task list UI state for one chatbox runtime. `workflowTasks`, `currentWorkflowTask`, `loading`, `keyword`, and `selectedJobStatus` must be runtime-local for the same reason.
  - `unreadCount` fields are stored on the corresponding runtime models in this phase to preserve existing UI behavior and avoid adding a new service layer. The counts are account-level values returned by the existing `aiConversations.unreadCounts()` API, so a later multi-runtime feature may introduce a shared unread-count service or event bridge if multiple visible runtimes need live synchronization. Do not change server APIs or websocket payload semantics in this refactor.
  - `ChatBoxRuntime` should contain `chatConversationModel` and `workflowTaskModel` in addition to the existing `chatBoxModel`, `chatMessageModel`, `chatToolCallModel`, and `chatToolModel`.

Field mapping:

| Current store | Current field | New model | Ownership | Annotation |
|---|---|---|---|---|
| `chat-conversations` | `currentConversation` | `ChatConversationModel.currentConversation` | UI runtime | `observable.ref` |
| `chat-conversations` | `conversations` | `ChatConversationModel.conversations` | UI runtime | `observable.shallow` |
| `chat-conversations` | `keyword` | `ChatConversationModel.keyword` | UI runtime | `observable.ref` |
| `chat-conversations` | `webSearch` | `ChatConversationModel.webSearch` | UI runtime | `observable.ref` |
| `chat-conversations` | `conversationSegmented` | `ChatConversationModel.conversationSegmented` | UI runtime | `observable.ref` |
| `chat-conversations` | `unreadCount` | `ChatConversationModel.unreadCount` | runtime-local snapshot of account-level count | `observable.ref` |
| `workflow-tasks` | `workflowTasks` | `WorkflowTaskModel.workflowTasks` | UI runtime | `observable.shallow` |
| `workflow-tasks` | `currentWorkflowTask` | `WorkflowTaskModel.currentWorkflowTask` | UI runtime | `observable.ref` |
| `workflow-tasks` | `unreadCount` | `WorkflowTaskModel.unreadCount` | runtime-local snapshot of account-level count | `observable.ref` |
| `workflow-tasks` | `loading` | `WorkflowTaskModel.loading` | UI runtime | `observable.ref` |
| `workflow-tasks` | `keyword` | `WorkflowTaskModel.keyword` | UI runtime | `observable.ref` |
| `workflow-tasks` | `selectedJobStatus` | `WorkflowTaskModel.selectedJobStatus` | UI runtime | `observable.ref` |

Action mapping:

| Current store | Current action | New model action | Annotation |
|---|---|---|---|
| `chat-conversations` | `setCurrentConversation`, `setKeyword`, `setWebSearch`, `setConversationSegmented` | same names on `ChatConversationModel` | `action` |
| `chat-conversations` | `setConversations`, `markConversationRead`, `setUnreadCount` | same names on `ChatConversationModel` | `action` |
| `workflow-tasks` | `setWorkflowTasks`, `setCurrentWorkflowTask`, `setUnreadCount` | same names on `WorkflowTaskModel` | `action` |
| `workflow-tasks` | `markWorkflowTaskRead`, `setLoading`, `setKeyword`, `setSelectedJobStatus` | same names on `WorkflowTaskModel` | `action` |

Temporary compatibility surfaces:

- `chat-conversations.ts` and `workflow-tasks.ts` can be converted to export model classes in T10 while keeping their domain types in place for existing imports.
- Selector-style `useChatConversationsStore` and `useWorkflowTasksStore` should not remain as production data sources after T11. If a compatibility adapter is needed during migration, it must be explicitly global-runtime-only and removed or isolated in T12.
- Provider-less entrypoints must keep passing `getGlobalChatBoxRuntime()` explicitly to hooks that need conversation or workflow state.

Tests:

- Design-only task; no runtime tests required unless code is changed.
- If only this document is touched, attempt markdown eslint and record the known `.md` parser failure.
- Verification on 2026-07-16:
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/RUNTIME_REFACTOR_PLAN.md`: attempted, but the current ESLint configuration parses `.md` as JavaScript and fails at line 1 with `Parsing error: Invalid character`.
- Commit the design update before implementation tasks.

### T10. Implement Conversation And Workflow Runtime Models

Status: `Done`

Dependencies: T9

Small tasks:

- T10.1 Implement `ChatConversationModel` with fields/actions equivalent to `useChatConversationsStore`.
- T10.2 Implement `WorkflowTaskModel` with fields/actions equivalent to `useWorkflowTasksStore`.
- T10.3 Preserve action names where practical:
  - conversations: `setCurrentConversation`, `setKeyword`, `setConversations`, `markConversationRead`, `setWebSearch`, `setConversationSegmented`, `setUnreadCount`
  - workflow tasks: `setWorkflowTasks`, `setCurrentWorkflowTask`, `setUnreadCount`, `markWorkflowTaskRead`, `setLoading`, `setKeyword`, `setSelectedJobStatus`
- T10.4 Preserve workflow task normalization behavior currently in `workflow-tasks.ts`.
- T10.5 Add both models to `ChatBoxRuntime` and `createChatBoxRuntime()`.
- T10.6 Update `getGlobalChatBoxRuntime()` so existing global floating chatbox behavior keeps a stable global conversation/workflow runtime.

Tests:

- Add or update model tests covering conversation setters, unread count updates, workflow task normalization, workflow task read marking, and runtime isolation.
- Run touched-file eslint and related store/runtime tests.
- Verification on 2026-07-16:
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/chat-conversations.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/workflow-tasks.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/runtime.tsx packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx`: passed.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-models.test.ts --run --reporter=verbose`: passed, 9 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-runtime.test.tsx --run --reporter=verbose`: passed, 9 tests.
  - `yarn test packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/__tests__/chatbox-stores.test.ts --run --reporter=verbose`: passed, 4 tests.
  - `yarn eslint --fix packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/chatbox/stores/RUNTIME_REFACTOR_PLAN.md`: attempted, but the current ESLint configuration parses `.md` as JavaScript and fails at line 1 with `Parsing error: Invalid character`.
- Commit after tests pass.

### T11. Migrate Conversation And Workflow Consumers To Runtime Models

Status: `Pending`

Dependencies: T10

Small tasks:

- T11.1 Update `useChatConversationActions(runtime?)` to use `useResolvedChatBoxRuntime(runtime).chatConversationModel` and `workflowTaskModel`.
- T11.2 Update `useWorkflowTasks(runtime?)` to use `useResolvedChatBoxRuntime(runtime).workflowTaskModel` and `chatBoxModel`.
- T11.3 Update hooks/actions that currently call `useChatConversationsStore` or `useWorkflowTasksStore` to read/write through the current runtime models.
- T11.4 Update React components that read conversation/workflow model state during render to use `useChatBoxRuntime()` or injected runtime and wrap with `observer` where needed.
- T11.5 Keep provider-less entrypoints explicit: if a component can render outside `ChatBoxRuntimeProvider`, pass `getGlobalChatBoxRuntime()` into conversation/workflow hooks instead of relying on fallback.
- T11.6 Ensure `useChat`, `useChatBoxActions`, `useChatMessageActions`, and `useToolCallActions` continue passing the already resolved runtime to nested hooks.

Likely consumers to audit:

- `useChatBoxActions`
- `useChatMessageActions`
- `useChatConversationActions`
- `useWorkflowTasks`
- chatbox components under `components/` that read current conversation, conversation list, web search, workflow tasks, or current workflow task
- AI employee entrypoints and tool cards that read conversation/workflow state
- external integrations already migrated to explicit global runtime, such as data-visualization's `DaraButton`

Tests:

- Run touched-file eslint.
- Run chatbox runtime/model tests.
- Run tests covering conversations, messages, sender, workflow tasks, AI employee shortcuts, and data-visualization integration.
- Add focused regression tests if the existing suite does not cover conversation/workflow state changes through runtime models.
- Commit after tests pass.

### T12. Remove Obsolete Conversation And Workflow Selector Stores

Status: `Pending`

Dependencies: T11

Small tasks:

- T12.1 Remove or replace production usage of `useChatConversationsStore.use.*`, `useChatConversationsStore.getState()`, `useWorkflowTasksStore.use.*`, and `useWorkflowTasksStore.getState()`.
- T12.2 Remove `createObservableStore` usage from `chat-conversations.ts` and `workflow-tasks.ts`, or replace those files with model exports.
- T12.3 Update public exports if `useChatConversationsStore` is no longer part of the supported client-v2 API. If compatibility is required, keep only an explicit global-runtime adapter and document it as global-only.
- T12.4 Search production code for stale selector store imports and static calls.
- T12.5 Keep `create-selectors.ts` only if other non-chatbox code still needs it; otherwise remove it.

Tests:

- Run `rg "useChatConversationsStore|useWorkflowTasksStore|createObservableStore|create-selectors" packages/plugins/@nocobase/plugin-ai/src/client-v2 -g '*.ts' -g '*.tsx'` and document any intentional remaining matches.
- Run touched-file eslint and related tests.
- Run public API contract tests if public exports change.
- Commit after tests pass.

## Completion Rule

Each task must be completed independently:

1. Change the task status in this document to `In Progress` before implementation.
2. Implement the task.
3. Run required tests and touched-file eslint.
4. Change the task status to `Done` and add any relevant test notes.
5. Commit only the intended files for that task.

Do not start AI chat box block development until all tasks in this plan are `Done` or explicitly deferred in a follow-up decision.
