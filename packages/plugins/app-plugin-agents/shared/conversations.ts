/**
 * Conversations: a person chatting with an agent from the chat panel, as the browser, the server's API and the
 * application exchange them. This file is the contract; the panel (client), the application's extensions and the
 * conversation domain build on it and on nothing else.
 *
 * ## Model
 *
 * - A **conversation** belongs to one person (its owner) and is bound to one agent. Its **mode** is the type of the agent
 *   it answers with now (`online`: a model on the server answers in seconds; `runner`: a coding agent on a runner). It
 *   changes only while a runner conversation uses the online fallback agent in its agent's place (see Availability); a
 *   person who needs the other kind of agent otherwise starts another conversation. Only the owner reads its content:
 *   the API answers 404 to everyone else, administrators included, and the runs a conversation starts are hidden from
 *   anyone the run does not involve. Administrators see usage only.
 * - A **message** is what the owner sent (`user`), what the agent replied (`assistant`), or a notice the server wrote
 *   (`system`: the agent was switched, a run failed). Field names follow the platform AI employee's
 *   `aiConversations` / `aiMessages`, so the two stores can be merged later.
 * - Each message the owner sends wakes the agent: a run with the subject `{ kind: 'conversation', id }`, woken by the
 *   owner (whose permissions bound it). A message sent while the agent is working joins that run as input; a message
 *   sent while it waits for a runner joins the waiting run. Every text the agent writes in a run becomes an assistant
 *   message, in order, as the runner reports it. An online agent's reply appears as it is written: a draft message
 *   (`metadata.streaming`) whose content grows until the reply is final, in place, at the same `seq`. The run's
 *   step-by-step transcript stays readable through the runs API
 *   (`/api/agents/admin/runs/:runId/events`), for the "thinking / reading X" lines.
 * - **Sessions**: a run resumes the session the same runner kept for the conversation. On another runner it starts a
 *   fresh session and its prompt carries the last `CONVERSATION_HISTORY_IN_PROMPT` messages and the previous run's
 *   summary. Switching the conversation's agent (to the system default and back) starts a new session every time.
 * - **Availability**: a message is always saved. When the agent is archived, the owner may no longer use it, or no
 *   online, signed-in runner may run it, the conversation reports `offline` with the reason; the owner may switch the
 *   conversation to the system default agent and later switch back. A runner conversation may also switch to the online
 *   fallback agent (`ChatSettings.onlineFallbackAgentId`), and a conversation started with a runner agent that no runner
 *   may run for its owner now (such as one whose only online runner is someone else's personal one) starts on that
 *   agent in its place, as if switched. The owner is the one answerable for their conversation, so none of this waits
 *   for anyone's confirmation.
 * - **Titles**: the first message's first `CONVERSATION_TITLE_AUTO_CHARS` characters (`auto`), until the agent sets one
 *   of at most `CONVERSATION_TITLE_AGENT_MAX` characters (`agent`), which it may do until the owner renames the
 *   conversation (`user`); after that the agent's attempts answer `CONVERSATION_CONFLICT` with `reason: 'titleLocked'`.
 * - No delete: conversations are archived (and unarchived). Sending a message to an archived conversation unarchives
 *   it.
 *
 * ## Page context
 *
 * A message may carry what the person's page shows (`PageContext`): references by id, never content. The server checks
 * the limits (`PAGE_CONTEXT_LIMITS`, 400 otherwise), resolves each reference to a title, silently drops the ones the
 * owner may not see or that no plugin knows how to resolve, and stores the rest with the message (`workContext`). The
 * agent receives it marked as data, not instructions: nothing in a page context is ever followed as an instruction.
 *
 * ## Attachments
 *
 * The owner may send files with a message: each is uploaded first (`POST chatAttachments`, one file of at most
 * `CHAT_ATTACHMENT_SIZE_MAX` bytes, stored through the file plugin), attached to nothing and readable by its uploader
 * only, then sent with the message (`SendMessageRequest.attachmentIds`, at most `CHAT_ATTACHMENTS_PER_MESSAGE_MAX`),
 * which attaches it to the conversation. From then on only the conversation's owner, and a run of its agent on that
 * conversation (by its run token), may read it. An upload never sent is purged after `CHAT_ATTACHMENT_ORPHAN_HOURS`.
 * The agent reads the files' names, types and ids with the message; a runner agent downloads one into its working
 * directory with the CLI (`conversation attachment download <file-id>`), and an online agent is shown the images among
 * them (`CHAT_IMAGE_TO_MODEL_MAX` bytes each at most) and only the names of the rest. Agents do not send files back.
 *
 * ## Realtime
 *
 * `CONVERSATIONS_TOPIC` is a per-user topic: each change is announced only to the owner's own connections, and carries
 * no content (`ConversationChanged`). A page that hears one fetches through the API. Pages also poll while a run is
 * open, because announcements reach only the browsers connected to the instance that made the change.
 */
