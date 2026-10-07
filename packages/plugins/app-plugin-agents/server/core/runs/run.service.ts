/**
 * Runs as the rest of the application starts and follows them: queueing work for an agent, adding input to a run,
 * cancelling and retrying, and reading runs and their transcripts. Who may read or change a run is decided by the
 * callers (the admin routes, the application); this service checks only that the person who wakes an agent may wake it.
 *
 * Work is keyed by (agent, subject, thread). New work for a key joins the run already working on it while it can
 * still be told (dispatched, or running with input), else the run waiting for it (queued), else starts a new run.
 */
import {
  ProtocolError,
  TERMINAL_RUN_STATUSES,
  type ActorRef,
  type RunEvent,
  type RunEventType,
  type RunInput,
  type RunInputType,
  type RunnerFeature,
  type RunSelf,
  type RunStatus,
} from '@nocobase/agent-protocol';
import type { Runner } from '../../../shared/runners.js';
import type { DatabaseConnection } from '@nocobase/db';

import type { Agent } from '../../../shared/agents.js';
import type { RunBrief } from '../../../shared/briefs.js';
import type {
  Run,
  RunDetail,
  RunEventPage,
  RunUsageTotal,
  Workload,
  WorkloadQuery,
} from '../../../shared/runs.js';
import type { Clock } from '../../kernel/clock.js';
import {
  conflict,
  forbidden,
  invalid,
  notFound,
  precondition,
} from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { asJson, cleanList, jsonObject } from '../../kernel/values.js';
import type { AgentService } from '../agents/index.js';
import { findAgent, lockAgentForClaim } from '../agents/index.js';
import { authenticateRunToken, type RunTokenIdentity } from './run-tokens.js';
import {
  ACTIVE,
  eventsRepo,
  findRunRecord,
  inputsOnSince,
  inputsRepo,
  isActive,
  isTerminal,
  lastSummary,
  openRunsOn,
  pendingInputs,
  reposRepo,
  runsOfKey,
  runsRepo,
  toInput,
  toInputView,
  toRepo,
  toRun,
  usageRepo,
  type RunRecord,
} from './run.store.js';
import { dialectOf, takesType, type SubjectRegistry } from './ports.js';
import { readWorkload, type WorkloadRunners } from './workload.js';
import { finishRun, type TransitionDeps } from './transitions.js';
import { findBrief, requestReset } from './workspace.store.js';

export const DEFAULT_THREAD = 'main';

export interface NewInput {
  readonly type: RunInputType;
  readonly actor: ActorRef;
  readonly text: string;
  readonly payload?: unknown;
}

export interface EnqueueRequest {
  readonly agentId: string;
  readonly subject: { readonly kind: string; readonly id: string };
  /** Separates conversations about one subject; `main` by default. */
  readonly threadScope?: string;
  /** Who woke the agent: their permissions bound the run. */
  readonly actorUserId: string;
  readonly ownerUserId?: string | null;
  /** Lower runs first; 0 by default. Work merged into a waiting run raises it to the more urgent of the two. */
  readonly priority?: number;
  /**
   * Not claimed before this moment (a delayed run); now by default. Work merged into a waiting run makes it claimable
   * at the earlier of the two moments.
   */
  readonly fireAt?: Date | string;
  /** Runner features this run needs beyond what its payload does (which the claim works out). */
  readonly requires?: readonly RunnerFeature[];
  /**
   * A consultation (`ask_agent`): the run that asks. Such a run is never claimed from the queue: the holder of the run
   * that asks takes it at once and waits for its answer.
   */
  readonly parentRunId?: string;
  /** Attempts the run may take; the agent's `maxAttempts` by default. */
  readonly maxAttempts?: number;
  readonly input: NewInput;
}

export interface EnqueueResult {
  readonly runId: string;
  /** `created` a new run, `merged` into a queued one, `appended` to one a runner holds. */
  readonly outcome: 'created' | 'merged' | 'appended';
  readonly status: RunStatus;
  readonly inputId: string;
}

export interface RunFilter {
  readonly subjectKind?: string;
  readonly subjectId?: string;
  readonly agentId?: string;
  readonly status?: RunStatus;
  /** Only runs this user started or is owner of. */
  readonly involvingUserId?: string;
  readonly limit?: number;
  /** The newest-first position to read after: the last run of the previous page. */
  readonly cursor?: { readonly createdAt: string; readonly id: string };
}

