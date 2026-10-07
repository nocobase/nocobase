/**
 * The agents' chat without its UI, for the application that renders one: the UI Library's `agent-chat` block
 * (`shadcn add @nocobase/agent-chat`) is the panel, conversation page, history and launchers built on what is here
 * (the assembling application installs it in `client/extensions/nocobase-agent-chat/`).
 *
 * - `ChatProvider` around the routes: the panel's state, ⌘J / Ctrl+J, `?chat=<id|new|history>` links, page context,
 *   the conversations topic subscription, and optionally `conversationPath`, the application's full-page route of a
 *   conversation; `useChatPanel()` reads it (`available` is false without it);
 * - `chatLinkRoutes(base)`: links under a path the application chooses that open the panel (`<base>`,
 *   `<base>/new`, `<base>/:id`);
 * - for pages: `useChatPanel().openChat(…)`, and `useChatContextSource` / `useChatFilterSource` to tell the panel what
 *   the page shows (the chips above the composer);
 * - `ChatExtensionsContext`: what the application adds among a conversation's messages, and how it words its news;
 * - the data hooks (`useChatAgents`, `useConversation`, `useConversationMessages`, `useConversationList`,
 *   `useSendMessage`, `useConversationActions`, keyed by `chatKeys`, and `useLiveRunEvents`, `useConversationSources`),
 *   the pure models of the timeline and the context chips, the panel's state helpers, and `ChatPanelScope` /
 *   `useChatPageTracking` for a full-page view.
 *
 * The data hooks read this plugin's cache (`agentsQueryClient()`) whichever `QueryClientProvider` is above them, and
 * `ChatProvider` keeps them current from the realtime topic, so a chat UI needs no `withAgents` wrapper.
 */
import type {
  AppClientRouteComponentLoader,
  AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';

export {
  CHAT_PANEL_ATTRIBUTE,
  CHAT_PANEL_ID,
  ChatPanelScope,
  ChatProvider,
  useChatContextSource,
  useChatFilterSource,
  useChatPageTracking,
  useChatPanel,
  useChatSources,
  type ChatDraft,
  type ChatPageTracking,
  type ChatPanelValue,
  type ChatSourcesValue,
  type OpenChatOptions,
} from './chat/provider.js';
export {
  CHAT_POLL_MS,
  CHAT_STREAM_POLL_MS,
  useChatAgents,
  useChatApi,
  useChatRealtime,
  useConversation,
  useConversationActions,
  useConversationList,
  useConversationMessages,
  useChatAttachments,
  useSendMessage,
  type ChatAttachments,
  type ConversationActions,
  type ConversationListPages,
  type ConversationMessages,
  type SendInput,
} from './chat/use-chat.js';
export type { ChatApi } from './chat/api.js';
export {
  useConversationSources,
  useLiveRunEvents,
  type ConversationSourceOption,
} from './chat/ui-hooks.js';
/** The kit's agent avatar, names and formatters, for a chat UI that imports this entry alone. */
export {
  AgentAvatar,
  type AgentAvatarSize,
} from './components/agent-avatar.js';
export { useAgentText, type AgentText } from './hooks/use-vocabulary.js';
export { useFormatters, type Formatters } from './lib/format.js';
export { chatKeys } from './chat/keys.js';
export {
  ChatExtensionsContext,
  type ChatExtensions,
  type ChatTimelineItem,
} from './chat/extensions.js';
export {
  buildPageContext,
  contextChips,
  filterText,
  itemKey,
  selectionPreview,
  SOURCE_ATTRIBUTE,
  type ChatContextChip,
  type ChatContextFilter,
  type ChatContextInput,
  type ChatContextItem,
  type ChatSelection,
} from './chat/context-model.js';
export {
  liveStepsView,
  newConversationAgent,
  noticeText,
  stepLineText,
  timelineOrder,
  type LiveStepsView,
  type MessagesAction,
  type MessagesState,
  type NewsNotice,
  type PendingMessage,
  type StepLine,
  type Translate,
} from './chat/message-model.js';
export {
  CHAT_DOCK_QUERY,
  CHAT_MOBILE_QUERY,
  CHAT_PANEL_STORAGE_KEY,
  CHAT_PARAM,
  chatLinkSearch,
  isChatShortcut,
  modifierKeyLabel,
  readPanelState,
  type ChatPanelMode,
  type ChatPanelState,
  type ChatPanelView,
} from './chat/panel-state.js';

const redirect: AppClientRouteComponentLoader = async () => {
  const [{ default: Redirect }, { withAgents: bind }] = await Promise.all([
    import('./chat/redirect.js'),
    import('./query.js'),
  ]);
  return { default: bind(Redirect) };
};

/**
 * `<base>` (the history), `<base>/new` and `<base>/:conversationId`: links that open the chat panel, under a path the
 * application chooses (`name` prefixes the routes' names).
 */
export function chatLinkRoutes(
  base: string,
  name = 'chat-link',
): readonly AppClientRoutePageDefinition[] {
  return [
    {
      name,
      path: base,
      auth: 'required',
      // Only a redirect: the panel checks what it opens.
      authz: 'skip',
      componentLoader: redirect,
    },
    {
      name: `${name}-conversation`,
      path: `${base}/:conversationId`,
      auth: 'required',
      authz: 'skip',
      componentLoader: redirect,
    },
  ];
}