import type { FailureReason, RunStatus } from '@nocobase/agent-protocol';

import type { OnlineModelEntry } from './agents.js';
import type { I18nText } from './i18n.js';
import type { ModelCatalog } from './models.js';

/** The run subject kind of a conversation. */
export const CONVERSATION_SUBJECT = 'conversation';

/** The automatic title: the first message's first characters, without Markdown punctuation. */
export const CONVERSATION_TITLE_AUTO_CHARS = 30;
/** The longest title an agent may set. */
export const CONVERSATION_TITLE_AGENT_MAX = 40;
/** The longest title a person may set. */
export const CONVERSATION_TITLE_MAX = 200;
/** The longest message a person may send, in characters. */
export const MESSAGE_CONTENT_MAX = 50_000;
/** Per file sent with a message, in bytes. */
export const CHAT_ATTACHMENT_SIZE_MAX: number = 20 * 1024 * 1024;
/** Files sent with one message. */
export const CHAT_ATTACHMENTS_PER_MESSAGE_MAX = 10;
/** How long an upload not sent with a message is kept. */
export const CHAT_ATTACHMENT_ORPHAN_HOURS = 24;
/** The largest image an online agent's model is shown; a larger one is listed by name only. */
export const CHAT_IMAGE_TO_MODEL_MAX: number = 5 * 1024 * 1024;

/** The raster images shown inline, by extension: the declared type must be the one listed. */
export const INLINE_IMAGE_TYPES: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
};

/** A safe raster image, whose declared type matches its extension; anything else is only downloaded. */
export function isInlineImage(mimeType: string, ext: string): boolean {
  const type = mimeType.split(';')[0]?.trim().toLowerCase() ?? '';
  return INLINE_IMAGE_TYPES[ext.toLowerCase()] === type;
}

/** Messages a fresh session's prompt carries from the conversation's history. */
export const CONVERSATION_HISTORY_IN_PROMPT = 20;

/** Pages of the history list and of messages. */
export const CONVERSATION_PAGE_DEFAULT = 30;
export const CONVERSATION_PAGE_MAX = 100;
export const MESSAGE_PAGE_DEFAULT = 50;
export const MESSAGE_PAGE_MAX = 200;

/** Who gave the conversation its title. */
export const TITLE_SOURCES = ['auto', 'agent', 'user'] as const;

export type TitleSource = (typeof TITLE_SOURCES)[number];

/**
 * Where a conversation was started: the chat panel (`panel`), or a source the application registers on the server
 * (`agents.conversations.sources`), such as a button on one of its pages. A source is a short identifier
 * (`CONVERSATION_SOURCE_PATTERN`).
 */
export type ConversationSource = 'panel' | (string & {});

/** The source of a conversation started from the chat panel. */
export const PANEL_SOURCE = 'panel';

/** `^[a-zA-Z][a-zA-Z0-9._-]{0,31}$` */
export const CONVERSATION_SOURCE_PATTERN: RegExp =
  /^[a-zA-Z][a-zA-Z0-9._-]{0,31}$/u;

/** `aiConversations.category`; every conversation of this plugin is a chat. */
export type ConversationCategory = 'chat';

export const MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;

export type MessageRole = (typeof MESSAGE_ROLES)[number];

// ---------------------------------------------------------------------------------------------------------------------
// Page context
// ---------------------------------------------------------------------------------------------------------------------

/** The limits a page context is checked against; a request over any of them answers 400 `INVALID_REQUEST`. */
export const PAGE_CONTEXT_LIMITS = {
  /** Characters of `route`. */
  route: 500,
  /** References in `items`. */
  items: 10,
  /** Keys of `filter.params`. */
  filterKeys: 20,
  /** Characters of each `filter.params` value. */
  filterValue: 500,
  /** Characters of `filter.label`. */
  filterLabel: 200,
  /** Characters of `selection.text`. */
  selection: 2000,
} as const;

