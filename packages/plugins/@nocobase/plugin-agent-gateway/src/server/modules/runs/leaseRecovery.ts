/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';
import { Context } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';
import { redactRunErrorSummary } from '../../security';
import {
  ModelRecord,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  requireManagePermission,
} from '../../actions/utils';
import { revokeSkillDownloadCapabilitiesForRun } from '../../actions/skillCapabilities';
import { ACTIVE_RUN_STATUSES, STALLED_RUN_STATUS, isActiveRunStatus } from '../../../shared/runState';
import { addTerminalTokenUsageToRunValues } from './serialization';
import { failOpenControlRequestsForFinishedRun } from './terminalControls';
import { LEASE_RECOVERY_BATCH_LIMIT, LEASE_RECOVERY_STALLED_GRACE_MS, getBoolean, getDateFromModel } from './types';

export async function appendRunLeaseRecoveryEvent(options: {
  ctx: Context;
  run: ModelRecord;
  now: Date;
  reason: string;
  eventType: 'run.lease.stalled' | 'run.lease.failed' | 'run.lease.canceled';
  message: string;
  nextStatus: string;
  transaction: Transaction;
}) {
  const runId = String(getModelTargetKey(options.run, 'id'));
  const latestEvent = (await options.ctx.db.getRepository('agRunEvents').findOne({
    filter: {
      runId,
      source: 'agent-gateway',
    },
    sort: ['-sequence'],
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord | null;

  await options.ctx.db.getRepository('agRunEvents').create({
    values: {
      id: randomUUID(),
      runId,
      claimAttempt: getModelNumber(options.run, 'claimAttempt'),
      source: 'agent-gateway',
      sequence: (latestEvent ? getModelNumber(latestEvent, 'sequence') : 0) + 1,
      level: 'warn',
      eventType: options.eventType,
      message: options.message,
      payloadJson: {
        reason: options.reason,
        previousStatus: getModelString(options.run, 'status'),
        nextStatus: options.nextStatus,
        leaseVersion: getModelNumber(options.run, 'leaseVersion'),
        claimExpiresAt: getDateFromModel(options.run, 'claimExpiresAt')?.toISOString() || null,
      },
      emittedAt: options.now,
    },
    transaction: options.transaction,
  });
}

export async function reconcileExpiredRunLeases(
  ctx: Context,
  options: { requirePermission?: boolean; limit?: number; recoveryReason?: string } = {},
) {
  if (options.requirePermission) {
    await requireManagePermission(ctx);
  }
  const now = new Date();
  const expiredRuns = (await ctx.db.getRepository('agRuns').find({
    filter: {
      status: {
        $in: [...ACTIVE_RUN_STATUSES, STALLED_RUN_STATUS],
      },
      claimExpiresAt: {
        $lte: now,
      },
    },
    sort: ['claimExpiresAt'],
    limit: options.limit || LEASE_RECOVERY_BATCH_LIMIT,
  })) as ModelRecord[];

  let stalledCount = 0;
  let failedCount = 0;
  let canceledCount = 0;
  for (const run of expiredRuns) {
    const recoveryResult = await ctx.db.sequelize.transaction(async (transaction) => {
      const lockedRun = (await ctx.db.getRepository('agRuns').findOne({
        filterByTk: getModelTargetKey(run, 'id'),
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord | null;
      const currentStatus = lockedRun ? getModelString(lockedRun, 'status') : '';
      if (!lockedRun || (!isActiveRunStatus(currentStatus) && currentStatus !== STALLED_RUN_STATUS)) {
        return null;
      }

      const claimExpiresAt = getDateFromModel(lockedRun, 'claimExpiresAt');
      if (!claimExpiresAt || claimExpiresAt.getTime() > now.getTime()) {
        return null;
      }
      await revokeSkillDownloadCapabilitiesForRun(ctx, String(getModelTargetKey(lockedRun, 'id')), transaction);

      if (currentStatus === 'canceling' || getBoolean(getModelValue(lockedRun, 'cancelRequested'))) {
        const terminalValues = await addTerminalTokenUsageToRunValues({
          ctx,
          run: lockedRun,
          runId: String(getModelTargetKey(lockedRun, 'id')),
          values: {
            status: 'canceled',
            cancelRequested: true,
            cancelRequestedAt: getModelValue(lockedRun, 'cancelRequestedAt') || now,
            claimExpiresAt: null,
            canceledAt: now,
            finishedAt: now,
            terminalEndedAt: now,
          },
          transaction,
        });
        await ctx.db.getRepository('agRuns').update({
          filterByTk: getModelTargetKey(lockedRun, 'id'),
          values: terminalValues,
          transaction,
        });
        await appendRunLeaseRecoveryEvent({
          ctx,
          run: lockedRun,
          now,
          reason: options.recoveryReason || 'lease-expired',
          eventType: 'run.lease.canceled',
          message: 'Run lease expired after cancellation was requested and the run was marked canceled',
          nextStatus: 'canceled',
          transaction,
        });
        await failOpenControlRequestsForFinishedRun({
          ctx,
          run: lockedRun,
          runId: String(getModelTargetKey(lockedRun, 'id')),
          terminalStatus: 'canceled',
          now,
          transaction,
        });
        return 'canceled' as const;
      }

      if (currentStatus !== STALLED_RUN_STATUS) {
        const stalledUntil = new Date(now.getTime() + LEASE_RECOVERY_STALLED_GRACE_MS);
        await ctx.db.getRepository('agRuns').update({
          filterByTk: getModelTargetKey(lockedRun, 'id'),
          values: {
            status: STALLED_RUN_STATUS,
            claimExpiresAt: stalledUntil,
          },
          transaction,
        });
        await appendRunLeaseRecoveryEvent({
          ctx,
          run: lockedRun,
          now,
          reason: options.recoveryReason || 'lease-expired',
          eventType: 'run.lease.stalled',
          message: 'Run lease expired and was marked stalled',
          nextStatus: STALLED_RUN_STATUS,
          transaction,
        });
        return 'stalled' as const;
      }

      const terminalValues = await addTerminalTokenUsageToRunValues({
        ctx,
        run: lockedRun,
        runId: String(getModelTargetKey(lockedRun, 'id')),
        values: {
          status: 'failed',
          claimExpiresAt: null,
          failedAt: now,
          finishedAt: now,
          terminalEndedAt: now,
          errorSummary: redactRunErrorSummary('Runner lost after lease stalled grace period'),
        },
        transaction,
      });
      await ctx.db.getRepository('agRuns').update({
        filterByTk: getModelTargetKey(lockedRun, 'id'),
        values: terminalValues,
        transaction,
      });
      await appendRunLeaseRecoveryEvent({
        ctx,
        run: lockedRun,
        now,
        reason: options.recoveryReason || 'lease-expired',
        eventType: 'run.lease.failed',
        message: 'Run lease remained stalled and was marked failed',
        nextStatus: 'failed',
        transaction,
      });
      await failOpenControlRequestsForFinishedRun({
        ctx,
        run: lockedRun,
        runId: String(getModelTargetKey(lockedRun, 'id')),
        terminalStatus: 'failed',
        now,
        transaction,
      });
      return 'failed' as const;
    });

    if (recoveryResult === 'stalled') {
      stalledCount += 1;
    }
    if (recoveryResult === 'failed') {
      failedCount += 1;
    }
    if (recoveryResult === 'canceled') {
      canceledCount += 1;
    }
  }

  return {
    stalledCount,
    failedCount,
    canceledCount,
    scannedAt: now.toISOString(),
  };
}

export async function expireLeases(ctx: Context) {
  ctx.body = await reconcileExpiredRunLeases(ctx, {
    requirePermission: true,
    recoveryReason: 'manual-expire-leases',
  });
}

export function createRunLifecycleHookContext(plugin: Plugin): Context {
  return {
    app: plugin.app,
    db: plugin.db,
  } as unknown as Context;
}

export async function recoverExpiredRunLeases(plugin: Plugin, recoveryReason = 'server-startup') {
  return await reconcileExpiredRunLeases(createRunLifecycleHookContext(plugin), {
    recoveryReason,
  });
}
