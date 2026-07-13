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

import { EXTERNAL_IMPORT_LIMITS, EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY } from '../../../shared/externalRunImport';
import { isTerminalRunStatus } from '../../../shared/runState';
import { redactEventPayload, redactObservabilityText } from '../../security';
import {
  JsonRecord,
  ModelRecord,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getString,
} from '../../actions/utils';
import { createConversationEvent } from '../../actions/conversationEvents';
import {
  OBSERVABILITY_ROLLUP_EVENT_FILTER,
  buildRunObservabilityRollup,
  getRunObservabilityRollup,
  mergeRunObservabilityRollup,
} from '../../services/observationRollup';
import { PreparedExternalObservationBatch as PreparedObservationBatch } from '../../services/externalImportLogs';
import { createRunArtifact } from '../observations/registerArtifact';
import { updateSourceRecordRelation } from './businessLink';
import {
  ObservationOperation,
  ObservationWriteResult,
  PreparedImportFinalizationPlan,
  PreparedObservationPlan,
  addObservationWriteResults,
  getObservationWriteResult,
} from './serialization';

const MAX_EVENT_MESSAGE_LENGTH = 4000;
const MAX_EVENT_PAYLOAD_CHARS = 16000;
const EXTERNAL_BATCH_COLLECTION = 'agExternalImportBatches';

export interface ObservationBatchProcessingResult {
  observations: ObservationWriteResult;
  relationUpdated: boolean;
}

function assertMatchingBatchOperationPlan(ctx: Context, batch: ModelRecord, observationPlan: PreparedObservationPlan) {
  if (
    getModelString(batch, 'operationPlanSha256') !== observationPlan.operationPlanSha256 ||
    getModelNumber(batch, 'operationCount') !== observationPlan.operations.length
  ) {
    ctx.throw(409, 'External import operation plan changed; retry with a new batchKey');
  }
}

function assertMatchingBatchFinalizationPlan(
  ctx: Context,
  batch: ModelRecord,
  finalizationPlan: PreparedImportFinalizationPlan,
) {
  if (getModelString(batch, 'finalizationSha256') !== finalizationPlan.finalizationSha256) {
    ctx.throw(409, 'External import finalization plan changed; retry with a new batchKey');
  }
}

function getEventMessage(ctx: Context, value: unknown) {
  const message = getString(value);
  if (message.length > MAX_EVENT_MESSAGE_LENGTH) {
    ctx.throw(413, 'Event message is too large; store large logs as artifacts');
  }
  return message ? redactObservabilityText(message) : null;
}

function getEventPayload(ctx: Context, value: unknown) {
  const redactedPayload = redactEventPayload(value);
  const serializedPayload = JSON.stringify(redactedPayload) || '';
  if (serializedPayload.length > MAX_EVENT_PAYLOAD_CHARS) {
    ctx.throw(413, 'Event payload is too large; store large logs as artifacts');
  }
  return redactedPayload;
}

