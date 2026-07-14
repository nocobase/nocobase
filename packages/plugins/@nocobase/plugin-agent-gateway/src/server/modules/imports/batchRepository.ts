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
import { Transaction } from 'sequelize';

import { EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY } from '../../../shared/externalRunImport';
import { IMPORTING_RUN_STATUS } from '../../../shared/runState';
import { ModelRecord, getCurrentUserId, getModelNumber, getModelString, getModelTargetKey } from '../../actions/utils';
import { hashExternalImportValue as getHash } from '../../services/externalImportUtils';
import {
  PreparedImportFinalizationPlan,
  PreparedObservationPlan,
  getObservationWriteResult,
  getStoredImportFinalizationPlan,
  getStoredObservationPlan,
} from './serialization';

export const EXTERNAL_BATCH_COLLECTION = 'agExternalImportBatches';

function getBatchIdentityKey(identityId: unknown, batchKey: string) {
  return `external-import-batch:${getHash(`${String(identityId)}\0${batchKey}`)}`;
}

export function assertMatchingBatchPayload(ctx: Context, batch: ModelRecord, payloadSha256: string) {
  if (getModelString(batch, 'payloadSha256') !== payloadSha256) {
    ctx.throw(409, 'batchKey already belongs to a different external import payload');
  }
}

export async function startImportBatchAttempt(
  ctx: Context,
  batch: ModelRecord,
  run: ModelRecord,
  transaction: Transaction,
) {
  if (getModelString(batch, 'status') === 'completed') {
    return null;
  }
  const observationPlan = getStoredObservationPlan(ctx, batch);
  const finalizationPlan = getStoredImportFinalizationPlan(ctx, batch);
  const currentRunStatus = getModelString(run, 'status');
  if (currentRunStatus !== finalizationPlan.expectedRunStatus) {
    const canResumeRecoveredImport =
      finalizationPlan.expectedRunStatus === IMPORTING_RUN_STATUS &&
      (currentRunStatus === 'abandoned' || currentRunStatus === 'failed');
    if (!canResumeRecoveredImport) {
      if (
        currentRunStatus === 'canceled' &&
        getModelString(batch, 'errorSummary') === EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY
      ) {
        ctx.throw(409, 'Canceled external imports cannot be resumed');
      }
      ctx.throw(409, `Imported run changed from ${finalizationPlan.expectedRunStatus} to ${currentRunStatus}`);
    }
    await ctx.db.getRepository('agRuns').update({
      filterByTk: getModelTargetKey(run, 'id'),
      values: {
        status: IMPORTING_RUN_STATUS,
        cancelRequested: false,
        cancelRequestedAt: null,
        cancelAckAt: null,
        completedAt: null,
        failedAt: null,
        canceledAt: null,
        finishedAt: null,
        errorSummary: null,
      },
      transaction,
    });
  }
  await ctx.db.getRepository(EXTERNAL_BATCH_COLLECTION).update({
    filterByTk: getModelTargetKey(batch, 'id'),
    values: {
      status: 'processing',
      attemptCount: getModelNumber(batch, 'attemptCount') + 1,
      lastAttemptAt: new Date(),
      errorSummary: null,
      completedAt: null,
    },
    transaction,
  });
  return { observationPlan, finalizationPlan };
}

export async function assertNoIncompleteImportBatch(ctx: Context, runId: string, transaction: Transaction) {
  const incompleteBatch = (await ctx.db.getRepository(EXTERNAL_BATCH_COLLECTION).findOne({
    filter: { runId, status: { $in: ['processing', 'failed'] } },
    sort: ['-lastAttemptAt', '-createdAt'],
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (incompleteBatch) {
    ctx.throw(
      409,
      `External import batch ${getModelString(
        incompleteBatch,
        'batchKey',
      )} must be retried or canceled before starting another batch`,
    );
  }
}

export async function findImportBatch(
  ctx: Context,
  runId: string,
  batchKey: string,
  transaction: Transaction,
): Promise<ModelRecord | null> {
  return (await ctx.db.getRepository(EXTERNAL_BATCH_COLLECTION).findOne({
    filter: { runId, batchKey },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
}

export async function createImportBatch(
  ctx: Context,
  options: {
    identityId: unknown;
    runId: string;
    batchKey: string;
    payloadSha256: string;
    observationPlan: PreparedObservationPlan;
    finalizationPlan: PreparedImportFinalizationPlan;
    transaction: Transaction;
  },
) {
  return (await ctx.db.getRepository(EXTERNAL_BATCH_COLLECTION).create({
    values: {
      id: randomUUID(),
      batchIdentityKey: getBatchIdentityKey(options.identityId, options.batchKey),
      identityId: options.identityId,
      runId: options.runId,
      batchKey: options.batchKey,
      payloadSha256: options.payloadSha256,
      operationPlanSha256: options.observationPlan.operationPlanSha256,
      operationCount: options.observationPlan.operations.length,
      operationPlanJson: {
        version: options.observationPlan.version,
        operations: options.observationPlan.operations,
      },
      finalizationSha256: options.finalizationPlan.finalizationSha256,
      finalizationJson: {
        version: options.finalizationPlan.version,
        expectedRunStatus: options.finalizationPlan.expectedRunStatus,
        runUpdateValues: options.finalizationPlan.runUpdateValues,
        sourceRecordRelation: options.finalizationPlan.sourceRecordRelation,
      },
      status: 'processing',
      processedOperations: 0,
      attemptCount: 1,
      lastAttemptAt: new Date(),
      observationCountsJson: getObservationWriteResult(null),
      relationUpdated: false,
      createdById: getCurrentUserId(ctx) || null,
    },
    transaction: options.transaction,
  })) as ModelRecord;
}
