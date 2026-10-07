/**
 * The runs' sweep: takes runs back from runners that stopped answering and ends runs nobody will end. The runners'
 * sweeper (`runners/sweeper.ts`) calls it on its timer (every 30 seconds) after it marked silent runners offline; it
 * is safe to run on several instances at once: every move it makes is a guarded
 * update, so a run another instance (or its runner) moved first is left alone.
 *
 * - The runs an offline runner holds go back to the queue (`runnerOffline`); so do the runs of a revoked runner. An
 *   online run held by an application instance has no runner to be offline: when the instance stops renewing its
 *   lease, the lease rule below takes it back.
 * - A dispatched run not started within `startTimeoutMs` goes back to the queue (`startTimeout`).
 * - A held run whose lease lapsed goes back to the queue (`leaseExpired`).
 * - A running run with no event for twice its idle timeout fails (`idleTimeout`).
 * - A cancellation not acknowledged within `cancelGraceMs` is recorded as done.
 * - Queued runs of an archived agent are cancelled.
 * - A queued run that waited longer than its subject allows (`SubjectBinding.queuedExpiryMs`), counted from its last
 *   change (queued, sent back to the queue, merged into) or from when its delay passed, fails (`queuedExpired`).
 *
 * A run that goes back to the queue with no attempt left fails with the same reason instead.
 *
 * A runner that stops answering never sends the usage of the attempt it held; the latest `usage` event it reported for
 * the attempt (cumulative, `meta.usage`) is recorded instead, so the tokens it spent still reach the reports.
 */
import {
  TIMINGS,
  UsageSchema,
  type FailureReason,
} from '@nocobase/agent-protocol';
import type { RunnerService } from '../../runners/index.js';
import { z } from 'zod';

import type { Clock } from '../../kernel/clock.js';
import type { IdSource } from '../../kernel/ids.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { jsonObject } from '../../kernel/values.js';
import { findAgent } from '../agents/index.js';
import { isServerHolder } from './claim.js';
import { toolPolicyFor } from './policy.js';
import {
  ACTIVE,
  eventsRepo,
  findRunRecord,
  runsRepo,
  usageRepo,
  type RunRecord,
} from './run.store.js';
import { finishRun, requeueRun, type TransitionDeps } from './transitions.js';

export interface SweepReport {
  readonly requeued: number;
  readonly failed: number;
  readonly cancelled: number;
}

export interface Sweeper {
  sweep(): Promise<SweepReport>;
}

export interface SweeperDeps extends TransitionDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  /** Which runners are not online. */
  readonly runners: Pick<RunnerService, 'absent'>;
}

const ReportedUsage = z.array(UsageSchema);

/**
 * Records the usage the held attempt reported in its latest `usage` event, unless the attempt already reported usage
 * with an ending. Events from before the attempt was dispatched belong to earlier attempts.
 */
