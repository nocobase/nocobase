import { OutputPreview } from './output-preview.js';
import { outputBlock, type RunEvent } from '@nocobase/agent-protocol';
/**
 * What a runner reports about the runs it holds: lease renewals, the start, events, and how the run ended. Every
 * report first checks that the runner still holds the run; a runner that lost it (the sweeper took it back, or it
 * ended) is told `LEASE_LOST` and must stop.
 */
import { QuotaReportSchema, type QuotaReport } from '@nocobase/agent-protocol';
import {
  isRetryable,
  MAX_EVENT_CONTENT_BYTES,
  ProtocolError,
  TIMINGS,
  UsageSchema,
  type ActiveRun,
  type AgentTool,
  type CancelAckRequest,
  type CompleteRequest,
  type EventsRequest,
  type EventsResponse,
  type FailRequest,
  type FinishResponse,
  type LeaseResponse,
  type RepoReport,
  type StartRequest,
  type StartResponse,
  type StatusResponse,
  type Usage,
} from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';
import { z } from 'zod';
import type { RunEffortReport } from '../../../shared/runs.js';

import { runnersRepo } from '../../runners/runner.store.js';
import type { Runner } from '../../../shared/runners.js';
import { later, type Clock } from '../../kernel/clock.js';
import type { IdSource } from '../../kernel/ids.js';
import {
  createSecretMemory,
  runSecretsKey,
  type SecretMemory,
} from '../../kernel/redaction.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import {
  asJson,
  jsonObject,
  truncateBytes,
  withoutNul,
} from '../../kernel/values.js';
import { recordActualModels } from './execution.js';
import { dropInputs, gatePending, type InputGateDeps } from './input-gate.js';
import { everHeld } from './run-tokens.js';
import {
  eventsRepo,
  findRunRecord,
  findRunStatus,
  pendingInputs,
  inputsRepo,
  isActive,
  isTerminal,
  markDelivered,
  reposRepo,
  runsRepo,
  sessionsRepo,
  toInput,
  usageRepo,
  type RunRecord,
} from './run.store.js';
import { finishRun, requeueRun, type TransitionDeps } from './transitions.js';

// MySQL TEXT stores at most 65,535 bytes, one less than the protocol's event limit.
const MAX_STORED_EVENT_BYTES = Math.min(MAX_EVENT_CONTENT_BYTES, 65_535);

const executionReport = z.object({
  effort: z.string().trim().min(1).max(200).nullable(),
  source: z.string().trim().min(1).max(200),
});

export interface RunnerReports {
  /** Resolves while `runner` holds the run; `LEASE_LOST`, `RUN_NOT_ACTIVE` or `RUN_NOT_OWNED` otherwise. */
  holds(runner: Pick<Runner, 'id'>, runId: string): Promise<void>;
  lease(runner: Pick<Runner, 'id'>, runId: string): Promise<LeaseResponse>;
  start(
    runner: Pick<Runner, 'id'>,
    runId: string,
    request: Pick<StartRequest, 'workDir' | 'acceptsInput' | 'sessionId'>,
  ): Promise<StartResponse>;
  events(
    runner: Pick<Runner, 'id'>,
    runId: string,
    request: EventsRequest,
  ): Promise<EventsResponse>;
  status(runner: Pick<Runner, 'id'>, runId: string): Promise<StatusResponse>;
  complete(
    runner: Pick<Runner, 'id'>,
    runId: string,
    request: CompleteRequest,
  ): Promise<FinishResponse>;
  fail(
    runner: Pick<Runner, 'id'>,
    runId: string,
    request: FailRequest,
  ): Promise<FinishResponse>;
  cancelAck(
    runner: Pick<Runner, 'id'>,
    runId: string,
    request: CancelAckRequest,
  ): Promise<FinishResponse>;
  /** Compares what a heartbeat says the runner holds with what the server thinks. */
  reconcile(
    runner: Runner,
    active: readonly ActiveRun[],
  ): Promise<{ cancelRequested: string[]; release: string[] }>;
}

