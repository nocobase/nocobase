# Agent chat

The agents' chat as the application's own source: the panel beside the content area with its header, one conversation (the messages, what the application adds among them, the agent at work, the composer with the page's context as chips and the files to send, the agent picker in its toolbar before a new chat's first message (every enabled agent with its availability; the conversation is created on it), the conversation's agent read-only in the header once it exists, the notice when the agent cannot answer), the history in the panel or in a dialog, one conversation as a page of its own, and the header, floating and "Ask agent" launchers.

Everything that has to stay consistent across upgrades stays in the agents plugin and is reached through `@nocobase/app-plugin-agents/client/chat`: the panel's state and keyboard shortcut (`ChatProvider`, `useChatPanel`), the page context (`useChatContextSource`, `useChatFilterSource`), the conversation hooks and their realtime refresh, the models of the timeline and the chips, and `chatLinkRoutes`. This block renders them and holds no state of its own beyond what a view needs.

| File                      | Exports                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `chat-panel.tsx`          | `ChatPanel`                                                                                      |
| `panel-header.tsx`        | `PanelHeader`, `ConversationTitle`                                                               |
| `conversation-view.tsx`   | `ConversationView`, `PAGE_COLUMN`                                                                |
| `message-item.tsx`        | `MessageItem`, `PendingItem`                                                                     |
| `message-attachments.tsx` | `MessageAttachments`: a message's files through `attachment-list`                                |
| `live-steps.tsx`          | `LiveSteps`, `TurnAnnouncer`                                                                     |
| `composer.tsx`            | `Composer`                                                                                       |
| `context-chips.tsx`       | `SentContext`                                                                                    |
| `agent-choice.tsx`        | `NewChatChoice`: the agent picker of a conversation not yet started                              |
| `agent-status.tsx`        | `AvailabilityDot`, `AgentLine`, `AgentNotice`                                                    |
| `consultation-card.tsx`   | `ConsultationCard`                                                                               |
| `history-list.tsx`        | `HistoryList`, `ChatHistoryDialog`                                                               |
| `conversation-page.tsx`   | `ChatConversationPage`                                                                           |
| `launchers.tsx`           | `ChatHeaderButton`, `ChatFloatingButton`, `AskAgentButton`                                       |
| `chat-markdown.tsx`       | `ChatMarkdown`: `markdown-view` with `mermaid` code blocks drawn by `@nocobase/markdown-mermaid` |
| `chat-ui.tsx`             | `ChatTag`, `Pulse`, `LoadError`                                                                  |
| `chat-i18n.ts`            | `useChatTranslation`, `useTranscriptLabels`, `errorStatus`                                       |
| `floating-clearance.ts`   | `useFloatingButtonBottom`, `measureFloatingClearance`                                            |
| `use-media-query.ts`      | `useMediaQuery`                                                                                  |
| `locales/en-US.ts`        | the English resource (default export) and its `AgentChatLocale` type                             |
| `locales/zh-CN.ts`        | the Chinese resource                                                                             |

It installs `markdown-view`, `agent-run-history`, `agent-composer`, `agent-picker` and `attachment-list` beside it, in `client/components/`: `Composer` wires `agent-composer` to the panel (context chips, the draft, focus, and files through the plugin's `useChatAttachments`), `MessageAttachments` shows a message's files with `attachment-list`, and `NewChatChoice` and the availability dot are `agent-picker`'s in the chat's wording.

## Files

People send files with a message: the composer's attach button, a pasted screenshot, or files dropped anywhere on the conversation. Each uploads at once through the agents plugin (`POST /api/agents/chatAttachments`, at most 20 MB, ten per message) and goes with the message; a message of files alone has no text bubble. The sender sees images as thumbnails that open larger and other files as chips that download, read from the plugin's content route, which only the conversation's owner and its agent's run may read. The plugin needs the file plugin registered on the server to store them. The agent reads the files listed with the message: the agent downloads one into its working directory on the runner with the CLI (`conversation attachment download <file-id>`). Agents do not send files back.

## Prerequisites

- The agents plugin, `@nocobase/app-plugin-agents`, registered on the server and the client.
- `ChatProvider` from the plugin's `client/chat` around the application's routes, inside the router. Every view reads the panel from it and renders nothing without it (`useChatPanel().available` is false). Give it `conversationPath` when the application has a full-page route for a conversation: the panel then offers "Open full screen" and `ChatConversationPage` moves between conversations there.
- Optionally `ChatExtensionsContext` from the same entry, with what the application adds: items placed among a conversation's messages (`useTimelineItems`, such as the projects plugin's plan cards), something under a message (`renderMessageExtra`), and the wording or card of the news it delivers (`newsText`, `renderNews`).

## Wiring

```tsx
import {
  ChatProvider,
  chatLinkRoutes,
} from '@nocobase/app-plugin-agents/client/chat';

import { ChatPanel } from '#extensions/nocobase-agent-chat/chat-panel';
import {
  ChatFloatingButton,
  ChatHeaderButton,
} from '#extensions/nocobase-agent-chat/launchers';

<ChatProvider conversationPath={(id) => `/chat/${encodeURIComponent(id)}`}>
  <header>
    {/* … */}
    <ChatHeaderButton />
  </header>
  <div className='relative flex min-h-0 flex-1'>
    <main className='relative min-w-0 flex-1 overflow-hidden'>
      <Outlet />
    </main>
    <ChatPanel />
  </div>
  <ChatFloatingButton />
</ChatProvider>;
```

- **Place `ChatPanel` as a sibling of `<main>` inside a `relative flex` row.** From 1280px it docks beside the content, which narrows to make room; between `md` and 1280px it floats over the content's right side; "Full width" covers the row. All three are positioned against that row, so without `relative` the panel covers the whole page instead. Below `md` it is a full-screen dialog.
- `ChatHeaderButton` toggles the panel and names ⌘J / Ctrl+J in its tooltip; `ChatFloatingButton` shows below `md` only, and rises above a bar the page pins to the bottom of the screen. Hide it on a page that is a chat already.
- A conversation's agent is chosen before its first message, in the composer's toolbar beside the attach button: `NewChatChoice` lists every enabled agent, saying why one cannot answer the viewer now. Once the conversation exists its agent is its identity: the panel's header and `ChatConversationPage` show it read-only (`AgentLine`), the notice above the composer reports failure or historical read-only state, and a different configuration means a new conversation or an explicit idle configuration update. New conversations can explicitly choose a callable Runner agent; the saved executor stays bound for the conversation. An application's own place to start a conversation, such as a home page, renders `NewChatChoice` in its `agent-composer`'s `toolbar` so both look and work alike.
- `ChatConversationPage` is one conversation as a page, for a route such as `/chat/:conversationId`; `newConversationPath` is where a new conversation starts. `ChatHistoryDialog` lists the conversations in a dialog for a page.
- `AskAgentButton` on a page opens the panel with the page's object pinned and, optionally, a draft in the composer, which is never sent on its own. Pages tell the panel what they show with the plugin's `useChatContextSource` and `useChatFilterSource`.
- Links that open the panel come from the plugin: add `...chatLinkRoutes('/chat-link')` (any base) to the application's routes for `<base>`, `<base>/new` and `<base>/:conversationId`.

## Translations

Spread each file of `locales/` into the matching application locale, before the application's own keys so they can reword it:

```ts
import agentChatEnUS from '#extensions/nocobase-agent-chat/locales/en-US';

const enUS = {
  ...agentChatEnUS,
  // the application's own keys
};
```

Every key is under `chat.`. A key missing from the application's resources renders the English of `locales/en-US.ts` (`useChatTranslation`), and a run's failure reason in a notice comes from the agents plugin's own namespace. `zh-CN.ts` is typed with `AgentChatLocale`, so a key missing from it fails `typecheck`; add a new language the same way.

## Customizing

The views are the application's to restyle and rearrange. Keep the `data-testid` attributes the application's end-to-end tests rely on, and keep the message list's scroller `relative`: absolutely placed content inside it, such as screen-reader text and live regions, would otherwise size the page rather than the scroller.

The plugin `ChatProvider` owns one SDK Chat per conversation, shared across surfaces. Key it by authenticated identity and clear unscoped caches before mounting another account. The SDK owns messages, parts, stream parsing and GET recovery; unknown POST results are reconciled without automatic resend. Durable history and business execution remain authoritative after SDK finish, missing streams or disconnects.

Native output updates its stable SDK message. Runner output retains one logical message with stable source records; `chatMessageSegments` renders source blocks around independent notifications using their original sequence and time. History, pagination, refresh and recovery use those same identities. Both paths share the SDK owner, history endpoint and independent Stop control. Managed Runner chats omit legacy LiveSteps. A native model catalog must gate only native sending; use the chosen Agent or bound conversation availability for Runner sending.

## Chat feedback, defaults and read state

`chatFeedback`, `chatIsRunning` and `useChatScroll` from the public client/chat entry provide presentation shared by the Registry block and its application copies. Local submissions show sending immediately; execution and current-stream state show waiting/thinking until the first visible reply. A successful Stop request remains stopping until the execution actually becomes idle. EOF or an interrupted subscription reports an unconfirmed result, never success or an automatic resend. Outcomes use localized safe keys; internal provider errors are not displayed. Legacy effect-review hints are advisory and never disable sending after execution has actually ended. Check possibly completed actions before repeating them. Layout growth follows only while the reader remains near the bottom; loading older messages preserves their position.

The built-in `online` choice is part of the service directory and may be saved as a personal or team default even before a model is configured; its availability still reports `noModel`. UI selection remains picked agent, personal default, then team default and passes that choice explicitly. Service calls that omit `agentId` retain Native compatibility, regardless of a Runner preference. Explicit scope/options precedence and existing session binding are unchanged; invalid or unavailable choices never silently select another backend.

Accepted user input marks the conversation read in its existing transaction. Only newly persisted visible assistant output marks it unread; empty cancellation/failure, tool-only records and duplicate finalization do not. Stop/abort resolves after the cancellation request has been processed; consumers must use execution status, saved history and terminal stream confirmation rather than the request Promise to decide whether another turn is safe. Follow-up context is limited to reauthorized references from the latest earlier page-bearing user message, with current page references taking priority. Full historical page context, including old selections, filters, routes and credentials, is not replayed.

The historical `runCancelled` notice means that cancellation was requested, not that execution has ended. It is rendered as “Cancellation requested.” even when older stored text says otherwise; terminal feedback still waits for the existing execution and saved-history confirmation.

## Historical page references

On a follow-up, OnlineAgent may supplement the current user input with authorized references from only the latest earlier page-bearing user message. It reuses loaded Native history; Runner admission performs one bounded latest-page read outside the existing admission transaction. Current page references (including a selection source) take priority, duplicates are removed, and historical additions use only the remaining slots of a ten-reference budget after counting current references; existing current-context limits stay unchanged. An empty, deleted, unknown or inaccessible latest page never falls back to an older one.

References are re-resolved through the existing page-kind resolver for the current user, once per kind. Only kind, identifier and the current title (at most 2,000 characters) enter the supplementary untrusted user data. Stored titles, URLs, keys, routes, filters, selections and entry credentials are not replayed. The supplement is not written back to conversation history or promoted to a system instruction. A Native entry with a restricted credential scope receives no inferred historical references because the existing resolver accepts user identity only; ordinary current context and tool authorization stay unchanged.

Resolvers remain responsible for business authorization and their own database reads. One batched resolver invocation does not imply one SQL query: Studio currently resolves each issue through its authorized detail service. There is no extra Native history query, new table, lock, persistent idempotency, automatic resend or reconnect. Runner protocol and lifecycle remain unchanged; existing Runner session memory and previously generated answers are not erased by this policy.

## Selected UI snapshots

`useChatUIContextSource` makes an application-owned source available; it does not select it or upload its values. Select it separately through `useChatSources().selectUI(source)`. For example, an unknown UI kind can supply open JSON without registering a business resource resolver:

```tsx
import {
  uiItemKey,
  useChatSources,
  useChatUIContextSource,
} from '@nocobase/app-plugin-agents/client/chat';
import { Button } from '#components/ui/button';

function CanvasContext({ selectedIds }: { selectedIds: string[] }) {
  const source = {
    kind: 'application.canvas',
    id: 'planning-canvas',
    label: 'Planning canvas',
    getSnapshot: () => ({
      kind: 'application.canvas',
      id: 'planning-canvas',
      title: 'Planning canvas',
      selection: { selectedIds },
    }),
  };
  useChatUIContextSource(source);
  const { selectUI, selectedUIKeys } = useChatSources();
  const included = selectedUIKeys.has(uiItemKey(source));
  return (
    <Button onClick={() => selectUI(source, !included)}>
      {included ? 'Remove canvas context' : 'Include canvas context'}
    </Button>
  );
}
```

The application supplies translated labels in production and explicitly excludes sensitive values. `Composer` shows only selected UI sources as removable chips, awaits their latest `getSnapshot()` values immediately before sending, validates and detaches the snapshot, and includes it in `context.ui.items`. It checks current sending readiness after asynchronous reads. A changed source, selection or page context rejects the send with a localized error and preserves the draft; duplicate clicks cannot submit twice. `AgentComposerContext.build` accepts either a synchronous context or a Promise, so non-UI consumers retain their existing synchronous behavior. Sent chips show UI identity/title, not arbitrary snapshot values.

UI snapshots are untrusted browser data, not business references or server permissions. The envelope is versioned and budgeted; custom item fields and unknown kinds survive as JSON. Tool cards must authorize local actions against their own exact originating source message, not all registered sources or the latest composer selection. Form registration and checked draft updates belong to the plugin's form helpers and the application adapter, not this display block.

## UIMessage extensions and approval

Messages are `AppUIMessage` values from the SDK: render ordered text, file, tool, `data-notice` and `data-business` parts. `ChatExtensionsContext` receives the original UIMessage; `renderMessageExtra` runs once on its final source segment. `renderDataPart` can supply a card, while null preserves the built-in renderer. A null `renderNews` falls back to localized `newsText`, then the saved title. Timeline hooks retain stable business keys and their own authorized queries/subscriptions. Composer `toolbar` and `notice` remain child props. This does not restore missing Studio producers or the old ask_agent chain.

### Application tool renderers

Register application-owned cards with `AIToolRendererProvider` from `@nocobase/app-plugin-agents/client/chat`, inside the authenticated identity boundary and around both business pages and the shared panel. Keep the existing single `ChatProvider`; this registry creates neither a chat owner nor a tool continuation. A provider accepts `renderers: AIToolRendererMap`. Keys are exact SDK tool names, resolved with `getToolName` after `isToolUIPart` for both static `tool-*` and `dynamic-tool` parts. Nested providers inherit the parent map and override matching own keys only; unmounting an override restores the parent, and no registrations are global. Keep the map and component identities stable to preserve card-local state.

```tsx
import {
  AIToolRendererProvider,
  type AIToolRendererMap,
  type AIToolRendererProps,
} from '@nocobase/app-plugin-agents/client/chat';

function ProposalCard({ part, context }: AIToolRendererProps) {
  // These are the existing safe public SDK parts, not private raw tool results.
  // An application validates its own output schema before enabling local actions.
  if (part.state === 'output-error')
    return <p role='alert'>{part.errorText}</p>;
  if (part.state === 'output-denied') return <p>Proposal denied</p>;
  if (part.state !== 'output-available') return <p>Preparing proposal…</p>;
  return (
    <ApplicationProposal
      output={part.output}
      disabled={context.readOnly || !context.sourceContext}
      source={context.sourceContext}
    />
  );
}

const renderers: AIToolRendererMap = { 'application.propose': ProposalCard };

// Inside the account-keyed boundary; children contain the existing ChatProvider.
<AIToolRendererProvider renderers={renderers}>
  {children}
</AIToolRendererProvider>;
```

`AIToolRendererProps` contains `toolName`, the readonly public SDK `part`, its readonly owning `message`, and `context`. The readonly context exposes `readOnly`, `streaming`, `sourceMessage`, `sourceContext`, and `approval` (`disabled`, `pending`, `error`, `respond(approved, reason?)`). `approval.respond` is bound to this part's genuine pending approval and the existing saved message/execution; renderers never supply arbitrary approval IDs. It does nothing when approval is unavailable, disabled or already pending. Display every relevant SDK state, including input streaming, waiting input, approval requested/responded, successful output, error and denial; do not assume a partial input or unknown output is a valid business proposal.

`ConversationView` calls `getAIToolSourceMessage(message, loadedMessages)` using the durable, server-owned `metadata.sourceUserMessageId`, and `MessageItem` verifies that exact link again before exposing the source. No nearest-user search, current composer context or tool-reported allowed IDs can supply authorization. Missing source history, mismatched conversation or ambiguous IDs yields null; actions must remain unavailable until the exact source is loaded. `sourceContext.ui.items` is the snapshot selected for that originating user message, not a live form registry or a permission grant. Applications still validate target identity, instance generation, declared editable fields and draft revision through their form helpers.

Registered cards replace only that tool part's display in its existing position. Unregistered tools retain the JSON, error, denial and approval fallback unchanged; notice/business/data extensions and message-extra rendering remain independent. Cards must never execute business actions on mount, in effects, during history reads, reconnect or restoration. A user's explicit local “apply draft” action is not SDK tool approval: validate the complete public output and user-edited proposal, then update browser draft only, without `addToolOutput`, synthetic messages or business save requests. Local action outcomes must not claim durable server completion.

Approval buttons bind the saved message, execution and genuine tool approval ID. Denial does not execute the tool. Waiting approval and actually executing tools retain business occupancy. Advisory effect-review feedback does not lock a finished conversation. Refresh rereads revisions by ID; pagination drains `nextAfter` before advancing its watermark. Independent notifications arrive by durable history polling (5 seconds running, 30 seconds idle) or business announcements after the model response has closed.
