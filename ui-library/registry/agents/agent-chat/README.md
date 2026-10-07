# Agent chat

The agents' chat as the application's own source: the panel beside the content area with its header, one conversation (the messages, what the application adds among them, the agent at work, the composer with the page's context as chips and the files to send, the agent and model pickers in its toolbar before a new chat's first message (every agent grouped by type with its availability, and an online agent's model; the conversation is created on them), the conversation's agent read-only in the header once it exists, the model of an online conversation, the notice when the agent cannot answer), the history in the panel or in a dialog, one conversation as a page of its own, and the header, floating and "Ask agent" launchers.

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
| `model-picker.tsx`        | `ModelPicker`                                                                                    |
| `agent-choice.tsx`        | `NewChatChoice`: the agent and model pickers of a conversation not yet started                   |
| `agent-status.tsx`        | `AvailabilityDot`, `AgentLine`, `AgentNotice`                                                    |
| `consultation-card.tsx`   | `ConsultationCard`                                                                               |
| `history-list.tsx`        | `HistoryList`, `ChatHistoryDialog`                                                               |
| `conversation-page.tsx`   | `ChatConversationPage`                                                                           |
| `launchers.tsx`           | `ChatHeaderButton`, `ChatFloatingButton`, `AskAgentButton`                                       |
| `chat-markdown.tsx`       | `ChatMarkdown`: `markdown-view` with `mermaid` code blocks drawn by `@nocobase/markdown-mermaid` |
| `chat-ui.tsx`             | `ChatTag`, `Pulse`, `ModeTag`, `LoadError`                                                       |
| `chat-i18n.ts`            | `useChatTranslation`, `useTranscriptLabels`, `errorStatus`                                       |
| `floating-clearance.ts`   | `useFloatingButtonBottom`, `measureFloatingClearance`                                            |
| `use-media-query.ts`      | `useMediaQuery`                                                                                  |
| `locales/en-US.ts`        | the English resource (default export) and its `AgentChatLocale` type                             |
| `locales/zh-CN.ts`        | the Chinese resource                                                                             |

It installs `markdown-view`, `agent-run-history`, `agent-composer`, `agent-picker` and `attachment-list` beside it, in `client/components/`: `Composer` wires `agent-composer` to the panel (context chips, the draft, focus, and files through the plugin's `useChatAttachments`), `MessageAttachments` shows a message's files with `attachment-list`, and `NewChatChoice`, the availability dot and the mode tag are `agent-picker`'s in the chat's wording.

## Files

People send files with a message: the composer's attach button, a pasted screenshot, or files dropped anywhere on the conversation. Each uploads at once through the agents plugin (`POST /api/agents/chatAttachments`, at most 20 MB, ten per message) and goes with the message; a message of files alone has no text bubble. The sender sees images as thumbnails that open larger and other files as chips that download, read from the plugin's content route, which only the conversation's owner and its agent's run may read. The plugin needs the file plugin registered on the server to store them. The agent reads the files listed with the message: a runner agent downloads one into its working directory with the CLI (`conversation attachment download <file-id>`), and an online agent's model is shown the images among them. Agents do not send files back.

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

import { ChatPanel } from '@/extensions/nocobase-agent-chat/chat-panel';
import {
  ChatFloatingButton,
  ChatHeaderButton,
} from '@/extensions/nocobase-agent-chat/launchers';

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
- A conversation's agent is chosen before its first message, in the composer's toolbar beside the attach button: `NewChatChoice` lists every agent the viewer may chat with, grouped by type, with the model picker of an online agent listing several models after it. Once the conversation exists its agent is its identity: the panel's header and `ChatConversationPage` show it read-only (`AgentLine`), the notice above the composer offers the system default while it cannot answer and switching back, and another agent means a new conversation. An application's own place to start a conversation, such as a home page, renders `NewChatChoice` in its `agent-composer`'s `toolbar` so both look and work alike.
- `ChatConversationPage` is one conversation as a page, for a route such as `/chat/:conversationId`; `newConversationPath` is where a new conversation starts. `ChatHistoryDialog` lists the conversations in a dialog for a page.
- `AskAgentButton` on a page opens the panel with the page's object pinned and, optionally, a draft in the composer, which is never sent on its own. Pages tell the panel what they show with the plugin's `useChatContextSource` and `useChatFilterSource`.
- Links that open the panel come from the plugin: add `...chatLinkRoutes('/chat-link')` (any base) to the application's routes for `<base>`, `<base>/new` and `<base>/:conversationId`.

## Translations

Spread each file of `locales/` into the matching application locale, before the application's own keys so they can reword it:

```ts
import agentChatEnUS from '@/extensions/nocobase-agent-chat/locales/en-US';

const enUS = {
  ...agentChatEnUS,
  // the application's own keys
};
```

Every key is under `chat.`. A key missing from the application's resources renders the English of `locales/en-US.ts` (`useChatTranslation`), and a run's failure reason in a notice comes from the agents plugin's own namespace. `zh-CN.ts` is typed with `AgentChatLocale`, so a key missing from it fails `typecheck`; add a new language the same way.

## Customizing

The views are the application's to restyle and rearrange. Keep the `data-testid` attributes the application's end-to-end tests rely on, and keep the message list's scroller `relative`: absolutely placed content inside it, such as screen-reader text and live regions, would otherwise size the page rather than the scroller.

`@nocobase/app-plugin-ai-employee` ships a chat of its own for AI employees (the `nocobase-ai` item), over a different protocol; the two share no code.
