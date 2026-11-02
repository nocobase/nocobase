import { outputBlock } from '@nocobase/agent-protocol';
import {
  publicUIPageContext,
  type AppUIJson,
  type AppUIPlan,
  type AppUITurn,
} from '../../../../shared/ui-message.js';
import type { ConversationMessage } from '../../../../shared/conversations.js';
import {
  validateAppUIMessages,
  type AppUIMessage,
} from '../../../../shared/online-agent.js';
import {
  messagesRepo,
  queuedRevision,
  toMessage,
} from '../../../core/conversations/conversation.store.js';
import type { TxRunner } from '../../../kernel/tx.js';
import {
  eventsRepo,
  runsRepo,
  toExecutions,
  type EventRecord,
} from '../../../core/runs/run.store.js';
import { jsonObject } from '../../../kernel/values.js';
import type { NativeHistoryQuery, NativeHistoryPage } from '../types.js';

export const runnerMessageId = (runId: string): string => `runner:${runId}`;
/** A run's saved reasoning, one of its tool calls (`toolUse`) and results (`toolResult`), its usage or turn status. */
type SavedReasoning = Pick<
  EventRecord,
  'runId' | 'seq' | 'at' | 'content' | 'meta'
> &
  Partial<Pick<EventRecord, 'type' | 'tool' | 'input' | 'output'>>;

/** The run event types a runner response's parts come from besides its messages. */
const RUNNER_STEP_EVENT_TYPES: readonly string[] = [
  'thinking',
  'toolUse',
  'toolResult',
  'usage',
  'input',
];

/** The run `status` events a response reads: a turn's end and the agent's plan. */
const RUNNER_STATUS_CONTENTS: readonly string[] = ['turnCompleted', 'plan'];

function isTurnCompleted(event: SavedReasoning): boolean {
  return event.type === 'status' && event.content === 'turnCompleted';
}

const PLAN_STATUSES = new Set(['pending', 'in_progress', 'completed']);

/** The agent's plan as it last reported it among `events` (ACP plan entries, or the same from Codex), and where. */
export function runnerPlan(
  events: readonly SavedReasoning[],
): { readonly plan: AppUIPlan; readonly seq: number } | null {
  const reported = events.filter(
    (event) => event.type === 'status' && event.content === 'plan',
  );
  const last = reported.at(-1);
  if (!last) return null;
  const entries = jsonObject(last.meta).plan;
  if (!Array.isArray(entries)) return null;
  const plan: AppUIPlan = {
    entries: entries.flatMap((entry) => {
      const { content, status } = jsonObject(entry);
      return typeof content === 'string' && content.trim()
        ? [
            {
              content: content.trim().slice(0, 500),
              status: (typeof status === 'string' && PLAN_STATUSES.has(status)
                ? status
                : 'pending') as AppUIPlan['entries'][number]['status'],
            },
          ]
        : [];
    }),
  };
  return plan.entries.length ? { plan, seq: Number(reported[0].seq) } : null;
}

/** A count the run reported, when it is one. */
function count(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : undefined;
}

/**
 * How the run's turn went, from its events: how long it took (`turnCompleted`'s `durationMs`), its tokens (the last
 * `usage` event, summed over its models) and how it ended (`outcome`, from the run). Null when there is nothing to say.
 */
function runnerTurn(
  events: readonly SavedReasoning[],
  outcome?: AppUITurn['outcome'],
): AppUITurn | null {
  const usage = events.filter((event) => event.type === 'usage').at(-1);
  const completed = events.filter(isTurnCompleted).at(-1);
  const turn: AppUITurn = {};
  const durationMs = count(jsonObject(completed?.meta).durationMs);
  if (durationMs !== undefined) turn.durationMs = durationMs;
  const entries = jsonObject(usage?.meta).usage;
  if (Array.isArray(entries) && entries.length) {
    const sum = (key: string) =>
      entries.reduce<number>(
        (total, entry) => total + (count(jsonObject(entry)[key]) ?? 0),
        0,
      );
    turn.inputTokens = sum('inputTokens');
    turn.cacheReadTokens = sum('cacheReadTokens');
    turn.outputTokens = sum('outputTokens');
  }
  if (outcome) turn.outcome = outcome;
  return Object.keys(turn).length ? turn : null;
}

