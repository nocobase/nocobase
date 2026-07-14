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

import { EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY } from '../../../shared/externalRunImport';
import { redactObservabilityText } from '../../security';
import { ModelRecord, getModelString, getModelTargetKey } from '../../actions/utils';
import { createConversationEvent } from '../../actions/conversationEvents';
import { createRunArtifact } from '../observations/registerArtifact';
import { createRunEvent } from '../observations/runEvent';
import { EXTERNAL_BATCH_COLLECTION } from './batchRepository';
import { ObservationOperation, ObservationWriteResult } from './serialization';

export async function writeObservationOperation(
  ctx: Context,
  options: {
    run: ModelRecord;
    runId: string;
    claimAttempt: number;
    operation: ObservationOperation;
    transaction: Transaction;
  },
): Promise<ObservationWriteResult> {
  const result: ObservationWriteResult = { conversationEvents: 0, runEvents: 0, artifacts: 0 };
  if (options.operation.type === 'run-event') {
    const event = await createRunEvent(ctx, {
      runId: options.runId,
      claimAttempt: options.claimAttempt,
      source: options.operation.source,
      sequence: options.operation.sequence,
      eventType: options.operation.eventType,
      message: options.operation.message,
      contentJson: options.operation.payload,
      transaction: options.transaction,
    });
    if (event.idempotent !== true) {
      result.runEvents = 1;
    }
    return result;
  }
  if (options.operation.type === 'artifact') {
    const artifact = await createRunArtifact(ctx, {
      runId: options.runId,
      claimAttempt: options.claimAttempt,
      values: options.operation.values,
      transaction: options.transaction,
    });
    if (artifact.idempotent !== true) {
      result.artifacts = 1;
    }
    return result;
  }
  const event = await createConversationEvent(
    ctx,
    options.run,
    options.runId,
    options.operation.values,
    options.transaction,
  );
  if (event.idempotent !== true) {
    result.conversationEvents = 1;
  }
  return result;
}

export async function markImportBatchFailed(ctx: Context, batchId: string | number, error: unknown) {
  await ctx.db.sequelize.transaction(async (transaction) => {
    const batch = (await ctx.db.getRepository(EXTERNAL_BATCH_COLLECTION).findOne({
      filterByTk: batchId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (
      !batch ||
      getModelString(batch, 'status') === 'completed' ||
      (getModelString(batch, 'status') === 'failed' &&
        getModelString(batch, 'errorSummary') === EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY)
    ) {
      return;
    }
    const errorSummary = error instanceof Error ? error.message : String(error);
    await ctx.db.getRepository(EXTERNAL_BATCH_COLLECTION).update({
      filterByTk: getModelTargetKey(batch, 'id'),
      values: {
        status: 'failed',
        errorSummary: redactObservabilityText(errorSummary).slice(0, 4000),
        completedAt: null,
        lastAttemptAt: new Date(),
      },
      transaction,
    });
  });
}
