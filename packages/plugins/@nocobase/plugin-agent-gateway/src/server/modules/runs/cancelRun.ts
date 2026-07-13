/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { AGENT_GATEWAY_ACTIONS } from '../../security';
import {
  AGENT_GATEWAY_ERROR_CODES,
  JsonRecord,
  ModelRecord,
  getModelString,
  getModelValue,
  getVisibleRunFilter,
  requireAgentGatewayPermission,
} from '../../actions/utils';
import { revokeSkillDownloadCapabilitiesForRun } from '../../actions/skillCapabilities';
import { EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY } from '../../../shared/externalRunImport';
import {
  CLAIMABLE_RUN_STATUS,
  IMPORTING_RUN_STATUS,
  STALLED_RUN_STATUS,
  isActiveRunStatus,
  isTerminalRunStatus,
} from '../../../shared/runState';
import { serializeRunForUser } from '../../services/runSerialization';
import { addTerminalTokenUsageToRunValues } from './serialization';
import { terminalizeRun } from './terminalizeRun';

export async function cancelRun(ctx: Context, runId: string, options: { requirePermission?: boolean } = {}) {
  if (options.requirePermission !== false) {
    await requireAgentGatewayPermission(
      ctx,
      AGENT_GATEWAY_ACTIONS.cancelRun,
      'Agent Gateway cancel permission required',
    );
  }
  const visibleRunFilter =
    options.requirePermission !== false
      ? await getVisibleRunFilter(
          ctx,
          {
            id: runId,
          },
          'get',
        )
      : null;

  const updatedRun = await ctx.db.sequelize.transaction(async (transaction) => {
    const now = new Date();
    const run =
      options.requirePermission !== false
        ? ((await ctx.db.getRepository('agRuns').findOne({
            filter: visibleRunFilter || {
              id: runId,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
          })) as ModelRecord | null)
        : ((await ctx.db.getRepository('agRuns').findOne({
            filterByTk: runId,
            transaction,
            lock: transaction.LOCK.UPDATE,
          })) as ModelRecord | null);
    if (!run) {
      if (options.requirePermission !== false) {
        ctx.throw(404, {
          code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
          message: 'Run not found',
        });
      }
      ctx.throw(404, 'Run not found');
    }

    const status = getModelString(run, 'status');
    if (isTerminalRunStatus(status)) {
      ctx.throw(409, `Run is already ${status}`);
    }

    const values: JsonRecord = {
      cancelRequested: true,
      cancelRequestedAt: getModelValue(run, 'cancelRequestedAt') || now,
    };
    if (status === CLAIMABLE_RUN_STATUS || status === IMPORTING_RUN_STATUS) {
      values.status = 'canceled';
      values.canceledAt = now;
      values.finishedAt = now;
      values.claimExpiresAt = null;
      Object.assign(
        values,
        await addTerminalTokenUsageToRunValues({
          ctx,
          run,
          runId,
          values,
          transaction,
        }),
      );
    } else if (isActiveRunStatus(status) || status === STALLED_RUN_STATUS) {
      values.status = 'canceling';
    } else {
      ctx.throw(409, `Run cannot be canceled from ${status}`);
    }

    await ctx.db.getRepository('agRuns').update({
      filterByTk: runId,
      values,
      transaction,
    });
    await revokeSkillDownloadCapabilitiesForRun(ctx, runId, transaction);
    if (status === IMPORTING_RUN_STATUS) {
      await ctx.db.getRepository('agExternalImportBatches').update({
        filter: {
          runId,
          status: {
            $in: ['processing', 'failed'],
          },
        },
        values: {
          status: 'failed',
          errorSummary: EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY,
          completedAt: null,
          lastAttemptAt: now,
        },
        transaction,
      });
    }

    return (await ctx.db.getRepository('agRuns').findOne({
      filterByTk: runId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord;
  });
  ctx.body = serializeRunForUser(updatedRun);
}

export async function ackCancelRun(ctx: Context, nodeId: string, runId: string) {
  await terminalizeRun(ctx, nodeId, runId, 'canceled', (_values, now) => ({
    cancelRequested: true,
    cancelAckAt: now,
    canceledAt: now,
  }));
}
