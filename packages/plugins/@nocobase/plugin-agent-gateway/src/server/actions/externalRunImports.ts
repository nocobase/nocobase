/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction, UniqueConstraintError } from 'sequelize';

import { AgentProviderKey, getAgentProviderKey, isAgentProviderKey } from '../../shared/providerCapabilities';
import {
  EXTERNAL_IMPORT_OPERATION_PLAN_VERSION,
  EXTERNAL_IMPORT_CAPABILITIES,
  EXTERNAL_IMPORT_LIMITS,
  EXTERNAL_IMPORT_SOURCE_TYPE,
  EXTERNAL_IMPORT_USER_CANCELED_ERROR_SUMMARY,
  ExternalLogFormat,
} from '../../shared/externalRunImport';
import { IMPORTING_RUN_STATUS, isTerminalRunStatus } from '../../shared/runState';
import { COMMAND_CONTENT_JSON_LIMIT_CHARS, COMMAND_DETAIL_STRING_LIMIT_CHARS } from '../../shared/conversationLimits';
import {
  AGENT_GATEWAY_ACTIONS,
  redactEventPayload,
  redactObservabilityText,
  redactRunErrorSummary,
  redactRunResultSummary,
} from '../security';
import {
  API_PREFIX,
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
  getCurrentRoleNames,
  getVisibleRunFilter,
  requireAgentGatewayPermission,
} from './utils';
import { createConversationEvent } from './conversationEvents';
import { serializeRunForManagement } from './runLifecycle';
import { createRunArtifact } from './runObservability';
import {
  OBSERVABILITY_ROLLUP_EVENT_FILTER,
  buildRunObservabilityRollup,
  getRunObservabilityRollup,
  getTokenUsageSummaryFromRecord,
  mergeRunObservabilityRollup,
} from '../services/observationRollup';
import {
  PreparedExternalImportLog as PreparedLogEntry,
  PreparedExternalObservationBatch as PreparedObservationBatch,
  prepareExternalObservationBatch as prepareObservationBatch,
} from '../services/externalImportLogs';
import {
  getCanonicalExternalImportJson as getCanonicalJson,
  hashExternalImportValue as getHash,
  sanitizeExternalImportKeyPart as sanitizeKeyPart,
} from '../services/externalImportUtils';

