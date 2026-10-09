/**
 * A conversation's messages in the browser, as plain data: the pages fetched so far merged by `seq`, the messages the
 * person sent that the server has not confirmed yet (optimistic, replaced once a message with the same
 * `metadata.clientId` arrives), and the step line of the run that is answering. An online agent's reply arrives as a
 * draft that grows in place at the same `seq` (`metadata.streaming`): merging by `seq` replaces it with each fetch.
 */
import type { RunEvent } from '@nocobase/agent-protocol';

import type {
  ChatAgent,
  ConversationMessage,
  ConversationNotice,
  MessageAttachment,
  MessagePage,
  PageContext,
} from '../../shared/conversations.js';
import { toolSummary } from '../lib/tool-summary.js';

/** A message the person sent, shown until the server's copy arrives. */
export interface PendingMessage {
  readonly clientId: string;
  readonly content: string;
  readonly context: PageContext | undefined;
  /** The files sent with it, already uploaded. */
  readonly attachments?: readonly MessageAttachment[];
  readonly createdAt: string;
  /** `failed`: not saved; the person may send it again. */
  readonly status: 'sending' | 'failed';
}

export interface MessagesState {
  /** Oldest first, each `seq` once. */
  readonly items: readonly ConversationMessage[];
  readonly pending: readonly PendingMessage[];
  /** There are older messages than the first one loaded. */
  readonly hasMore: boolean;
  /** The page token of the older messages, while there are any. */
  readonly olderToken: string | null;
  /** The highest `seq` the server has reported. */
  readonly lastSeq: number;
  readonly loaded: boolean;
}

export const EMPTY_MESSAGES: MessagesState = {
  items: [],
  pending: [],
  hasMore: false,
  olderToken: null,
  lastSeq: 0,
  loaded: false,
};

export type MessagesAction =
  /** A page arrived: the newest page, a page `after`, or an older page. */
  | {
      readonly type: 'page';
      readonly page: MessagePage & { readonly nextCursor?: string | null };
      readonly older?: boolean;
    }
  /** The server confirmed a message (the answer of a send). */
  | { readonly type: 'confirmed'; readonly message: ConversationMessage }
  | { readonly type: 'sending'; readonly message: PendingMessage }
  | { readonly type: 'failed'; readonly clientId: string }
  | { readonly type: 'discard'; readonly clientId: string }
  | { readonly type: 'reset' };

function merge(
  current: readonly ConversationMessage[],
  batch: readonly ConversationMessage[],
): readonly ConversationMessage[] {
  if (batch.length === 0) return current;
  const bySeq = new Map(current.map((message) => [message.seq, message]));
  for (const message of batch) bySeq.set(message.seq, message);
  return [...bySeq.values()].sort((a, b) => a.seq - b.seq);
}

/** Drops the optimistic copies of messages the server now has. */
function settle(
  pending: readonly PendingMessage[],
  items: readonly ConversationMessage[],
): readonly PendingMessage[] {
  if (pending.length === 0) return pending;
  const confirmed = new Set(
    items
      .map((message) => message.metadata.clientId)
      .filter((id): id is string => typeof id === 'string'),
  );
  const next = pending.filter((message) => !confirmed.has(message.clientId));
  return next.length === pending.length ? pending : next;
}

export function messagesReducer(
  state: MessagesState,
  action: MessagesAction,
): MessagesState {
  switch (action.type) {
    case 'page': {
      const items = merge(state.items, action.page.items);
      return {
        items,
        pending: settle(state.pending, items),
        // An older page tells whether there is more before it; a newer one leaves what the first load said.
        hasMore:
          action.older || !state.loaded ? action.page.hasMore : state.hasMore,
        olderToken:
          action.older || !state.loaded
            ? (action.page.nextCursor ?? null)
            : state.olderToken,
        lastSeq: Math.max(state.lastSeq, action.page.lastSeq),
        loaded: true,
      };
    }
    case 'confirmed': {
      const items = merge(state.items, [action.message]);
      return {
        ...state,
        items,
        pending: settle(state.pending, items),
        lastSeq: Math.max(state.lastSeq, action.message.seq),
      };
    }
    case 'sending':
      return { ...state, pending: [...state.pending, action.message] };
    case 'failed':
      return {
        ...state,
        pending: state.pending.map((message) =>
          message.clientId === action.clientId
            ? { ...message, status: 'failed' }
            : message,
        ),
      };
    case 'discard':
      return {
        ...state,
        pending: state.pending.filter(
          (message) => message.clientId !== action.clientId,
        ),
      };
    case 'reset':
      return EMPTY_MESSAGES;
  }
}

/** The highest `seq` loaded, to ask `after` with; 0 before anything was loaded. */
export function lastLoadedSeq(state: MessagesState): number {
  return state.items.at(-1)?.seq ?? 0;
}

/** The lowest `seq` of a reply still being written (`metadata.streaming`), or null when none is. */
export function streamingSeq(state: MessagesState): number | null {
  return state.items.find((message) => message.metadata.streaming)?.seq ?? null;
}

/**
 * Where to fetch newer messages from: after the last one loaded, or from just before a reply still being written,
 * which grows in place (same `seq`) until it is final.
 */
export function fetchCursor(state: MessagesState): number {
  const streaming = streamingSeq(state);
  const last = lastLoadedSeq(state);
  return streaming === null ? last : Math.min(last, streaming - 1);
}

let clientSeed = 0;

/** An id for a message the browser sends, echoed back in `metadata.clientId`. */
export function newClientId(): string {
  clientSeed += 1;
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `c-${random}-${clientSeed}`;
}

