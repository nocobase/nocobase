/**
 * The conversation API the rest of the application uses: the HTTP routes, the application's extensions, and later the
 * platform.
 * It names no storage; `createConversationService` keeps conversations in this plugin's tables, and a shared platform
 * conversation layer, or the AI employee's storage, would replace that implementation behind the same interface.
 *
 * Every method that takes a `userId` acts for that person as the conversation's owner: a conversation someone else owns
 * answers 404 `NOT_FOUND`, whoever asks.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { Agent } from '../../../shared/agents.js';
import type { I18nText } from '../../../shared/i18n.js';
import type {
  ChatAgent,
  ConsultationNotice,
  ConversationNotice,
  ConversationDetail,
  ConversationListQuery,
  ConversationPage,
  ConversationPatch,
  ConversationSource,
  CopyAgentRequest,
  CreateConversationRequest,
  MessagePage,
  SendMessageRequest,
  SendMessageResult,
  StartConversationRequest,
} from '../../../shared/conversations.js';
import type { Run } from '../../../shared/runs.js';
import type { Tx } from '../../kernel/tx.js';
import type { NewInput, SubjectBinding } from '../runs/index.js';
import type { PageContextKinds } from './page-context.js';

/** A conversation as the application sees the one a run works on. */
export interface ConversationRef {
  readonly id: string;
  /** The owner: the person the run acts for. */
  readonly userId: string;
  readonly agentId: string;
  readonly title: string | null;
  readonly source: ConversationSource;
}

/** What a plugin adding rules to a conversation's system layer learns about it. */
export interface ConversationRulesContext {
  readonly conversation: ConversationRef;
  readonly agent: Agent;
  readonly ownerName: string;
  /** The CLI command the brief names (`acme`). */
  readonly cli: string;
  /** How the agent reaches the commands: name them with `commandRef(context.dialect, context.cli, id)`. */
  readonly dialect: 'cli' | 'tools';
}

/** What the application adds to the system layer of a conversation's runs. */
export interface ConversationRuleLines {
  /** Lines added to the rules list, each one rule (without its `- `). */
  readonly rules?: readonly string[];
  /** Sections after the rules, each a list of lines (a heading line, then `- ` lines). */
  readonly sections?: readonly (readonly string[])[];
}

/**
 * The application's part of the system layer of a conversation's runs, such as its rules for changing data for the
 * person. Database reads only; called in the claim's transaction.
 */
export type ConversationRules = (
  conn: DatabaseConnection,
  context: ConversationRulesContext,
) => Promise<ConversationRuleLines>;

/** A place a conversation may be started from besides the panel (`StartConversationRequest.source`). */
export interface ConversationSourceKind {
  /** `CONVERSATION_SOURCE_PATTERN`, not `panel`. */
  readonly key: string;
  readonly title: I18nText;
}

export interface ConversationSources {
  /** Returns what removes the source. A key is registered once. */
  register(source: ConversationSourceKind): () => void;
  has(key: string): boolean;
  list(): readonly ConversationSourceKind[];
}

/** What happened outside the conversation that its owner and its agent should hear of. */
export interface ConversationNews {
  /** Written as a `system` message. */
  readonly notice: ConversationNotice;
  /** Handed to the agent as run input on the conversation's key, when the agent may still be woken. */
  readonly input?: NewInput;
}

/** Which messages to read: the newest `limit`, those before a `seq` (older), or those after one (newer). */
export interface MessageReadOptions {
  readonly before?: number;
  readonly after?: number;
  readonly limit?: number;
}

export interface ConversationService {
  /** The `conversation` subject kind of runs; registered once, by the composition. */
  readonly binding: SubjectBinding;
  /** Where plugins register how references of their kinds in a page context resolve. */
  readonly contextKinds: PageContextKinds;
  /** Where the application registers the places conversations are started from besides the panel. */
  readonly sources: ConversationSources;

