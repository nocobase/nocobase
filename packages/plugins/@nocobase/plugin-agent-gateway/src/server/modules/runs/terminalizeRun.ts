/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { redactRunErrorSummary } from '../../security';
import { JsonRecord, ModelRecord, getBodyValues, getModelString, getString } from '../../actions/utils';
import { revokeSkillDownloadCapabilitiesForRun } from '../../actions/skillCapabilities';
import { STALLED_RUN_STATUS, TerminalRunStatus, isTerminalRunStatus } from '../../../shared/runState';
import { mergeTerminalResultSummary } from '../../services/runSerialization';
import { respondLeaseLost, validateRunLease } from './claimLease';
import { addTerminalTokenUsageToRunValues } from './serialization';
import { failOpenControlRequestsForFinishedRun } from './terminalControls';

type LeaseTerminalRunStatus = Exclude<TerminalRunStatus, 'abandoned'>;

export const RUN_TERMINAL_TRANSITIONS: Record<LeaseTerminalRunStatus, readonly string[]> = {
  succeeded: ['running', 'finalizing', STALLED_RUN_STATUS],
  failed: ['claimed', 'syncing_skills', 'running', 'finalizing', STALLED_RUN_STATUS],
  timeout: ['running', 'finalizing', STALLED_RUN_STATUS],
  canceled: ['canceling', STALLED_RUN_STATUS],
};

export function getTerminalTransitionFailure(currentStatus: string, terminalStatus: LeaseTerminalRunStatus) {
  if (isTerminalRunStatus(currentStatus)) {
    return `Run is already ${currentStatus}`;
  }
  if (currentStatus === 'canceling' && terminalStatus !== 'canceled') {
    return 'Run is canceling';
  }
  if (!RUN_TERMINAL_TRANSITIONS[terminalStatus].includes(currentStatus)) {
    return `Run cannot become ${terminalStatus} from ${currentStatus}`;
  }
  return null;
}

export function assertTerminalAllowed(ctx: Context, run: ModelRecord, terminalStatus: LeaseTerminalRunStatus) {
  const failure = getTerminalTransitionFailure(getModelString(run, 'status'), terminalStatus);
  return failure ? respondLeaseLost(ctx, failure) : true;
}

export async function terminalizeRun(
  ctx: Context,
  nodeId: string,
  runId: string,
  terminalStatus: LeaseTerminalRunStatus,
  terminalValues: (values: JsonRecord, now: Date, run: ModelRecord) => JsonRecord,
) {
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction, {
      allowExpiredLease: true,
      allowStaleLeaseVersion: true,
      allowedStatuses: RUN_TERMINAL_TRANSITIONS[terminalStatus],
    });
    if (!lease) {
      return null;
    }
    const terminalAllowed = assertTerminalAllowed(ctx, lease.run, terminalStatus);
    if (terminalAllowed !== true) {
      return null;
    }

    const now = new Date();
    const nextLeaseVersion = lease.leaseVersion + 1;
    const nextRunValues = await addTerminalTokenUsageToRunValues({
      ctx,
      run: lease.run,
      runId,
      values: terminalValues(values, now, lease.run),
      transaction,
    });
    await ctx.db.getRepository('agRuns').update({
      filterByTk: runId,
      values: {
        status: terminalStatus,
        leaseVersion: nextLeaseVersion,
        claimExpiresAt: null,
        finishedAt: now,
        ...nextRunValues,
      },
      transaction,
    });
    await revokeSkillDownloadCapabilitiesForRun(ctx, runId, transaction);
    await failOpenControlRequestsForFinishedRun({
      ctx,
      run: lease.run,
      runId,
      terminalStatus,
      now,
      transaction,
    });

    return {
      runId,
      status: terminalStatus,
      claimAttempt: lease.claimAttempt,
      leaseVersion: nextLeaseVersion,
      finishedAt: now.toISOString(),
    };
  });

  if (result) {
    ctx.body = result;
  }
}

export async function completeRun(ctx: Context, nodeId: string, runId: string) {
  await terminalizeRun(ctx, nodeId, runId, 'succeeded', (values, now, run) => ({
    resultSummaryJson: mergeTerminalResultSummary(run, values.resultSummaryJson),
    completedAt: now,
  }));
}

export async function failRun(ctx: Context, nodeId: string, runId: string) {
  await terminalizeRun(ctx, nodeId, runId, 'failed', (values, now, run) => ({
    resultSummaryJson: mergeTerminalResultSummary(run, values.resultSummaryJson),
    errorSummary: getString(values.errorSummary) ? redactRunErrorSummary(getString(values.errorSummary)) : null,
    failedAt: now,
  }));
}

export async function timeoutRun(ctx: Context, nodeId: string, runId: string) {
  await terminalizeRun(ctx, nodeId, runId, 'timeout', (values) => ({
    errorSummary: getString(values.errorSummary)
      ? redactRunErrorSummary(getString(values.errorSummary))
      : 'Process timeout confirmed by daemon',
  }));
}