/**
 * The kinds of objects a page may reference that this plugin resolves: agents and runs. The application registers a
 * resolver for each kind of its own (`agents.conversations.contextKinds`); references of a kind nobody resolves are
 * dropped. A kind is a short identifier, so new kinds need no change here.
 */
export const PAGE_CONTEXT_KINDS = ['agent', 'run'] as const;

export type KnownPageContextKind = (typeof PAGE_CONTEXT_KINDS)[number];

/** `^[a-zA-Z][a-zA-Z0-9._-]{0,31}$` */
export const PAGE_CONTEXT_KIND_PATTERN: RegExp =
  /^[a-zA-Z][a-zA-Z0-9._-]{0,31}$/u;

/** An object on the page, by id only. */
export interface PageContextRef {
  readonly kind: string;
  readonly id: string;
}

/**
 * What the person's page shows when they send a message, as the browser sends it: ids and the visible filter, never
 * content. Data, not instructions.
 */
export interface PageContext {
  /** The page's route (path and query), at most `PAGE_CONTEXT_LIMITS.route` characters. */
  readonly route: string;
  /** The objects the page shows or the person pinned, at most `PAGE_CONTEXT_LIMITS.items`. */
  readonly items: readonly PageContextRef[];
  /** The list filter the page applies: which list (such as `inbox`) and its parameters. */
  readonly filter?: {
    readonly page: string;
    readonly params: Readonly<Record<string, string>>;
    /**
     * How the person saw the filter when sending (`Project: Website`), kept with the message so it reads the same
     * later. Words the page gave, not checked by the server: the agent reads it beside `params`, as data.
     */
    readonly label?: string;
  };
  /** Text the person selected on the page, and what it was selected in. */
  readonly selection?: {
    readonly text: string;
    readonly source?: PageContextRef;
  };
}

/** A reference the server resolved for the message's owner. */
export interface ResolvedPageContextItem extends PageContextRef {
  /** What a person calls it: a record's title, an agent's name. */
  readonly title: string;
  /** A short key, such as a record's identifier (`TKT-12`). */
  readonly key: string | null;
  /** Where it opens in the application, when it has a page. */
  readonly url: string | null;
}

/** A page context as stored with a message (`workContext`) and handed to the agent. */
export interface ResolvedPageContext {
  readonly route: string;
  readonly items: readonly ResolvedPageContextItem[];
  readonly filter?: PageContext['filter'];
  readonly selection?: {
    readonly text: string;
    readonly source?: ResolvedPageContextItem;
  };
  /** References dropped: unknown kinds and objects the owner may not see. */
  readonly dropped: number;
}

// ---------------------------------------------------------------------------------------------------------------------
// Conversations and messages
// ---------------------------------------------------------------------------------------------------------------------

/** The agent a conversation is bound to, as the panel shows it; null fields when the agent was deleted. */
export interface ConversationAgent {
  readonly id: string;
  /** Null when the agent no longer exists. */
  readonly name: string | null;
  /** Its name as an i18n reference, shown in the viewer's language (`Agent.nameText`). */
  readonly nameText: I18nText | null;
  readonly avatar: string | null;
  readonly archived: boolean;
}

/** Why a conversation's agent cannot answer now. */
export const OFFLINE_REASONS = [
  /** The agent was deleted. */
  'agentMissing',
  /** The agent is archived. */
  'agentArchived',
  /** The owner may no longer wake the agent. */
  'forbidden',
  /** No online runner with the agent's tool installed and signed in may run the owner's work. */
  'noRunner',
  /** An online agent: its model service no longer offers its model, or no model services are available. */
  'modelUnavailable',
] as const;

export type OfflineReason = (typeof OFFLINE_REASONS)[number];

/** Whether the agent can answer now. */
export interface ChatAvailability {
  readonly online: boolean;
  /** Null when online. */
  readonly reason: OfflineReason | null;
  /** Runners that may run the agent for the owner now; for an online agent, 1 while its model is offered. */
  readonly onlineRunners: number;
}

