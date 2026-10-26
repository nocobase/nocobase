/**
 * A session's transcript as the page shows it: the events folded, in order, into what a person reads. Pieces of a
 * streamed message become one message, the updates of a tool call one call, consecutive calls one group, and the
 * records the session's turn tied to it one card at the end of that turn. Updates this version does not know are left
 * out rather than shown raw.
 */
import type {
  PermissionOption,
  TurnUsage,
} from '@nocobase/acp-bridge/protocol';

import type { PromptPart, TranscriptEvent } from '../shared/api.js';

export type ToolKind =
  | 'read'
  | 'edit'
  | 'delete'
  | 'move'
  | 'search'
  | 'execute'
  | 'think'
  | 'fetch'
  | 'other';
export type ToolStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ToolDiff {
  readonly path: string;
  readonly oldText: string | null;
  readonly newText: string;
}

export interface ToolCall {
  readonly id: string;
  readonly title: string;
  readonly kind: ToolKind;
  readonly status: ToolStatus;
  readonly locations: readonly string[];
  /** What the call printed or returned, as text. */
  readonly output: string;
  readonly diffs: readonly ToolDiff[];
}

export type PromptState =
  | 'queued'
  | 'running'
  | 'done'
  | 'cancelled'
  | 'failed'
  | 'withdrawing'
  | 'withdrawn';

export type TranscriptItem =
  | {
      readonly type: 'prompt';
      readonly key: string;
      readonly at: string;
      readonly text: string;
      readonly images: readonly (Extract<PromptPart, { type: 'image' }> & {
        readonly id: string;
      })[];
      readonly state: PromptState;
      readonly withdrawable: boolean;
      readonly promptId: string;
      readonly retryOfPromptId?: string | undefined;
      readonly superseded?: boolean;
    }
  | { readonly type: 'message'; readonly key: string; readonly text: string }
  | { readonly type: 'thought'; readonly key: string; readonly text: string }
  | {
      readonly type: 'tools';
      readonly key: string;
      readonly calls: readonly ToolCall[];
    }
  | {
      readonly type: 'plan';
      readonly key: string;
      readonly entries: readonly {
        readonly id: string;
        readonly content: string;
        readonly status: string;
      }[];
    }
  | {
      readonly type: 'permission';
      readonly key: string;
      readonly requestId: string;
      readonly title: string;
      readonly detail: string;
      readonly options: readonly PermissionOption[];
      /** The option chosen, `declined`, `cancelled` or `timedOut` once settled; null while it waits. */
      readonly outcome: string | null;
    }
  | {
      readonly type: 'turn';
      readonly key: string;
      readonly stopReason: string | null;
      readonly usage: TurnUsage | null;
      readonly error: string | null;
      readonly seconds: number | null;
    }
  | {
      readonly type: 'notice';
      readonly key: string;
      readonly level: 'error' | 'warning';
      readonly message: string;
    }
  | {
      readonly type: 'links';
      readonly key: string;
      readonly linkKind: string;
      readonly refIds: readonly string[];
    };

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export function editablePrompts(
  items: readonly TranscriptItem[],
): ReadonlySet<string> {
  const prompts = items.filter((item) => item.type === 'prompt');
  if (
    prompts.some(
      (item) =>
        item.state === 'queued' ||
        item.state === 'running' ||
        item.state === 'withdrawing',
    )
  )
    return new Set();
  const last = prompts
    .filter((item) => ['done', 'failed', 'cancelled'].includes(item.state))
    .at(-1);
  const waiting = prompts.find(
    (item) => item.state === 'withdrawn' && !item.superseded,
  );
  return new Set([
    ...(last?.state === 'cancelled' && !last.superseded ? [last.promptId] : []),
    ...(waiting ? [waiting.promptId] : []),
  ]);
}
type Draft = Mutable<TranscriptItem>;
type Update = Readonly<Record<string, unknown>>;

const TOOL_KINDS: readonly ToolKind[] = [
  'read',
  'edit',
  'delete',
  'move',
  'search',
  'execute',
  'think',
  'fetch',
];
const STATUSES: readonly ToolStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'failed',
];