/** The most run events one read of history projects (the latest ones). */
const RUNNER_EVENTS_MAX = 5000;

/** How much of a step's input strings and output a UI message carries; the run's transcript keeps all of it. */
const STEP_TEXT_MAX = 4000;
const STEP_INPUT_DEPTH = 4;

function bounded(text: string): string {
  return text.length > STEP_TEXT_MAX
    ? `${text.slice(0, STEP_TEXT_MAX)}…`
    : text;
}

function boundedInput(value: unknown, depth = 0): AppUIJson {
  if (typeof value === 'string') return bounded(value);
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : String(value);
  if (typeof value === 'boolean' || value === null) return value;
  if (depth >= STEP_INPUT_DEPTH) return '…';
  if (Array.isArray(value))
    return value.slice(0, 50).map((item) => boundedInput(item, depth + 1));
  if (typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 50)
        .map(([key, item]) => [key, boundedInput(item, depth + 1)]),
    );
  return null;
}

function parsedInput(value: unknown): AppUIJson {
  if (typeof value === 'string')
    try {
      return boundedInput(JSON.parse(value) as unknown);
    } catch {
      return bounded(value);
    }
  return boundedInput(value ?? {});
}

/** A tool call of a run, as one SDK dynamic tool part: its input, then its output or error once it returned. */
export type RunnerToolPart = Extract<
  AppUIMessage['parts'][number],
  { type: 'dynamic-tool' }
>;

/**
 * The run's tool calls among `events`, in order, each with its result when one is among them. Keyed by the part id
 * the response's sources use (`tool:<toolUseId>`).
 */
export function runnerToolParts(
  events: readonly SavedReasoning[],
): Map<
  string,
  { readonly seq: number; readonly at: string; part: RunnerToolPart }