  list(userId: string, query: ConversationListQuery): Promise<ConversationPage>;
  /** Starts no run; the first message does. */
  create(
    userId: string,
    request: CreateConversationRequest,
  ): Promise<ConversationDetail>;
  get(userId: string, id: string): Promise<ConversationDetail>;
  /** Rename (the title becomes the owner's) and archive or unarchive. */
  update(
    userId: string,
    id: string,
    patch: ConversationPatch,
  ): Promise<ConversationDetail>;
  messages(
    userId: string,
    id: string,
    query: MessageReadOptions,
  ): Promise<MessagePage>;
  /** Saves the message, then wakes the agent or joins its open run; see `SendMessageResult.run`. */
  send(
    userId: string,
    id: string,
    request: SendMessageRequest,
  ): Promise<SendMessageResult>;
  /** A new conversation and its first message (`StartConversationRequest`): the application pages' buttons. */
  start(
    userId: string,
    request: StartConversationRequest,
  ): Promise<SendMessageResult>;
  markRead(userId: string, id: string): Promise<ConversationDetail>;
  /** Cancels the conversation's open runs: a queued one at once, a working one is asked to stop. */
  stop(userId: string, id: string): Promise<ConversationDetail>;
  /** Moves the conversation to the system default agent until `restore`; a new session. */
  fallback(userId: string, id: string): Promise<ConversationDetail>;
  /** Moves the conversation back to its own agent; a new session. */
  restore(userId: string, id: string): Promise<ConversationDetail>;

  /**
   * The agent of a run on the conversation sets its title (at most `CONVERSATION_TITLE_AGENT_MAX` characters);
   * `CONVERSATION_CONFLICT` `titleLocked` once the owner renamed it. For the CLI command `conversation title set`.
   */
  setTitleFromRun(
    run: Pick<Run, 'subject' | 'actorUserId'>,
    title: string,
  ): Promise<ConversationDetail>;
  /** The conversation a run works on, when it is one and the run acts for its owner; null otherwise. */
  ofRun(
    conn: DatabaseConnection,
    run: Pick<Run, 'subject' | 'actorUserId'>,
  ): Promise<ConversationRef | null>;
  /**
   * The conversation a run's work goes back to: the one it works on, or for a consultation (`Run.parentRunId`) the one
   * the first asking run works on, where the plans it proposes are confirmed. Null when there is none.
   */
  homeOf(
    conn: DatabaseConnection,
    run: Pick<Run, 'subject' | 'actorUserId'> & {
      readonly parentRunId?: string | null;
    },
  ): Promise<ConversationRef | null>;
  /**
   * Writes or rewrites the card of a consultation `run` made (`ask_agent`), one per tool call; nothing for a run on
   * anything but a conversation.
   */
  consultation(
    run: Pick<Run, 'id' | 'subject' | 'actorUserId'>,
    card: ConsultationNotice,
  ): Promise<void>;
  /**
   * In the caller's transaction: writes `news.notice` to the conversation and hands `news.input` to its agent (a new
   * run, or the open one), as a message would. Answers the run, or null when the agent was not woken (no input, or
   * the agent can no longer be woken) or the conversation is gone.
   */
  deliver(
    outer: Tx,
    conversationId: string,
    news: ConversationNews,
  ): Promise<SendMessageResult['run']>;
  /**
   * Locks the conversation in the caller's transaction, so changes made for it run one after another (an application
   * counting what an agent changed in a turn counts under it); false when it does not exist.
   */
  lock(conn: DatabaseConnection, id: string): Promise<boolean>;
  /** Where plugins add sections to the system layer of conversation runs. */
  readonly rules: {
    provide(source: ConversationRules): () => void;
  };
  /** Turns the run's new text events into assistant messages; nothing for runs on other subjects. */
  syncRun(runId: string): Promise<void>;
  /**
   * An online agent's reply as written so far, shown as a draft message that grows in place; the run's next text event
   * makes it final. Nothing for runs on other subjects.
   */
  streamDraft(
    run: Pick<Run, 'id' | 'agentId' | 'subject' | 'actorUserId'>,
    text: string,
  ): Promise<void>;

  /** The agents the person may chat with, with whether each can answer now. */
  chatAgents(userId: string): Promise<ChatAgent[]>;
  /** A private copy of an agent the person may wake, owned and usable only by them. */
  copyAgent(
    userId: string,
    agentId: string,
    request: CopyAgentRequest,
  ): Promise<Agent>;
}