/** A conversation's mode: the type of the agent it answers with now (`AgentType`). */
export type ConversationMode = 'online' | 'runner';

/** The conversation's open run: queued, waiting for a runner, or working. */
export interface ConversationRun {
  readonly id: string;
  readonly status: RunStatus;
  /** A runner holds it and takes new messages in as they come. */
  readonly acceptsInput: boolean;
}

/** A conversation in the history list. */
export interface ConversationSummary {
  readonly id: string;
  /** Null until the first message gives it one. */
  readonly title: string | null;
  readonly titleSource: TitleSource;
  readonly category: ConversationCategory;
  readonly source: ConversationSource;
  /** `online` or `runner`: the type of `agent`. */
  readonly mode: ConversationMode;
  readonly agent: ConversationAgent;
  /**
   * While the conversation uses the system default or the online fallback agent in place of its own (`fallback`, or a
   * new conversation whose runner agent could not run): the agent it switches back to. Null otherwise.
   */
  readonly fallbackFrom: ConversationAgent | null;
  /**
   * An online conversation: the entry of its agent's list it answers with, the owner's choice
   * (`ConversationPatch.model`) while the agent lists it, else the agent's first. Null for a runner conversation, or
   * when the agent is gone.
   */
  readonly model: OnlineModelEntry | null;
  /** False when the agent wrote since the owner last marked it read. */
  readonly read: boolean;
  readonly lastMessageAt: string;
  readonly archivedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** The open run, if any: the panel shows "working" and offers to stop. */
  readonly run: ConversationRun | null;
}

/** An entry a conversation may answer with, named as the person reads it: its service's title and the model's label. */
export interface ChatModelChoice extends OnlineModelEntry {
  /** Its service's title; its name when no enabled service has it any more. */
  readonly serviceTitle: string;
  /** The model's label in its service; its id when the service no longer offers it. */
  readonly modelLabel: string;
}

/** The entries named from the catalog (`ChatModelChoice`); what the catalog no longer has keeps its ids. */
export function chatModelChoices(
  entries: readonly OnlineModelEntry[],
  catalog: Pick<ModelCatalog, 'services'>,
): ChatModelChoice[] {
  return entries.map((entry) => {
    const service = catalog.services.find(
      (item) => item.name === entry.modelService,
    );
    const option = service?.models.find((item) => item.value === entry.model);
    return {
      ...entry,
      serviceTitle: service?.title || entry.modelService,
      modelLabel: option?.label || entry.model,
    };
  });
}

/** One conversation as the panel opens it. */
export interface ConversationDetail extends ConversationSummary {
  readonly availability: ChatAvailability;
  /** An online conversation: the entries of its agent's list the owner may choose from, in order; empty otherwise. */
  readonly models: readonly ChatModelChoice[];
  /**
   * Another agent may take over (`POST …/fallback`): the system default when it is of the conversation's mode, else,
   * for a runner conversation, the online fallback agent (`ChatSettings.onlineFallbackAgentId`).
   */
  readonly canFallback: boolean;
  /** The conversation is on the system default and its own agent may take it back (`POST …/restore`). */
  readonly canRestore: boolean;
}

/** `aiMessages.content`. */
export interface MessageContent {
  readonly type: 'text';
  /** Markdown. */
  readonly content: string;
}

/**
 * What the server writes as a `system` message, as a code the panel translates. `content` carries an English fallback
 * of the same text.
 */
export type ConversationNotice =
  /** The conversation now uses the system default agent, until switched back. */
  | {
      readonly code: 'switchedToDefault';
      readonly agentId: string;
      readonly fromAgentId: string;
    }
  /** The conversation now uses the online fallback agent in place of its runner agent, until switched back. */
  | {
      readonly code: 'switchedToOnline';
      readonly agentId: string;
      readonly fromAgentId: string;
    }
  /** The configured online fallback cannot answer; the conversation stays with its runner agent. */
  | {
      readonly code: 'onlineFallbackUnavailable';
      readonly fromAgentId: string;
      readonly reason: OfflineReason;
    }
  /** The conversation is back on its own agent. */
  | {
      readonly code: 'switchedBack';
      readonly agentId: string;
      readonly fromAgentId: string;
    }
  /** The run answering ended without finishing. */
  | {
      readonly code: 'runFailed';
      readonly runId: string;
      readonly reason: FailureReason | null;
    }
  /** The owner stopped the run. */
  | { readonly code: 'runCancelled'; readonly runId: string }
  /**
   * Something happened outside the conversation that the application tells its owner and its agent about
   * (`ConversationService.deliver`): `type` says what, for a panel extension that words it in the reader's language
   * (`ChatExtensions.renderNotice`); `title` is the English line shown otherwise; `params` what the wording needs.
   */
  | {
      readonly code: 'news';
      readonly type: string;
      readonly title: string;
      readonly params?: Readonly<Record<string, string>>;
    }
  | ConsultationNotice;

