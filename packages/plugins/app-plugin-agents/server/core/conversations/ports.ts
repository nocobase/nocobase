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
  ConversationAttentionCounts,
  ConversationUsage,
  ConversationLink,
  ConversationLinkView,
  ConversationNotice,
  ConversationDetail,
  ConversationListQuery,
  ConversationPage,
  ConversationPatch,
  ConversationSource,
  CreateConversationRequest,
  MessagePage,
  SendMessageRequest,
  SendMessageResult,
  StartConversationRequest,
  ResolvedPageContext,
} from '../../../shared/conversations.js';
import type { Run } from '../../../shared/runs.js';
import type { Tx } from '../../kernel/tx.js';
import type { NewInput, SubjectBinding } from '../runs/index.js';
import type { PageContextKinds } from './page-context.js';
import type {
  OnlineAgentConfig,
  OnlineAgentJson,
} from '../../online/agent/types.js';

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
  /** The CLI command the brief names (`acme`): name commands with `commandRef(context.cli, id)`. */
  readonly cli: string;
}

/** What the application adds to the system layer of a conversation's runs. */
export interface ConversationRuleLines {
  /** Lines added to the rules list, each one rule (without its `- `). */
  readonly rules?: readonly string[];
  /** Sections after the rules, each a list of lines (a heading line, then `- ` lines). */
  readonly sections?: readonly (readonly string[])[];
  /**
   * Sections added to every turn after its first line, each a list of lines: what is current now, such as the work the
   * conversation drives. A resumed session does not read the system layer again, and these never stop it resuming.
   */
  readonly turn?: readonly (readonly string[])[];
}

/**
 * The application's part of the system layer of a conversation's runs, such as its rules for changing data for the
 * person. Database reads only; called in the claim's transaction.
 */
export type ConversationRules = (
  conn: DatabaseConnection,
  context: ConversationRulesContext,
) => Promise<ConversationRuleLines>;

/** A kind of record conversations may be tied to (`ConversationLinks.registerKind`), such as an issue. */
export interface ConversationLinkKind {
  /** `CONVERSATION_LINK_KIND_PATTERN`; a key is registered once. */
  readonly key: string;
  readonly title?: I18nText;
  /**
   * How each of `targetIds` looks to `userId`, leaving out the ones they may not see. Database reads on `conn` only: it
   * is also read in the claim's transaction, for the "Linked work" section of each turn. Without it the owner may tie
   * any id of the kind, and its links show no view.
   */
  resolve?(
    conn: DatabaseConnection,
    userId: string,
    targetIds: readonly string[],
  ): Promise<ReadonlyMap<string, ConversationLinkView>>;
}

/** A record of a registered kind. */
export interface ConversationLinkTarget {
  readonly kind: string;
  readonly targetId: string;
}

