/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Transaction } from 'sequelize';

import { JsonRecord, ModelRecord, getModelString } from '../../actions/utils';
import { updateSourceRecordRelation } from './businessLink';
import { PreparedImportFinalizationPlan } from './serialization';

export async function finalizeExternalImport(
  ctx: Context,
  options: {
    run: ModelRecord;
    runId: string;
    finalizationPlan: PreparedImportFinalizationPlan;
    transaction: Transaction;
  },
) {
  const currentStatus = getModelString(options.run, 'status');
  if (currentStatus !== options.finalizationPlan.expectedRunStatus) {
    ctx.throw(409, `Imported run changed from ${options.finalizationPlan.expectedRunStatus} to ${currentStatus}`);
  }
  const runUpdateValues: JsonRecord = options.finalizationPlan.runUpdateValues
    ? { ...options.finalizationPlan.runUpdateValues }
    : {};
  if (Object.keys(runUpdateValues).length) {
    await ctx.db.getRepository('agRuns').update({
      filterByTk: options.runId,
      values: runUpdateValues,
      transaction: options.transaction,
    });
  }
  if (!options.finalizationPlan.sourceRecordRelation) {
    return false;
  }
  return await updateSourceRecordRelation(ctx, {
    ...options.finalizationPlan.sourceRecordRelation,
    runId: options.runId,
    transaction: options.transaction,
  });
}