// ---------------------------------------------------------------------------------------------------------------------
// The step line of the answering run
// ---------------------------------------------------------------------------------------------------------------------

export type StepLine =
  | { readonly kind: 'thinking' }
  /** Reading or looking something up: `subject` is what. */
  | { readonly kind: 'reading'; readonly subject: string }
  /** Running a command or changing something: `subject` is what. */
  | { readonly kind: 'working'; readonly subject: string };

export interface LiveStepsView {
  /** The steps since the agent last wrote to the conversation: what the folded line expands to. */
  readonly steps: readonly RunEvent[];
  readonly line: StepLine;
}

const READ_TOOLS = new Set([
  'read',
  'grep',
  'glob',
  'ls',
  'webfetch',
  'websearch',
  'search',
  'view',
]);
const READ_COMMAND =
  /\b(get|list|ls|search|show|view|find|cat|grep|rg|read|status|log|diff|inbox|roster)\b/u;
const STEP_TYPES = new Set(['thinking', 'toolUse', 'toolResult', 'permission']);

/** What a tool call is about, for the step line: the summary without the shell prompt. */
function subjectOf(event: RunEvent): string {
  const summary = toolSummary(event.input);
  const text = summary?.startsWith('$ ') ? summary.slice(2) : summary;
  return text || event.tool || '';
}

function lineOf(event: RunEvent | undefined): StepLine {
  if (!event || event.type !== 'toolUse') return { kind: 'thinking' };
  const subject = subjectOf(event);
  if (!subject) return { kind: 'thinking' };
  const tool = (event.tool ?? '').toLowerCase();
  // A command reads when one of its first words is a read verb (`acme record get REC-12`, `git log`).
  const head = subject.split(/\s+/u).slice(0, 4).join(' ');
  const reads = READ_TOOLS.has(tool) || READ_COMMAND.test(head);
  return reads ? { kind: 'reading', subject } : { kind: 'working', subject };
}

/**
 * The run's steps since its last text (which became a message), and the line that sums them up: "thinking" until a
 * tool call, then what the last tool call is about.
 */
export function liveStepsView(events: readonly RunEvent[]): LiveStepsView {
  let start = 0;
  events.forEach((event, index) => {
    if (event.type === 'text' && event.content?.trim()) start = index + 1;
  });
  const steps = events
    .slice(start)
    .filter((event) => STEP_TYPES.has(event.type));
  const lastTool = [...steps]
    .reverse()
    .find((event) => event.type === 'toolUse');
  const lastStep = steps.at(-1);
  return {
    steps,
    line:
      lastStep?.type === 'thinking' ? { kind: 'thinking' } : lineOf(lastTool),
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Helpers of the views
// ---------------------------------------------------------------------------------------------------------------------

export type Translate = (
  key: string,
  options?: Record<string, unknown>,
) => string;

/** A notice of what happened outside the conversation (`ConversationNotice` `news`). */
export type NewsNotice = Extract<ConversationNotice, { code: 'news' }>;

/** The agent a new conversation would go to: the one picked, else the viewer's default, else the system default. */
export function newConversationAgent(
  agents: readonly ChatAgent[] | undefined,
  picked: string | null,
): ChatAgent | null {
  if (!agents) return null;
  return (
    (picked ? agents.find((agent) => agent.id === picked) : undefined) ??
    agents.find((agent) => agent.isMyDefault) ??
    agents.find((agent) => agent.isSystemDefault) ??
    null
  );
}

/** Messages and other items in time order; an item follows the messages created at or before it. */
export function timelineOrder<
  T extends { readonly at: string; readonly rank: number },
>(entries: readonly T[]): T[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort(
      (a, b) =>
        a.entry.at.localeCompare(b.entry.at) ||
        a.entry.rank - b.entry.rank ||
        a.index - b.index,
    )
    .map(({ entry }) => entry);
}

export function stepLineText(t: Translate, line: StepLine): string {
  if (line.kind === 'thinking') return t('chat.steps.thinking');
  return t(`chat.steps.${line.kind}`, { subject: line.subject });
}

/**
 * A notice in the viewer's language; the English `content` when the code is unknown. News is worded by the
 * application (`newsText`), else read as its English title.
 */
export function noticeText(
  t: Translate,
  notice: ConversationNotice | undefined,
  fallback: string,
  agentName: (agentId: string) => string,
  newsText?: (notice: NewsNotice, t: Translate) => string | null,
): string {
  if (!notice) return fallback;
  switch (notice.code) {
    case 'switchedToDefault':
      return t('chat.notice.switchedToDefault', {
        name: agentName(notice.agentId),
        own: agentName(notice.fromAgentId),
      });
    case 'switchedToOnline':
      return t('chat.notice.switchedToOnline', {
        name: agentName(notice.agentId),
        own: agentName(notice.fromAgentId),
      });
    case 'onlineFallbackUnavailable':
      return t('chat.notice.onlineFallbackUnavailable', {
        own: agentName(notice.fromAgentId),
        reason: t(`chat.availability.${notice.reason}`),
      });
    case 'switchedBack':
      return t('chat.notice.switchedBack', { name: agentName(notice.agentId) });
    case 'runFailed':
      return notice.reason
        ? t('chat.notice.runFailedReason', {
            reason: t(`failures.${notice.reason}`),
          })
        : t('chat.notice.runFailed');
    case 'runCancelled':
      return t('chat.notice.runCancelled');
    case 'news':
      return newsText?.(notice, t) ?? notice.title;
    case 'consultation':
      return t('chat.consultation.title', { name: notice.agentName });
    default:
      return fallback;
  }
}