export function foldTranscript(
  events: readonly TranscriptEvent[],
): TranscriptItem[] {
  const items: Draft[] = [];
  const prompts = new Map<
    string,
    Mutable<Extract<TranscriptItem, { type: 'prompt' }>>
  >();
  const calls = new Map<string, Mutable<ToolCall>>();
  const permissions = new Map<
    string,
    Mutable<Extract<TranscriptItem, { type: 'permission' }>>
  >();
  let messageId: unknown;
  let started: { promptId: string; at: number } | undefined;
  let linked: { kind: string; refIds: string[] }[] = [];

  const flushLinks = (seq: number): void => {
    for (const group of linked)
      items.push({
        type: 'links',
        key: `links-${seq}-${group.kind}`,
        linkKind: group.kind,
        refIds: group.refIds,
      });
    linked = [];
  };

  for (const event of events) {
    const key = String(event.seq);
    switch (event.kind) {
      case 'prompt': {
        const item = {
          type: 'prompt' as const,
          key,
          at: event.at,
          text: event.content
            .flatMap((part) => (part.type === 'text' ? [part.text] : []))
            .join('\n\n'),
          images: event.content
            .filter(
              (part): part is Extract<PromptPart, { type: 'image' }> =>
                part.type === 'image',
            )
            .map((image, index) => ({ ...image, id: `${key}:${index}` })),
          state: 'queued' as PromptState,
          withdrawable: event.withdrawable === true,
          promptId: event.promptId,
          retryOfPromptId: event.retryOfPromptId,
        };
        prompts.set(event.promptId, item);
        items.push(item);
        break;
      }
      case 'turnStarted': {
        const prompt = prompts.get(event.promptId);
        if (prompt?.state === 'withdrawing' || prompt?.state === 'withdrawn')
          break;
        if (prompt) prompt.state = 'running';
        started = { promptId: event.promptId, at: Date.parse(event.at) };
        messageId = undefined;
        break;
      }
      case 'turnEnded': {
        const prompt = prompts.get(event.promptId);
        if (prompt?.state === 'withdrawing' || prompt?.state === 'withdrawn')
          break;
        const ran = started?.promptId === event.promptId;
        if (prompt)
          prompt.state = event.error
            ? 'failed'
            : event.stopReason === 'cancelled'
              ? 'cancelled'
              : 'done';
        if (ran) {
          items.push({
            type: 'turn',
            key,
            stopReason: event.stopReason,
            usage: event.usage,
            error: event.error,
            seconds: started
              ? Math.max(
                  0,
                  Math.round((Date.parse(event.at) - started.at) / 1000),
                )
              : null,
          });
          flushLinks(event.seq);
          started = undefined;
        }
        messageId = undefined;
        break;
      }
      case 'withdrawalRequested':
      case 'promptWithdrawn': {
        const prompt = prompts.get(event.promptId);
        if (prompt)
          prompt.state =
            event.kind === 'promptWithdrawn' ? 'withdrawn' : 'withdrawing';
        break;
      }
      case 'update':
        messageId = foldUpdate(items, calls, event.update, key, messageId);
        break;
      case 'permissionRequested': {
        const toolCall = event.toolCall;
        const item = {
          type: 'permission' as const,
          key,
          requestId: event.requestId,
          title: text(toolCall.title) ?? 'Tool call',
          detail: describeInput(toolCall.rawInput),
          options: event.options,
          outcome: null as string | null,
        };
        permissions.set(event.requestId, item);
        items.push(item);
        messageId = undefined;
        break;
      }
      case 'permissionResolved': {
        const item = permissions.get(event.requestId);
        if (item)
          item.outcome =
            event.reason === 'answered'
              ? (event.optionId ?? 'declined')
              : event.reason;
        break;
      }
      case 'notice':
        items.push({
          type: 'notice',
          key,
          level: event.level,
          message: event.message,
        });
        messageId = undefined;
        break;
      case 'link': {
        const group = linked.find(
          (candidate) => candidate.kind === event.linkKind,
        );
        if (group) group.refIds.push(event.refId);
        else linked.push({ kind: event.linkKind, refIds: [event.refId] });
        break;
      }
    }
  }
  flushLinks(events.at(-1)?.seq ?? 0);
  // Execution events stay with their actual attempt. Retries share the original input's position;
  // queued inputs therefore never move ahead of the interrupted reply they were waiting behind.
  const positions = new Map<string, { root: number; attempt: number }>();
  const owners = new Map<number, { root: number; attempt: number }>();
  let active: { root: number; attempt: number } | undefined;
  for (const event of events) {
    if (event.kind === 'prompt') {
      const previous =
        event.retryOfPromptId && positions.get(event.retryOfPromptId);
      const position = {
        root: previous ? previous.root : event.seq,
        attempt: event.seq,
      };
      positions.set(event.promptId, position);
      owners.set(event.seq, position);
      if (event.retryOfPromptId) {
        const prior = prompts.get(event.retryOfPromptId);
        if (prior) prior.superseded = true;
      }
    } else {
      if (event.kind === 'turnStarted') active = positions.get(event.promptId);
      if (active) owners.set(event.seq, active);
      if (
        event.kind === 'turnEnded' &&
        active === positions.get(event.promptId)
      )
        active = undefined;
    }
  }
  const position = (item: Draft): { root: number; attempt: number } => {
    const seq = Number(
      item.key.startsWith('links-') ? item.key.split('-')[1] : item.key,
    );
    return owners.get(seq) ?? { root: seq, attempt: seq };
  };
  return items.sort((left, right) => {
    const a = position(left),
      b = position(right);
    return a.root - b.root || a.attempt - b.attempt;
  });
}