const MAX_EVENT_MESSAGE_LENGTH = 4000;
const MAX_EVENT_PAYLOAD_CHARS = 16000;
const MAX_CONVERSATION_CONTENT_TEXT_LENGTH = 8000;
const MAX_CONVERSATION_CONTENT_JSON_CHARS = 32 * 1024;
const MAX_ARTIFACT_METADATA_JSON_CHARS = 16 * 1024;
const MAX_DATABASE_STRING_LENGTH = 255;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IMPORTED_RUN_STATUSES = new Set(['running', 'succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);
const TERMINAL_IMPORTED_RUN_STATUSES = new Set(['succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);
const DEFAULT_IMPORT_BATCH_KEY = 'initial';
const EXTERNAL_INITIAL_EVENT_SOURCE = 'external-import-task';
const MAX_BATCH_KEY_LENGTH = 200;
const EXTERNAL_IDENTITY_COLLECTION = 'agExternalRunIdentities';
const EXTERNAL_BATCH_COLLECTION = 'agExternalImportBatches';
const MAX_FOUNDATION_ATTEMPTS = 3;

interface FieldLike {
  options?: JsonRecord;
  [key: string]: unknown;
}

interface CollectionLike {
  name?: string;
  hasField?(name: string): boolean;
  getField?(name: string): FieldLike | undefined;
}

interface DatabaseWithCollections {
  getCollection?(name: string): CollectionLike | undefined;
}

interface OutputRelation {
  fieldName: string;
  foreignKey: string;
}

interface CollectionActionAccess {
  filter?: JsonRecord;
  readFields: Set<string> | null;
  writeFields: Set<string> | null;
}

interface ExternalImportResult {
  run: ModelRecord;
  deduped: boolean;
  observations: ObservationWriteResult;
  relationUpdated: boolean;
}

interface ObservationWriteResult {
  conversationEvents: number;
  runEvents: number;
  artifacts: number;
}

interface ExternalIdentityDescriptor {
  identityKey: string;
  identityType: 'external-run-key' | 'run-code';
  externalRunKey: string | null;
  explicitRunCode: string | null;
  runCode: string;
}

interface PreparedObservationPlan {
  version: number;
  operations: ObservationOperation[];
  operationPlanSha256: string;
}

interface PreparedImportFoundation {
  run: ModelRecord;
  batch: ModelRecord;
  observationPlan: PreparedObservationPlan;
  finalizationPlan: PreparedImportFinalizationPlan;
  deduped: boolean;
}

interface SourceRecordRelationPlan {
  sourceCollection: string;
  sourceRecordId: string;
  outputAgentRunField: string;
}

interface ImportFinalizationPlan {
  expectedRunStatus: string;
  runUpdateValues: JsonRecord | null;
  sourceRecordRelation: SourceRecordRelationPlan | null;
}

interface PreparedImportFinalizationPlan extends ImportFinalizationPlan {
  version: number;
  finalizationSha256: string;
}

interface ObservationBatchProcessingResult {
  observations: ObservationWriteResult;
  relationUpdated: boolean;
}

type ObservationOperation =
  | {
      type: 'initial-conversation';
      values: JsonRecord;
    }
  | {
      type: 'run-event';
      source: string;
      sequence: number;
      eventType: string;
      message: string;
      payload: JsonRecord;
    }
  | {
      type: 'artifact';
      values: JsonRecord;
    }
  | {
      type: 'conversation-event';
      values: JsonRecord;
    };

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
  if (provider === 'claude') {
    return 'claude-code' as const;
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

function getExternalRunCode(values: JsonRecord, provider: AgentProviderKey) {
  const explicitRunCode = getString(values.runCode);
  if (explicitRunCode) {
    return explicitRunCode;
  }
  const externalRunKey = getString(values.externalRunKey);
  if (externalRunKey) {
    const suffix = sanitizeKeyPart(externalRunKey, 48);
    const hash = getHash(`${provider}\0${externalRunKey}`).slice(0, 16);
    return suffix ? `external_${hash}_${suffix}` : `external_${hash}`;
  }
  return '';
}

function getExternalIdentityDescriptor(
  ctx: Context,
  values: JsonRecord,
  provider: AgentProviderKey,
): ExternalIdentityDescriptor {
  const externalRunKey = getString(values.externalRunKey) || null;
  const explicitRunCode = getString(values.runCode);
  const runCode = getExternalRunCode(values, provider);
  if (explicitRunCode.length > MAX_DATABASE_STRING_LENGTH) {
    ctx.throw(413, `runCode must not exceed ${MAX_DATABASE_STRING_LENGTH} characters`);
  }
  if (externalRunKey) {
    return {
      identityKey: `external-run-key:${getHash(`${provider}\0${externalRunKey}`)}`,
      identityType: 'external-run-key',
      externalRunKey,
      explicitRunCode: explicitRunCode || null,
      runCode,
    };
  }
  if (explicitRunCode) {
    return {
      identityKey: `run-code:${getHash(explicitRunCode)}`,
      identityType: 'run-code',
      externalRunKey: null,
      explicitRunCode,
      runCode,
    };
  }
  ctx.throw(400, 'externalRunKey or runCode is required');
}

function getBatchKey(ctx: Context, value: unknown, required: boolean) {
  const batchKey = getString(value) || (required ? '' : DEFAULT_IMPORT_BATCH_KEY);
  if (!batchKey) {
    ctx.throw(400, 'batchKey is required');
  }
  if (batchKey.length > MAX_BATCH_KEY_LENGTH) {
    ctx.throw(400, `batchKey must not exceed ${MAX_BATCH_KEY_LENGTH} characters`);
  }
  return batchKey;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof UniqueConstraintError ||
    (error instanceof Error && error.name === 'SequelizeUniqueConstraintError')
  );
}

function getObjectLike(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function getStringSet(values: unknown[]) {
  const fields = values.map((field) => getString(field)).filter(Boolean);
  return fields.length ? new Set(fields) : null;
}

function getReadableFields(params: JsonRecord) {
  const fields = Array.isArray(params.fields) ? params.fields : [];
  const appends = Array.isArray(params.appends) ? params.appends : [];
  return getStringSet([...fields, ...appends]);
}

function getWritableFields(params: JsonRecord) {
  const whitelist = Array.isArray(params.whitelist) ? params.whitelist : [];
  const fields = Array.isArray(params.fields) ? params.fields : [];
  return getStringSet(whitelist) || getStringSet(fields);
}

function hasFilter(filter?: JsonRecord) {
  return Boolean(filter && Object.keys(filter).length);
}

function mergeFilters(...filters: Array<JsonRecord | undefined>) {
  const activeFilters = filters.filter((filter): filter is JsonRecord => hasFilter(filter));
  if (!activeFilters.length) {
    return {};
  }
  if (activeFilters.length === 1) {
    return activeFilters[0];
  }
  return {
    $and: activeFilters,
  };
}

function getFieldOption(field: FieldLike | undefined, key: string) {
  const fieldRecord = getObjectLike(field);
  const options = getObjectLike(fieldRecord.options);
  return options[key] ?? fieldRecord[key];
}

function getFieldOptionString(field: FieldLike | undefined, key: string) {
  return getString(getFieldOption(field, key));
}

function getCollection(ctx: Context, collectionName: string) {
  const collection = (ctx.db as unknown as DatabaseWithCollections).getCollection?.(collectionName);
  if (!collection) {
    ctx.throw(400, `Collection not found: ${collectionName}`);
  }
  return collection;
}

function getCollectionField(ctx: Context, collection: CollectionLike, fieldName: string) {
  const hasField = collection.hasField ? collection.hasField(fieldName) : Boolean(collection.getField?.(fieldName));
  const field = collection.getField?.(fieldName);
  if (!hasField || !field) {
    ctx.throw(400, `Field not found: ${fieldName}`);
  }
  return field;
}

function assertOutputAgentRunField(ctx: Context, collectionName: string, fieldName: string): OutputRelation {
  const collection = getCollection(ctx, collectionName);
  const field = getCollectionField(ctx, collection, fieldName);
  const fieldType = getFieldOptionString(field, 'type');
  const target = getFieldOptionString(field, 'target');
  const targetKey = getFieldOptionString(field, 'targetKey') || 'id';
  const foreignKey = getFieldOptionString(field, 'foreignKey') || `${fieldName}Id`;

  if (fieldType !== 'belongsTo' || target !== 'agRuns' || targetKey !== 'id') {
    ctx.throw(400, 'outputAgentRunField must be a belongsTo relation field targeting agRuns.id');
  }

  return {
    fieldName,
    foreignKey,
  };
}

function assertWritableOutputField(ctx: Context, access: CollectionActionAccess, output: OutputRelation) {
  if (access.writeFields && !access.writeFields.has(output.fieldName) && !access.writeFields.has(output.foreignKey)) {
    ctx.throw(403, `No permission to write output relation field: ${output.fieldName}`);
  }
}

async function getCollectionActionAccess(
  ctx: Context,
  collectionName: string,
  action: 'view' | 'update',
): Promise<CollectionActionAccess> {
  const collection = getCollection(ctx, collectionName);
  const roles = await getCurrentRoleNames(ctx);
  const permission = ctx.app.acl.can({
    roles,
    resource: collectionName,
    action,
  });

  if (!permission || typeof permission !== 'object') {
    ctx.throw(403, `No permission to ${action} collection: ${collectionName}`);
  }

  const params = getRecord(permission.params);
  try {
    checkFilterParams(collection, params.filter);
  } catch (error) {
    if (error instanceof NoPermissionError) {
      ctx.throw(403, `No permission to ${action} collection: ${collectionName}`);
    }
    throw error;
  }

  const parsedParams = getRecord(
    await parseJsonTemplate(params, {
      state: ctx.state,
      timezone: ctx.get('x-timezone'),
      userProvider: createUserProvider({
        db: ctx.db,
        currentUser: ctx.state.currentUser,
      }),
    }),
  );

  return {
    filter: getRecord(parsedParams.filter),
    readFields: action === 'view' ? getReadableFields(parsedParams) : null,
    writeFields: action === 'update' ? getWritableFields(parsedParams) : null,
  };
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
  const title = getString(values.title) || getString(existingPayload.title);
  const instruction = getString(values.instruction || values.prompt) || getString(existingPayload.instruction);
  const externalRunKey = getString(values.externalRunKey) || getString(existingPayload.externalRunKey);
  const providerSessionId =
    getString(values.providerSessionId || values.sessionId) || getString(existingPayload.providerSessionId);
  return {
    ...existingPayload,
    imported: true,
    source: 'external-import',
    provider,
    title: title || null,
    instruction: instruction || null,
    externalRunKey: externalRunKey || null,
    providerSessionId: providerSessionId || null,
    capabilities: EXTERNAL_IMPORT_CAPABILITIES,
    metadata: {
      ...getRecord(existingPayload.metadata),
      ...getRecord(values.metadata || values.metadataJson),
    },
  };
}

function getImportedRunPromptSnapshot(values: JsonRecord, existing?: ModelRecord) {
  const existingSnapshot = getRecord(existing ? getModelValue(existing, 'promptSnapshot') : undefined);
  const existingVariables = getRecord(existingSnapshot.variables);
  const title = getString(values.title) || getString(existingVariables.title);
  const instruction =
    getString(values.instruction || values.prompt) ||
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
    ...getRecord(values.resultSummary || values.resultSummaryJson),
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
  const providerSessionId = getString(values.providerSessionId || values.sessionId);
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
    agentSessionProvider: provider,
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

function getSourceRecordRelationPlan(values: JsonRecord): SourceRecordRelationPlan | null {
  const sourceCollection = getString(values.sourceCollection);
  const sourceRecordId = getIdentifierString(values.sourceRecordId);
  const outputAgentRunField = getString(values.outputAgentRunField);
  if (!sourceCollection || !sourceRecordId || !outputAgentRunField) {
    return null;
  }
  return {
    sourceCollection,
    sourceRecordId,
    outputAgentRunField,
  };
}

function prepareImportFinalizationPlan(plan: ImportFinalizationPlan): PreparedImportFinalizationPlan {
  const version = EXTERNAL_IMPORT_OPERATION_PLAN_VERSION;
  return {
    ...plan,
    version,
    finalizationSha256: getHash(
      getCanonicalJson({
        version,
        expectedRunStatus: plan.expectedRunStatus,
        runUpdateValues: plan.runUpdateValues,
        sourceRecordRelation: plan.sourceRecordRelation,
      }),
    ),
  };
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
    getString(artifactValues.artifactKey || artifactValues.key) ||
    getSourceKey(
      'artifact',
      batchKey,
      String(index),
      getHash(
        [
          getString(artifactValues.artifactType || artifactValues.type),
          getString(artifactValues.mimeType),
          getString(artifactValues.contentText),
        ].join(':'),
      ).slice(0, 16),
    );
  return {
    ...artifactValues,
    artifactKey,
    metadata: {
      ...getRecord(artifactValues.metadata || artifactValues.metadataJson),
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

function getAliasedValue(values: JsonRecord, canonicalKey: string, aliasKey: string) {
  return Object.prototype.hasOwnProperty.call(values, canonicalKey) ? values[canonicalKey] : values[aliasKey];
}

function assertRequiredObservationString(ctx: Context, value: unknown, name: string) {
  const stringValue = getString(value);
  if (!stringValue) {
    ctx.throw(400, `${name} is required`);
  }
  if (stringValue.length > MAX_DATABASE_STRING_LENGTH) {
    ctx.throw(413, `${name} must not exceed ${MAX_DATABASE_STRING_LENGTH} characters`);
  }
  return stringValue;
}

function assertOptionalObservationString(ctx: Context, value: unknown, name: string) {
  const stringValue = getString(value);
  if (stringValue.length > MAX_DATABASE_STRING_LENGTH) {
    ctx.throw(413, `${name} must not exceed ${MAX_DATABASE_STRING_LENGTH} characters`);
  }
  return stringValue;
}

function assertOptionalNonNegativeInteger(ctx: Context, value: unknown, name: string) {
  if (value === undefined || value === null || value === '') {
    return;
  }
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    ctx.throw(400, `${name} must be a non-negative integer`);
  }
}

function isDetailedConversationEvent(eventType: string) {
  return eventType.startsWith('agent.command.') || eventType.startsWith('agent.tool.');
}

function isVerboseConversationEvent(eventType: string) {
  return (
    eventType === 'agent.message' ||
    eventType === 'agent.reasoning' ||
    eventType === 'agent.progress' ||
    eventType === 'agent.raw'
  );
}

function truncateConversationDetailValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.slice(0, COMMAND_DETAIL_STRING_LIMIT_CHARS);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => truncateConversationDetailValue(entry));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.entries(value).reduce<JsonRecord>((result, [key, entry]) => {
    result[key] = truncateConversationDetailValue(entry);
    if (typeof entry === 'string' && entry.length > COMMAND_DETAIL_STRING_LIMIT_CHARS) {
      result[`${key}Truncated`] = true;
      result[`${key}OriginalLength`] = entry.length;
    }
    return result;
  }, {});
}

function validateConversationOperation(ctx: Context, values: JsonRecord) {
  const source = assertRequiredObservationString(ctx, values.source, 'source');
  const eventType = assertRequiredObservationString(ctx, values.eventType || values.type, 'eventType');
  assertOptionalObservationString(ctx, values.providerEventId, 'providerEventId');
  assertOptionalObservationString(ctx, values.correlationId, 'correlationId');

  const sequence = typeof values.sequence === 'number' ? values.sequence : Number(values.sequence);
  if (!Number.isInteger(sequence) || sequence < 0) {
    ctx.throw(400, 'sequence is required');
  }
  if (values.confidence !== undefined && values.confidence !== null && values.confidence !== '') {
    const confidence = typeof values.confidence === 'number' ? values.confidence : Number(values.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      ctx.throw(400, 'confidence must be a number between 0 and 1');
    }
  }

  const contentJsonValue = values.contentJson || values.payloadJson || values.payload || {};
  if (isDetailedConversationEvent(eventType) || isVerboseConversationEvent(eventType)) {
    const storedContentJson = truncateConversationDetailValue(getRecord(contentJsonValue));
    if ((JSON.stringify(storedContentJson) || '').length > COMMAND_CONTENT_JSON_LIMIT_CHARS) {
      ctx.throw(413, 'Conversation event tool details are too large');
    }
  } else if ((JSON.stringify(contentJsonValue) || '').length > MAX_CONVERSATION_CONTENT_JSON_CHARS) {
    ctx.throw(413, 'Conversation event contentJson is too large');
  }

  const contentText =
    typeof (values.contentText || values.message) === 'string' ? values.contentText || values.message : '';
  const maxContentTextLength = isVerboseConversationEvent(eventType)
    ? COMMAND_DETAIL_STRING_LIMIT_CHARS
    : MAX_CONVERSATION_CONTENT_TEXT_LENGTH;
  if (String(contentText).length > maxContentTextLength) {
    ctx.throw(413, 'Conversation event contentText is too large');
  }
  return {
    source,
    sequence,
    providerEventId: getString(values.providerEventId),
  };
}

function validateArtifactOperation(ctx: Context, values: JsonRecord) {
  const artifactKey = assertOptionalObservationString(ctx, values.artifactKey, 'artifactKey');
  assertRequiredObservationString(ctx, values.artifactType || values.type, 'artifactType');
  const mimeType = assertOptionalObservationString(ctx, values.mimeType, 'mimeType') || 'text/plain';
  const contentText = typeof values.contentText === 'string' ? values.contentText : '';
  if (Buffer.byteLength(contentText) > COMMAND_CONTENT_JSON_LIMIT_CHARS) {
    ctx.throw(413, 'Artifact text is too large for plugin-hosted P0 storage');
  }

  const rawMetadata = getRecord(getAliasedValue(values, 'metadataJson', 'metadata'));
  assertOptionalNonNegativeInteger(ctx, values.sizeBytes, 'sizeBytes');
  assertOptionalNonNegativeInteger(ctx, rawMetadata.originalSizeBytes, 'metadata.originalSizeBytes');
  assertOptionalNonNegativeInteger(ctx, rawMetadata.uploadedBytes, 'metadata.uploadedBytes');
  assertOptionalObservationString(ctx, rawMetadata.storageMode, 'metadata.storageMode');
  assertOptionalObservationString(ctx, rawMetadata.sha256, 'metadata.sha256');

  const storedMetadata = {
    ...rawMetadata,
    ...(contentText && mimeType.includes('json')
      ? {
          jsonValid: (() => {
            try {
              JSON.parse(contentText);
              return true;
            } catch {
              return false;
            }
          })(),
        }
      : {}),
  };
  if ((JSON.stringify(storedMetadata) || '').length > MAX_ARTIFACT_METADATA_JSON_CHARS) {
    ctx.throw(413, 'Artifact metadata is too large');
  }
  return artifactKey;
}

function prepareObservationPlan(ctx: Context, operations: ObservationOperation[]): PreparedObservationPlan {
  const artifactKeys = new Set<string>();
  const conversationSequences = new Set<string>();
  const conversationProviderEvents = new Set<string>();
  for (const operation of operations) {
    if (operation.type === 'run-event') {
      assertRequiredObservationString(ctx, operation.source, 'source');
      assertRequiredObservationString(ctx, operation.eventType, 'eventType');
      getEventMessage(ctx, operation.message);
      getEventPayload(ctx, operation.payload);
      continue;
    }
    if (operation.type === 'artifact') {
      const artifactKey = validateArtifactOperation(ctx, operation.values);
      if (artifactKey && artifactKeys.has(artifactKey)) {
        ctx.throw(409, `Duplicate artifactKey in external import batch: ${artifactKey}`);
      }
      if (artifactKey) {
        artifactKeys.add(artifactKey);
      }
      continue;
    }

    const identity = validateConversationOperation(ctx, operation.values);
    const sequenceKey = `${identity.source}\0${identity.sequence}`;
    if (conversationSequences.has(sequenceKey)) {
      ctx.throw(409, 'Duplicate conversation event source and sequence in external import batch');
    }
    conversationSequences.add(sequenceKey);
    if (identity.providerEventId) {
      const providerEventKey = `${identity.source}\0${identity.providerEventId}`;
      if (conversationProviderEvents.has(providerEventKey)) {
        ctx.throw(409, 'Duplicate conversation event providerEventId in external import batch');
      }
      conversationProviderEvents.add(providerEventKey);
    }
  }

  return {
    version: EXTERNAL_IMPORT_OPERATION_PLAN_VERSION,
    operations,
    operationPlanSha256: getHash(
      getCanonicalJson({
        version: EXTERNAL_IMPORT_OPERATION_PLAN_VERSION,
        operations,
      }),
    ),
  };
}

function parseStoredObservationOperation(ctx: Context, value: unknown): ObservationOperation {
  const record = getRecord(value);
  const type = getString(record.type);
  if (type === 'artifact' || type === 'conversation-event' || type === 'initial-conversation') {
    return {
      type,
      values: getRecord(record.values),
    };
  }
  if (type === 'run-event') {
    const sequence = typeof record.sequence === 'number' ? record.sequence : Number(record.sequence);
    const source = getString(record.source);
    const eventType = getString(record.eventType);
    if (!source || !eventType || !Number.isInteger(sequence) || sequence < 0) {
      ctx.throw(409, 'Stored external import operation plan is invalid');
    }
    return {
      type,
      source,
      sequence,
      eventType,
      message: getString(record.message),
      payload: getRecord(record.payload),
    };
  }
  ctx.throw(409, 'Stored external import operation plan is invalid');
}

function getStoredObservationPlan(ctx: Context, batch: ModelRecord): PreparedObservationPlan {
  const stored = getRecord(getModelValue(batch, 'operationPlanJson'));
  const version = typeof stored.version === 'number' ? stored.version : Number(stored.version);
  const hasStoredOperations = Array.isArray(stored.operations);
  const rawOperations = getArray(stored.operations);
  if (version !== EXTERNAL_IMPORT_OPERATION_PLAN_VERSION || !hasStoredOperations) {
    ctx.throw(409, 'Stored external import operation plan is unavailable');
  }
  const operations = rawOperations.map((operation) => parseStoredObservationOperation(ctx, operation));
  const operationPlanSha256 = getHash(
    getCanonicalJson({
      version,
      operations,
    }),
  );
  if (
    operationPlanSha256 !== getModelString(batch, 'operationPlanSha256') ||
    operations.length !== getModelNumber(batch, 'operationCount')
  ) {
    ctx.throw(409, 'Stored external import operation plan is invalid');
  }
  return {
    version,
    operations,
    operationPlanSha256,
  };
}

function parseStoredSourceRecordRelation(ctx: Context, value: unknown): SourceRecordRelationPlan | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    ctx.throw(409, 'Stored external import finalization plan is invalid');
  }
  const sourceCollection = getString(value.sourceCollection);
  const sourceRecordId = getIdentifierString(value.sourceRecordId);
  const outputAgentRunField = getString(value.outputAgentRunField);
  if (!sourceCollection || !sourceRecordId || !outputAgentRunField) {
    ctx.throw(409, 'Stored external import finalization plan is invalid');
  }
  return {
    sourceCollection,
    sourceRecordId,
    outputAgentRunField,
  };
}

function getStoredImportFinalizationPlan(ctx: Context, batch: ModelRecord): PreparedImportFinalizationPlan {
  const storedValue = getModelValue(batch, 'finalizationJson');
  if (!isRecord(storedValue)) {
    ctx.throw(409, 'Stored external import finalization plan is unavailable');
  }
  const version = typeof storedValue.version === 'number' ? storedValue.version : Number(storedValue.version);
  const expectedRunStatus = getString(storedValue.expectedRunStatus);
  const rawRunUpdateValues = storedValue.runUpdateValues;
  if (
    version !== EXTERNAL_IMPORT_OPERATION_PLAN_VERSION ||
    !expectedRunStatus ||
    (rawRunUpdateValues !== null && !isRecord(rawRunUpdateValues))
  ) {
    ctx.throw(409, 'Stored external import finalization plan is invalid');
  }
  const runUpdateValues = rawRunUpdateValues === null ? null : getRecord(rawRunUpdateValues);
  const sourceRecordRelation = parseStoredSourceRecordRelation(ctx, storedValue.sourceRecordRelation);
  const finalizationSha256 = getHash(
    getCanonicalJson({
      version,
      expectedRunStatus,
      runUpdateValues,
      sourceRecordRelation,
    }),
  );
  if (finalizationSha256 !== getModelString(batch, 'finalizationSha256')) {
    ctx.throw(409, 'Stored external import finalization plan is invalid');
  }
  return {
    version,
    expectedRunStatus,
    runUpdateValues,
    sourceRecordRelation,
    finalizationSha256,
  };
}

function getObservationWriteResult(value: unknown): ObservationWriteResult {
  const counts = getRecord(value);
  const getCount = (entry: unknown) => {
    const numberValue = typeof entry === 'number' ? entry : Number(entry);
    return Number.isInteger(numberValue) && numberValue >= 0 ? numberValue : 0;
  };
  return {
    conversationEvents: getCount(counts.conversationEvents),
    runEvents: getCount(counts.runEvents),
    artifacts: getCount(counts.artifacts),
  };
}

function addObservationWriteResults(left: ObservationWriteResult, right: ObservationWriteResult) {
  return {
    conversationEvents: left.conversationEvents + right.conversationEvents,
    runEvents: left.runEvents + right.runEvents,
    artifacts: left.artifacts + right.artifacts,
  };
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

async function processObservationBatch(
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

async function assertSourceRecordRelationWritable(
  ctx: Context,
  options: {
    sourceCollection: string;
    sourceRecordId: string;
    outputAgentRunField: string;
    transaction: Transaction;
  },
) {
  const output = assertOutputAgentRunField(ctx, options.sourceCollection, options.outputAgentRunField);
  const viewAccess = await getCollectionActionAccess(ctx, options.sourceCollection, 'view');
  const updateAccess = await getCollectionActionAccess(ctx, options.sourceCollection, 'update');
  assertWritableOutputField(ctx, updateAccess, output);

  const repo = ctx.db.getRepository(options.sourceCollection);
  const record = (await repo.findOne({
    filterByTk: options.sourceRecordId,
    filter: mergeFilters(viewAccess.filter, updateAccess.filter),
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!record) {
    ctx.throw(404, 'Source record not found');
  }
  return {
    output,
    repo,
  };
}

async function updateSourceRecordRelation(
  ctx: Context,
  options: SourceRecordRelationPlan & {
    runId: string;
    transaction: Transaction;
  },
) {
  const { output, repo } = await assertSourceRecordRelationWritable(ctx, options);
  await repo.update({
    filterByTk: options.sourceRecordId,
    values: {
      [output.foreignKey]: options.runId,
    },
    transaction: options.transaction,
  });
  return true;
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
        metadataJson: getRecord(options.values.metadata || options.values.metadataJson),
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

async function retryImportFoundation<T>(operation: () => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_FOUNDATION_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
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

async function importExternalRun(ctx: Context) {
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

async function appendExternalRunObservations(ctx: Context, runId: string) {
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
  const provider = getProvider(ctx, values.provider || getModelValue(visibleRun, 'agentSessionProvider'));
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

export function registerExternalRunImportRoutes(plugin: Plugin) {
  plugin.app.use(
    async (ctx: Context, next: Next) => {
      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }

      const routePath = ctx.path.slice(API_PREFIX.length);
      const appendMatch = routePath.match(/^\/external-runs\/([^/]+)\/observations:append$/);
      if (ctx.method === 'POST' && routePath === '/external-runs:import') {
        await importExternalRun(ctx);
        return;
      }

      if (ctx.method === 'POST' && appendMatch) {
        const [, runId] = appendMatch;
        if (!UUID_PATTERN.test(runId)) {
          ctx.throw(400, 'runId must be a valid UUID');
        }
        await appendExternalRunObservations(ctx, runId);
        return;
      }

      await next();
    },
    {
      tag: 'agentGatewayExternalRunImportRoutes',
      after: 'agentGatewayRunObservabilityRoutes',
      before: 'dataSource',
    },
  );
}