export interface RunnerReportsDeps extends TransitionDeps, InputGateDeps {
  readonly onOutput?: (runId: string, event: RunEvent) => void;
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  /**
   * The secrets claims handed out. Events, summaries and failure details are redacted of them and of the common
   * patterns before they are stored, whatever the runner did (`kernel/redaction.ts`).
   */
  readonly secrets?: SecretMemory;
  readonly onQuota?: (
    unit: Tx,
    runnerId: string,
    tool: AgentTool,
    model: string | null,
    quota: QuotaReport,
    observation: {
      runId: string;
      agentId: string;
      subject: { kind: string; id: string };
    },
  ) => Promise<void>;
  /**
   * A run failed `modelUnavailable` on `runnerId` with its tool and model: the runner's mark that the model is not
   * offered there (`RunnerService.markModelUnavailable`), in the failure's transaction.
   */
  readonly onModelUnavailable?: (
    unit: Tx,
    runnerId: string,
    tool: AgentTool,
    model: string,
  ) => Promise<void>;
}

export function createRunnerReports(deps: RunnerReportsDeps): RunnerReports {
  const { tx, ids, clock } = deps;
  const previews = new OutputPreview();
  const secrets = deps.secrets ?? createSecretMemory();
  const redactorOf = (runId: string) => secrets.redactor(runSecretsKey(runId));

  /** The run, while `runner` holds it; `LEASE_LOST`, `RUN_NOT_ACTIVE` or `RUN_NOT_OWNED` otherwise. */
  async function held(
    conn: DatabaseConnection,
    runner: Pick<Runner, 'id'>,
    runId: string,
  ): Promise<RunRecord> {
    return checkHeld(conn, runner, runId, await findRunRecord(conn, runId));
  }

  async function checkHeld<T extends Pick<RunRecord, 'runnerId' | 'status'>>(
    conn: DatabaseConnection,
    runner: Pick<Runner, 'id'>,
    runId: string,
    run: T | undefined,
  ): Promise<T> {
    if (run && run.runnerId === runner.id) {
      if (isActive(run.status)) return run;
      throw new ProtocolError('RUN_NOT_ACTIVE', `The run is ${run.status}.`, {
        status: run.status,
      });
    }
    if (run && (await everHeld(conn, runId, runner.id)))
      throw new ProtocolError(
        'LEASE_LOST',
        'This runner no longer holds the run; stop it.',
        { status: run.status },
      );
    throw new ProtocolError(
      'RUN_NOT_OWNED',
      'This runner does not hold the run.',
    );
  }

  async function extendLease(
    conn: DatabaseConnection,
    run: RunRecord,
    starting = false,
  ) {
    const now = clock.now();
    const leaseExpiresAt =
      run.status === 'dispatched' && !starting
        ? later(new Date(run.dispatchedAt!), TIMINGS.startTimeoutMs)
        : later(now, TIMINGS.leaseMs);
    await runsRepo(conn).updateMany({
      filter: { id: run.id },
      values: { leaseExpiresAt, updatedAt: now.toISOString() },
    });
    return leaseExpiresAt;
  }

  /**
   * The run's unhandled input, marking what is new delivered. New input passes the subject's policy first, as it would
   * at a claim: what the run's agent may not act on now is marked handled instead and never reaches the runner.
   */
  async function deliver(conn: DatabaseConnection, run: RunRecord) {
    const now = clock.now().toISOString();
    const pending = await settlePending(conn, run, now);
    return (await markDelivered(conn, pending, now)).map(toInput);
  }

  /**
   * For an events answer: the run's input when some arrived that its runner has not been given, delivered as a status
   * poll would; nothing otherwise, so most answers read nothing more.
   */
  async function arrived(conn: DatabaseConnection, run: RunRecord) {
    return (await undelivered(conn, run.id))
      ? await deliver(conn, run)
      : undefined;
  }

  async function undelivered(
    conn: DatabaseConnection,
    runId: string,
  ): Promise<boolean> {
    return Boolean(
      await inputsRepo(conn).findOne({
        filter: (f) =>
          f.and([
            f.string('runId').eq(runId),
            f.date('handledAt').empty(),
            f.date('deliveredAt').empty(),
          ]),
      }),
    );
  }

  /** The run's unhandled input it may act on, marking what it may no longer act on handled. */
  async function settlePending(
    conn: DatabaseConnection,
    run: RunRecord,
    now: string,
  ) {
    const { kept, withheld } = await gatePending(conn, deps, run);
    await dropInputs(
      conn,
      withheld.map((input) => input.id),
      now,
    );
    return kept;
  }

  /** Records what every ending reports: handled inputs, usage, branches. */
  async function recordOutcome(
    { conn }: Tx,
    run: RunRecord,
    report: {
      readonly handledInputIds?: readonly string[];
      readonly usage?: readonly Usage[];
      readonly repos?: readonly RepoReport[];
    },
  ) {
    const now = clock.now().toISOString();
    const handled = report.handledInputIds ?? [];
    if (handled.length > 0)
      await inputsRepo(conn).updateMany({
        filter: (f) =>
          f.and([
            f.string('runId').eq(run.id),
            f.or(handled.map((id) => f.string('id').eq(id))),
            f.date('handledAt').empty(),
          ]),
        values: { handledAt: now },
      });
    for (const usage of report.usage ?? [])
      await usageRepo(conn).createOne({
        values: {
          id: ids.next(),
          runId: run.id,
          tool: usage.tool,
          modelService: null,
          model: usage.model ?? null,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheReadTokens: usage.cacheReadTokens ?? 0,
          cacheWriteTokens: usage.cacheWriteTokens ?? 0,
          reasoningTokens: usage.reasoningTokens ?? 0,
          createdAt: now,
        },
      });
    await recordActualModels(conn, run, report.usage ?? [], now);
    for (const repo of report.repos ?? []) {
      const existing = await reposRepo(conn).findOne({
        filter: { runId: run.id, url: repo.url },
      });
      const values = {
        branch: repo.branch,
        pushed: repo.pushed,
        headSha: repo.headSha ?? null,
        failureReason: repo.failure?.reason ?? null,
        failureDetail:
          repo.failure === undefined
            ? null
            : redactorOf(run.id).text(repo.failure.message).slice(0, 2000),
        updatedAt: now,
      };
      if (existing)
        await reposRepo(conn).updateMany({
          filter: { id: existing.id },
          values,
        });
      else
        await reposRepo(conn).createOne({
          values: { id: ids.next(), runId: run.id, url: repo.url, ...values },
        });
    }
  }

  async function rememberSession(
    { conn }: Tx,
    run: RunRecord,
    sessionId: string | undefined,
    poisoned: boolean,
  ) {
    if (!sessionId || !run.runnerId) return;
    const key = {
      agentId: run.agentId,
      runnerId: run.runnerId,
      subjectKind: run.subjectKind,
      subjectId: run.subjectId,
      threadScope: run.threadScope,
    };
    const values = {
      sessionId,
      workDir: run.workDir,
      fingerprint: run.payloadFingerprint,
      poisoned,
      updatedAt: clock.now().toISOString(),
    };
    const existing = await sessionsRepo(conn).findOne({ filter: key });
    if (existing)
      await sessionsRepo(conn).updateMany({
        filter: { id: existing.id },
        values,
      });
    else
      await sessionsRepo(conn).createOne({
        values: { id: ids.next(), ...key, branch: null, ...values },
      });
  }

  return {
    async holds(runner, runId) {
      await held(tx.read(), runner, runId);
    },
    lease: (runner, runId) =>
      tx.run(async ({ conn }) => {
        const run = await held(conn, runner, runId);
        const leaseExpiresAt = await extendLease(conn, run);
        return {
          leaseExpiresAt,
          cancelRequested: run.cancelRequestedAt !== null,
          inputs: await deliver(conn, run),
        };
      }),

    start: (runner, runId, request) =>
      tx.run(async (unit) => {
        const { conn } = unit;
        const run = await held(conn, runner, runId);
        const cancelRequested = run.cancelRequestedAt !== null;
        if (run.status === 'dispatched' && !cancelRequested) {
          const now = clock.now().toISOString();
          const changed = await runsRepo(conn).updateMany({
            filter: (f) =>
              f.and([
                f.string('id').eq(run.id),
                f.string('status').eq('dispatched'),
                f.string('runnerId').eq(runner.id),
                f.number('attempt').eq(Number(run.attempt)),
              ]),
            values: {
              status: 'running',
              startedAt: now,
              lastActivityAt: now,
              workDir: request.workDir,
              acceptsInput: request.acceptsInput,
              ...(request.sessionId ? { sessionId: request.sessionId } : {}),
              updatedAt: now,
            },
          });
          if (changed.updatedCount !== 1)
            throw new ProtocolError('LEASE_LOST', 'The run moved on; stop it.');
          unit.emit({ type: 'run.changed', runId: run.id, status: 'running' });
        }
        const leaseExpiresAt = await extendLease(conn, run, true);
        const current = (await findRunRecord(conn, run.id))!;
        return {
          status: current.status,
          leaseExpiresAt,
          cancelRequested,
          inputs: await deliver(conn, run),
        };
      }),

    events: async (runner, runId, reported) => {
      let previewKey = runId;
      const completed: RunEvent[] = [];
      if (reported.events.some((event) => outputBlock(event.meta)))
        reported = withoutNul(reported);
      const transient = reported.events.filter((event) => {
        const output = outputBlock(event.meta);
        return (
          output?.phase === 'delta' ||
          (output?.phase === 'end' && event.content === undefined)
        );
      });
      if (
        transient.length ||
        reported.events.some((event) => outputBlock(event.meta))
      ) {
        const run = await held(tx.read(), runner, runId);
        const machine = await runnersRepo(tx.read()).findOne({
          filter: { id: runner.id },
        });
        if (
          run.subjectKind !== 'conversation' ||
          !Array.isArray(machine?.features) ||
          !machine.features.includes('outputBlocks')
        )
          throw new ProtocolError(
            'RUN_NOT_OWNED',
            'Output previews require a capable runner holding a conversation.',
          );
        previewKey = `${runId}:${run.attempt}`;
        previews.accept(
          previewKey,
          transient,
          () => redactorOf(runId),
          (event) => deps.onOutput?.(runId, event),
        );
        if (transient.length === reported.events.length) {
          // A preview answer reads nothing more unless input is waiting.
          const inputs = (await undelivered(tx.read(), runId))
            ? await tx.run(async ({ conn }) =>
                arrived(conn, await held(conn, runner, runId)),
              )
            : undefined;
          return {
            accepted: 0,
            duplicates: 0,
            cancelRequested: run.cancelRequestedAt !== null,
            ...(inputs ? { inputs } : {}),
          };
        }
      }
      const durable = {
        ...reported,
        events: reported.events.filter((event) => !transient.includes(event)),
      };
      const response = await tx.run(async (unit) => {
        const { conn } = unit;
        const request = withoutNul(durable);
        const run = await held(conn, runner, runId);
        const seqs = request.events.map((event) => event.seq);
        const existing =
          seqs.length === 0
            ? []
            : await eventsRepo(conn).findMany({
                filter: (f) =>
                  f.and([
                    f.string('runId').eq(run.id),
                    f.or(seqs.map((seq) => f.number('seq').eq(seq))),
                  ]),
              });
        const stored = new Set(existing.map((event) => Number(event.seq)));
        const quotaReports = request.events
          .filter((event) => !stored.has(event.seq))
          .map((event) => QuotaReportSchema.safeParse(event.meta?.quota))
          .filter((parsed) => parsed.success);
        if (run.tool && quotaReports.length) {
          const latest = new Map<string, QuotaReport['windows'][number]>();
          for (const parsed of quotaReports)
            if (parsed.success)
              for (const window of parsed.data.windows)
                latest.set(
                  JSON.stringify([window.scope, window.target, window.window]),
                  window,
                );
          await deps.onQuota?.(
            unit,
            runner.id,
            run.tool as AgentTool,
            run.model ?? null,
            { windows: [...latest.values()] },
            {
              runId: run.id,
              agentId: run.agentId,
              subject: { kind: run.subjectKind, id: run.subjectId },
            },
          );
        }

        const now = clock.now().toISOString();
        const redact = redactorOf(run.id);
        let accepted = 0;
        let lastSeq = 0;
        const reportedUsage: Usage[] = [];
        const efforts: RunEffortReport[] = [];
        for (const event of request.events) {
          lastSeq = Math.max(lastSeq, event.seq);
          if (stored.has(event.seq)) continue;
          stored.add(event.seq);
          // Redacted before it is cut, so a cut never leaves part of a secret the redactor would have found.
          const content =
            event.content === undefined
              ? null
              : truncateBytes(
                  redact.text(event.content),
                  MAX_STORED_EVENT_BYTES,
                );
          const output =
            event.output === undefined
              ? null
              : truncateBytes(
                  redact.text(event.output),
                  MAX_STORED_EVENT_BYTES,
                );
          await eventsRepo(conn).createOne({
            values: {
              id: ids.next(),
              runId: run.id,
              seq: event.seq,
              at: Number.isNaN(Date.parse(event.at))
                ? now
                : new Date(event.at).toISOString(),
              type: event.type,
              tool: event.tool ?? null,
              content: content?.text ?? null,
              input: asJson(redact.value(event.input)),
              output: output?.text ?? null,
              meta: asJson(redact.value(event.meta)),
              truncated:
                Boolean(event.truncated) ||
                Boolean(content?.truncated) ||
                Boolean(output?.truncated),
              createdAt: now,
            },
          });
          if (outputBlock(event.meta)?.phase === 'end')
            completed.push({
              ...event,
              content: content?.text,
              meta: redact.value(event.meta),
            });
          accepted += 1;
          if (event.type === 'usage') {
            const usage = UsageSchema.array().safeParse(
              jsonObject(redact.value(event.meta)).usage,
            );
            if (usage.success) reportedUsage.push(...usage.data);
          }
          if (event.type === 'status' && event.tool === run.tool) {
            const meta = jsonObject(redact.value(event.meta));
            const report = executionReport.safeParse(meta.execution);
            if (report.success)
              efforts.push({
                ...report.data,
                at: Number.isNaN(Date.parse(event.at))
                  ? now
                  : new Date(event.at).toISOString(),
              });
          }
        }
        await runsRepo(conn).updateMany({
          filter: { id: run.id },
          values: { lastActivityAt: now },
        });
        await recordActualModels(conn, run, reportedUsage, now, efforts, true);
        if (accepted > 0)
          unit.emit({ type: 'run.events', runId: run.id, lastSeq });
        const inputs = await arrived(conn, run);
        return {
          accepted,
          duplicates: request.events.length - accepted,
          cancelRequested: run.cancelRequestedAt !== null,
          ...(inputs ? { inputs } : {}),
        };
      });
      if (completed.length)
        previews.accept(
          previewKey,
          completed,
          () => redactorOf(runId),
          (event) => deps.onOutput?.(runId, event),
        );
      return response;
    },
    status: async (runner, runId) => {
      const conn = tx.read();
      const run = await findRunStatus(conn, runId);
      // Terminal polls never deliver residual input.
      if (run && run.runnerId === runner.id && isTerminal(run.status))
        return {
          status: run.status,
          cancelRequested: run.cancelRequestedAt !== null,
          inputs: [],
          leaseExpiresAt: null,
        };
      const current = await checkHeld(conn, runner, runId, run);
      const pending =
        current.pendingInputId === null ? [] : await pendingInputs(conn, runId);
      if (pending.every((input) => input.deliveredAt !== null))
        return {
          status: current.status,
          cancelRequested: current.cancelRequestedAt !== null,
          inputs: pending.map(toInput),
          leaseExpiresAt: current.leaseExpiresAt,
        };
      // Re-read and revalidate inside the existing delivery transaction.
      return tx.run(async ({ conn }) => {
        const run = await findRunRecord(conn, runId);
        // A runner may still ask about a run it held once it ended, to learn how.
        if (run && run.runnerId === runner.id && isTerminal(run.status))
          return {
            status: run.status,
            cancelRequested: run.cancelRequestedAt !== null,
            inputs: [],
            leaseExpiresAt: null,
          };
        const current = await held(conn, runner, runId);
        return {
          status: current.status,
          cancelRequested: current.cancelRequestedAt !== null,
          inputs: await deliver(conn, current),
          leaseExpiresAt: current.leaseExpiresAt,
        };
      });
    },

    complete: (runner, runId, reported) =>
      tx.run(async (unit) => {
        const request = withoutNul(reported);
        const handled = new Set(request.handledInputIds);
        // Revision conflicts are bounded; exhaustion rolls back the transaction.
        for (let attempt = 0; attempt < 4; attempt += 1) {
          const run = await held(unit.conn, runner, runId);
          if (run.status !== 'running')
            throw new ProtocolError(
              'RUN_NOT_ACTIVE',
              'Only a running run can complete.',
            );
          const missing = (
            await settlePending(unit.conn, run, clock.now().toISOString())
          ).filter((input) => !handled.has(input.id));
          if (missing.length > 0)
            throw new ProtocolError(
              'RUN_INPUT_PENDING',
              'The run has input it has not handled; handle it before completing.',
              {
                inputIds: missing.map((input) => input.id),
                inputs: missing.map(toInput),
              },
            );
          const ended = await finishRun(
            unit,
            deps,
            run,
            {
              status: 'completed',
              summary: redactorOf(run.id).text(request.summary),
              ...(request.sessionId ? { sessionId: request.sessionId } : {}),
            },
            true,
            async () => {
              await recordOutcome(unit, run, request);
              await rememberSession(unit, run, request.sessionId, false);
            },
          );
          if (ended) {
            secrets.forget(runSecretsKey(run.id));
            return { status: ended.status };
          }
        }
        throw new ProtocolError(
          'RUN_INPUT_PENDING',
          'The run revision changed during completion; collect input and retry.',
          { inputIds: [], inputs: [] },
        );
      }),

    fail: (runner, runId, failure) =>
      tx.run(async (unit) => {
        const reported = withoutNul(failure);
        const run = await held(unit.conn, runner, runId);
        const machine =
          reported.reason === 'runnerDiskFull'
            ? await runnersRepo(unit.conn).findOne({
                filter: { id: runner.id },
              })
            : undefined;
        const named =
          reported.reason === 'runnerDiskFull'
            ? {
                ...reported,
                detail: `Runner ${machine?.name ?? runner.id} is out of disk space${reported.detail ? `: ${reported.detail}` : '.'}`,
              }
            : reported;
        const request: FailRequest =
          named.detail === undefined
            ? named
            : {
                ...named,
                detail: redactorOf(run.id).text(named.detail),
              };
        await recordOutcome(
          unit,
          run,
          request.reason === 'runnerUpgrade'
            ? { ...request, handledInputIds: [] }
            : request,
        );
        if (request.quota && run.tool && request.reason === 'toolQuota') {
          // A final failure repeats quota observations already accepted through events.
          // Read their existing record so a late fail cannot undo an owner's clear.
          // A new event sequence is still processed by events(), even with identical values.
          const observations = await eventsRepo(unit.conn).findMany({
            filter: (f) =>
              f.and([
                f.string('runId').eq(run.id),
                f.json('meta').path(['quota', 'windows']).isNotEmpty(),
              ]),
            select: (s) => s.fields('meta'),
          });
          const identity = (window: QuotaReport['windows'][number]): string =>
            JSON.stringify([
              window.scope,
              window.target,
              window.window,
              window.resetsAt,
              window.usedPercent ?? null,
              window.exhausted,
            ]);
          const seen = new Set<string>();
          for (const observation of observations) {
            const parsed = QuotaReportSchema.safeParse(
              jsonObject(observation.meta).quota,
            );
            if (parsed.success)
              for (const window of parsed.data.windows)
                seen.add(identity(window));
          }
          const windows = request.quota.windows.filter(
            (window) => !seen.has(identity(window)),
          );
          if (windows.length)
            await deps.onQuota?.(
              unit,
              runner.id,
              run.tool as AgentTool,
              run.model ?? null,
              { windows },
              {
                runId: run.id,
                agentId: run.agentId,
                subject: { kind: run.subjectKind, id: run.subjectId },
              },
            );
        }
        if (request.reason === 'modelUnavailable' && run.tool && run.model)
          await deps.onModelUnavailable?.(
            unit,
            runner.id,
            run.tool as AgentTool,
            run.model ?? null,
          );
        await rememberSession(
          unit,
          run,
          request.sessionId,
          request.reason === 'contextOverflow',
        );
        if (isRetryable(request.reason) && run.cancelRequestedAt === null) {
          const outcome = await requeueRun(
            unit,
            deps,
            run,
            request.reason,
            request.detail,
          );
          if (!outcome.run)
            throw new ProtocolError('LEASE_LOST', 'The run moved on; stop it.');
          return {
            status: outcome.status,
            ...(outcome.status === 'queued' && outcome.retryAt
              ? { retryAt: outcome.retryAt }
              : {}),
          };
        }
        const ended = await finishRun(unit, deps, run, {
          ...(request.reason === 'toolQuota' && request.quota
            ? { quota: request.quota }
            : {}),
          status: run.cancelRequestedAt === null ? 'failed' : 'cancelled',
          reason: run.cancelRequestedAt === null ? request.reason : 'cancelled',
          ...(request.detail === undefined ? {} : { detail: request.detail }),
          ...(request.sessionId ? { sessionId: request.sessionId } : {}),
        });
        if (!ended)
          throw new ProtocolError('LEASE_LOST', 'The run moved on; stop it.');
        secrets.forget(runSecretsKey(run.id));
        return { status: ended.status };
      }),

    cancelAck: (runner, runId, acknowledged) =>
      tx.run(async (unit) => {
        const request = withoutNul(acknowledged);
        const run = await held(unit.conn, runner, runId);
        await recordOutcome(unit, run, request);
        await rememberSession(unit, run, request.sessionId, false);
        const ended = await finishRun(unit, deps, run, {
          status: 'cancelled',
          reason: 'cancelled',
          ...(request.sessionId ? { sessionId: request.sessionId } : {}),
        });
        if (!ended)
          throw new ProtocolError('LEASE_LOST', 'The run moved on; stop it.');
        secrets.forget(runSecretsKey(run.id));
        return { status: ended.status };
      }),

    async reconcile(runner, active) {
      const conn = tx.read();
      const cancelRequested: string[] = [];
      const release: string[] = [];
      for (const { runId } of active) {
        const run = await findRunRecord(conn, runId);
        if (!run || run.runnerId !== runner.id || !isActive(run.status))
          release.push(runId);
        else if (run.cancelRequestedAt !== null) cancelRequested.push(runId);
      }
      return { cancelRequested, release };
    },
  };
}