/** How a consultation went: asked and not answered yet, answered, failed, or refused before it started. */
export const CONSULTATION_STATES = [
  'running',
  'completed',
  'failed',
  'refused',
] as const;

export type ConsultationState = (typeof CONSULTATION_STATES)[number];

/**
 * The agent consulted another one (`ask_agent`) while answering: one card per call, rewritten in place (same id and
 * `seq`, `metadata.streaming` while it runs) as the consultation goes. The consulted agent's own run (`runId`) has its
 * transcript and usage.
 */
export interface ConsultationNotice {
  readonly code: 'consultation';
  /** The tool call: one card per call. */
  readonly callId: string;
  /** The consulted agent's run; null when it was refused before it started. */
  readonly runId: string | null;
  /** The consulted agent; null when the one asked for was not found. */
  readonly agentId: string | null;
  /** Its name, or what the asking agent called it. */
  readonly agentName: string;
  readonly question: string;
  readonly state: ConsultationState;
  /** Its answer so far while it runs, then its final answer. */
  readonly answer: string;
  /** Why it failed or was refused. */
  readonly error: string | null;
  /** What it used, once it ended. */
  readonly usage: {
    readonly inputTokens: number;
    readonly outputTokens: number;
  } | null;
  /** Operation plans it proposed, which the person confirms here. */
  readonly plans: number;
}

export type ConversationNoticeCode = ConversationNotice['code'];

/** `aiMessages.metadata`. */
export interface MessageMetadata {
  /** A user message: the run input it became, once the agent was woken. */
  readonly inputId?: string;
  /** An assistant message: the agent that wrote it and the run event it came from. */
  readonly agentId?: string;
  readonly runEventSeq?: number;
  /** A system message: what happened. */
  readonly notice?: ConversationNotice;
  /** The id the browser gave a message it sent, echoed so it can replace its optimistic copy. */
  readonly clientId?: string;
  /**
   * An assistant message an online agent is still writing: its content grows in place (same id and `seq`) until the reply
   * is final, when the flag goes. Fetch messages again from before the first streaming one to see it grow.
   */
  readonly streaming?: boolean;
  /** A draft whose run ended before the reply was final: what it had written. */
  readonly interrupted?: boolean;
}

/** A file sent with a message (`SendMessageRequest.attachmentIds`), or an upload not sent yet. */
export interface MessageAttachment {
  readonly id: string;
  readonly filename: string;
  /** Lower case, without the dot; empty when the name has none. */
  readonly ext: string;
  /** As the uploader declared it. */
  readonly mimeType: string;
  readonly size: number;
  /** The content route, with the application's base path: shows a safe image inline, downloads anything else. */
  readonly contentUrl: string;
  /** The content route, always as a download. */
  readonly downloadUrl: string;
  /** A safe raster image the browser may show (`isInlineImage`). */
  readonly previewable: boolean;
}

