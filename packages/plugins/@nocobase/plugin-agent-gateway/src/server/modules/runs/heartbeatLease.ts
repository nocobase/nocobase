/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { ModelRecord, getBodyValues, getModelString, getModelValue, getString } from '../../actions/utils';
import { AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON } from '../../../shared/runControl';
import { HeartbeatRunStatus, STALLED_RUN_STATUS, isHeartbeatRunStatus } from '../../../shared/runState';
import { respondLeaseLost, validateRunLease } from './claimLease';
import { getBoolean, getDateFromModel, getLeaseExpiresAt } from './types';

export function getHeartbeatStatus(ctx: Context, currentStatus: string, requestedStatus: string) {
  if (currentStatus === STALLED_RUN_STATUS) {
    if (!requestedStatus) {
      return 'running';
    }
    if (!isHeartbeatRunStatus(requestedStatus)) {
      ctx.throw(400, 'Unsupported heartbeat status');
    }
    return requestedStatus;
  }
  if (!requestedStatus) {
    return currentStatus;
  }

  if (!isHeartbeatRunStatus(requestedStatus)) {
    ctx.throw(400, 'Unsupported heartbeat status');
  }
  if (currentStatus === 'canceling') {
    return currentStatus;
  }

  if (!isHeartbeatRunStatus(currentStatus)) {
    return currentStatus;
  }

  const statusOrder: Record<HeartbeatRunStatus, number> = {
    claimed: 0,
    syncing_skills: 1,
    running: 2,
    finalizing: 3,
  };
  return statusOrder[requestedStatus] > statusOrder[currentStatus] ? requestedStatus : currentStatus;
}

export async function runHeartbeat(ctx: Context, nodeId: string, runId: string) {
  const values = getBodyValues(ctx);
  let stateChanged = false;
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction, {
      allowedStatuses: [STALLED_RUN_STATUS],
      allowPreviousLeaseVersion: true,
    });
    if (!lease) {
      return null;
    }

    const now = new Date();
    const heartbeatRetry = lease.requestedLeaseVersion !== lease.leaseVersion;
    const nextLeaseVersion = heartbeatRetry ? lease.leaseVersion : lease.leaseVersion + 1;
    const currentStatus = getModelString(lease.run, 'status');
    const status = heartbeatRetry ? currentStatus : getHeartbeatStatus(ctx, currentStatus, getString(values.status));
    stateChanged = !heartbeatRetry && status !== currentStatus;
    const claimExpiresAt = heartbeatRetry ? getDateFromModel(lease.run, 'claimExpiresAt') : getLeaseExpiresAt(now);
    if (!claimExpiresAt) {
      return respondLeaseLost(ctx, 'Run lease has expired');
    }
    if (!heartbeatRetry) {
      await ctx.db.getRepository('agRuns').update({
        filterByTk: runId,
        values: {
          status,
          leaseVersion: nextLeaseVersion,
          claimExpiresAt,
          lastRunHeartbeatAt: now,
          startedAt:
            status === 'running' && !getModelValue(lease.run, 'startedAt')
              ? now
              : getModelValue(lease.run, 'startedAt'),
        },
        transaction,
      });
      await ctx.db.getRepository('agNodes').update({
        filterByTk: nodeId,
        values: {
          lastHeartbeatAt: now,
        },
        transaction,
      });
    }
    const cancelRequested = getBoolean(getModelValue(lease.run, 'cancelRequested')) || status === 'canceling';
    const activeTerminateControl = cancelRequested
      ? ((await ctx.db.getRepository('agRunControlRequests').findOne({
          filter: {
            runId,
            action: 'terminate',
            status: ['accepted', 'delivered'],
          },
          transaction,
        })) as ModelRecord | null)
      : null;

    return {
      runId,
      status,
      claimAttempt: lease.claimAttempt,
      leaseVersion: nextLeaseVersion,
      claimExpiresAt: claimExpiresAt.toISOString(),
      leaseTtlMs: Math.max(0, claimExpiresAt.getTime() - now.getTime()),
      serverTime: now.toISOString(),
      cancelRequested,
      ...(activeTerminateControl ? { cancelReason: AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON } : {}),
    };
  });

  if (result) {
    ctx.state.agentGatewayApiStateChanged = stateChanged;
    ctx.body = result;
  }
}