> {
  const parts = new Map<
    string,
    { seq: number; at: string; part: RunnerToolPart }
  >();
  for (const event of events) {
    const meta = jsonObject(event.meta);
    const toolCallId =
      typeof meta.toolUseId === 'string' && meta.toolUseId
        ? meta.toolUseId
        : null;
    if (!toolCallId) continue;
    const id = `tool:${toolCallId}`;
    if (event.type === 'toolUse' && !parts.has(id))
      parts.set(id, {
        seq: Number(event.seq),
        at: event.at,
        part: {
          type: 'dynamic-tool',
          toolName: event.tool || 'tool',
          toolCallId,
          state: 'input-available',
          input: parsedInput(event.input),
        },
      });
    else if (event.type === 'toolResult') {
      const call = parts.get(id);
      if (!call) continue;
      const output = bounded(event.output ?? '');
      call.part =
        meta.isError === true
          ? {
              type: 'dynamic-tool',
              toolName: call.part.toolName,
              toolCallId,
              state: 'output-error',
              input: call.part.input,
              errorText: output || 'Failed',
            }
          : {
              type: 'dynamic-tool',
              toolName: call.part.toolName,
              toolCallId,
              state: 'output-available',
              input: call.part.input,
              output,
            };
    }
  }
  return parts;
}
/** Pure projection: no Run inference from prose and no invented tools or approvals. */
export function runnerUIMessages(
  rows: ConversationMessage[],
  reasoning: readonly SavedReasoning[] = [],
  /** How each finished run ended, by run id. */
  outcomes: ReadonlyMap<string, AppUITurn['outcome']> = new Map(),
  defaultEffortRuns: ReadonlySet<string> = new Set(),
): AppUIMessage[] {
  const messages = new Map<string, AppUIMessage>();
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    const grouped = row.role === 'assistant' && row.runId;
    const id = grouped ? runnerMessageId(row.runId) : row.id;
    let message = messages.get(id);
    if (!message) {
      message = {
        id,
        role:
          row.role === 'user'
            ? 'user'
            : row.role === 'assistant'
              ? 'assistant'
              : 'system',
        metadata: {
          conversationId: row.conversationId,
          createdAt: row.createdAt,
          revision: row.seq,
          seq: row.seq,
          ...(row.metadata.clientId ? { clientId: row.metadata.clientId } : {}),
          ...(row.metadata.agentId ? { agentId: row.metadata.agentId } : {}),
          ...(typeof row.metadata.effort === 'string'
            ? { effort: row.metadata.effort }
            : {}),
          ...(row.runId ? { executionId: row.runId, turnId: row.runId } : {}),
          sourceRecords: [],
          ...(row.workContext
            ? { context: publicUIPageContext(row.workContext) }
            : {}),
          ...(row.role === 'user' && row.metadata.queued
            ? {
                queue: row.metadata.withdrawn
                  ? ('withdrawn' as const)
                  : row.metadata.pickedUp
                    ? undefined
                    : row.runId && outcomes.has(row.runId)
                      ? ('unanswered' as const)
                      : ('queued' as const),
              }
            : {}),
        },
        parts: [],
      };
      if (message.metadata!.queue === undefined) delete message.metadata!.queue;
      if (row.role === 'user' && row.metadata.queued)
        message.metadata!.revision = queuedRevision(
          row.seq,
          row.metadata.withdrawn
            ? 'withdrawn'
            : row.metadata.pickedUp
              ? 'pickedUp'
              : null,
        );
      messages.set(id, message);
    }
    const index = message.parts.length;
    const output = outputBlock(row.metadata as Record<string, unknown>);
    const partId = output ? `output:${output.blockId}` : `record:${row.id}`;
    if (row.metadata.notice) {
      const notice = row.metadata.notice;
      message.parts.push(
        notice.code === 'news'
          ? {
              type: 'data-notice',
              id: partId,
              data: {
                type: notice.type,
                title: notice.title,
                ...(notice.params ? { params: { ...notice.params } } : {}),
              },
            }
          : {
              type: 'data-business',
              id: partId,
              data: {
                kind: notice.code,
                id: row.id,
                payload: JSON.parse(JSON.stringify(notice)) as AppUIJson,
              },
            },
      );
    } else
      message.parts.push({
        type: 'text',
        text: row.content.content,
        state: 'done',
      });
    message.metadata!.sourceRecords!.push({
      recordId: row.id,
      seq: row.seq,
      partId,
      partIndex: index,
      ...(output ? { output } : {}),
      createdAt: row.createdAt,
    });
    for (const file of row.attachments ?? []) {
      message.parts.push({
        type: 'file',
        filename: file.filename,
        mediaType: file.mimeType,
        url: file.contentUrl,
      });
      message.metadata!.sourceRecords!.push({
        recordId: row.id,
        seq: row.seq,
        partId: `file:${file.id}`,
        partIndex: message.parts.length - 1,
        createdAt: row.createdAt,
      });
    }
    if (
      row.role === 'user' &&
      row.metadata.effort &&
      row.runId &&
      defaultEffortRuns.has(row.runId)
    ) {
      const id = `effort-defaulted:${row.id}`;
      message.parts.push({
        type: 'data-notice',
        id,
        data: {
          type: 'effortDefaulted',
          title:
            'This runtime does not support the selected reasoning effort; the tool default was used.',
        },
      });
      message.metadata!.sourceRecords!.push({
        recordId: row.id,
        seq: row.seq,
        partId: id,
        partIndex: message.parts.length - 1,
        createdAt: row.createdAt,
      });
    }
    message.metadata!.revision = Math.max(message.metadata!.revision, row.seq);
  }
  // User records already carry their accepted run id, including a response stopped before producing text.
  for (const event of reasoning) {
    const step =
      event.type === 'toolUse' ||
      (event.content?.trim() &&
        outputBlock(jsonObject(event.meta))?.phase === 'end');
    if (!step) continue;
    const id = runnerMessageId(event.runId);
    if (messages.has(id)) continue;
    const user = rows.find(
      (row) => row.role === 'user' && row.runId === event.runId,
    );
    if (!user) continue;
    messages.set(id, {
      id,
      role: 'assistant',
      metadata: {
        conversationId: user.conversationId,
        createdAt: event.at,
        seq: user.seq,
        revision: user.seq,
        ...(user.metadata.agentId ? { agentId: user.metadata.agentId } : {}),
        executionId: event.runId,
        turnId: event.runId,
        sourceRecords: [],
      },
      parts: [],
    });
  }
  const byRecord = new Map(rows.map((row) => [row.id, row]));
  const split: AppUIMessage[] = [];
  for (const message of messages.values()) {
    const runId = message.metadata?.executionId;
    if (message.role !== 'assistant' || !runId) continue;
    const sources = message.metadata!.sourceRecords!;
    const parts = sources.map((source) => ({
      source,
      part: message.parts[source.partIndex],
      seq: Number(
        byRecord.get(source.recordId)?.metadata.runEventSeq ?? Infinity,
      ),
    }));
    const seenParts = new Set(sources.map((source) => source.partId));
    const own = reasoning.filter((event) => event.runId === runId);
    for (const [partId, call] of runnerToolParts(own)) {
      if (seenParts.has(partId)) continue;
      seenParts.add(partId);
      const anchor = parts.find((part) => part.seq > call.seq) ?? parts.at(-1);
      parts.push({
        source: {
          recordId: partId,
          partId,
          partIndex: 0,
          seq: anchor?.source.seq ?? message.metadata!.seq!,
          ...(call.at ? { createdAt: call.at } : {}),
        },
        part: call.part,
        seq: call.seq,
      });
    }
    for (const event of own) {
      if ((event.type ?? 'thinking') !== 'thinking' || !event.content?.trim())
        continue;
      const output = outputBlock(jsonObject(event.meta));
      if (output?.phase !== 'end') continue;
      const partId = `output:${output.blockId}`;
      if (seenParts.has(partId)) continue;
      seenParts.add(partId);
      // Use a real conversation cursor, while run-event order positions reasoning within its response.
      const anchor = parts.find((part) => part.seq > event.seq) ?? parts.at(-1);
      parts.push({
        source: {
          recordId: partId,
          partId,
          partIndex: 0,
          seq: anchor?.source.seq ?? message.metadata!.seq!,
          createdAt: event.at,
          output,
        },
        part: { type: 'reasoning', text: event.content, state: 'done' },
        seq: Number(event.seq),
      });
    }
    parts.sort((a, b) => a.seq - b.seq);
    // A message queued while the agent worked starts a response of its own where the agent took it as its next turn.
    // One steered into the running turn does not: the agent answers it within that turn, before its runner even
    // reports taking it (Claude Code reports it once the turn's reply is written).
    const boundaries = own.flatMap((event) => {
      const meta = jsonObject(event.meta);
      const inputId = meta.inputId;
      if (
        event.type !== 'input' ||
        typeof inputId !== 'string' ||
        meta.mode !== 'turn'
      )
        return [];
      const user = rows.find(
        (row) =>
          row.role === 'user' &&
          row.runId === runId &&
          row.metadata.inputId === inputId &&
          row.metadata.queued &&
          !row.metadata.withdrawn,
      );
      return user ? [{ seq: Number(event.seq), user }] : [];
    });
    const ended = outcomes.get(runId);
    const segments = [
      { message, from: -Infinity, parts: [] as typeof parts },
      ...boundaries.map(({ seq, user }) => ({
        message: {
          id: `${runnerMessageId(runId)}:${user.id}`,
          role: 'assistant' as const,
          metadata: {
            ...message.metadata!,
            createdAt: user.createdAt,
            seq: user.seq,
            revision: user.seq,
            sourceUserMessageId: user.id,
            sourceRecords: [],
          },
          parts: [],
        } satisfies AppUIMessage,
        from: seq,
        parts: [] as typeof parts,
      })),
    ];
    for (const part of parts)
      [...segments]
        .reverse()
        .find((segment) => segment.from <= part.seq)!
        .parts.push(part);
    segments.forEach((segment, index) => {
      const next = segments[index + 1]?.from ?? Infinity;
      const events = own.filter(
        (event) =>
          Number(event.seq) >= segment.from && Number(event.seq) < next,
      );
      const plan = runnerPlan(events);
      if (plan) {
        const id = index ? `plan:${runId}:${index}` : `plan:${runId}`;
        const at =
          segment.parts.findIndex((part) => part.seq > plan.seq) === -1
            ? segment.parts.length
            : segment.parts.findIndex((part) => part.seq > plan.seq);
        segment.parts.splice(at, 0, {
          source: {
            recordId: id,
            partId: id,
            partIndex: 0,
            seq:
              (segment.parts[at] ?? segment.parts.at(-1))?.source.seq ??
              segment.message.metadata!.seq!,
          },
          part: { type: 'data-plan', id, data: plan.plan },
          seq: plan.seq,
        });
      }
      // Once the run has ended, each of its turns closes with a footer: the last says how the run ended.
      const last = index === segments.length - 1;
      const turn = ended
        ? runnerTurn(events, last ? ended : 'completed')
        : null;
      if (turn && (last || events.some(isTurnCompleted))) {
        const id = index ? `turn:${runId}:${index}` : `turn:${runId}`;
        segment.parts.push({
          source: {
            recordId: id,
            partId: id,
            partIndex: 0,
            seq:
              segment.parts.at(-1)?.source.seq ??
              segment.message.metadata!.seq!,
          },
          part: { type: 'data-turn', id, data: turn },
          seq: Infinity,
        });
        // A page holding the live response, without its footer, reads it again.
        segment.message.metadata!.revision += 1;
      }
      segment.message.parts = segment.parts.map((part) => part.part);
      segment.message.metadata!.sourceRecords = segment.parts.map(
        ({ source }, partIndex) => ({ ...source, partIndex }),
      );
      if (index && segment.parts.length) split.push(segment.message);
    });
  }
  for (const message of split) messages.set(message.id, message);
  return [...messages.values()].sort(
    (a, b) => (a.metadata?.seq ?? 0) - (b.metadata?.seq ?? 0),
  );
}

