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

import { AgentProviderKey, getAgentProviderKey, isAgentProviderKey } from '../../../shared/providerCapabilities';
import {
  EXTERNAL_IMPORT_CAPABILITIES,
  EXTERNAL_IMPORT_LIMITS,
  EXTERNAL_IMPORT_SOURCE_TYPE,
  EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY,
  ExternalLogFormat,
} from '../../../shared/externalRunImport';
import { IMPORTING_RUN_STATUS, isTerminalRunStatus } from '../../../shared/runState';
import {
  AGENT_GATEWAY_ACTIONS,
  redactEventPayload,
  redactObservabilityText,
  redactRunErrorSummary,
  redactRunResultSummary,
} from '../../security';
import {
  JsonRecord,
  ModelRecord,
  assertRunVisible,
  getArray,
  getBodyValues,
  getCurrentUserId,
  getDate,
  getModelJson,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  getVisibleRunFilter,
  requireAgentGatewayPermission,
} from '../../actions/utils';
import { createConversationEvent } from '../../actions/conversationEvents';
import { serializeRunForManagement } from '../../actions/runLifecycle';
import { createRunArtifact } from '../observations/registerArtifact';
import {
  OBSERVABILITY_ROLLUP_EVENT_FILTER,
  buildRunObservabilityRollup,
  getRunObservabilityRollup,
  getTokenUsageSummaryFromRecord,
  mergeRunObservabilityRollup,
} from '../../services/observationRollup';
import {
  PreparedExternalImportLog as PreparedLogEntry,
  PreparedExternalObservationBatch as PreparedObservationBatch,
  prepareExternalObservationBatch as prepareObservationBatch,
} from '../../services/externalImportLogs';
import {
  hashExternalImportValue as getHash,
  sanitizeExternalImportKeyPart as sanitizeKeyPart,
} from '../../services/externalImportUtils';
import {
  SourceRecordRelationPlan,
  assertSourceRecordRelationWritable,
  updateSourceRecordRelation,
} from './businessLink';
import {
  ExternalIdentityDescriptor,
  getBatchKey,
  getExternalIdentityDescriptor,
  retryImportFoundation,
} from './identity';
import {
  ObservationOperation,
  ObservationWriteResult,
  PreparedImportFinalizationPlan,
  PreparedObservationPlan,
  addObservationWriteResults,
  getObservationWriteResult,
  getSourceRecordRelationPlan,
  getStoredImportFinalizationPlan,
  getStoredObservationPlan,
  prepareImportFinalizationPlan,
  prepareObservationPlan,
} from './serialization';
import { processObservationBatch } from './appendBatch';

