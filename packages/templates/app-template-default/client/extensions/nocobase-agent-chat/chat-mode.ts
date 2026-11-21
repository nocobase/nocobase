import {
  agentsOfMode,
  configuredChatModes,
  resolveChatAgentMode,
  useChatAgents,
  useChatPanel,
  useConversation,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  ChatAgent,
  ConversationMode,
} from '@nocobase/app-plugin-agents/shared/conversations';

export interface ChatMode {
  /** Null while the agents load and no conversation is open, or when none is configured. */
  readonly mode: ConversationMode | null;
  /** The modes configured, in the order the panel offers them. */
  readonly modes: readonly ConversationMode[];
  /** The agents a new conversation may go to in this mode; all of them without a mode. */
  readonly agents: readonly ChatAgent[];
  /** Both modes are configured and the panel can switch between them. */
  readonly switchable: boolean;
  /** The other mode, the switch's target; null when there is none. */
  readonly other: ConversationMode | null;
  /** Shows the other mode with a new conversation (or its history, when the history is shown). */
  readonly switchTo: (mode: ConversationMode) => void;
  /** A new conversation in the current mode. */
  readonly startNew: () => void;
}

export function useChatMode(): ChatMode {
  const panel = useChatPanel();
  const agents = useChatAgents(panel.open);
  const conversation = useConversation(panel.conversationId).data ?? null;
  const mode = resolveChatAgentMode({
    agents: agents.data,
    chosen: panel.agentMode ?? null,
    conversationAgent: conversation?.agent ?? null,
    newAgentId: panel.newAgentId,
    lastAgentId: panel.lastAgentId ?? null,
  });
  const modes = configuredChatModes(agents.data);
  const switchable = modes.length > 1 && panel.setAgentMode !== undefined;
  const other = switchable
    ? (modes.find((candidate) => candidate !== mode) ?? null)
    : null;
  return {
    mode,
    modes,
    agents: mode ? agentsOfMode(agents.data ?? [], mode) : (agents.data ?? []),
    switchable,
    other,
    switchTo: (next) => {
      const history = panel.view === 'history';
      panel.setAgentMode?.(next);
      // A conversation belongs to its mode; an unsent new one keeps its draft.
      if (panel.conversationId !== null) panel.selectConversation(null);
      if (history) panel.setView('history');
      else panel.focusComposer();
    },
    startNew: () => {
      if (mode) panel.setAgentMode?.(mode);
      panel.selectConversation(null);
      panel.focusComposer();
    },
  };
}
