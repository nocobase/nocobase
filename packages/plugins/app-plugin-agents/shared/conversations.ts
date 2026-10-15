/**
 * Conversations: a person chatting with an agent from the chat panel, as the browser, the server's API and the
 * application exchange them. This file is the contract; the panel (client), the application's extensions and the
 * conversation domain build on it and on nothing else.
 *
 * ## Model
 *
 * - A **conversation** belongs to one person (its owner) and is bound to one agent, which answers on a runner. Its
 *   **mode** is `runner`; conversations an earlier version answered with an online agent keep `online`. Only the owner
 *   reads its content:
 *   the API answers 404 to everyone else, administrators included, and the runs a conversation starts are hidden from
 *   anyone the run does not involve. Administrators see usage only.
 * - A **message** is what the owner sent (`user`), what the agent replied (`assistant`), or a notice the server wrote
 *   (`system`: the agent was switched, a run failed). Field names follow the platform AI employee's
 *   `aiConversations` / `aiMessages`, so the two stores can be merged later.
 * - Each message the owner sends wakes the agent: a run with the subject `{ kind: 'conversation', id }`, woken by the
 *   owner (whose permissions bound it). A message sent while the agent is working joins that run as input; a message
 *   sent while it waits for a runner joins the waiting run. Every text the agent writes in a run becomes an assistant
 *   message, in order, as the runner reports it. The run's step-by-step transcript stays readable through the runs API
 *   (`/api/agents/admin/runs/:runId/events`), for the "thinking / reading X" lines.
 * - **Sessions**: a run resumes the session the same runner kept for the conversation. On another runner it starts a
 *   fresh session and its prompt carries the last `CONVERSATION_HISTORY_IN_PROMPT` messages and the previous run's
 *   summary. Switching the conversation's agent (to the system default and back) starts a new session every time.
 * - **Availability**: a message is always saved. When the agent is not enabled, the owner may no longer use it, or no
 *   online runner that has its tool and model may run the owner's work (including claim's feature and team-only
 *   variable restrictions), the conversation reports `offline` with the reason; the owner may switch the conversation
 *   to the system default agent and later switch back. Switching transfers unanswered queued messages. Manual fallback
 *   skips an unavailable system default, and restoring requires the original agent to be available again. The owner is
 *   the one answerable for their conversation, so none of this waits for anyone's confirmation.
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
 * directory with the CLI (`conversation attachment download <file-id>`). Agents do not send files back.
 *
 * ## Realtime
 *
 * `CONVERSATIONS_TOPIC` is a per-user topic: each change is announced only to the owner's own connections, and carries
 * no content (`ConversationChanged`). A page that hears one fetches through the API. Pages also poll while a run is
 * open, because announcements reach only the browsers connected to the instance that made the change.
 */
import type { FailureReason, RunStatus } from '@nocobase/agent-protocol';

import type { I18nText } from './i18n.js';

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
  /** The agent is not enabled. */
  'agentArchived',
  /** The owner may no longer wake the agent. */
  'forbidden',
  /** No online runner that has the agent's tool and model may run the owner's work. */
  'noRunner',
  /** Only other people's personal runners have the agent's tool and model. */
  'othersPersonal',
] as const;

export type OfflineReason = (typeof OFFLINE_REASONS)[number];

/** Whether the agent can answer now. */
export interface ChatAvailability {
  readonly online: boolean;
  /** Null when online. */
  readonly reason: OfflineReason | null;
  /** Runners that may run the agent for the owner now. */
  readonly onlineRunners: number;
}

/** A conversation's mode: `runner`, or `online` for a conversation an earlier version answered with an online agent. */
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
  readonly mode: ConversationMode;
  readonly agent: ConversationAgent;
  /** While the conversation uses the system default agent in place of its own (`fallback`): the agent it switches back to. */
  readonly fallbackFrom: ConversationAgent | null;
  /** False when the agent wrote since the owner last marked it read. */
  readonly read: boolean;
  readonly lastMessageAt: string;
  readonly archivedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** The open run, if any: the panel shows "working" and offers to stop. */
  readonly run: ConversationRun | null;
}

/** One conversation as the panel opens it. */
export interface ConversationDetail extends ConversationSummary {
  readonly availability: ChatAvailability;
  /** Another agent may take over (`POST …/fallback`): the system default agent, when it can answer. */
  readonly canFallback: boolean;
  /** The conversation uses another agent and its original agent can answer again (`POST …/restore`). */
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
  /** Written by earlier versions: the conversation used the online fallback agent in place of its runner agent. */
  | {
      readonly code: 'switchedToOnline';
      readonly agentId: string;
      readonly fromAgentId: string;
    }
  /** Written by earlier versions: the configured online fallback could not answer. */
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
 * Written by earlier versions: the online agent consulted another one (`ask_agent`) while answering, one card per call.
 * The consulted agent's own run (`runId`) has its transcript and usage.
 */
export interface ConsultationNotice {
  /** Display-only marker: the requested subject could not be resolved; agentName is a historical snapshot. */
  readonly identitySnapshot?: boolean;
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
  /** Written by earlier versions: an online fallback failure no longer applied. */
  readonly onlineFallbackResolved?: boolean;
  /** The id the browser gave a message it sent, echoed so it can replace its optimistic copy. */
  readonly clientId?: string;
  /** Written by earlier versions: an online agent's reply still being written. */
  readonly streaming?: boolean;
  /** Written by earlier versions: a draft whose run ended before the reply was final. */
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
  /** `fallback`: the conversation already uses another agent in place of its own, or the system default cannot answer. */
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
   * The agent to chat with, which must be enabled. Without one: the person's default agent
   * (`ChatPreferences.defaultAgentId`) while it is enabled, else the system default (`ChatSettings.defaultAgentId`),
   * else `CONVERSATION_CONFLICT` `noChatAgent`.
   */
  readonly agentId?: string;
  /** An explicit title (`user`); otherwise the first message gives one. */
  readonly title?: string;
  /** `panel` by default; otherwise a registered source. */
  readonly source?: ConversationSource;
}

/** `PATCH conversation`: rename (the title becomes `user`'s and the agent may no longer change it), or archive. */
export interface ConversationPatch {
  readonly title?: string;
  readonly archived?: boolean;
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
  readonly isSystemDefault: boolean;
  readonly isMyDefault: boolean;
  readonly availability: ChatAvailability;
  /** Only personal runners have it: it takes only their owners' work. */
  readonly personalOnly: boolean;
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
