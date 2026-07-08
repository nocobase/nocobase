/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';

import { AgentProviderKey, getAgentProviderKey, isAgentProviderKey } from '../../shared/providerCapabilities';
import {
  EXTERNAL_IMPORT_CAPABILITIES,
  EXTERNAL_IMPORT_SOURCE_TYPE,
  EXTERNAL_LOG_FORMATS,
  ExternalLogFormat,
} from '../../shared/externalRunImport';
import { claudeCodeAdapter } from '../../daemon/adapters/claudeCode';
import { codexAdapter } from '../../daemon/adapters/codex';
import { opencodeAdapter } from '../../daemon/adapters/opencode';
import { AgentAdapter, NormalizedAgentEvent } from '../../daemon/adapters/types';
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

const MAX_EVENT_MESSAGE_LENGTH = 4000;
const MAX_EVENT_PAYLOAD_CHARS = 16000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IMPORTED_RUN_STATUSES = new Set(['running', 'succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);
const TERMINAL_IMPORTED_RUN_STATUSES = new Set(['succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);
const DEFAULT_IMPORT_BATCH_KEY = 'initial';
const EXTERNAL_INITIAL_EVENT_SOURCE = 'external-import-task';

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

const PROVIDER_ADAPTERS: Partial<Record<AgentProviderKey, AgentAdapter>> = {
  codex: codexAdapter,
  opencode: opencodeAdapter,
  'claude-code': claudeCodeAdapter,
};

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getRequiredString(ctx: Context, value: unknown, name: string) {
  const stringValue = getString(value);
  if (!stringValue) {
    ctx.throw(400, `${name} is required`);
  }
  return stringValue;
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

function sanitizeKeyPart(value: string, maxLength = 96) {
  return value
    .trim()
    .replace(/[^A-Za-z0-9_.:/-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}

function getHash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function getExternalRunCode(values: JsonRecord) {
  const explicitRunCode = getString(values.runCode);
  if (explicitRunCode) {
    return explicitRunCode;
  }
  const externalRunKey = getString(values.externalRunKey);
  if (externalRunKey) {
    const suffix = sanitizeKeyPart(externalRunKey, 48);
    const hash = getHash(externalRunKey).slice(0, 16);
    return suffix ? `external_${hash}_${suffix}` : `external_${hash}`;
  }
  return `external_${randomUUID()}`;
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

function getLogFormat(provider: AgentProviderKey, value: unknown): ExternalLogFormat {
  const format = getString(value);
  if (EXTERNAL_LOG_FORMATS.includes(format as ExternalLogFormat)) {
    return format as ExternalLogFormat;
  }
  if (provider === 'codex') {
    return 'codex-jsonl';
  }
  if (provider === 'opencode') {
    return 'opencode-jsonl';
  }
  if (provider === 'claude-code') {
    return 'claude-code-jsonl';
  }
  return 'text';
}

function getLogEntries(values: JsonRecord) {
  const logs = getArray(values.logs).map((entry) => getRecord(entry));
  if (logs.length) {
    return logs;
  }
  const contentText = getString(values.contentText || values.log || values.logsText);
  if (!contentText) {
    return [];
  }
  return [
    {
      contentText,
      format: values.format,
      artifactKey: values.artifactKey,
    },
  ];
}

function getArtifactEntries(values: JsonRecord) {
  return getArray(values.artifacts).map((entry) => getRecord(entry));
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
  return redactRunResultSummary({
    ...existingResultSummary,
    ...getRecord(values.resultSummary || values.resultSummaryJson),
    ...(title ? { title } : {}),
    requestedFrom: 'external-import',
    provider,
    externalRunKey: getString(values.externalRunKey) || getString(existingResultSummary.externalRunKey) || null,
  });
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
  return sanitizeKeyPart(parts.filter(Boolean).join(':'), 180) || 'external-import';
}

function getTextLogEvents(contentText: string): NormalizedAgentEvent[] {
  return contentText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      eventType: 'agent.progress',
      level: 'info' as const,
      message: line,
      payloadJson: {
        textKind: 'progress',
      },
    }));
}

function normalizeLogEvents(provider: AgentProviderKey, format: ExternalLogFormat, contentText: string) {
  if (format === 'text') {
    return getTextLogEvents(contentText);
  }
  const adapter = PROVIDER_ADAPTERS[provider];
  if (!adapter) {
    return getTextLogEvents(contentText);
  }
  return contentText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => adapter.normalizeEvent({ rawLine: line }));
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

async function writeInitialConversationEvent(
  ctx: Context,
  options: {
    run: ModelRecord;
    runId: string;
    values: JsonRecord;
    transaction: Transaction;
  },
) {
  const instruction = getString(options.values.instruction || options.values.prompt);
  if (!instruction) {
    return false;
  }
  const event = await createConversationEvent(
    ctx,
    options.run,
    options.runId,
    {
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
    options.transaction,
  );
  return event.idempotent !== true;
}

async function writeObservationBatch(
  ctx: Context,
  options: {
    run: ModelRecord;
    values: JsonRecord;
    provider: AgentProviderKey;
    batchKey: string;
    transaction: Transaction;
  },
): Promise<ObservationWriteResult> {
  const runId = String(getModelTargetKey(options.run, 'id'));
  const claimAttempt = getModelNumber(options.run, 'claimAttempt');
  const sequenceBySource = new Map<string, number>();
  const result: ObservationWriteResult = {
    conversationEvents: 0,
    runEvents: 0,
    artifacts: 0,
  };
  const runEventSource = getSourceKey('external-import', options.batchKey);

  if (
    await appendRunEvent(ctx, {
      runId,
      claimAttempt,
      source: runEventSource,
      sequence: 1,
      eventType: 'external.import.batch.received',
      message: 'External import batch received',
      payload: {
        batchKey: options.batchKey,
        provider: options.provider,
      },
      transaction: options.transaction,
    })
  ) {
    result.runEvents += 1;
  }

  const logs = getLogEntries(options.values);
  for (let index = 0; index < logs.length; index += 1) {
    const log = logs[index];
    const contentText = getString(log.contentText || log.text || log.content);
    if (!contentText) {
      continue;
    }
    const format = getLogFormat(options.provider, log.format || options.values.format);
    const rawLogArtifact = await createRunArtifact(ctx, {
      runId,
      claimAttempt,
      values: getRawLogArtifactValues({
        log,
        provider: options.provider,
        format,
        batchKey: options.batchKey,
        index,
        contentText,
      }),
      transaction: options.transaction,
    });
    if (rawLogArtifact.idempotent !== true) {
      result.artifacts += 1;
    }

    const source = getSourceKey('external', options.provider, format, options.batchKey, String(index));
    const normalizedEvents = normalizeLogEvents(options.provider, format, contentText);
    for (const normalizedEvent of normalizedEvents) {
      const sequence = (sequenceBySource.get(source) || 0) + 1;
      sequenceBySource.set(source, sequence);
      const event = await createConversationEvent(
        ctx,
        options.run,
        runId,
        {
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
        options.transaction,
      );
      if (event.idempotent !== true) {
        result.conversationEvents += 1;
      }
    }
  }

  const artifacts = getArtifactEntries(options.values);
  for (let index = 0; index < artifacts.length; index += 1) {
    const artifactValues = artifacts[index];
    const artifact = await createRunArtifact(ctx, {
      runId,
      claimAttempt,
      values: getExternalArtifactValues(artifactValues, options.batchKey, index),
      transaction: options.transaction,
    });
    if (artifact.idempotent !== true) {
      result.artifacts += 1;
    }
  }

  return result;
}

async function updateSourceRecordRelation(
  ctx: Context,
  options: {
    sourceCollection: string;
    sourceRecordId: string;
    outputAgentRunField: string;
    runId: string;
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
  await repo.update({
    filterByTk: options.sourceRecordId,
    values: {
      [output.foreignKey]: options.runId,
    },
    transaction: options.transaction,
  });
  return true;
}

async function createOrUpdateImportedRun(
  ctx: Context,
  values: JsonRecord,
  provider: AgentProviderKey,
  transaction: Transaction,
): Promise<{ run: ModelRecord; deduped: boolean }> {
  const runCode = getExternalRunCode(values);
  const now = new Date();
  const existing = (await ctx.db.getRepository('agRuns').findOne({
    filter: {
      runCode,
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  const status = getImportStatus(ctx, values, existing ? getModelString(existing, 'status') : undefined);
  if (existing) {
    if (getModelString(existing, 'sourceType') !== EXTERNAL_IMPORT_SOURCE_TYPE) {
      ctx.throw(409, 'runCode already belongs to a non-imported Agent Gateway run');
    }
    const visibleFilter = await getVisibleRunFilter(
      ctx,
      {
        id: String(getModelTargetKey(existing, 'id')),
      },
      'get',
    );
    const visibleRun = (await ctx.db.getRepository('agRuns').findOne({
      filter: visibleFilter,
      transaction,
    })) as ModelRecord | null;
    if (!visibleRun) {
      ctx.throw(404, 'Run not found');
    }
    await ctx.db.getRepository('agRuns').update({
      filterByTk: getModelTargetKey(existing, 'id'),
      values: {
        ...getRunUpdateValuesWithUser(ctx, values, status, provider, now, existing),
        runCode,
      },
      transaction,
    });
    const updated = (await ctx.db.getRepository('agRuns').findOne({
      filterByTk: getModelTargetKey(existing, 'id'),
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord;
    return {
      run: updated,
      deduped: true,
    };
  }

  const run = (await ctx.db.getRepository('agRuns').create({
    values: {
      runCode,
      ...getRunUpdateValuesWithUser(ctx, values, status, provider, now),
    },
    transaction,
  })) as ModelRecord;
  return {
    run,
    deduped: false,
  };
}

function getRunUpdateValuesWithUser(
  ctx: Context,
  values: JsonRecord,
  status: string,
  provider: AgentProviderKey,
  now: Date,
  existing?: ModelRecord,
) {
  const updateValues = getRunUpdateValues(values, status, provider, now, existing);
  return {
    ...updateValues,
    requestedById: getCurrentUserId(ctx) || null,
  };
}

async function importExternalRun(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.importExternalRuns,
    'Agent Gateway external run import permission required',
  );

  const values = getBodyValues(ctx);
  const provider = getProvider(ctx, values.provider);
  const batchKey = getString(values.batchKey) || DEFAULT_IMPORT_BATCH_KEY;
  const result = await ctx.db.sequelize.transaction(async (transaction): Promise<ExternalImportResult> => {
    const { run, deduped } = await createOrUpdateImportedRun(ctx, values, provider, transaction);
    const runId = String(getModelTargetKey(run, 'id'));
    let relationUpdated = false;

    const sourceCollection = getString(values.sourceCollection);
    const sourceRecordId = getIdentifierString(values.sourceRecordId);
    const outputAgentRunField = getString(values.outputAgentRunField);
    if (sourceCollection && sourceRecordId && outputAgentRunField) {
      relationUpdated = await updateSourceRecordRelation(ctx, {
        sourceCollection,
        sourceRecordId,
        outputAgentRunField,
        runId,
        transaction,
      });
    }

    const observations: ObservationWriteResult = {
      conversationEvents: 0,
      runEvents: 0,
      artifacts: 0,
    };
    if (await writeInitialConversationEvent(ctx, { run, runId, values, transaction })) {
      observations.conversationEvents += 1;
    }
    const batchObservations = await writeObservationBatch(ctx, {
      run,
      values,
      provider,
      batchKey,
      transaction,
    });
    observations.conversationEvents += batchObservations.conversationEvents;
    observations.runEvents += batchObservations.runEvents;
    observations.artifacts += batchObservations.artifacts;

    return {
      run,
      deduped,
      observations,
      relationUpdated,
    };
  });

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
  await assertRunVisible(ctx, runId, 'get');

  const values = getBodyValues(ctx);
  const batchKey = getRequiredString(ctx, values.batchKey, 'batchKey');
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const run = (await ctx.db.getRepository('agRuns').findOne({
      filterByTk: runId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (!run) {
      ctx.throw(404, 'Run not found');
    }
    if (getModelString(run, 'sourceType') !== EXTERNAL_IMPORT_SOURCE_TYPE) {
      ctx.throw(409, 'Only imported external runs can receive external observations');
    }

    const provider = getProvider(ctx, values.provider || getModelValue(run, 'agentSessionProvider'));
    const status = getString(values.status)
      ? getImportStatus(ctx, values, getModelString(run, 'status'))
      : getModelString(run, 'status');
    if (getString(values.status)) {
      await ctx.db.getRepository('agRuns').update({
        filterByTk: runId,
        values: getRunUpdateValuesWithUser(ctx, values, status, provider, new Date(), run),
        transaction,
      });
    }
    const updatedRun = getString(values.status)
      ? ((await ctx.db.getRepository('agRuns').findOne({
          filterByTk: runId,
          transaction,
          lock: transaction.LOCK.UPDATE,
        })) as ModelRecord)
      : run;
    const observations = await writeObservationBatch(ctx, {
      run: updatedRun,
      values,
      provider,
      batchKey,
      transaction,
    });

    return {
      run: updatedRun,
      observations,
    };
  });

  ctx.body = {
    runId,
    run: await serializeRunForManagement(ctx, result.run),
    observations: result.observations,
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