const MAX_EVENT_MESSAGE_LENGTH = 4000;
const MAX_EVENT_PAYLOAD_CHARS = 16000;
const IMPORTED_RUN_STATUSES = new Set(['running', 'succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);
const TERMINAL_IMPORTED_RUN_STATUSES = new Set(['succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);
const EXTERNAL_INITIAL_EVENT_SOURCE = 'external-import-task';
const EXTERNAL_IDENTITY_COLLECTION = 'agExternalRunIdentities';
const EXTERNAL_BATCH_COLLECTION = 'agExternalImportBatches';

interface ExternalImportResult {
  run: ModelRecord;
  deduped: boolean;
  observations: ObservationWriteResult;
  relationUpdated: boolean;
}

interface PreparedImportFoundation {
  run: ModelRecord;
  batch: ModelRecord;
  observationPlan: PreparedObservationPlan;
  finalizationPlan: PreparedImportFinalizationPlan;
  deduped: boolean;
}

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getIdentifierString(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function getProvider(ctx: Context, value: unknown) {
  const provider = getString(value);
  if (!provider) {
    return 'generic-cli' as const;
  }
  if (!isAgentProviderKey(provider)) {
    ctx.throw(400, 'provider is not supported');
  }
  return getAgentProviderKey(provider);
}

function getImportStatus(ctx: Context, values: JsonRecord, existingStatus?: string) {
  const status = getString(values.status);
  if (status) {
    if (IMPORTED_RUN_STATUSES.has(status)) {
      return status;
    }
    ctx.throw(400, 'status is not supported');
  }
  if (existingStatus) {
    return existingStatus;
  }
  return getString(values.errorSummary) ? 'failed' : 'succeeded';
}

function assertImportedRunStatusTransition(ctx: Context, currentStatus: string, nextStatus: string) {
  if (currentStatus === nextStatus || currentStatus === 'running') {
    return;
  }
  if (TERMINAL_IMPORTED_RUN_STATUSES.has(currentStatus)) {
    ctx.throw(409, `Imported run status cannot transition from ${currentStatus} to ${nextStatus}`);
  }
  ctx.throw(409, `Imported run status cannot transition from ${currentStatus} to ${nextStatus}`);
}

function getImportedRunTimestamps(values: JsonRecord, status: string, now: Date, existing?: ModelRecord) {
  const existingJson = existing ? getModelJson(existing) : {};
  const startedAt =
    getDate(values.startedAt) ||
    getDate(values.requestedAt) ||
    (existingJson.startedAt ? getDate(existingJson.startedAt) : null) ||
    now;
  const requestedAt =
    getDate(values.requestedAt) || (existingJson.requestedAt ? getDate(existingJson.requestedAt) : null) || startedAt;
  const finishedAt =
    getDate(values.finishedAt) ||
    getDate(values.completedAt) ||
    getDate(values.failedAt) ||
    (existingJson.finishedAt ? getDate(existingJson.finishedAt) : null) ||
    (TERMINAL_IMPORTED_RUN_STATUSES.has(status) ? now : null);

  return {
    requestedAt,
    queuedAt: existingJson.queuedAt ? getDate(existingJson.queuedAt) || requestedAt : requestedAt,
    startedAt,
    ...(status === 'running'
      ? {
          completedAt: null,
          failedAt: null,
          canceledAt: null,
          finishedAt: null,
        }
      : {}),
    ...(status === 'succeeded'
      ? {
          completedAt: finishedAt || now,
          failedAt: null,
          canceledAt: null,
          finishedAt: finishedAt || now,
        }
      : {}),
    ...(status === 'failed' || status === 'timeout' || status === 'abandoned'
      ? {
          completedAt: null,
          failedAt: finishedAt || now,
          canceledAt: null,
          finishedAt: finishedAt || now,
        }
      : {}),
    ...(status === 'canceled'
      ? {
          completedAt: null,
          failedAt: null,
          canceledAt: finishedAt || now,
          finishedAt: finishedAt || now,
        }
      : {}),
  };
}

function getImportedRunPayload(values: JsonRecord, provider: AgentProviderKey, existing?: ModelRecord) {
  const existingPayload = getRecord(existing ? getModelValue(existing, 'executionPayloadJson') : undefined);
  const existingFields = getRecord(existingPayload.fields);
  const title = getString(values.title) || getString(existingPayload.title);
  const instruction = getString(values.instruction) || getString(existingPayload.instruction);
  const externalRunKey = getString(values.externalRunKey) || getString(existingFields.externalRunKey);
  const providerSessionId = getString(values.providerSessionId) || getString(existingPayload.providerSessionId);
  return {
    executionPolicyKey: `external-import:${provider}`,
    source: 'external-import',
    title: title || null,
    instruction: instruction || null,
    providerSessionId: providerSessionId || null,
    fields: {
      ...existingFields,
      externalRunKey: externalRunKey || null,
      metadataJson: {
        ...getRecord(existingFields.metadataJson),
        ...getRecord(values.metadataJson),
      },
    },
  };
}

function getImportedRunPromptSnapshot(values: JsonRecord, existing?: ModelRecord) {
  const existingSnapshot = getRecord(existing ? getModelValue(existing, 'promptSnapshot') : undefined);
  const existingVariables = getRecord(existingSnapshot.variables);
  const title = getString(values.title) || getString(existingVariables.title);
  const instruction =
    getString(values.instruction) ||
    getString(existingVariables.instruction) ||
    getString(existingSnapshot.renderedPrompt);
  return {
    ...existingSnapshot,
    templateKey: 'agent-gateway-external-import',
    templateText: '{{instruction}}',
    renderedPrompt: instruction || title || 'External imported run',
    variables: {
      title: title || null,
      instruction: instruction || null,
      externalRunKey: getString(values.externalRunKey) || getString(existingVariables.externalRunKey) || null,
    },
    renderedAt: new Date().toISOString(),
  };
}

function getImportedRunResultSummary(values: JsonRecord, provider: AgentProviderKey, existing?: ModelRecord) {
  const existingResultSummary = getRecord(existing ? getModelValue(existing, 'resultSummaryJson') : undefined);
  const title = getString(values.title) || getString(existingResultSummary.title);
  const resultSummary = {
    ...existingResultSummary,
    ...getRecord(values.resultSummaryJson),
    ...(title ? { title } : {}),
    requestedFrom: 'external-import',
    provider,
    externalRunKey: getString(values.externalRunKey) || getString(existingResultSummary.externalRunKey) || null,
  };
  const redactedResultSummary = getRecord(redactRunResultSummary(resultSummary));
  const tokenUsageJson = getTokenUsageSummaryFromRecord(resultSummary);
  return tokenUsageJson
    ? {
        ...redactedResultSummary,
        tokenUsageJson,
      }
    : redactedResultSummary;
}

function getRunUpdateValues(
  values: JsonRecord,
  status: string,
  provider: AgentProviderKey,
  now: Date,
  existing?: ModelRecord,
) {
  const providerSessionId = getString(values.providerSessionId);
  return {
    status,
    cancelRequested: status === 'canceled',
    promptSnapshot: getImportedRunPromptSnapshot(values, existing),
    executionPayloadJson: getImportedRunPayload(values, provider, existing),
    resultSummaryJson: getImportedRunResultSummary(values, provider, existing),
    errorSummary: getString(values.errorSummary)
      ? redactRunErrorSummary(getString(values.errorSummary))
      : existing
        ? getModelString(existing, 'errorSummary') || null
        : null,
    sourceType: EXTERNAL_IMPORT_SOURCE_TYPE,
    provider,
    capabilitiesSnapshotJson: EXTERNAL_IMPORT_CAPABILITIES,
    executionPolicyKey: `external-import:${provider}`,
    sourceCollection:
      getString(values.sourceCollection) || (existing ? getModelString(existing, 'sourceCollection') : '') || null,
    sourceRecordId:
      getIdentifierString(values.sourceRecordId) ||
      (existing ? getModelString(existing, 'sourceRecordId') : '') ||
      null,
    claimAttempt: existing ? getModelNumber(existing, 'claimAttempt') : 0,
    leaseVersion: existing ? getModelNumber(existing, 'leaseVersion') : 0,
    claimTokenHash: null,
    claimTokenLast4: null,
    claimExpiresAt: null,
    terminalBackend: null,
    terminalStatus: null,
    terminalSessionName: null,
    terminalStartedAt: null,
    terminalEndedAt: null,
    terminalLastActivityAt: null,
    terminalExitCode: null,
    agentSessionProviderId:
      providerSessionId || (existing ? getModelString(existing, 'agentSessionProviderId') : '') || null,
    ...getImportedRunTimestamps(values, status, now, existing),
  };
}

function getNewImportingRunValues(finalRunValues: JsonRecord) {
  const provisionalValues = { ...finalRunValues };
  delete provisionalValues.resultSummaryJson;
  return {
    ...provisionalValues,
    status: IMPORTING_RUN_STATUS,
    cancelRequested: false,
    completedAt: null,
    failedAt: null,
    canceledAt: null,
    finishedAt: null,
    errorSummary: null,
  };
}

function getSourceKey(...parts: string[]) {
  const source = parts.filter(Boolean).join(':');
  const hash = getHash(source).slice(0, 16);
  const prefix = sanitizeKeyPart(source, 163) || 'external-import';
  return `${prefix}:${hash}`;
}

function getRawLogArtifactValues(options: {
  log: JsonRecord;
  provider: AgentProviderKey;
  format: ExternalLogFormat;
  batchKey: string;
  index: number;
  contentText: string;
}) {
  const artifactKey =
    getString(options.log.artifactKey || options.log.key) ||
    getSourceKey('raw-log', options.provider, options.format, options.batchKey, String(options.index));
  return {
    artifactKey,
    artifactType: 'log',
    mimeType: options.format === 'text' ? 'text/plain' : 'application/x-ndjson',
    contentText: options.contentText,
    metadata: {
      externalImport: true,
      provider: options.provider,
      format: options.format,
      batchKey: options.batchKey,
      logIndex: options.index,
      storageMode: 'inline',
    },
  };
}

function getExternalArtifactValues(artifactValues: JsonRecord, batchKey: string, index: number) {
  const artifactKey =
    getString(artifactValues.artifactKey) ||
    getSourceKey(
      'artifact',
      batchKey,
      String(index),
      getHash(
        [
          getString(artifactValues.artifactType),
          getString(artifactValues.mimeType),
          getString(artifactValues.contentText),
        ].join(':'),
      ).slice(0, 16),
    );
  return {
    ...artifactValues,
    artifactKey,
    metadataJson: {
      ...getRecord(artifactValues.metadataJson),
      externalImport: true,
      batchKey,
    },
  };
}

function getObservationOperations(options: {
  values: JsonRecord;
  preparedBatch: PreparedObservationBatch;
  provider: AgentProviderKey;
  batchKey: string;
  includeInitialConversation: boolean;
}) {
  const sequenceBySource = new Map<string, number>();
  const operations: ObservationOperation[] = [];
  const instruction = getString(options.values.instruction || options.values.prompt);
  if (options.includeInitialConversation && instruction) {
    operations.push({
      type: 'initial-conversation',
      values: {
        source: EXTERNAL_INITIAL_EVENT_SOURCE,
        sequence: 0,
        eventType: 'agent.user.message',
        providerEventId: 'initial-task',
        confidence: 1,
        contentText: instruction,
        contentJson: {
          participant: {
            id: 'user:requester',
            type: 'user',
            name: 'You',
          },
          title: getString(options.values.title) || null,
        },
      },
    });
  }

  const runEventSource = getSourceKey('external-import', options.batchKey);
  const batchEventIndex = operations.length;

  for (const preparedLog of options.preparedBatch.logs) {
    operations.push({
      type: 'artifact',
      values: getRawLogArtifactValues({
        log: preparedLog.log,
        provider: options.provider,
        format: preparedLog.format,
        batchKey: options.batchKey,
        index: preparedLog.index,
        contentText: preparedLog.contentText,
      }),
    });

    const source = getSourceKey(
      'external',
      options.provider,
      preparedLog.format,
      options.batchKey,
      String(preparedLog.index),
    );
    for (const normalizedEvent of preparedLog.normalizedEvents) {
      const sequence = (sequenceBySource.get(source) || 0) + 1;
      sequenceBySource.set(source, sequence);
      operations.push({
        type: 'conversation-event',
        values: {
          source,
          sequence,
          eventType: normalizedEvent.eventType,
          providerEventId: normalizedEvent.providerEventId || null,
          correlationId: normalizedEvent.correlationId || null,
          confidence: normalizedEvent.confidence ?? null,
          contentText: normalizedEvent.message || null,
          contentJson: {
            ...(normalizedEvent.payloadJson || {}),
            ...(normalizedEvent.rawEvent ? { rawProviderEvent: normalizedEvent.rawEvent } : {}),
            ...(normalizedEvent.rawLine ? { rawLine: normalizedEvent.rawLine } : {}),
          },
        },
      });
    }
  }

  for (let index = 0; index < options.preparedBatch.artifacts.length; index += 1) {
    operations.push({
      type: 'artifact',
      values: getExternalArtifactValues(options.preparedBatch.artifacts[index], options.batchKey, index),
    });
  }
  if (operations.length) {
    operations.splice(batchEventIndex, 0, {
      type: 'run-event',
      source: runEventSource,
      sequence: 1,
      eventType: 'external.import.batch.received',
      message: 'External import batch received',
      payload: {
        batchKey: options.batchKey,
        provider: options.provider,
      },
    });
  }
  return operations;
}

function getBatchIdentityKey(identityId: unknown, batchKey: string) {
  return `external-import-batch:${getHash(`${String(identityId)}\0${batchKey}`)}`;
}

function assertMatchingBatchPayload(ctx: Context, batch: ModelRecord, payloadSha256: string) {
  if (getModelString(batch, 'payloadSha256') !== payloadSha256) {
    ctx.throw(409, 'batchKey already belongs to a different external import payload');
  }
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

async function startImportBatchAttempt(ctx: Context, batch: ModelRecord, run: ModelRecord, transaction: Transaction) {
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
  return {
    observationPlan,
    finalizationPlan,
  };
}

async function assertNoIncompleteImportBatch(ctx: Context, runId: string, transaction: Transaction) {
  const incompleteBatch = (await ctx.db.getRepository(EXTERNAL_BATCH_COLLECTION).findOne({
    filter: {
      runId,
      status: {
        $in: ['processing', 'failed'],
      },
    },
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

async function findImportBatch(
  ctx: Context,
  runId: string,
  batchKey: string,
  transaction: Transaction,
): Promise<ModelRecord | null> {
  return (await ctx.db.getRepository(EXTERNAL_BATCH_COLLECTION).findOne({
    filter: {
      runId,
      batchKey,
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
}

async function createImportBatch(
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

async function assertExistingImportedRunVisible(ctx: Context, runId: string, transaction: Transaction) {
  const visibleFilter = await getVisibleRunFilter(ctx, { id: runId }, 'get');
  const visibleRun = (await ctx.db.getRepository('agRuns').findOne({
    filter: visibleFilter,
    transaction,
  })) as ModelRecord | null;
  if (!visibleRun) {
    ctx.throw(404, 'Run not found');
  }
}

function assertIdentityMatchesDescriptor(
  ctx: Context,
  identity: ModelRecord,
  descriptor: ExternalIdentityDescriptor,
  provider: AgentProviderKey,
) {
  if (
    getModelString(identity, 'identityType') !== descriptor.identityType ||
    getModelString(identity, 'provider') !== provider ||
    (getModelString(identity, 'externalRunKey') || null) !== descriptor.externalRunKey ||
    (descriptor.explicitRunCode && getModelString(identity, 'runCode') !== descriptor.explicitRunCode)
  ) {
    ctx.throw(409, 'External run identity conflicts with the requested provider, externalRunKey, or runCode');
  }
}

async function prepareImportFoundationOnce(
  ctx: Context,
  options: {
    values: JsonRecord;
    provider: AgentProviderKey;
    descriptor: ExternalIdentityDescriptor;
    preparedBatch: PreparedObservationBatch;
    observationPlan: PreparedObservationPlan;
    batchKey: string;
  },
): Promise<PreparedImportFoundation> {
  return await ctx.db.sequelize.transaction(async (transaction) => {
    const identityRepo = ctx.db.getRepository(EXTERNAL_IDENTITY_COLLECTION);
    const runRepo = ctx.db.getRepository('agRuns');
    const existingIdentity = (await identityRepo.findOne({
      filter: {
        identityKey: options.descriptor.identityKey,
      },
      transaction,
    })) as ModelRecord | null;

    if (existingIdentity) {
      assertIdentityMatchesDescriptor(ctx, existingIdentity, options.descriptor, options.provider);
      const runId = String(getModelValue(existingIdentity, 'runId'));
      let run = (await runRepo.findOne({
        filterByTk: runId,
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord | null;
      if (!run) {
        ctx.throw(409, 'External run identity points to a missing run');
      }
      if (
        getModelString(run, 'sourceType') !== EXTERNAL_IMPORT_SOURCE_TYPE ||
        getModelString(run, 'runCode') !== getModelString(existingIdentity, 'runCode')
      ) {
        ctx.throw(409, 'External run identity conflicts with its Agent Gateway run');
      }
      await assertExistingImportedRunVisible(ctx, runId, transaction);

      const existingBatch = await findImportBatch(ctx, runId, options.batchKey, transaction);
      if (existingBatch) {
        assertMatchingBatchPayload(ctx, existingBatch, options.preparedBatch.payloadSha256);
        const storedAttempt = await startImportBatchAttempt(ctx, existingBatch, run, transaction);
        return {
          run,
          batch: existingBatch,
          observationPlan: storedAttempt?.observationPlan || options.observationPlan,
          finalizationPlan: storedAttempt?.finalizationPlan || getStoredImportFinalizationPlan(ctx, existingBatch),
          deduped: true,
        };
      }

      await assertNoIncompleteImportBatch(ctx, runId, transaction);
      const currentStatus = getModelString(run, 'status');
      if (currentStatus === IMPORTING_RUN_STATUS) {
        ctx.throw(409, 'Imported run has an incomplete batch; retry that batchKey before starting another import');
      }
      const status = getImportStatus(ctx, options.values, currentStatus);
      assertImportedRunStatusTransition(ctx, currentStatus, status);
      const finalRunValues = getRunUpdateValues(options.values, status, options.provider, new Date(), run);
      const sourceRecordRelation = getSourceRecordRelationPlan(options.values);
      if (sourceRecordRelation) {
        await assertSourceRecordRelationWritable(ctx, {
          ...sourceRecordRelation,
          transaction,
        });
      }
      const shouldStageImport = currentStatus !== status && TERMINAL_IMPORTED_RUN_STATUSES.has(status);
      if (shouldStageImport) {
        await runRepo.update({
          filterByTk: runId,
          values: {
            status: IMPORTING_RUN_STATUS,
          },
          transaction,
        });
        run = (await runRepo.findOne({
          filterByTk: runId,
          transaction,
          lock: transaction.LOCK.UPDATE,
        })) as ModelRecord;
      }
      const finalizationPlan = prepareImportFinalizationPlan({
        expectedRunStatus: shouldStageImport ? IMPORTING_RUN_STATUS : currentStatus,
        runUpdateValues: finalRunValues,
        sourceRecordRelation,
      });
      const batch = await createImportBatch(ctx, {
        identityId: getModelTargetKey(existingIdentity, 'id'),
        runId,
        batchKey: options.batchKey,
        payloadSha256: options.preparedBatch.payloadSha256,
        observationPlan: options.observationPlan,
        finalizationPlan,
        transaction,
      });
      return {
        run,
        batch,
        observationPlan: options.observationPlan,
        finalizationPlan,
        deduped: true,
      };
    }

    const conflictingRun = (await runRepo.findOne({
      filter: {
        runCode: options.descriptor.runCode,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (conflictingRun) {
      ctx.throw(409, 'runCode already belongs to another Agent Gateway run');
    }

    const status = getImportStatus(ctx, options.values);
    const finalRunValues = getRunUpdateValues(options.values, status, options.provider, new Date());
    const sourceRecordRelation = getSourceRecordRelationPlan(options.values);
    if (sourceRecordRelation) {
      await assertSourceRecordRelationWritable(ctx, {
        ...sourceRecordRelation,
        transaction,
      });
    }
    const run = (await runRepo.create({
      values: {
        runCode: options.descriptor.runCode,
        ...getNewImportingRunValues(finalRunValues),
        requestedById: getCurrentUserId(ctx) || null,
      },
      transaction,
    })) as ModelRecord;
    const identity = (await identityRepo.create({
      values: {
        id: randomUUID(),
        identityKey: options.descriptor.identityKey,
        identityType: options.descriptor.identityType,
        provider: options.provider,
        externalRunKey: options.descriptor.externalRunKey,
        runCode: options.descriptor.runCode,
        runId: getModelTargetKey(run, 'id'),
        createdById: getCurrentUserId(ctx) || null,
        metadataJson: getRecord(options.values.metadataJson),
      },
      transaction,
    })) as ModelRecord;
    const runId = String(getModelTargetKey(run, 'id'));
    const finalizationPlan = prepareImportFinalizationPlan({
      expectedRunStatus: IMPORTING_RUN_STATUS,
      runUpdateValues: finalRunValues,
      sourceRecordRelation,
    });
    const batch = await createImportBatch(ctx, {
      identityId: getModelTargetKey(identity, 'id'),
      runId,
      batchKey: options.batchKey,
      payloadSha256: options.preparedBatch.payloadSha256,
      observationPlan: options.observationPlan,
      finalizationPlan,
      transaction,
    });
    return {
      run,
      batch,
      observationPlan: options.observationPlan,
      finalizationPlan,
      deduped: false,
    };
  });
}

async function prepareAppendFoundationOnce(
  ctx: Context,
  options: {
    runId: string;
    values: JsonRecord;
    provider: AgentProviderKey;
    preparedBatch: PreparedObservationBatch;
    observationPlan: PreparedObservationPlan;
    batchKey: string;
  },
): Promise<PreparedImportFoundation> {
  return await ctx.db.sequelize.transaction(async (transaction) => {
    const runRepo = ctx.db.getRepository('agRuns');
    let run = (await runRepo.findOne({
      filterByTk: options.runId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (!run) {
      ctx.throw(404, 'Run not found');
    }
    if (getModelString(run, 'sourceType') !== EXTERNAL_IMPORT_SOURCE_TYPE) {
      ctx.throw(409, 'Only imported external runs can receive external observations');
    }
    const identity = (await ctx.db.getRepository(EXTERNAL_IDENTITY_COLLECTION).findOne({
      filter: {
        runId: options.runId,
      },
      transaction,
    })) as ModelRecord | null;
    if (!identity) {
      ctx.throw(409, 'Imported external run does not have an external identity');
    }
    if (getModelString(identity, 'provider') !== options.provider) {
      ctx.throw(409, 'provider must match the imported external run identity');
    }

    const existingBatch = await findImportBatch(ctx, options.runId, options.batchKey, transaction);
    if (existingBatch) {
      assertMatchingBatchPayload(ctx, existingBatch, options.preparedBatch.payloadSha256);
      const storedAttempt = await startImportBatchAttempt(ctx, existingBatch, run, transaction);
      return {
        run,
        batch: existingBatch,
        observationPlan: storedAttempt?.observationPlan || options.observationPlan,
        finalizationPlan: storedAttempt?.finalizationPlan || getStoredImportFinalizationPlan(ctx, existingBatch),
        deduped: true,
      };
    }

    await assertNoIncompleteImportBatch(ctx, options.runId, transaction);
    const currentStatus = getModelString(run, 'status');
    if (currentStatus === IMPORTING_RUN_STATUS) {
      ctx.throw(409, 'Imported run has an incomplete batch; retry that batchKey before appending another batch');
    }
    let finalRunValues: JsonRecord | null = null;
    let expectedRunStatus = currentStatus;
    if (getString(options.values.status)) {
      const status = getImportStatus(ctx, options.values, currentStatus);
      assertImportedRunStatusTransition(ctx, currentStatus, status);
      finalRunValues = getRunUpdateValues(options.values, status, options.provider, new Date(), run);
      if (currentStatus !== status && TERMINAL_IMPORTED_RUN_STATUSES.has(status)) {
        expectedRunStatus = IMPORTING_RUN_STATUS;
        await runRepo.update({
          filterByTk: options.runId,
          values: {
            status: IMPORTING_RUN_STATUS,
          },
          transaction,
        });
        run = (await runRepo.findOne({
          filterByTk: options.runId,
          transaction,
          lock: transaction.LOCK.UPDATE,
        })) as ModelRecord;
      }
    }

    const finalizationPlan = prepareImportFinalizationPlan({
      expectedRunStatus,
      runUpdateValues: finalRunValues,
      sourceRecordRelation: null,
    });
    const batch = await createImportBatch(ctx, {
      identityId: getModelTargetKey(identity, 'id'),
      runId: options.runId,
      batchKey: options.batchKey,
      payloadSha256: options.preparedBatch.payloadSha256,
      observationPlan: options.observationPlan,
      finalizationPlan,
      transaction,
    });
    return {
      run,
      batch,
      observationPlan: options.observationPlan,
      finalizationPlan,
      deduped: false,
    };
  });
}

export async function importExternalRun(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.importExternalRuns,
    'Agent Gateway external run import permission required',
  );

  const values = getBodyValues(ctx);
  const provider = getProvider(ctx, values.provider);
  const batchKey = getBatchKey(ctx, values.batchKey, false);
  const descriptor = getExternalIdentityDescriptor(ctx, values, provider);
  const preparedBatch = prepareObservationBatch(ctx, values, provider, batchKey);
  const observationPlan = prepareObservationPlan(
    ctx,
    getObservationOperations({
      values,
      preparedBatch,
      provider,
      batchKey,
      includeInitialConversation: true,
    }),
  );
  const foundation = await retryImportFoundation(() => {
    return prepareImportFoundationOnce(ctx, {
      values,
      provider,
      descriptor,
      preparedBatch,
      observationPlan,
      batchKey,
    });
  });
  const processedBatch = await processObservationBatch(ctx, {
    run: foundation.run,
    batch: foundation.batch,
    preparedBatch,
    observationPlan: foundation.observationPlan,
    finalizationPlan: foundation.finalizationPlan,
  });
  const completedRun = (await ctx.db.getRepository('agRuns').findOne({
    filterByTk: getModelTargetKey(foundation.run, 'id'),
  })) as ModelRecord | null;
  if (!completedRun) {
    ctx.throw(404, 'Run not found');
  }
  const result: ExternalImportResult = {
    run: completedRun,
    deduped: foundation.deduped,
    relationUpdated: processedBatch.relationUpdated,
    observations: processedBatch.observations,
  };

  ctx.body = {
    runId: getModelTargetKey(result.run, 'id'),
    runCode: getModelString(result.run, 'runCode'),
    deduped: result.deduped,
    relationUpdated: result.relationUpdated,
    observations: result.observations,
    run: await serializeRunForManagement(ctx, result.run),
  };
}

export async function appendExternalRunObservations(ctx: Context, runId: string) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.importExternalRuns,
    'Agent Gateway external run import permission required',
  );
  const values = getBodyValues(ctx);
  const visibleRun = await assertRunVisible(ctx, runId, 'get');
  if (getModelString(visibleRun, 'sourceType') !== EXTERNAL_IMPORT_SOURCE_TYPE) {
    ctx.throw(409, 'Only imported external runs can receive external observations');
  }
  const batchKey = getBatchKey(ctx, values.batchKey, true);
  const provider = getProvider(ctx, values.provider);
  const preparedBatch = prepareObservationBatch(ctx, values, provider, batchKey);
  const observationPlan = prepareObservationPlan(
    ctx,
    getObservationOperations({
      values,
      preparedBatch,
      provider,
      batchKey,
      includeInitialConversation: false,
    }),
  );
  const foundation = await retryImportFoundation(() => {
    return prepareAppendFoundationOnce(ctx, {
      runId,
      values,
      provider,
      preparedBatch,
      observationPlan,
      batchKey,
    });
  });
  const processedBatch = await processObservationBatch(ctx, {
    run: foundation.run,
    batch: foundation.batch,
    preparedBatch,
    observationPlan: foundation.observationPlan,
    finalizationPlan: foundation.finalizationPlan,
  });
  const completedRun = (await ctx.db.getRepository('agRuns').findOne({
    filterByTk: runId,
  })) as ModelRecord | null;
  if (!completedRun) {
    ctx.throw(404, 'Run not found');
  }

  ctx.body = {
    runId,
    run: await serializeRunForManagement(ctx, completedRun),
    observations: processedBatch.observations,
  };
}