/** One batched read of already-redacted summaries; never writes conversation rows or changes model replay. */
export async function runnerMessages(
  tx: TxRunner,
  rows: ConversationMessage[],
): Promise<AppUIMessage[]> {
  // Every run the rows answer: its steps and how its turn went belong to its response.
  const runIds = [
    ...new Set(
      rows
        .filter(
          (row) =>
            row.runId && (row.role === 'assistant' || row.role === 'user'),
        )
        .map((row) => row.runId!),
    ),
  ];
  // The latest steps of these runs, at most `RUNNER_EVENTS_MAX`: a page of history never reads a whole long run.
  const reasoning = runIds.length
    ? await eventsRepo(tx.read()).findMany({
        filter: (f) =>
          f.and([
            f.or([
              ...RUNNER_STEP_EVENT_TYPES.map((type) =>
                f.string('type').eq(type),
              ),
              f.and([
                f.string('type').eq('status'),
                f.or(
                  RUNNER_STATUS_CONTENTS.map((content) =>
                    f.text('content').eq(content),
                  ),
                ),
              ]),
            ]),
            f.or(runIds.map((runId) => f.string('runId').eq(runId))),
          ]),
        sort: (s) => [s.field('createdAt').desc(), s.field('seq').desc()],
        limit: RUNNER_EVENTS_MAX,
      })
    : [];
  reasoning.sort((a, b) => Number(a.seq) - Number(b.seq));
  const runs = runIds.length
    ? await runsRepo(tx.read()).findMany({
        filter: (f) => f.or(runIds.map((runId) => f.string('id').eq(runId))),
      })
    : [];
  const outcomes = new Map<string, AppUITurn['outcome']>();
  for (const run of runs)
    if (
      run.status === 'completed' ||
      run.status === 'cancelled' ||
      run.status === 'failed'
    )
      outcomes.set(String(run.id), run.status);
  const defaultEffortRuns = new Set(
    runs
      .filter((run) => {
        const last = toExecutions(run.executionHistory).at(-1);
        return last?.dispatchedAt && last.effort === null;
      })
      .map((run) => String(run.id)),
  );
  return runnerUIMessages(rows, reasoning, outcomes, defaultEffortRuns);
}