export async function salvageUsage(
  tx: Tx,
  deps: Pick<SweeperDeps, 'ids' | 'clock'>,
  run: RunRecord,
): Promise<void> {
  if (!run.dispatchedAt) return;
  const since = new Date(run.dispatchedAt);
  const recorded = await usageRepo(tx.conn).count({
    filter: (f) =>
      f.and([
        f.string('runId').eq(run.id),
        f.date('createdAt').notBefore(since),
      ]),
  });
  if (recorded > 0) return;
  const [latest] = await eventsRepo(tx.conn).findMany({
    filter: (f) =>
      f.and([
        f.string('runId').eq(run.id),
        f.string('type').eq('usage'),
        f.date('createdAt').notBefore(since),
      ]),
    sort: (sort) => [sort.field('seq').desc()],
    limit: 1,
  });
  if (!latest) return;
  const parsed = ReportedUsage.safeParse(jsonObject(latest.meta).usage);
  if (!parsed.success) return;
  const now = deps.clock.now().toISOString();
  for (const usage of parsed.data)
    await usageRepo(tx.conn).createOne({
      values: {
        id: deps.ids.next(),
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
}

export function createSweeper(deps: SweeperDeps): Sweeper {
  const { tx, clock } = deps;

  return {
    async sweep() {
      const now = clock.now();
      const counts = { requeued: 0, failed: 0, cancelled: 0 };

      const take = async (run: RunRecord, reason: FailureReason) => {
        await tx.run(async (unit) => {
          const current = await findRunRecord(unit.conn, run.id);
          if (
            !current ||
            current.status !== run.status ||
            current.runnerId !== run.runnerId
          )
            return;
          await salvageUsage(unit, deps, current);
          const outcome = await requeueRun(unit, deps, current, reason);
          if (outcome.status === 'queued') counts.requeued += 1;
          else if (outcome.run) counts.failed += 1;
        });
      };
      const end = async (
        run: RunRecord,
        outcome: Parameters<typeof finishRun>[3],
      ) => {
        await tx.run(async (unit) => {
          const current = await findRunRecord(unit.conn, run.id);
          if (!current || current.status !== run.status) return;
          if (current.status !== 'queued')
            await salvageUsage(unit, deps, current);
          const ended = await finishRun(unit, deps, current, outcome);
          if (ended?.status === 'failed') counts.failed += 1;
          if (ended?.status === 'cancelled') counts.cancelled += 1;
        });
      };

      const conn = tx.read();
      const held = await runsRepo(conn).findMany({
        filter: (f) =>
          f.or(ACTIVE.map((status) => f.string('status').eq(status))),
      });
      // An online run's holder is an application instance, not a registered runner: only its lease tells it is gone.
      const absent = new Set(
        await deps.runners.absent(
          conn,
          [...new Set(held.map((run) => run.runnerId ?? ''))].filter(
            (id) => id !== '' && !isServerHolder(id),
          ),
        ),
      );
      const policies = new Map<string, number>();
      const idleTimeoutOf = async (agentId: string) => {
        if (!policies.has(agentId)) {
          const agent = await findAgent(conn, agentId);
          policies.set(
            agentId,
            toolPolicyFor(agent?.toolPolicy ?? null).idleTimeoutMs,
          );
        }
        return policies.get(agentId)!;
      };
      const time = (at: string | null) => (at ? Date.parse(at) : 0);

      for (const run of held) {
        if (
          run.cancelRequestedAt &&
          time(run.cancelRequestedAt) < now.getTime() - TIMINGS.cancelGraceMs
        ) {
          await end(run, { status: 'cancelled', reason: 'cancelled' });
          continue;
        }
        if (run.runnerId && absent.has(run.runnerId)) {
          await take(run, 'runnerOffline');
          continue;
        }
        if (
          run.status === 'dispatched' &&
          time(run.dispatchedAt) < now.getTime() - TIMINGS.startTimeoutMs
        ) {
          await take(run, 'startTimeout');
          continue;
        }
        if (time(run.leaseExpiresAt) < now.getTime()) {
          await take(run, 'leaseExpired');
          continue;
        }
        if (
          run.status === 'running' &&
          time(run.lastActivityAt ?? run.startedAt) <
            now.getTime() - 2 * (await idleTimeoutOf(run.agentId))
        )
          await end(run, {
            status: 'failed',
            reason: 'idleTimeout',
            detail: 'The run reported nothing for too long.',
          });
      }

      const queued = await runsRepo(conn).findMany({
        filter: (f) =>
          f.and([
            f.string('status').eq('queued'),
            f
              .relation('agent')
              .some((agent) => agent.date('archivedAt').notEmpty()),
          ]),
      });
      for (const run of queued)
        await end(run, {
          status: 'cancelled',
          reason: 'cancelled',
          detail: 'The agent was archived.',
        });

      for (const binding of deps.subjects.list()) {
        const expiry = binding.queuedExpiryMs ?? 0;
        if (!(expiry > 0)) continue;
        const cutoff = new Date(now.getTime() - expiry);
        const stale = await runsRepo(conn).findMany({
          filter: (f) =>
            f.and([
              f.string('status').eq('queued'),
              f.string('subjectKind').eq(binding.kind),
              f.date('updatedAt').before(cutoff),
              f.or([
                f.date('availableAt').empty(),
                f.date('availableAt').before(cutoff),
              ]),
            ]),
        });
        for (const run of stale)
          await end(run, {
            status: 'failed',
            reason: 'queuedExpired',
            detail: 'No runtime took the run in time.',
          });
      }

      return counts;
    },
  };
}
