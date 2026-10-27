/** UIMessage reconciliation at the durable-history boundary. SDK Chat owns the active messages. */
import { isFileInputFailureReason } from '../../shared/file-input-failures.js';
import type { ConsultationIdentity } from './consultation-identity.js';
import type { RunEvent } from '@nocobase/agent-protocol';
import type {
  ChatAgent,
  ConversationNotice,
  MessageAttachment,
  PageContext,
} from '../../shared/conversations.js';
import type { AppUIData, AppUIMessage } from '../../shared/online-agent.js';
import { toolSummary } from '../lib/tool-summary.js';

/** Input recovery information; this never assembles an assistant message or parses a stream. */
export interface PendingMessage {
  readonly clientId: string;
  readonly content: string;
  readonly context: PageContext | undefined;
  readonly attachments?: readonly MessageAttachment[];
  readonly createdAt: string;
  readonly status: 'sending' | 'failed' | 'unknown';
}
export interface UIMessagePage {
  readonly items: readonly AppUIMessage[];
  readonly hasMore: boolean;
  readonly lastSeq: number;
  readonly nextCursor: string | null;
  readonly nextAfter?: number;
}
export interface MessagesState {
  readonly items: readonly AppUIMessage[];
  readonly pending: readonly PendingMessage[];
  readonly hasMore: boolean;
  readonly olderToken: string | null;
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
  | {
      readonly type: 'replaceHistory';
      readonly seq: number;
      readonly executionId: string;
      readonly lastSeq: number;
    }
  | {
      readonly type: 'page';
      readonly page: UIMessagePage;
      readonly older?: boolean;
      readonly reread?: boolean;
    }
  | { readonly type: 'confirmed'; readonly message: AppUIMessage }
  | { readonly type: 'sending'; readonly message: PendingMessage }
  | {
      readonly type: 'unknown' | 'failed' | 'discard';
      readonly clientId: string;
    }
  | { readonly type: 'reset' };

/** Stable IDs and revisions replace snapshots; an active SDK assistant always wins until the response ends. */
export function mergeUIMessages(
  current: readonly AppUIMessage[],
  batch: readonly AppUIMessage[],
  activeId?: string,
): AppUIMessage[] {
  const accepted = new Set(
    batch.flatMap((message) =>
      message.role === 'user' ? [message.metadata?.clientId ?? message.id] : [],
    ),
  );
  const byId = new Map(
    current
      .filter(
        (message) =>
          !(
            message.role === 'user' &&
            message.metadata?.seq === undefined &&
            accepted.has(message.id) &&
            !batch.some((item) => item.id === message.id)
          ),
      )
      .map((message) => [message.id, message]),
  );
  for (const message of batch) {
    const previous = byId.get(message.id);
    if (
      previous &&
      (message.id === activeId ||
        (previous.metadata?.revision ?? 0) > (message.metadata?.revision ?? 0))
    )
      continue;
    byId.set(message.id, message);
  }
  const ordered = [...byId.values()].sort((a, b) => {
    const left = a.metadata?.seq,
      right = b.metadata?.seq;
    if (left !== undefined && right !== undefined) return left - right;
    if (left !== undefined) return -1;
    if (right !== undefined) return 1;
    return (a.metadata?.createdAt ?? '').localeCompare(
      b.metadata?.createdAt ?? '',
    );
  });
  // SDK live writes target the final assistant. Rendering follows source metadata, not this working order.
  const active = activeId ? byId.get(activeId) : undefined;
  return active
    ? [...ordered.filter((message) => message.id !== activeId), active]
    : ordered;
}
export function messagesReducer(
  state: MessagesState,
  action: MessagesAction,
): MessagesState {
  switch (action.type) {
    case 'replaceHistory':
      return {
        ...state,
        items: state.items.filter(
          (message) =>
            (message.metadata?.seq !== undefined &&
              message.metadata.seq <= action.seq) ||
            (message.role === 'assistant' &&
              message.metadata?.executionId === action.executionId),
        ),
        lastSeq: Math.max(state.lastSeq, action.lastSeq),
      };
    case 'page': {
      const items = mergeUIMessages(state.items, action.page.items);
      return {
        ...state,
        items,
        pending: state.pending.filter(
          (pending) =>
            !items.some(
              (message) =>
                message.id === pending.clientId ||
                message.metadata?.clientId === pending.clientId,
            ),
        ),
        hasMore:
          action.older || !state.loaded ? action.page.hasMore : state.hasMore,
        olderToken:
          action.older || !state.loaded
            ? action.page.nextCursor
            : state.olderToken,
        lastSeq: Math.max(state.lastSeq, action.page.lastSeq),
        loaded: true,
      };
    }
    case 'confirmed':
      return messagesReducer(state, {
        type: 'page',
        page: {
          items: [action.message],
          lastSeq: action.message.metadata?.seq ?? state.lastSeq,
          hasMore: state.hasMore,
          nextCursor: state.olderToken,
        },
      });
    case 'sending':
      return { ...state, pending: [...state.pending, action.message] };
    case 'unknown':
    case 'failed':
      return {
        ...state,
        pending: state.pending.map((message) =>
          message.clientId === action.clientId
            ? {
                ...message,
                status: action.type === 'unknown' ? 'unknown' : 'failed',
              }
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
export function lastLoadedSeq(state: MessagesState): number {
  return Math.max(
    0,
    ...state.items.map((message) => message.metadata?.seq ?? 0),
  );
}
export function fetchCursor(state: MessagesState): number {
  return lastLoadedSeq(state);
}

/** A rendering segment keeps its original UIMessage; it never creates another SDK message. */
export interface ChatMessageSegment {
  readonly key: string;
  readonly message: AppUIMessage;
  readonly partIndexes: readonly number[];
  readonly seq?: number;
  readonly at: string;
  readonly first: boolean;
  readonly last: boolean;
}
export function chatMessageSegments(
  messages: readonly AppUIMessage[],
): ChatMessageSegment[] {
  const segments = messages
    .flatMap((message) => {
      const partIndexes = message.parts.flatMap((part, index) =>
        (part.type === 'text' &&
          !part.text.trim() &&
          !message.metadata?.sourceRecords?.some(
            (source) => source.partIndex === index && source.output,
          )) ||
        part.type === 'step-start' ||
        (part.type === 'reasoning' && !part.text.trim()) ||
        (part.type === 'data-notice' &&
          part.id === 'execution-status' &&
          part.data.type === 'completed')
          ? []
          : [index],
      );
      if (!partIndexes.length && message.role !== 'user') return [];
      const sources = message.metadata?.sourceRecords;
      if (!sources?.length || !partIndexes.length)
        return [
          {
            key: message.id,
            message,
            partIndexes,
            seq: message.metadata?.seq,
            at: message.metadata?.createdAt ?? '',
            first: true,
            last: true,
          },
        ];
      if (message.role === 'assistant') {
        // Source records position parts of one SDK response. Adjacent sources are joined after all
        // messages are ordered, so an intervening card or user message remains between its replies.
        const visible = new Set(partIndexes);
        const ordered = [...sources]
          .sort((a, b) => a.seq - b.seq)
          .filter((source) => visible.has(source.partIndex));
        const groups = new Map<
          string,
          { indexes: number[]; seq: number; at: string }
        >();
        const placed = new Set<number>();
        for (const source of ordered) {
          if (placed.has(source.partIndex)) continue;
          const group = groups.get(source.recordId) ?? {
            indexes: [],
            seq: source.seq,
            at: source.createdAt ?? message.metadata?.createdAt ?? '',
          };
          group.indexes.push(source.partIndex);
          groups.set(source.recordId, group);
          placed.add(source.partIndex);
        }
        const entries = [...groups];
        // SDK parts without source metadata stay with the latest known part of their response.
        if (!entries.length)
          return [
            {
              key: message.id,
              message,
              partIndexes,
              seq: message.metadata?.seq,
              at: message.metadata?.createdAt ?? '',
              first: true,
              last: true,
            },
          ];
        entries
          .at(-1)![1]
          .indexes.push(...partIndexes.filter((index) => !placed.has(index)));
        return entries.map(([recordId, group], index) => ({
          key: index === 0 ? message.id : `${message.id}:${recordId}`,
          message,
          partIndexes: group.indexes,
          seq: group.seq,
          at: group.at,
          first: index === 0,
          last: index === entries.length - 1,
        }));
      }
      const groups = new Map<
        string,
        { indexes: number[]; seq: number; at: string }
      >();
      const visibleIndexes = new Set(partIndexes);
      for (const source of sources) {
        if (!message.parts[source.partIndex]) continue;
        const group = groups.get(source.recordId) ?? {
          indexes: [],
          seq: source.seq,
          at: source.createdAt ?? message.metadata!.createdAt,
        };
        if (visibleIndexes.has(source.partIndex))
          group.indexes.push(source.partIndex);
        groups.set(source.recordId, group);
      }
      const entries = [...groups].filter(([, group]) => group.indexes.length);
      return entries.map(([recordId, group], index) => ({
        key: `${message.id}:${recordId}`,
        message,
        partIndexes: group.indexes,
        seq: group.seq,
        at: group.at,
        first: index === 0,
        last: index === entries.length - 1,
      }));
    })
    .sort((a, b) =>
      a.seq !== undefined && b.seq !== undefined
        ? a.seq - b.seq
        : a.at.localeCompare(b.at),
    );
  const merged: (Omit<ChatMessageSegment, 'partIndexes'> & {
    partIndexes: number[];
  })[] = [];
  for (const segment of segments) {
    const previous = merged.at(-1);
    if (
      segment.message.role === 'assistant' &&
      previous?.message === segment.message
    ) {
      previous.partIndexes.push(...segment.partIndexes);
      merged[merged.length - 1] = { ...previous, last: segment.last };
    } else merged.push({ ...segment, partIndexes: [...segment.partIndexes] });
  }
  return merged;
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
export type NewsNotice = AppUIData['notice'];

/**
 * The agent a new conversation would go to: the one picked, else the one last used (`lastUsed`, when the application
 * remembers it), else the viewer's default, else the system default.
 */
export function newConversationAgent(
  agents: readonly ChatAgent[] | undefined,
  picked: string | null,
  lastUsed: string | null = null,
): ChatAgent | null {
  if (!agents) return null;
  return (
    (picked ? agents.find((agent) => agent.id === picked) : undefined) ??
    (lastUsed ? agents.find((agent) => agent.id === lastUsed) : undefined) ??
    agents.find((agent) => agent.isMyDefault) ??
    agents.find((agent) => agent.isSystemDefault) ??
    null
  );
}

/** Messages and other items in time order; an item follows the messages created at or before it. */
export function timelineOrder<
  T extends {
    readonly at: string;
    readonly rank: number;
    readonly seq?: number;
  },
>(entries: readonly T[]): T[] {
  const timed = (values: readonly T[]) =>
    values
      .map((entry, index) => ({ entry, index }))
      .sort(
        (a, b) =>
          a.entry.at.localeCompare(b.entry.at) ||
          a.entry.rank - b.entry.rank ||
          a.index - b.index,
      )
      .map(({ entry }) => entry);
  const messages = entries
    .filter((entry) => entry.rank === 0 && entry.seq !== undefined)
    .sort((a, b) => a.seq! - b.seq!);
  if (!messages.length) return timed(entries);
  const remaining = timed(
    entries.filter((entry) => entry.rank !== 0 || entry.seq === undefined),
  );
  const result: T[] = [];
  let cursor = 0;
  for (const message of messages) {
    while (cursor < remaining.length && remaining[cursor].at < message.at)
      result.push(remaining[cursor++]);
    result.push(message);
  }
  return [...result, ...remaining.slice(cursor)];
}

export function stepLineText(t: Translate, line: StepLine): string {
  if (line.kind === 'thinking') return t('chat.steps.thinking');
  return t(`chat.steps.${line.kind}`, { subject: line.subject });
}

/**
 * A notice in the viewer's language; the English `content` when the code is unknown. News is worded by the
 * application (`newsText`), else read as its English title. For a loaded consultation, pass `useConsultationIdentity`'s
 * result to distinguish loading, refusal and a missing subject without exposing a hidden identity.
 */
export function noticeText(
  t: Translate,
  notice: ConversationNotice | undefined,
  fallback: string,
  agentName: (agentId: string) => string,
  newsText?: (notice: NewsNotice, t: Translate) => string | null,
  consultationIdentity?: ConsultationIdentity,
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
    case 'switchedAgent':
      return t('chat.notice.switchedAgent', {
        name: agentName(notice.agentId),
      });
    case 'switchedBack':
      return t('chat.notice.switchedBack', { name: agentName(notice.agentId) });
    case 'runFailed':
      return notice.reason
        ? t('chat.notice.runFailedReason', {
            reason: t(`failures.${notice.reason}`),
          })
        : t('chat.notice.runFailed');
    // The historical code names a cancellation request, not a terminal outcome.
    case 'runCancelled':
      return t('chat.notice.runCancelled');
    case 'news': {
      const custom = newsText?.(notice, t);
      if (custom !== undefined && custom !== null) return custom;
      const reason = notice.params?.fileInputReason;
      if (notice.type === 'failed' && reason !== undefined)
        return t(
          `chat.fileInputFailures.${isFileInputFailureReason(reason) ? reason : 'preparationFailed'}`,
        );
      if (notice.type === 'failed' && notice.title === 'Interrupted')
        return t('chat.executionFailed');
      return notice.title;
    }
    case 'consultation':
      if (consultationIdentity?.state === 'unavailable')
        return t('chat.consultation.unavailableTitle');
      return t(
        consultationIdentity?.state === 'snapshot' ||
          (!consultationIdentity &&
            (notice.identitySnapshot || !notice.agentId))
          ? 'chat.consultation.snapshotTitle'
          : 'chat.consultation.title',
        {
          name: consultationIdentity
            ? consultationIdentity.state === 'loading'
              ? '…'
              : consultationIdentity.name
            : notice.agentId && !notice.identitySnapshot
              ? agentName(notice.agentId)
              : notice.agentName,
        },
      );
    default:
      return fallback;
  }
}