export interface ConversationMessage {
  readonly id: string;
  readonly conversationId: string;
  /** The message's position in its conversation, from 1, without gaps. */
  readonly seq: number;
  readonly role: MessageRole;
  readonly content: MessageContent;
  /** Reserved for the AI employee's shape; null here (tool steps stay in the run's transcript). */
  readonly toolCalls: readonly unknown[] | null;
  /** The files the owner sent with a user message, in the order sent; null when none. */
  readonly attachments: readonly MessageAttachment[] | null;
  /** A user message's page context, as resolved when it was sent. */
  readonly workContext: ResolvedPageContext | null;
  readonly metadata: MessageMetadata;
  /** The run a user message woke or joined, or the run an assistant or notice message came from. */
  readonly runId: string | null;
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------------------------------------------------
// HTTP API
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Paths under the application's API base (`/api`), signed in. Every answer is `{ data }` (`{ data, meta }` for a list);
 * a failure is the standard error body of domain `agents`. A conversation someone else owns answers 404
 * `CONVERSATION_NOT_FOUND`.
 *
 * | Method | Route           | Body / query                                      | `data`                     |
 * | ------ | --------------- | ------------------------------------------------- | -------------------------- |
 * | GET    | `conversations` | `ConversationListQuery` (cursor paging)           | `ConversationSummary[]`    |
 * | POST   | `conversations` | `CreateConversationRequest`                       | `ConversationDetail` (201) |
 * | POST   | `start`         | `StartConversationRequest`                        | `SendMessageResult`        |
 * | GET    | `conversation`  |                                                   | `ConversationDetail`       |
 * | PATCH  | `conversation`  | `ConversationPatch` (rename, archive / unarchive) | `ConversationDetail`       |
 * | GET    | `messages`      | `MessageListQuery` (cursor paging)                | `ConversationMessage[]`    |
 * | POST   | `messages`      | `SendMessageRequest`                              | `SendMessageResult` (201)  |
 * | POST   | `markRead`      |                                                   | `ConversationDetail`       |
 * | POST   | `stop`          |                                                   | `ConversationDetail`       |
 * | POST   | `fallback`      |                                                   | `ConversationDetail`       |
 * | POST   | `restore`       |                                                   | `ConversationDetail`       |
 * | GET    | `agents`        |                                                   | `ChatAgent[]`              |
 * | POST   | `copyAgent`     | `CopyAgentRequest`                                | `Agent`                    |
 * | GET    | `preferences`   |                                                   | `ChatPreferences`          |
 * | PATCH  | `preferences`   | `ChatPreferencesPatch`                            | `ChatPreferences`          |
 * | GET    | `settings`      |                                                   | `ChatSettings`             |
 * | PATCH  | `settings`      | `ChatSettingsPatch` (`agents.agents` manage)      | `ChatSettings`             |
 * | POST   | `attachments`   | multipart, one `file`                             | `MessageAttachment` (201)  |
 * | DELETE | `attachment`    | an upload not sent yet, by its uploader           | 204                        |
 * | GET    | `attachmentContent` | `?download=true` to save; a person or a run   | the bytes                  |
 *
 * A conversation whose state forbids the request answers 400 `CONVERSATION_CONFLICT` with `metadata.reason`
 * (`ConversationConflict`).
 */
export const CHAT_ROUTES = {
  conversations: 'agents/conversations',
  conversation: 'agents/conversations/:conversationId',
  messages: 'agents/conversations/:conversationId/messages',
  markRead: 'agents/conversations/:conversationId/markRead',
  stop: 'agents/conversations/:conversationId/stop',
  fallback: 'agents/conversations/:conversationId/fallback',
  restore: 'agents/conversations/:conversationId/restore',
  start: 'agents/conversations/start',
  agents: 'agents/chatAgents',
  copyAgent: 'agents/:agentId/copy',
  preferences: 'agents/chatPreferences',
  settings: 'agents/chatSettings',
  attachments: 'agents/chatAttachments',
  attachment: 'agents/chatAttachments/:attachmentId',
  attachmentContent: 'agents/chatAttachments/:attachmentId/content',
} as const;

export type ChatRoute = keyof typeof CHAT_ROUTES;

/** A route's path with its id parameter filled in (URI-encoded). */
export function chatPath(route: ChatRoute, id?: string): string {
  const path: string = CHAT_ROUTES[route];
  return id === undefined
    ? path
    : path.replace(/:[A-Za-z]+/u, encodeURIComponent(id));
}

/** `metadata.reason` of a `CONVERSATION_CONFLICT`. */
export const CONVERSATION_CONFLICTS = [
  /** No agent was named, the owner has no usable default, and no system default is set. */
  'noChatAgent',
  /** The agent tried to set the title after the owner renamed the conversation. */
  'titleLocked',
  /**
   * `fallback`: the conversation already uses another agent in place of its own, or no system default of its mode and,
   * for a runner conversation, no online fallback agent is set or usable.
   */
  'noFallback',
  /** `restore`: the conversation is not on the system default, or its own agent is still unavailable. */
  'noRestore',
] as const;

export type ConversationConflict = (typeof CONVERSATION_CONFLICTS)[number];

/** `GET conversations`: the owner's conversations, last message first, a page at a time. */
export interface ConversationListQuery {
  /** Matches the title and the text of every message, case-insensitively. */
  readonly q?: string;
  /** `false` (default): open ones; `true`: archived ones; `all`: both. */
  readonly archived?: boolean | 'all';
  readonly agentId?: string;
  readonly source?: ConversationSource;
  /** The `meta.nextPageToken` of the previous page. */
  readonly pageToken?: string;
  /** `CONVERSATION_PAGE_DEFAULT`, at most `CONVERSATION_PAGE_MAX`. */
  readonly pageSize?: number;
}

/** A page of conversations, as the service reads it; the route answers `{ data: items, meta: { nextPageToken } }`. */
export interface ConversationPage {
  readonly items: readonly ConversationSummary[];
  readonly nextCursor: string | null;
}

/** `POST conversations`. Creating starts no run; the first message does. */
export interface CreateConversationRequest {
  /**
   * The agent to chat with, which the person must be allowed to wake; its type becomes the conversation's initial mode.
   * Without one: the person's default online agent
   * (`ChatPreferences.defaultAgentId`) while they may still wake it, else the system default
   * (`ChatSettings.defaultAgentId`), else `CONVERSATION_CONFLICT` `noChatAgent`. A runner agent that no runner may
   * run for the person now is replaced by the online fallback agent (`ChatSettings.onlineFallbackAgentId`) when one is
   * set and usable, without `model`; the conversation starts on it with `fallbackFrom` naming the runner agent.
   */
  readonly agentId?: string;
  /** An explicit title (`user`); otherwise the first message gives one. */
  readonly title?: string;
  /** `panel` by default; otherwise a registered source. */
  readonly source?: ConversationSource;
  /**
   * An online agent: the entry of its list (`ChatAgent.models`) the conversation answers with, as `ConversationPatch.model`
   * sets it later; null or left out for the agent's default. 400 `INVALID_REQUEST` (`MODEL_NOT_LISTED`) for one the
   * agent does not list.
   */
  readonly model?: OnlineModelEntry | null;
}

/**
 * `PATCH conversation`: rename (the title becomes `user`'s and the agent may no longer change it), archive, or choose
 * the model an online conversation answers with: one of `ConversationDetail.models`, or null for the agent's default.
 * The choice applies from the next run; a model that fails fails the run, nothing falls back to another.
 */
export interface ConversationPatch {
  readonly title?: string;
  readonly archived?: boolean;
  readonly model?: OnlineModelEntry | null;
}

/**
 * `GET messages`: without a page token, the newest `pageSize` messages; `meta.nextPageToken` pages back through older
 * ones, and `after` reads what arrived since a message. Always oldest first within the page; `meta.lastSeq` is the
 * highest `seq` in the conversation now.
 */
export interface MessageListQuery {
  /** Messages with a higher `seq`. */
  readonly after?: number;
  /** The `meta.nextPageToken` of the previous page: older messages. */
  readonly pageToken?: string;
  /** `MESSAGE_PAGE_DEFAULT`, at most `MESSAGE_PAGE_MAX`. */
  readonly pageSize?: number;
}

/** A page of messages, as the service reads it and the client puts it back together. */
export interface MessagePage {
  readonly items: readonly ConversationMessage[];
  /** There are older messages than the first one returned. */
  readonly hasMore: boolean;
  /** The highest `seq` in the conversation now, to ask `after` with. */
  readonly lastSeq: number;
}

/** `POST messages`. */
export interface SendMessageRequest {
  /** Markdown, at most `MESSAGE_CONTENT_MAX` characters; empty only when files are sent. */
  readonly content: string;
  readonly context?: PageContext;
  /**
   * The caller's own uploads not sent yet (`POST attachments`), at most `CHAT_ATTACHMENTS_PER_MESSAGE_MAX`, sent with
   * the message in its order. 400 `INVALID_ATTACHMENT` for any other id, and nothing is sent.
   */
  readonly attachmentIds?: readonly string[];
  /** Echoed in the message's `metadata.clientId`. */
  readonly clientId?: string;
}

export interface SendMessageResult {
  readonly message: ConversationMessage;
  /**
   * The run the message woke or joined: `created` a new run, `merged` into the run waiting for a runner, `appended` to
   * the run working now. Null when the agent is unavailable (archived, forbidden or deleted): the message is saved and
   * waits until the conversation switches to an agent that can answer.
   */
  readonly run: {
    readonly id: string;
    readonly outcome: 'created' | 'merged' | 'appended';
  } | null;
  readonly conversation: ConversationDetail;
}

/**
 * `POST start`: a new conversation and its first message in one request, for the buttons that hand a page's work to an
 * agent. The answer is the first message's `SendMessageResult`; open the panel on `conversation.id`.
 *
 * `source` is a source the application registered (not `panel`), and `text` the first message as the agent should
 * read it: an application that wraps what the person gave (marking pasted text as data, say) does so before calling
 * `start`. `context` pins the page's objects.
 *
 * The person must be allowed to wake the agent (`agentId`, else their default, else the system default, as
 * `CreateConversationRequest`). The text is at most `MESSAGE_CONTENT_MAX` characters: 400 `INVALID_REQUEST` otherwise.
 */
export interface StartConversationRequest {
  readonly source: Exclude<ConversationSource, 'panel'>;
  readonly text: string;
  readonly agentId?: string;
  readonly title?: string;
  readonly context?: PageContext;
  readonly clientId?: string;
}

/** An agent the person may chat with (`GET agents`). */
export interface ChatAgent {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  /** Its name and description as i18n references, shown in the viewer's language (`Agent.nameText`). */
  readonly nameText: I18nText | null;
  readonly descriptionText: I18nText | null;
  readonly avatar: string | null;
  /** `online` or `runner`: the mode of the conversations it is started in. */
  readonly type: 'online' | 'runner';
  /**
   * An online agent: the entries of its list a new conversation may answer with (`CreateConversationRequest.model`), in
   * order, the first its default; empty for a runner agent.
   */
  readonly models: readonly ChatModelChoice[];
  /** The person's own agent, which only they may use (a "copy for myself"). */
  readonly personal: boolean;
  readonly isSystemDefault: boolean;
  readonly isMyDefault: boolean;
  readonly availability: ChatAvailability;
  /**
   * A runner agent that no runner may run for the person now: the online agent a new conversation with it starts on
   * instead (`ChatSettings.onlineFallbackAgentId`). Null otherwise.
   */
  readonly fallbackAgentId: string | null;
}

/**
 * `POST copyAgent`: a private copy of an agent the person may wake, owned by them and usable only by them. The copy
 * takes the agent's description, avatar, tool, model, instructions, business actions, skills, runners and limits, not
 * its variables.
 */
export interface CopyAgentRequest {
  /** The copy's name; `<name> (copy)` by default. */
  readonly name?: string;
  /** Also make the copy the person's default online agent. */
  readonly makeDefault?: boolean;
}

/** The person's own chat settings ("Profile › Agent"). */
export interface ChatPreferences {
  /** New conversations go to this agent while the person may wake it; null: the system default. */
  readonly defaultAgentId: string | null;
}

export type ChatPreferencesPatch = Partial<ChatPreferences>;

/** The team's chat settings ("Agent team › Settings"). */
export interface ChatSettings {
  /** The agent new conversations go to when a person has no default of their own; null when none is set. */
  readonly defaultAgentId: string | null;
  /**
   * The online agent that answers in place of a runner agent no runner may run for the person now: a new conversation
   * with that runner agent starts on it, and a runner conversation may switch to it. Null when none is set.
   */
  readonly onlineFallbackAgentId: string | null;
}

export type ChatSettingsPatch = Partial<ChatSettings>;

// ---------------------------------------------------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------------------------------------------------

/** A per-user topic: each announcement reaches only the conversation owner's connections. */
export const CONVERSATIONS_TOPIC = 'agents:conversations';

/**
 * What changed in one of the owner's conversations; never content. `messages`: new messages up to `lastSeq` (fetch
 * `after`); `conversation`: its title, agent, run, archive or read state changed (fetch it, and the list).
 */
export type ConversationChanged =
  | {
      readonly kind: 'conversation.messages';
      readonly conversationId: string;
      readonly lastSeq: number;
    }
  | {
      readonly kind: 'conversation.changed';
      readonly conversationId: string;
    };