export interface RunService {
  /** Queues work for an agent. In `outer`, joins the caller's transaction (the caller publishes its events). */
  enqueue(request: EnqueueRequest, outer?: Tx): Promise<EnqueueResult>;
  /** Adds input to a run that has not ended. */
  addInput(runId: string, input: NewInput, outer?: Tx): Promise<string>;
  /** A queued run ends at once; a held one is asked to stop. In `outer`, joins the caller's transaction. */
  cancel(runId: string, byUserId: string, outer?: Tx): Promise<Run>;
  /**
   * Ends the queued runs on a subject, of one agent or of any, or of one agent on every subject; optionally only those
   * `actorUserId` woke. Held runs are left alone. Answers the runs it ended. In `outer`, joins the caller's transaction.
   */
  withdrawQueued(
    request: {
      /** Every subject when left out, which then needs `agentId`. */
      readonly subject?: { readonly kind: string; readonly id: string };
      readonly agentId?: string;
      readonly actorUserId?: string;
      readonly byUserId: string | null;
      /** Why, in words, kept as the run's failure detail. */
      readonly detail?: string;
    },
    outer?: Tx,
  ): Promise<Run[]>;
  /** Starts a failed or cancelled run's work again as a new run, with its unhandled input, as `byUserId`. */
  retry(runId: string, byUserId: string): Promise<Run>;
  get(runId: string): Promise<Run>;
  detail(runId: string): Promise<RunDetail>;
  list(filter: RunFilter): Promise<Run[]>;
  /** The newest ended run of each agent on each of the subjects (`subjectIds` of `subjectKind`), in no order. */
  lastEnded(subjectKind: string, subjectIds: readonly string[]): Promise<Run[]>;
  /**
   * The open runs on one kind of subject, held ones with their runner and newest activity, queued ones with their
   * place in the claim order and what holds them; with every agent's load and the runners' (`shared/runs.ts`).
   * Whoever calls decides what of it a person may see.
   */
  workload(query: WorkloadQuery): Promise<Workload>;
  events(runId: string, afterSeq: number, limit: number): Promise<RunEventPage>;
  /** The run a run token belongs to; `RUN_TOKEN_INVALID` otherwise. */
  authenticateToken(value: string): Promise<RunTokenIdentity>;
  self(identity: RunTokenIdentity): Promise<RunSelf>;
  /** The brief the run's latest attempt was given; 404 before its first claim. */
  brief(runId: string): Promise<RunBrief>;
  /** The subject's next run starts from a fresh working directory; its sessions are forgotten. */
  resetWorkspace(
    subject: { readonly kind: string; readonly id: string },
    byUserId: string,
  ): Promise<void>;
  /** The run's subject context, assembled again. */
  context(
    identity: RunTokenIdentity,
  ): Promise<Readonly<Record<string, unknown>>>;
  /** The runs on a subject that have not ended (queued or held), of one agent or of any, oldest first; read on `conn`. */
  openOn(
    conn: DatabaseConnection,
    subject: { readonly kind: string; readonly id: string },
    agentId?: string,
  ): Promise<Run[]>;
  /** The run's input not yet reported as handled, oldest first; read on `conn`. */
  pendingInputs(conn: DatabaseConnection, runId: string): Promise<RunInput[]>;
  /** The inputs given to runs on a subject since `since`, with the agent of their run and their payload as an object. */
  inputsSince(
    conn: DatabaseConnection,
    subject: { readonly kind: string; readonly id: string },
    since: Date,
  ): Promise<
    {
      readonly agentId: string;
      readonly type: string;
      readonly payload: Record<string, unknown>;
    }[]
  >;
  /** The summary of the newest completed run of an agent on a subject, other than `exceptRunId`. */
  lastSummary(
    conn: DatabaseConnection,
    key: {
      readonly agentId: string;
      readonly subjectKind: string;
      readonly subjectId: string;
    },
    exceptRunId: string,
  ): Promise<string | null>;
}

export interface RunServiceDeps extends TransitionDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  readonly agents: Pick<AgentService, 'mayInvoke'>;
  readonly subjects: SubjectRegistry;
  /** The application CLI command, as a subject's context hears it. */
  readonly cliName: string;
  /** The application's name in prose (`agents.app.name`). */
  readonly appName: string;
  /** The runners and the jobs they hold. */
  readonly runners: WorkloadRunners & {
    find(conn: DatabaseConnection, id: string): Promise<Runner | null>;
  };
}