/** Seed a bounded source page, then expand whole Runs and the intervening independent records. */
export async function runnerUIPage(
  tx: TxRunner,
  id: string,
  lastSeq: number,
  query: NativeHistoryQuery,
  basePath: string,
): Promise<NativeHistoryPage> {
  const repo = messagesRepo(tx.read());
  const rows = await repo.findMany({
    filter: (f) =>
      f.and([
        f.string('conversationId').eq(id),
        ...(query.ids
          ? [
              f.or(
                query.ids.map((key) =>
                  key.startsWith('runner:')
                    ? f.string('runId').eq(key.slice(7).split(':')[0])
                    : f.string('id').eq(key),
                ),
              ),
            ]
          : []),
        ...(query.before !== undefined
          ? [f.number('seq').lt(query.before)]
          : []),
        ...(query.after !== undefined ? [f.number('seq').gt(query.after)] : []),
      ]),
    sort: (s) =>
      query.after !== undefined || query.ids
        ? s.field('seq').asc()
        : s.field('seq').desc(),
    ...(query.ids ? {} : { limit: query.limit + 1 }),
  });
  const selected = rows.slice(0, query.ids ? rows.length : query.limit);
  const runIds = [
    ...new Set(
      selected
        .filter(
          (row) =>
            (row.role === 'assistant' || row.role === 'user') && row.runId,
        )
        .map((row) => row.runId!),
    ),
  ];
  const groups = runIds.length
    ? await repo.findMany({
        filter: (f) =>
          f.and([
            f.string('conversationId').eq(id),
            f.or([
              f.string('role').eq('assistant'),
              f.string('role').eq('user'),
            ]),
            f.or(runIds.map((runId) => f.string('runId').eq(runId))),
          ]),
        sort: (s) => s.field('seq').asc(),
      })
    : [];
  const gathered = [...selected, ...groups];
  if (!gathered.length) return { items: [], lastSeq, hasMore: false };
  const minimum = Math.min(...gathered.map((row) => Number(row.seq)));
  const maximum = Math.max(...gathered.map((row) => Number(row.seq)));
  // Notices interleaved with a logical message must be on the same page, never stranded behind its anchor.
  const interval = query.ids
    ? gathered
    : await repo.findMany({
        filter: (f) =>
          f.and([
            f.string('conversationId').eq(id),
            f.number('seq').gte(minimum),
            f.number('seq').lte(maximum),
          ]),
        sort: (s) => s.field('seq').asc(),
      });
  const unique = [
    ...new Map(
      interval
        .filter(
          (row) =>
            query.after === undefined ||
            Number(row.seq) > query.after ||
            // A run's whole response, with the messages queued into it that split it.
            ((row.role === 'assistant' || row.role === 'user') &&
              runIds.includes(row.runId!)),
        )
        .map((row) => [row.id, row]),
    ).values(),
  ].sort((a, b) => Number(a.seq) - Number(b.seq));
  const items = await validateAppUIMessages(
    await runnerMessages(
      tx,
      unique.map((row) => toMessage(row, basePath)),
    ),
  );
  return {
    // A run's response asked for by its id comes with the responses its queued messages split off it.
    items: query.ids
      ? items.filter((message) =>
          query.ids!.some(
            (id) => message.id === id || message.id.startsWith(`${id}:`),
          ),
        )
      : items,
    lastSeq,
    ...(query.after !== undefined && maximum < lastSeq
      ? { nextAfter: maximum }
      : {}),
    hasMore: query.ids
      ? false
      : query.after === undefined
        ? minimum > 1
        : maximum < lastSeq,
  };
}