/** Folds one ACP update into the items; the id of the message the next piece would continue. */
function foldUpdate(
  items: Draft[],
  calls: Map<string, Mutable<ToolCall>>,
  update: Update,
  key: string,
  messageId: unknown,
): unknown {
  switch (update.sessionUpdate) {
    case 'agent_message_chunk':
    case 'agent_thought_chunk': {
      const type =
        update.sessionUpdate === 'agent_message_chunk' ? 'message' : 'thought';
      const piece = contentText(update.content);
      const last = items.at(-1);
      if (last?.type === type && update.messageId === messageId)
        last.text += piece;
      else items.push({ type, key, text: piece });
      return update.messageId;
    }
    case 'tool_call':
    case 'tool_call_update': {
      const id = text(update.toolCallId);
      if (!id) return undefined;
      let call = calls.get(id);
      if (!call) {
        call = {
          id,
          title: 'Tool call',
          kind: 'other',
          status: 'pending',
          locations: [],
          output: '',
          diffs: [],
        };
        calls.set(id, call);
        const last = items.at(-1);
        if (last?.type === 'tools') last.calls = [...last.calls, call];
        else items.push({ type: 'tools', key, calls: [call] });
      }
      applyToolUpdate(call, update);
      return undefined;
    }
    case 'plan': {
      const entries = Array.isArray(update.entries)
        ? update.entries.flatMap((entry: Update, index: number) => {
            const content = text(entry.content);
            return content
              ? [
                  {
                    id: `${key}:${index}`,
                    content,
                    status: text(entry.status) ?? 'pending',
                  },
                ]
              : [];
          })
        : [];
      const last = items.at(-1);
      if (last?.type === 'plan') last.entries = entries;
      else items.push({ type: 'plan', key, entries });
      return undefined;
    }
    default:
      return messageId;
  }
}

function applyToolUpdate(call: Mutable<ToolCall>, update: Update): void {
  call.title = text(update.title) ?? call.title;
  const kind = text(update.kind);
  // An MCP tool's call is a tool call, whatever kind the agent reports it as (Codex says `execute`).
  if (call.title.startsWith('mcp.')) call.kind = 'other';
  else if (kind)
    call.kind = (TOOL_KINDS as readonly string[]).includes(kind)
      ? (kind as ToolKind)
      : 'other';
  const status = text(update.status);
  if (status && (STATUSES as readonly string[]).includes(status))
    call.status = status as ToolStatus;
  if (Array.isArray(update.locations)) {
    call.locations = update.locations.flatMap((location: Update) =>
      text(location.path) ? [text(location.path)!] : [],
    );
  }
  if (Array.isArray(update.content)) {
    const outputs: string[] = [];
    const diffs: ToolDiff[] = [];
    const entries: readonly Update[] = update.content;
    for (const entry of entries) {
      if (entry.type === 'diff' && text(entry.path)) {
        diffs.push({
          path: text(entry.path)!,
          oldText: text(entry.oldText) ?? null,
          newText: text(entry.newText) ?? '',
        });
      } else if (entry.type === 'content') {
        outputs.push(contentText(entry.content));
      }
    }
    call.diffs = diffs;
    if (outputs.length > 0) call.output = outputs.join('\n');
  }
  // Codex streams a command's output as `_meta.terminal_output_delta` pieces, outside ACP's own content.
  const delta = (
    update._meta as { terminal_output_delta?: { data?: unknown } } | undefined
  )?.terminal_output_delta;
  if (typeof delta?.data === 'string') call.output += delta.data;
}

function contentText(content: unknown): string {
  const block = content as Update | undefined;
  if (block?.type === 'text') return text(block.text) ?? '';
  if (block?.type === 'resource_link') return text(block.uri) ?? '';
  return '';
}

/** What a tool call wants to do, from its input: the command it runs, else the input as compact JSON. */
function describeInput(input: unknown): string {
  if (input === undefined || input === null) return '';
  const fields = input as Update;
  const command = fields.command ?? fields.cmd;
  if (typeof command === 'string') return command;
  if (Array.isArray(command)) return command.join(' ');
  return JSON.stringify(input, null, 2);
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Counts of a tool group's calls by kind, for its one-line summary. */
export function toolSummary(
  calls: readonly ToolCall[],
): readonly { readonly kind: ToolKind; readonly count: number }[] {
  const counts = new Map<ToolKind, number>();
  for (const call of calls)
    counts.set(call.kind, (counts.get(call.kind) ?? 0) + 1);
  return [...counts].map(([kind, count]) => ({ kind, count }));
}