/** A delay as the moment a run may be claimed, or null for now (and for any moment already past). */
function fireAtOf(value: Date | string | undefined, now: Date): string | null {
  if (value === undefined) return null;
  const at = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(at.getTime())) throw invalid('fireAt is not a date.');
  return at.getTime() > now.getTime() ? at.toISOString() : null;
}

export function createRunService(deps: RunServiceDeps): RunService {
  const { tx, ids, clock } = deps;

  const require = async (conn: Tx['conn'], id: string): Promise<RunRecord> => {
    const run = await findRunRecord(conn, id);
    if (!run) throw notFound('Run');
    return run;
  };

  async function insertInput(
    unit: Tx,
    runId: string,
    input: NewInput,
  ): Promise<string> {
    const id = ids.next();
    await inputsRepo(unit.conn).createOne({
      values: {
        id,
        runId,
        type: input.type,
        actorKind: input.actor.kind,
        actorId: input.actor.id,
        actorName: input.actor.name,
        text: input.text,
        payload: asJson(input.payload),
        createdAt: clock.now().toISOString(),
        deliveredAt: null,
        handledAt: null,
      },
    });
    unit.emit({ type: 'run.input', runId, inputId: id });
    return id;
  }

  async function requireInvocable(
    unit: Tx,
    agentId: string,
    userId: string,
  ): Promise<Agent> {
    const agent = await findAgent(unit.conn, agentId);
    if (!agent) throw notFound('Agent');
    if (agent.archivedAt)
      throw precondition('AGENT_ARCHIVED', 'The agent is archived.');
    if (!deps.agents.mayInvoke(agent, userId))
      throw forbidden('You may not wake this agent.');
    return agent;
  }

  async function createRun(
    unit: Tx,
    agent: Agent,
    values: {
      readonly subject: EnqueueRequest['subject'];
      readonly threadScope: string;
      readonly actorUserId: string;
      readonly ownerUserId: string | null;
      readonly priority: number;
      readonly requires: readonly string[];
      readonly retryOfRunId: string | null;
      readonly availableAt?: string | null;
      readonly parentRunId?: string | null;
      readonly maxAttempts?: number;
    },
  ): Promise<string> {
    if (!takesType(deps.subjects.get(values.subject.kind), agent.type))
      throw invalid(
        `A ${agent.type} agent cannot work on a ${values.subject.kind}.`,
        { reason: 'AGENT_TYPE_NOT_ALLOWED', agentType: agent.type },
      );
    const now = clock.now().toISOString();
    const id = ids.next();
    await runsRepo(unit.conn).createOne({
      values: {
        id,
        agentId: agent.id,
        agentType: agent.type,
        runnerId: null,
        status: 'queued',
        priority: values.priority,
        attempt: 1,
        maxAttempts: values.maxAttempts ?? agent.maxAttempts,
        retryOfRunId: values.retryOfRunId,
        parentRunId: values.parentRunId ?? null,
        subjectKind: values.subject.kind,
        subjectId: values.subject.id,
        threadScope: values.threadScope,
        actorUserId: values.actorUserId,
        ownerUserId: values.ownerUserId,
        requires: cleanList([...values.requires]),
        acceptsInput: false,
        availableAt: values.availableAt ?? null,
        leaseExpiresAt: null,
        dispatchedAt: null,
        startedAt: null,
        finishedAt: null,
        lastActivityAt: null,
        cancelRequestedAt: null,
        cancelledById: null,
        failureReason: null,
        failureDetail: null,
        summary: null,
        sessionId: null,
        workDir: null,
        directoryKey: null,
        claimFailures: 0,
        payloadFingerprint: null,
        createdAt: now,
        updatedAt: now,
      },
    });
    unit.emit({ type: 'run.queued', runId: id, agentId: agent.id });
    unit.emit({ type: 'run.changed', runId: id, status: 'queued' });
    return id;
  }

  /** A waiting run takes on the more urgent priority and the earlier moment of the work merged into it. */
  async function hurry(
    unit: Tx,
    run: RunRecord,
    priority: number,
    fireAt: string | null,
  ): Promise<void> {
    const values: Record<string, unknown> = {};
    if (priority < Number(run.priority)) values.priority = priority;
    if (
      run.availableAt &&
      (fireAt === null || Date.parse(fireAt) < Date.parse(run.availableAt))
    )
      values.availableAt = fireAt;
    if (Object.keys(values).length === 0) return;
    await runsRepo(unit.conn).updateMany({
      filter: (f) =>
        f.and([f.string('id').eq(run.id), f.string('status').eq('queued')]),
      values: { ...values, updatedAt: clock.now().toISOString() },
    });
  }

  async function usageOf(
    conn: Tx['conn'],
    runId: string,
  ): Promise<RunUsageTotal[]> {
    const rows = await usageRepo(conn).findMany({ filter: { runId } });
    const totals = new Map<string, RunUsageTotal>();
    for (const row of rows) {
      const key = `${row.tool}\u0000${row.model ?? ''}`;
      const total = totals.get(key) ?? {
        tool: row.tool,
        model: row.model,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        reasoningTokens: 0,
      };
      totals.set(key, {
        ...total,
        inputTokens: total.inputTokens + Number(row.inputTokens),
        outputTokens: total.outputTokens + Number(row.outputTokens),
        cacheReadTokens: total.cacheReadTokens + Number(row.cacheReadTokens),
        cacheWriteTokens: total.cacheWriteTokens + Number(row.cacheWriteTokens),
        reasoningTokens: total.reasoningTokens + Number(row.reasoningTokens),
      });
    }
    return [...totals.values()];
  }

  return {
    enqueue: (request, outer) =>
      tx.run(async (unit) => {
        const agent = await requireInvocable(
          unit,
          request.agentId,
          request.actorUserId,
        );
        // Serializes enqueues and claims for this agent, so a key never gets two waiting runs.
        await lockAgentForClaim(unit.conn, agent.id, clock.now().toISOString());
        const key = {
          agentId: agent.id,
          subjectKind: request.subject.kind,
          subjectId: request.subject.id,
          threadScope: request.threadScope ?? DEFAULT_THREAD,
        };
        const open = await runsOfKey(unit.conn, key, ['queued', ...ACTIVE]);
        const working = open.find(
          (run) =>
            run.status === 'dispatched' ||
            (run.status === 'running' && Boolean(run.acceptsInput)),
        );
        const waiting = open.find((run) => run.status === 'queued');
        const target = working ?? waiting;
        const fireAt = fireAtOf(request.fireAt, clock.now());
        if (!working && waiting)
          await hurry(unit, waiting, request.priority ?? 0, fireAt);
        if (target) {
          const inputId = await insertInput(unit, target.id, request.input);
          return {
            runId: target.id,
            outcome: working ? 'appended' : 'merged',
            status: target.status,
            inputId,
          };
        }
        const runId = await createRun(unit, agent, {
          subject: request.subject,
          threadScope: key.threadScope,
          actorUserId: request.actorUserId,
          ownerUserId: request.ownerUserId ?? null,
          priority: request.priority ?? 0,
          requires: request.requires ?? [],
          retryOfRunId: null,
          availableAt: fireAt,
          ...(request.parentRunId ? { parentRunId: request.parentRunId } : {}),
          ...(request.maxAttempts ? { maxAttempts: request.maxAttempts } : {}),
        });
        const inputId = await insertInput(unit, runId, request.input);
        return { runId, outcome: 'created', status: 'queued', inputId };
      }, outer),

    addInput: (runId, input, outer) =>
      tx.run(async (unit) => {
        const run = await require(unit.conn, runId);
        if (isTerminal(run.status))
          throw new ProtocolError(
            'RUN_NOT_ACTIVE',
            `The run is ${run.status}.`,
          );
        return insertInput(unit, run.id, input);
      }, outer),

    cancel: (runId, byUserId, outer) =>
      tx.run(async (unit) => {
        const run = await require(unit.conn, runId);
        if (isTerminal(run.status))
          throw new ProtocolError(
            'RUN_NOT_ACTIVE',
            `The run is ${run.status}.`,
          );
        if (run.status === 'queued') {
          const ended = await finishRun(unit, deps, run, {
            status: 'cancelled',
            reason: 'cancelled',
            cancelledById: byUserId,
          });
          if (!ended) throw conflict('The run changed; try again.');
          return toRun(ended);
        }
        if (!run.cancelRequestedAt) {
          const now = clock.now().toISOString();
          await runsRepo(unit.conn).updateMany({
            filter: { id: run.id },
            values: {
              cancelRequestedAt: now,
              cancelledById: byUserId,
              updatedAt: now,
            },
          });
          unit.emit({ type: 'run.changed', runId: run.id, status: run.status });
        }
        return toRun(await require(unit.conn, run.id));
      }, outer),

    withdrawQueued: (request, outer) =>
      tx.run(async (unit) => {
        const { subject } = request;
        if (!subject && !request.agentId)
          throw invalid('Withdrawing queued runs needs a subject or an agent.');
        const queued = await runsRepo(unit.conn).findMany({
          filter: (f) =>
            f.and([
              ...(subject
                ? [
                    f.string('subjectKind').eq(subject.kind),
                    f.string('subjectId').eq(subject.id),
                  ]
                : []),
              f.string('status').eq('queued'),
              ...(request.agentId
                ? [f.string('agentId').eq(request.agentId)]
                : []),
              ...(request.actorUserId
                ? [f.string('actorUserId').eq(request.actorUserId)]
                : []),
            ]),
        });
        const ended: Run[] = [];
        for (const run of queued) {
          const done = await finishRun(unit, deps, run, {
            status: 'cancelled',
            reason: 'cancelled',
            ...(request.byUserId ? { cancelledById: request.byUserId } : {}),
            ...(request.detail ? { detail: request.detail } : {}),
          });
          if (done) ended.push(toRun(done));
        }
        return ended;
      }, outer),

    retry: (runId, byUserId) =>
      tx.run(async (unit) => {
        const run = await require(unit.conn, runId);
        if (run.status !== 'failed' && run.status !== 'cancelled')
          throw precondition(
            'RUN_NOT_RETRYABLE',
            'Only a failed or cancelled run can be retried.',
          );
        if (run.parentRunId)
          throw precondition(
            'RUN_NOT_RETRYABLE',
            'A consultation is not retried: the agent that asked asks again.',
          );
        const agent = await requireInvocable(unit, run.agentId, byUserId);
        await lockAgentForClaim(unit.conn, agent.id, clock.now().toISOString());
        const open = await runsOfKey(unit.conn, run, ['queued', ...ACTIVE]);
        if (open.length > 0)
          throw precondition(
            'AGENT_BUSY',
            'The agent is already working on this.',
            {
              runId: open[0].id,
            },
          );
        const newId = await createRun(unit, agent, {
          subject: { kind: run.subjectKind, id: run.subjectId },
          threadScope: run.threadScope,
          actorUserId: byUserId,
          ownerUserId: run.ownerUserId,
          priority: Number(run.priority),
          requires: toRun(run).requires,
          retryOfRunId: run.id,
        });
        for (const input of await pendingInputs(unit.conn, run.id))
          await insertInput(unit, newId, {
            type: input.type as RunInputType,
            actor: toInput(input).actor,
            text: input.text,
            ...(input.payload === null ? {} : { payload: input.payload }),
          });
        await insertInput(unit, newId, {
          type: 'retry',
          actor: { kind: 'user', id: byUserId, name: byUserId },
          text: 'Retry the work of the previous run.',
          payload: { retryOfRunId: run.id, failureReason: run.failureReason },
        });
        return toRun(await require(unit.conn, newId));
      }),

    get: async (runId) => toRun(await require(tx.read(), runId)),

    async detail(runId) {
      const conn = tx.read();
      const run = await require(conn, runId);
      const inputs = await inputsRepo(conn).findMany({
        filter: { runId },
        sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
      });
      const repos = await reposRepo(conn).findMany({ filter: { runId } });
      const children = await runsRepo(conn).findMany({
        filter: { parentRunId: runId },
        sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
      });
      const names = new Map<string, string | null>();
      for (const child of children)
        if (!names.has(child.agentId))
          names.set(
            child.agentId,
            (await findAgent(conn, child.agentId))?.name ?? null,
          );
      return {
        ...toRun(run),
        inputs: inputs.map(toInputView),
        repos: repos.map(toRepo),
        usage: await usageOf(conn, runId),
        children: children.map((child) => ({
          id: child.id,
          agentId: child.agentId,
          agentName: names.get(child.agentId) ?? null,
          status: child.status,
          failureReason: toRun(child).failureReason,
          summary: child.summary,
          createdAt: child.createdAt,
          finishedAt: child.finishedAt,
        })),
      };
    },

    async list(filter) {
      const records = await runsRepo(tx.read()).findMany({
        filter: (f) =>
          f.and([
            ...(filter.subjectKind
              ? [f.string('subjectKind').eq(filter.subjectKind)]
              : []),
            ...(filter.subjectId
              ? [f.string('subjectId').eq(filter.subjectId)]
              : []),
            ...(filter.agentId ? [f.string('agentId').eq(filter.agentId)] : []),
            ...(filter.status ? [f.string('status').eq(filter.status)] : []),
            ...(filter.involvingUserId
              ? [
                  f.or([
                    f.string('actorUserId').eq(filter.involvingUserId),
                    f.string('ownerUserId').eq(filter.involvingUserId),
                  ]),
                ]
              : []),
          ]),
        sort: (sort) => [
          sort.field('createdAt').desc(),
          sort.field('id').desc(),
        ],
        limit: Math.min(Math.max(filter.limit ?? 50, 1), 200),
        ...(filter.cursor ? { cursor: filter.cursor } : {}),
      });
      return records.map(toRun);
    },

    async lastEnded(subjectKind, subjectIds) {
      if (subjectIds.length === 0) return [];
      const records = await runsRepo(tx.read()).findMany({
        filter: (f) =>
          f.and([
            f.string('subjectKind').eq(subjectKind),
            f.or(subjectIds.map((id) => f.string('subjectId').eq(id))),
            f.or(
              TERMINAL_RUN_STATUSES.map((status) =>
                f.string('status').eq(status),
              ),
            ),
          ]),
        sort: (sort) => [
          sort.field('createdAt').desc(),
          sort.field('id').desc(),
        ],
      });
      const newest = new Map<string, RunRecord>();
      for (const record of records) {
        const key = `${record.agentId}:${record.subjectId}`;
        if (!newest.has(key)) newest.set(key, record);
      }
      return [...newest.values()].map(toRun);
    },

    workload(query) {
      return readWorkload(tx.read(), clock, deps.runners, query);
    },

    async events(runId, afterSeq, limit) {
      const conn = tx.read();
      await require(conn, runId);
      const rows = await eventsRepo(conn).findMany({
        filter: (f) =>
          f.and([f.string('runId').eq(runId), f.number('seq').gt(afterSeq)]),
        sort: (sort) => sort.field('seq').asc(),
        limit: Math.min(Math.max(limit, 1), 1000),
      });
      const events: RunEvent[] = rows.map((row) => ({
        seq: Number(row.seq),
        at: row.at,
        type: row.type as RunEventType,
        ...(row.tool ? { tool: row.tool } : {}),
        ...(row.content === null ? {} : { content: row.content }),
        ...(row.input === null || row.input === undefined
          ? {}
          : { input: row.input }),
        ...(row.output === null ? {} : { output: row.output }),
        ...(row.truncated ? { truncated: true } : {}),
        ...(row.meta === null || row.meta === undefined
          ? {}
          : { meta: jsonObject(row.meta) }),
      }));
      return {
        events,
        lastSeq: events.length > 0 ? events[events.length - 1].seq : afterSeq,
      };
    },

    authenticateToken: (value) => authenticateRunToken(tx.read(), clock, value),

    async self({ run }) {
      const conn = tx.read();
      const agent = await findAgent(conn, run.agentId);
      return {
        runId: run.id,
        attempt: Number(run.attempt),
        status: run.status,
        agent: { id: run.agentId, name: agent?.name ?? run.agentId },
        subjectRef: { kind: run.subjectKind, id: run.subjectId },
        actorUserId: run.actorUserId,
        cancelRequested: run.cancelRequestedAt !== null,
        inputs: (await pendingInputs(conn, run.id)).map(toInput),
      };
    },

    async brief(runId) {
      const brief = await findBrief(tx.read(), runId);
      if (!brief) throw notFound('Brief');
      return brief;
    },

    resetWorkspace: (subject, byUserId) =>
      tx.run(async ({ conn }) => {
        await requestReset(
          conn,
          () => ids.next(),
          subject,
          byUserId,
          clock.now().toISOString(),
        );
      }),

    async context({ run }) {
      const conn = tx.read();
      const binding = deps.subjects.get(run.subjectKind);
      const agent = await findAgent(conn, run.agentId);
      // An online run is held by the application itself, not by a registered runner.
      const runner =
        run.runnerId && agent?.type === 'runner'
          ? await deps.runners.find(conn, run.runnerId)
          : null;
      if (
        !binding ||
        !agent ||
        (agent.type === 'runner' && !runner) ||
        !isActive(run.status)
      )
        throw notFound('Run context');
      const assembly = await binding.context.assemble(conn, {
        run: toRun(run),
        agent,
        runner,
        inputs: (await pendingInputs(conn, run.id)).map(toInput),
        cli: deps.cliName,
        appName: deps.appName,
        dialect: dialectOf(agent),
      });
      return assembly.data;
    },

    openOn: openRunsOn,
    pendingInputs: async (conn, runId) =>
      (await pendingInputs(conn, runId)).map(toInput),
    inputsSince: inputsOnSince,
    lastSummary,
  };
}
