/**
 * The agents' panel and conversation page — the lazy entry. Nothing the plugin's eager entry loads imports this
 * module or anything under `client/panel/`: the application downloads it the first time the panel opens or a
 * conversation page renders. The header button and "Ask Agent" live in `client/launchers/` and reach the panel only
 * through `useChatPanel()`.
 */
export { ChatPanel, type ChatPanelProps } from './chat-panel.js';
export { CHAT_PANEL_WIDTH } from './panel-frame.js';
export {
  ChatConversationPage,
  type ChatConversationPageProps,
} from './conversation-page.js';
export {
  ChatHistoryDialog,
  HistoryList,
  ConversationListItem,
  DefaultConversationListItem,
  type ChatHistoryDialogProps,
  type ConversationListItemProps,
  type HistoryListProps,
} from './history-list.js';
export {
  HISTORY_GROUPS,
  historyGroup,
  type HistoryGroup,
} from './history-groups.js';
export {
  NewChatChoice,
  ConversationModelChoice,
  type NewChatChoiceProps,
} from './agent-choice.js';
export {
  ConversationView,
  type ConversationVariant,
} from './conversation-view.js';
export {
  MessageItem,
  DefaultMessageItem,
  type MessageItemProps,
} from './message-item.js';
export { Composer, DefaultComposer, type ComposerProps } from './composer.js';
export {
  PanelHeader,
  DefaultPanelHeader,
  type PanelHeaderProps,
} from './panel-header.js';
export {
  ToolCard,
  DefaultToolCard,
  ConfirmationCard,
  DefaultConfirmationCard,
  type ToolCardProps,
  type ConfirmationCardProps,
} from './tool-card.js';
export { ChatFloatingButton } from './launchers.js';
export {
  LinkedChatPanel,
  type LinkedChatPanelProps,
} from './linked-chat-panel.js';
export { ChatWorkspace, type ChatWorkspaceProps } from './workspace.js';
export { useChatTranslation } from './chat-i18n.js';
