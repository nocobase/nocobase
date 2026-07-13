/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

import { EXTERNAL_IMPORT_LIMITS, EXTERNAL_IMPORT_OPERATION_PLAN_VERSION } from '../../../shared/externalRunImport';
import {
  COMMAND_CONTENT_JSON_LIMIT_CHARS,
  COMMAND_DETAIL_STRING_LIMIT_CHARS,
} from '../../../shared/conversationLimits';
import { redactEventPayload, redactObservabilityText } from '../../security';
import {
  JsonRecord,
  ModelRecord,
  getArray,
  getModelJson,
  getModelNumber,
  getModelString,
  getModelValue,
  getRecord,
  getString,
} from '../../actions/utils';
import {
  getCanonicalExternalImportJson as getCanonicalJson,
  hashExternalImportValue as getHash,
} from '../../services/externalImportUtils';
import { SourceRecordRelationPlan } from './businessLink';

const MAX_CONVERSATION_CONTENT_TEXT_LENGTH = 8000;
const MAX_CONVERSATION_CONTENT_JSON_CHARS = 32 * 1024;
const MAX_ARTIFACT_METADATA_JSON_CHARS = 16 * 1024;
const MAX_DATABASE_STRING_LENGTH = 255;
const MAX_EVENT_MESSAGE_LENGTH = 4000;
const MAX_EVENT_PAYLOAD_CHARS = 16000;

export interface ObservationWriteResult {
  conversationEvents: number;
  runEvents: number;
  artifacts: number;
}

export interface PreparedObservationPlan {
  version: number;
  operations: ObservationOperation[];
  operationPlanSha256: string;
}

export interface ImportFinalizationPlan {
  expectedRunStatus: string;
  runUpdateValues: JsonRecord | null;
  sourceRecordRelation: SourceRecordRelationPlan | null;
}

export interface PreparedImportFinalizationPlan extends ImportFinalizationPlan {
  version: number;
  finalizationSha256: string;
}

export type ObservationOperation =
  | { type: 'initial-conversation'; values: JsonRecord }
  | {
      type: 'run-event';
      source: string;
      sequence: number;
      eventType: string;
      message: string;
      payload: JsonRecord;
    }
  | { type: 'artifact'; values: JsonRecord }
  | { type: 'conversation-event'; values: JsonRecord };

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

export function getSourceRecordRelationPlan(values: JsonRecord): SourceRecordRelationPlan | null {
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

export function prepareImportFinalizationPlan(plan: ImportFinalizationPlan): PreparedImportFinalizationPlan {
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
  const eventType = assertRequiredObservationString(ctx, values.eventType, 'eventType');
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

  const contentJsonValue = values.contentJson || {};
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
  assertRequiredObservationString(ctx, values.artifactType, 'artifactType');
  const mimeType = assertOptionalObservationString(ctx, values.mimeType, 'mimeType') || 'text/plain';
  const contentText = typeof values.contentText === 'string' ? values.contentText : '';
  if (Buffer.byteLength(contentText) > COMMAND_CONTENT_JSON_LIMIT_CHARS) {
    ctx.throw(413, 'Artifact text is too large for plugin-hosted P0 storage');
  }

  const rawMetadata = getRecord(values.metadataJson);
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

export function prepareObservationPlan(ctx: Context, operations: ObservationOperation[]): PreparedObservationPlan {
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

export function getStoredObservationPlan(ctx: Context, batch: ModelRecord): PreparedObservationPlan {
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

export function getStoredImportFinalizationPlan(ctx: Context, batch: ModelRecord): PreparedImportFinalizationPlan {
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

export function getObservationWriteResult(value: unknown): ObservationWriteResult {
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

export function addObservationWriteResults(left: ObservationWriteResult, right: ObservationWriteResult) {
  return {
    conversationEvents: left.conversationEvents + right.conversationEvents,
    runEvents: left.runEvents + right.runEvents,
    artifacts: left.artifacts + right.artifacts,
  };
}
