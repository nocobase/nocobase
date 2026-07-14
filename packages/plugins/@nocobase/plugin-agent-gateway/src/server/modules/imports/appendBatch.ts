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

import { EXTERNAL_IMPORT_LIMITS, EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY } from '../../../shared/externalRunImport';
import { isTerminalRunStatus } from '../../../shared/runState';
import {
  ModelRecord,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getString,
} from '../../actions/utils';
import { PreparedExternalObservationBatch as PreparedObservationBatch } from '../../services/externalImportLogs';
import { EXTERNAL_BATCH_COLLECTION } from './batchRepository';
import { finalizeExternalImport } from './finalization';
import { mergeExternalImportObservabilityRollup } from './observabilityProjection';
import { markImportBatchFailed, writeObservationOperation } from './observationPersistence';
import {
  ObservationWriteResult,
  PreparedImportFinalizationPlan,
  PreparedObservationPlan,
  addObservationWriteResults,
  getObservationWriteResult,
} from './serialization';

export interface ObservationBatchProcessingResult {
  observations: ObservationWriteResult;
  relationUpdated: boolean;
}

function assertStoredPlans(
  ctx: Context,
  batch: ModelRecord,
  observationPlan: PreparedObservationPlan,
  finalizationPlan: PreparedImportFinalizationPlan,
) {
  if (
    getModelString(batch, 'operationPlanSha256') !== observationPlan.operationPlanSha256 ||
    getModelNumber(batch, 'operationCount') !== observationPlan.operations.length
  ) {
    ctx.throw(409, 'External import operation plan changed; retry with a new batchKey');
  }
  if (getModelString(batch, 'finalizationSha256') !== finalizationPlan.finalizationSha256) {
    ctx.throw(409, 'External import finalization plan changed; retry with a new batchKey');
  }
}

async function processObservationChunk(
  ctx: Context,
  options: {
    run: ModelRecord;
    runId: string;
    operations: PreparedObservationPlan['operations'];
    processedOperations: number;
    transaction: Transaction;
  },
) {
  const chunk = options.operations.slice(
    options.processedOperations,
    options.processedOperations + EXTERNAL_IMPORT_LIMITS.observationChunkSize,
  );
  let counts: ObservationWriteResult = { conversationEvents: 0, runEvents: 0, artifacts: 0 };
  for (const operation of chunk) {
    counts = addObservationWriteResults(
      counts,
      await writeObservationOperation(ctx, {
        run: options.run,
        runId: options.runId,
        claimAttempt: getModelNumber(options.run, 'claimAttempt'),
        operation,
        transaction: options.transaction,
      }),
    );
  }
  return { chunk, counts };
}

export async function processObservationBatch(
  ctx: Context,
  options: {
    run: ModelRecord;
    batch: ModelRecord;
    preparedBatch: PreparedObservationBatch;
    observationPlan: PreparedObservationPlan;
    finalizationPlan: PreparedImportFinalizationPlan;
  },
): Promise<ObservationBatchProcessingResult> {
  const runId = String(getModelTargetKey(options.run, 'id'));
  const batchId = getModelTargetKey(options.batch, 'id');
  try {
    let completedResult: ObservationBatchProcessingResult | null = null;
    while (!completedResult) {
      const result = await ctx.db.sequelize.transaction(async (transaction) => {
        const run = (await ctx.db.getRepository('agRuns').findOne({
          filterByTk: runId,
          transaction,
          lock: transaction.LOCK.UPDATE,
        })) as ModelRecord | null;
        if (!run) {
          ctx.throw(404, 'Run not found');
        }
        const batch = (await ctx.db.getRepository(EXTERNAL_BATCH_COLLECTION).findOne({
          filterByTk: batchId,
          transaction,
          lock: transaction.LOCK.UPDATE,
        })) as ModelRecord | null;
        if (!batch) {
          ctx.throw(404, 'External import batch not found');
        }
        if (getModelString(batch, 'payloadSha256') !== options.preparedBatch.payloadSha256) {
          ctx.throw(409, 'batchKey already belongs to a different external import payload');
        }
        const storedCounts = getObservationWriteResult(getModelValue(batch, 'observationCountsJson'));
        if (getModelString(batch, 'status') === 'completed') {
          return {
            observations: storedCounts,
            completed: true,
            relationUpdated: getModelValue(batch, 'relationUpdated') === true,
          };
        }
        assertStoredPlans(ctx, batch, options.observationPlan, options.finalizationPlan);
        const batchStatus = getModelString(batch, 'status');
        if (batchStatus !== 'processing') {
          if (
            batchStatus === 'failed' &&
            getModelString(batch, 'errorSummary') === EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY
          ) {
            ctx.throw(409, 'Canceled external imports cannot be resumed');
          }
          ctx.throw(409, `External import batch cannot continue from ${batchStatus}`);
        }
        const runStatus = getModelString(run, 'status');
        if (runStatus !== options.finalizationPlan.expectedRunStatus) {
          ctx.throw(409, `Imported run changed from ${options.finalizationPlan.expectedRunStatus} to ${runStatus}`);
        }
        const processedOperations = getModelNumber(batch, 'processedOperations');
        if (processedOperations < 0 || processedOperations > options.observationPlan.operations.length) {
          ctx.throw(409, 'External import batch progress is invalid');
        }
        const processed = await processObservationChunk(ctx, {
          run,
          runId,
          operations: options.observationPlan.operations,
          processedOperations,
          transaction,
        });
        const nextProcessedOperations = Math.min(
          processedOperations + processed.chunk.length,
          options.observationPlan.operations.length,
        );
        const observations = addObservationWriteResults(storedCounts, processed.counts);
        const completed = nextProcessedOperations >= options.observationPlan.operations.length;
        const finalRunUpdateValues = options.finalizationPlan.runUpdateValues;
        const finalStatus = completed ? getString(finalRunUpdateValues?.status) || runStatus : runStatus;
        const resultSummaryJson =
          completed && isTerminalRunStatus(finalStatus)
            ? finalRunUpdateValues?.resultSummaryJson ?? getModelValue(run, 'resultSummaryJson')
            : null;
        const observabilityRollupJson = await mergeExternalImportObservabilityRollup(ctx, {
          run,
          runId,
          batchId: String(batchId),
          operations: processed.chunk,
          finalStatus,
          resultSummaryJson,
          transaction,
        });
        if (observabilityRollupJson) {
          await ctx.db.getRepository('agRuns').update({
            filterByTk: runId,
            values: { observabilityRollupJson },
            transaction,
          });
        }
        const relationUpdated = completed
          ? await finalizeExternalImport(ctx, { run, runId, finalizationPlan: options.finalizationPlan, transaction })
          : false;
        await ctx.db.getRepository(EXTERNAL_BATCH_COLLECTION).update({
          filterByTk: batchId,
          values: {
            processedOperations: nextProcessedOperations,
            observationCountsJson: observations,
            status: completed ? 'completed' : 'processing',
            errorSummary: null,
            completedAt: completed ? new Date() : null,
            lastAttemptAt: new Date(),
            relationUpdated,
            ...(completed ? { operationPlanJson: null } : {}),
          },
          transaction,
        });
        return { observations, completed, relationUpdated };
      });
      if (result.completed) {
        completedResult = { observations: result.observations, relationUpdated: result.relationUpdated };
      }
    }
    return completedResult;
  } catch (error) {
    try {
      await markImportBatchFailed(ctx, batchId, error);
    } catch {
      // Keep the original observation write error when failure bookkeeping also fails.
    }
    throw error;
  }
}