/** What conversations are tied to. A target is tied to a conversation once. */
export interface ConversationLinks {
  /** Returns what removes the kind. Links of a kind that is not registered stay stored but are not listed. */
  registerKind(kind: ConversationLinkKind): () => void;
  hasKind(key: string): boolean;
  /** The conversation's links, oldest first, as its owner sees them. */
  list(userId: string, conversationId: string): Promise<ConversationLink[]>;
  /** The owner ties a target they may see; tying one again answers the existing link. */
  add(
    userId: string,
    conversationId: string,
    target: ConversationLinkTarget,
  ): Promise<ConversationLink>;
  /** 404 for a link the conversation does not have. */
  remove(userId: string, conversationId: string, linkId: string): Promise<void>;
  /**
   * Trusted: ties a target without asking its kind whether anyone may see it, such as what the agent of a run on the
   * conversation created (`ConversationService.ofRunId`). In `outer`'s transaction when given. False when the
   * conversation is gone or already had the link.
   */
  attach(
    conversationId: string,
    target: ConversationLinkTarget,
    options?: {
      readonly origin?: 'agent' | 'application';
      readonly outer?: Tx;
    },
  ): Promise<boolean>;
  /**
   * Trusted: every conversation tied to the target, whoever owns it, such as to deliver news to each
   * (`ConversationService.deliver`). A person reads their own with `list` and `linkKind`, `linkTargetId`.
   */
  linkedTo(
    conn: DatabaseConnection,
    target: ConversationLinkTarget,
  ): Promise<readonly ConversationRef[]>;
}

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
  /**
   * A Runner OnlineAgent conversation hands `input` to its agent only when this is true: as a new run, or into the one
   * that works on it now. Its owner sees that run's replies in the conversation like any other.
   */
  readonly wake?: boolean;
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
    runnerConfig?: OnlineAgentConfig,
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
  /** Strict admission receipt after commit; it does not project conversation detail after acceptance. */
  sendRealtime(
    userId: string,
    id: string,
    request: SendMessageRequest,
    input: {
      config: OnlineAgentConfig;
      expectedConfig: OnlineAgentConfig;
      workContext?: ResolvedPageContext;
      business?: OnlineAgentJson;
      /** Join the run already answering: the runner steers it into the turn or takes it as the next one. */
      queue?: boolean;
    },
  ): Promise<{ readonly seq: number; readonly run: SendMessageResult['run'] }>;
  /**
   * Takes back a message queued while the agent worked (`queue`), while its runner has not taken it: it stays in the
   * history, marked withdrawn, and the agent never sees it.
   */
  withdraw(userId: string, id: string, messageId: string): Promise<void>;
  /** A new conversation and its first message (`StartConversationRequest`): the application pages' buttons. */
  start(
    userId: string,
    request: StartConversationRequest,
  ): Promise<SendMessageResult>;
  markRead(userId: string, id: string): Promise<ConversationDetail>;
  /**
   * The owner saw the conversation up to message `seq`: a reply or failure waiting for them up to there is settled; a
   * question (`confirm`) waits until they write.
   */
  markSeen(
    userId: string,
    id: string,
    seq: number,
  ): Promise<ConversationDetail>;
  /** How many of the owner's open conversations are unread, and how many need them. */
  attention(userId: string): Promise<ConversationAttentionCounts>;
  /** What the conversation's runs used (`ConversationUsage`); owner only. */
  usage(userId: string, id: string): Promise<ConversationUsage>;
  /**
   * The application told the owner of the conversation up to `seq` (a reminder, a push), so it tells them once; the
   * highest one is kept.
   */
  markNoticed(conversationId: string, seq: number): Promise<void>;
  /**
   * Unbinds the conversation from its runner: the next run goes to whichever runner takes it first, which binds it,
   * starting a fresh session with the conversation's history. The old directory is left to the runner's cleanup.
   */
  switchRunner(userId: string, id: string): Promise<ConversationDetail>;
  /** Changes the agent of an idle Runner conversation, preserving history and links; its next message starts a fresh session. */
  switchAgent(
    userId: string,
    id: string,
    agentId: string,
  ): Promise<ConversationDetail>;
  /** Cancels the conversation's open runs: a queued one at once, a working one is asked to stop. */
  stop(userId: string, id: string): Promise<ConversationDetail>;
  /**
   * Deletes the owner's conversation for good: its open runs are cancelled, its messages, files, links and kept
   * sessions go, its inbox notices are settled, and runners remove its working directories and session files on
   * their next report.
   */
  delete(userId: string, id: string): Promise<void>;
  /**
   * Deletes conversations archived more than `days` days before `now`, as `delete` does, in batches; answers how many
   * it deleted.
   */
  purgeArchived(days: number, now?: Date): Promise<number>;
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
  /**
   * The agent of a run on the conversation asks its owner something (`confirm`), which waits for them until they write.
   * For the CLI command `conversation ask-owner`.
   */
  askOwnerFromRun(
    run: Pick<Run, 'subject' | 'actorUserId'>,
    question: string,
    issue?: string,
  ): Promise<ConversationDetail>;
  /** Settles only a question about this issue asked before its recorded resumption. */
  settleOwnerQuestion(
    id: string,
    issue: string,
    resumedAt: string,
  ): Promise<boolean>;
  /** `homeOf` for a stored run, by id: the conversation what the run did goes back to, or null. */
  ofRunId(runId: string): Promise<ConversationRef | null>;
  /** Where the application registers what conversations may be tied to, and ties them. */
  readonly links: ConversationLinks;
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
   * In the caller's transaction: writes `news.notice` to the conversation and hands `news.input` to its agent (a new
   * run, or the open one), as a message would. Answers the run, or null when the agent was not woken (no input, or
   * the agent can no longer be woken) or the conversation is gone. Native bindings save the notice but ignore input
   * for wake-up and return null, as Runner OnlineAgent bindings do unless `news.wake`; null can therefore mean a notice
   * was saved.
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
  syncRun(runId: string): Promise<Run>;

  /** The enabled agents the person may chat with, with whether each can answer now. */
  chatAgents(userId: string): Promise<ChatAgent[]>;
}