async function appendRunEvent(
  ctx: Context,
  options: {
    runId: string;
    claimAttempt: number;
    source: string;
    sequence: number;
    level?: string;
    eventType: string;
    message?: string | null;
    payload?: unknown;
    emittedAt?: Date;
    transaction: Transaction;
  },
) {
  const repo = ctx.db.getRepository('agRunEvents');
  const uniqueFilter = {
    runId: options.runId,
    claimAttempt: options.claimAttempt,
    source: options.source,
    sequence: options.sequence,
  };
  const existing = (await repo.findOne({
    filter: uniqueFilter,
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (existing) {
    return false;
  }
  await repo.create({
    values: {
      id: randomUUID(),
      ...uniqueFilter,
      level: options.level || 'info',
      eventType: options.eventType,
      message: getEventMessage(ctx, options.message || options.eventType),
      payloadJson: getEventPayload(ctx, options.payload || {}),
      emittedAt: options.emittedAt || new Date(),
    },
    transaction: options.transaction,
  });
  return true;
}

async function writeObservationOperation(
  ctx: Context,
  options: {
    run: ModelRecord;
    runId: string;
    claimAttempt: number;
    operation: ObservationOperation;
    transaction: Transaction;
  },
): Promise<ObservationWriteResult> {
  const result: ObservationWriteResult = {
    conversationEvents: 0,
    runEvents: 0,
    artifacts: 0,
  };
  if (options.operation.type === 'run-event') {
    if (
      await appendRunEvent(ctx, {
        runId: options.runId,
        claimAttempt: options.claimAttempt,
        source: options.operation.source,
        sequence: options.operation.sequence,
        eventType: options.operation.eventType,
        message: options.operation.message,
        payload: options.operation.payload,
        transaction: options.transaction,
      })
    ) {
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

async function markImportBatchFailed(ctx: Context, batchId: string | number, error: unknown) {
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
      filterByTk: batchId,
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
  const operations = options.observationPlan.operations;

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
        assertMatchingBatchOperationPlan(ctx, batch, options.observationPlan);
        assertMatchingBatchFinalizationPlan(ctx, batch, options.finalizationPlan);
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
        if (processedOperations < 0 || processedOperations > operations.length) {
          ctx.throw(409, 'External import batch progress is invalid');
        }
        const chunk = operations.slice(
          processedOperations,
          processedOperations + EXTERNAL_IMPORT_LIMITS.observationChunkSize,
        );
        let chunkCounts: ObservationWriteResult = {
          conversationEvents: 0,
          runEvents: 0,
          artifacts: 0,
        };
        for (const operation of chunk) {
          const operationCounts = await writeObservationOperation(ctx, {
            run,
            runId,
            claimAttempt: getModelNumber(run, 'claimAttempt'),
            operation,
            transaction,
          });
          chunkCounts = addObservationWriteResults(chunkCounts, operationCounts);
        }

        const nextProcessedOperations = Math.min(processedOperations + chunk.length, operations.length);
        const observations = addObservationWriteResults(storedCounts, chunkCounts);
        const completed = nextProcessedOperations >= operations.length;
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
          operations: chunk,
          finalStatus,
          resultSummaryJson,
          transaction,
        });
        if (observabilityRollupJson) {
          await ctx.db.getRepository('agRuns').update({
            filterByTk: runId,
            values: {
              observabilityRollupJson,
            },
            transaction,
          });
        }
        const relationUpdated = completed
          ? await finalizeExternalImport(ctx, {
              run,
              runId,
              finalizationPlan: options.finalizationPlan,
              transaction,
            })
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
        return {
          observations,
          completed,
          relationUpdated,
        };
      });
      if (result.completed) {
        completedResult = {
          observations: result.observations,
          relationUpdated: result.relationUpdated,
        };
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

async function finalizeExternalImport(
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

async function mergeExternalImportObservabilityRollup(
  ctx: Context,
  options: {
    run: ModelRecord;
    runId: string;
    batchId: string;
    operations: ObservationOperation[];
    finalStatus: string;
    resultSummaryJson: unknown;
    transaction: Transaction;
  },
) {
  const existingRollup = getRunObservabilityRollup(options.run);
  const identityFilter = existingRollup ? getObservationOperationsConversationEventFilter(options.operations) : null;
  const events =
    existingRollup && !identityFilter
      ? []
      : ((await ctx.db.getRepository('agAgentConversationEvents').find({
          filter: {
            $and: [
              {
                runId: options.runId,
              },
              OBSERVABILITY_ROLLUP_EVENT_FILTER,
              ...(identityFilter ? [identityFilter] : []),
            ],
          },
          sort: ['createdAt', 'sequence', 'id'],
          transaction: options.transaction,
        })) as ModelRecord[]);
  return existingRollup
    ? mergeRunObservabilityRollup(options.run, events, new Date(), {
        externalImportBatchId: options.batchId,
        closeDanglingToolCalls: isTerminalRunStatus(options.finalStatus),
        resultSummaryJson: options.resultSummaryJson,
      })
    : buildRunObservabilityRollup(options.run, events, new Date(), {
        closeDanglingToolCalls: isTerminalRunStatus(options.finalStatus),
        resultSummaryJson: options.resultSummaryJson,
      });
}

function getObservationOperationsConversationEventFilter(operations: ObservationOperation[]): JsonRecord | null {
  const identitiesBySource = new Map<
    string,
    {
      providerEventIds: Set<string>;
      sequences: Set<number>;
    }
  >();
  for (const operation of operations) {
    if (operation.type !== 'conversation-event' && operation.type !== 'initial-conversation') {
      continue;
    }
    const source = getString(operation.values.source);
    const sequence = Number(operation.values.sequence);
    if (!source || !Number.isInteger(sequence) || sequence < 0) {
      continue;
    }
    const identities = identitiesBySource.get(source) || {
      providerEventIds: new Set<string>(),
      sequences: new Set<number>(),
    };
    const providerEventId = getString(operation.values.providerEventId);
    if (providerEventId) {
      identities.providerEventIds.add(providerEventId);
    } else {
      identities.sequences.add(sequence);
    }
    identitiesBySource.set(source, identities);
  }

  const filters: JsonRecord[] = [];
  for (const [source, identities] of identitiesBySource) {
    if (identities.providerEventIds.size) {
      filters.push({
        source,
        providerEventId: {
          $in: [...identities.providerEventIds],
        },
      });
    }
    if (identities.sequences.size) {
      filters.push({
        source,
        sequence: {
          $in: [...identities.sequences],
        },
      });
    }
  }
  return filters.length
    ? {
        $or: filters,
      }
    : null;
}
