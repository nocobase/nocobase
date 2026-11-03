/**
 * The chat's two kinds of agent as plain data. `online` is the application's own model agent (the catalog's `online`
 * entry, offered while a chat model is configured); `runner` is every agent that works on a runner. A panel shows one
 * mode at a time, each with its own conversations, and offers a switch only when both are configured.
 *
 * The agent last used for a new conversation is remembered in `localStorage` under a key the application scopes to
 * itself and the signed-in person; every access is guarded (private windows, blocked storage).
 */
import type {
  ChatAgent,
  ConversationMode,
} from '../../shared/conversations.js';

/** The catalog's id of the application's own model agent. */
export const ONLINE_AGENT_ID = 'online';

/** Both modes, in the order a panel lists them. */
export const CHAT_AGENT_MODES: readonly ConversationMode[] = [
  'online',
  'runner',
];

/** The mode an agent (or a conversation's agent) belongs to. */
export function chatAgentMode(agent: {
  readonly id: string;
}): ConversationMode {
  return agent.id === ONLINE_AGENT_ID ? 'online' : 'runner';
}

/** The agents of one mode. */
export function agentsOfMode(
  agents: readonly ChatAgent[],
  mode: ConversationMode,
): ChatAgent[] {
  return agents.filter((agent) => chatAgentMode(agent) === mode);
}

/** The modes the catalog offers: `online` while it lists the online agent, `runner` while it lists any other. */
export function configuredChatModes(
  agents: readonly ChatAgent[] | undefined,
): readonly ConversationMode[] {
  if (!agents) return [];
  return CHAT_AGENT_MODES.filter((mode) =>
    agents.some((agent) => chatAgentMode(agent) === mode),
  );
}

export interface ChatAgentModeInput {
  readonly agents: readonly ChatAgent[] | undefined;
  /** The mode the person switched to; null when they have not. */
  readonly chosen?: ConversationMode | null;
  /** The open conversation's agent; it decides while a conversation is shown. */
  readonly conversationAgent?: { readonly id: string } | null;
  /** The agent a new conversation was asked to go to. */
  readonly newAgentId?: string | null;
  readonly lastAgentId?: string | null;
}

/**
 * The mode a panel shows: the open conversation's, else the one chosen, else that of the agent a new conversation goes
 * to (asked for, last used, the person's default, the system default), else the first configured one. Null while the
 * catalog is loading and no conversation is open, or when no mode is configured.
 */
export function resolveChatAgentMode({
  agents,
  chosen = null,
  conversationAgent = null,
  newAgentId = null,
  lastAgentId = null,
}: ChatAgentModeInput): ConversationMode | null {
  if (conversationAgent) return chatAgentMode(conversationAgent);
  const modes = configuredChatModes(agents);
  if (!agents || modes.length === 0) return null;
  if (chosen && modes.includes(chosen)) return chosen;
  const find = (id: string | null) =>
    id ? agents.find((agent) => agent.id === id) : undefined;
  const target =
    find(newAgentId) ??
    find(lastAgentId) ??
    agents.find((agent) => agent.isMyDefault) ??
    agents.find((agent) => agent.isSystemDefault);
  return target ? chatAgentMode(target) : (modes[0] ?? null);
}

/** Where the last used agent is kept; the application's scope (its path and the person) follows it. */
export const CHAT_LAST_AGENT_STORAGE_KEY = 'nocobase:agents-chat:last-agent';

function localStorageOf(storage?: Storage | null): Storage | null {
  if (storage) return storage;
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The storage key for one scope, such as the application's path and the signed-in person's id. */
export function lastAgentStorageKey(scope: string): string {
  return scope
    ? `${CHAT_LAST_AGENT_STORAGE_KEY}:${scope}`
    : CHAT_LAST_AGENT_STORAGE_KEY;
}

/** The agent last used for a new conversation in `scope`; null when none is remembered or storage is unavailable. */
export function readLastAgent(
  scope: string,
  storage?: Storage | null,
): string | null {
  try {
    const value = localStorageOf(storage)?.getItem(lastAgentStorageKey(scope));
    return value ? value : null;
  } catch {
    return null;
  }
}

export function rememberLastAgent(
  scope: string,
  agentId: string,
  storage?: Storage | null,
): void {
  try {
    localStorageOf(storage)?.setItem(lastAgentStorageKey(scope), agentId);
  } catch {
    // Not remembered; the next new conversation falls back to the defaults.
  }
}
