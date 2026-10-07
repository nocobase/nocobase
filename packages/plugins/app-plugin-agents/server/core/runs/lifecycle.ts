/**
 * What a runner reports about the runs it holds: lease renewals, the start, events, and how the run ended. Every
 * report first checks that the runner still holds the run; a runner that lost it (the sweeper took it back, or it
 * ended) is told `LEASE_LOST` and must stop.
 */
import {
  isRetryable,
  MAX_EVENT_CONTENT_BYTES,
  ProtocolError,
  TIMINGS,
  type ActiveRun,
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

import { ONLINE_TOOL } from '../../../shared/reports.js';
import type { Runner } from '../../../shared/runners.js';
import { later, type Clock } from '../../kernel/clock.js';
import type { IdSource } from '../../kernel/ids.js';
import {
  createSecretMemory,
  runSecretsKey,
  type SecretMemory,
} from '../../kernel/redaction.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { asJson, truncateBytes } from '../../kernel/values.js';
import { everHeld } from './run-tokens.js';
import {
  eventsRepo,
  findRunRecord,
  inputsRepo,
  isActive,
  isTerminal,
  markDelivered,
  pendingInputs,
  reposRepo,
  runsRepo,
  sessionsRepo,
  toInput,
  usageRepo,
  type RunRecord,
} from './run.store.js';
import { finishRun, requeueRun, type TransitionDeps } from './transitions.js';

export interface RunnerReports {
  /** Resolves while `runner` holds the run; `LEASE_LOST`, `RUN_NOT_ACTIVE` or `RUN_NOT_OWNED` otherwise. */
  holds(runner: Pick<Runner, 'id'>, runId: string): Promise<void>;
  lease(runner: Pick<Runner, 'id'>, runId: string): Promise<LeaseResponse>;
  start(
    runner: Pick<Runner, 'id'>,
    runId: string,
    request: Pick<StartRequest, 'workDir' | 'acceptsInput' | 'sessionId'>,
  ): Promise<StartResponse>;
  /**
   * Records one model call of an online run as it happens (`tool` `online`), so what it used reaches the reports however the
   * run ends. The run must still be held.
   */
  onlineUsage(
    holder: Pick<Runner, 'id'>,
    runId: string,
    usage: OnlineUsageRecord,
  ): Promise<void>;
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

/** What one model call of an online run used. */
export interface OnlineUsageRecord {
  /** The model service the call went through, which prices it. */
  readonly modelService: string | null;
  readonly model: string | null;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens?: number;
  readonly cacheWriteTokens?: number;
  readonly reasoningTokens?: number;
}

export interface RunnerReportsDeps extends TransitionDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  /**
   * The secrets claims handed out. Events, summaries and failure details are redacted of them and of the common
   * patterns before they are stored, whatever the runner did (`kernel/redaction.ts`).
   */
  readonly secrets?: SecretMemory;
}

export function createRunnerReports(deps: RunnerReportsDeps): RunnerReports {
  const { tx, ids, clock } = deps;
  const secrets = deps.secrets ?? createSecretMemory();
  const redactorOf = (runId: string) => secrets.redactor(runSecretsKey(runId));

  /** The run, while `runner` holds it; `LEASE_LOST`, `RUN_NOT_ACTIVE` or `RUN_NOT_OWNED` otherwise. */
  async function held(
    conn: DatabaseConnection,
    runner: Pick<Runner, 'id'>,
    runId: string,
  ): Promise<RunRecord> {
    const run = await findRunRecord(conn, runId);
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

  async function extendLease(conn: DatabaseConnection, run: RunRecord) {
    const now = clock.now();
    const leaseExpiresAt = later(now, TIMINGS.leaseMs);
    await runsRepo(conn).updateMany({
      filter: { id: run.id },
      values: { leaseExpiresAt, updatedAt: now.toISOString() },
    });
    return leaseExpiresAt;
  }

  async function deliver(conn: DatabaseConnection, runId: string) {
    const pending = await pendingInputs(conn, runId);
    await markDelivered(conn, pending, clock.now().toISOString());
    return pending.map(toInput);
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
    for (const repo of report.repos ?? []) {
      const existing = await reposRepo(conn).findOne({
        filter: { runId: run.id, url: repo.url },
      });
      const values = {
        branch: repo.branch,
        pushed: repo.pushed,
        headSha: repo.headSha ?? null,
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
    onlineUsage: (holder, runId, usage) =>
      tx.run(async ({ conn }) => {
        const run = await held(conn, holder, runId);
        await usageRepo(conn).createOne({
          values: {
            id: ids.next(),
            runId: run.id,
            tool: ONLINE_TOOL,
            modelService: usage.modelService?.slice(0, 64) ?? null,
            model: usage.model?.slice(0, 200) ?? null,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            cacheReadTokens: usage.cacheReadTokens ?? 0,
            cacheWriteTokens: usage.cacheWriteTokens ?? 0,
            reasoningTokens: usage.reasoningTokens ?? 0,
            createdAt: clock.now().toISOString(),
          },
        });
      }),
    lease: (runner, runId) =>
      tx.run(async ({ conn }) => {
        const run = await held(conn, runner, runId);
        const leaseExpiresAt = await extendLease(conn, run);
        return {
          leaseExpiresAt,
          cancelRequested: run.cancelRequestedAt !== null,
          inputs: await deliver(conn, run.id),
        };
      }),

    start: (runner, runId, request) =>
      tx.run(async (unit) => {
        const { conn } = unit;
        const run = await held(conn, runner, runId);
        const cancelRequested = run.cancelRequestedAt !== null;
        if (run.status === 'dispatched' && !cancelRequested) {
          const now = clock.now().toISOString();
          await runsRepo(conn).updateMany({
            filter: (f) =>
              f.and([
                f.string('id').eq(run.id),
                f.string('status').eq('dispatched'),
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
          unit.emit({ type: 'run.changed', runId: run.id, status: 'running' });
        }
        const leaseExpiresAt = await extendLease(conn, run);
        const current = (await findRunRecord(conn, run.id))!;
        return {
          status: current.status,
          leaseExpiresAt,
          cancelRequested,
          inputs: await deliver(conn, run.id),
        };
      }),

    events: (runner, runId, request) =>
      tx.run(async (unit) => {
        const { conn } = unit;
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
        const now = clock.now().toISOString();
        const redact = redactorOf(run.id);
        let accepted = 0;
        let lastSeq = 0;
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
                  MAX_EVENT_CONTENT_BYTES,
                );
          const output =
            event.output === undefined
              ? null
              : truncateBytes(
                  redact.text(event.output),
                  MAX_EVENT_CONTENT_BYTES,
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
          accepted += 1;
        }
        await runsRepo(conn).updateMany({
          filter: { id: run.id },
          values: { lastActivityAt: now },
        });
        if (accepted > 0)
          unit.emit({ type: 'run.events', runId: run.id, lastSeq });
        return {
          accepted,
          duplicates: request.events.length - accepted,
          cancelRequested: run.cancelRequestedAt !== null,
        };
      }),

    status: (runner, runId) =>
      tx.run(async ({ conn }) => {
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
          inputs: await deliver(conn, current.id),
          leaseExpiresAt: current.leaseExpiresAt,
        };
      }),

    complete: (runner, runId, request) =>
      tx.run(async (unit) => {
        const run = await held(unit.conn, runner, runId);
        const handled = new Set(request.handledInputIds);
        const missing = (await pendingInputs(unit.conn, run.id)).filter(
          (input) => !handled.has(input.id),
        );
        if (missing.length > 0)
          throw new ProtocolError(
            'RUN_INPUT_PENDING',
            'The run has input it has not handled; handle it before completing.',
            {
              inputIds: missing.map((input) => input.id),
              inputs: missing.map(toInput),
            },
          );
        await recordOutcome(unit, run, request);
        await rememberSession(unit, run, request.sessionId, false);
        const ended = await finishRun(unit, deps, run, {
          status: 'completed',
          summary: redactorOf(run.id).text(request.summary),
          ...(request.sessionId ? { sessionId: request.sessionId } : {}),
        });
        if (!ended)
          throw new ProtocolError('LEASE_LOST', 'The run moved on; stop it.');
        secrets.forget(runSecretsKey(run.id));
        return { status: ended.status };
      }),

    fail: (runner, runId, reported) =>
      tx.run(async (unit) => {
        const run = await held(unit.conn, runner, runId);
        const request: FailRequest =
          reported.detail === undefined
            ? reported
            : {
                ...reported,
                detail: redactorOf(run.id).text(reported.detail),
              };
        await recordOutcome(unit, run, request);
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

    cancelAck: (runner, runId, request) =>
      tx.run(async (unit) => {
        const run = await held(unit.conn, runner, runId);
        await recordOutcome(unit, run, request);
        const ended = await finishRun(unit, deps, run, {
          status: 'cancelled',
          reason: 'cancelled',
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
