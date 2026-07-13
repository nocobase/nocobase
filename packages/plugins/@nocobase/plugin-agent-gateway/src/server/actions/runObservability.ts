/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';

import {
  AGENT_GATEWAY_ACTIONS,
  authenticateNodeToken,
  redactEventPayload,
  redactObservabilityText,
  redactSnapshotJson,
} from '../security';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionName } from '../../shared/apiContract';
import {
  JsonRecord,
  ModelRecord,
  asActionContext,
  getBodyValues,
  getDate,
  getModelJson,
  getModelValue,
  getModelNumber,
  getRecord,
  getString,
  getActionTargetKey,
  assertRunVisible,
  matchStandardCollectionAction,
  requireAgentGatewayPermission,
  requireManagePermission,
} from './utils';
import { validateRunLease } from './runLifecycle';
import {
  AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE,
  AgentCapabilityKey,
  getUnsupportedCapabilityMessage,
} from '../../shared/providerCapabilities';
import { COMMAND_CONTENT_JSON_LIMIT_CHARS } from '../../shared/conversationLimits';
import { getRunProviderCapabilitySummary, isRunCapabilitySupported } from './capabilityUtils';
import { findCursorPage, getBoundedPositiveIntegerQuery } from './cursorPagination';
import {
  deleteSharedStorageObject,
  parseSharedStorageObject,
  putSharedStorageBuffer,
  readSharedStorageBuffer,
} from '../services/sharedFileStorage';

const MAX_EVENT_MESSAGE_LENGTH = 4000;
const MAX_EVENT_PAYLOAD_CHARS = 16000;
const MAX_ARTIFACT_TEXT_BYTES = COMMAND_CONTENT_JSON_LIMIT_CHARS;
const MAX_METADATA_JSON_CHARS = 16 * 1024;
const MAX_SNAPSHOT_JSON_CHARS = 64 * 1024;
const DEFAULT_EVENT_PAGE_SIZE = 100;
const MAX_EVENT_PAGE_SIZE = 500;
const DEFAULT_DETAIL_PAGE_SIZE = 20;
const MAX_DETAIL_PAGE_SIZE = 100;
const SUPPORTED_SNAPSHOT_TYPES = new Set(['node', 'agent', 'skill', 'nocobase', 'workspace', 'custom']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STANDARD_OBSERVABILITY_COLLECTIONS = [
  'agRunEvents',
  'agRunArtifacts',
  'agRunSnapshots',
  'agApiCallLogs',
] as const;
const DIRECT_OBSERVABILITY_READ_ACTIONS = new Set(['get', 'list']);
const OBSERVABILITY_WRITE_RUN_STATUSES = ['claimed', 'syncing_skills', 'running', 'finalizing', 'stalled'] as const;

interface ArtifactGroupDeclaration {
  path?: string;
  glob?: string;
  groupKey?: string;
  groupLabel?: string;
}

function getDetailPagination(ctx: Context) {
  const page = getBoundedPositiveIntegerQuery(ctx, 'page', 1, Number.MAX_SAFE_INTEGER);
  const pageSize = getBoundedPositiveIntegerQuery(
    ctx,
    'pageSize',
    DEFAULT_DETAIL_PAGE_SIZE,
    MAX_DETAIL_PAGE_SIZE,
    'limit',
  );
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

function findRunEventPage(ctx: Context, runId: string) {
  return findCursorPage({
    ctx,
    filter: { runId },
    scope: `observability:events:${runId}`,
    cursorField: 'ingestId',
    defaultPageSize: DEFAULT_EVENT_PAGE_SIZE,
    maxPageSize: MAX_EVENT_PAGE_SIZE,
    findRows: (options) => ctx.db.getRepository('agRunEvents').find(options) as Promise<ModelRecord[]>,
  });
}

export interface CreateRunArtifactOptions {
  runId: string;
  claimAttempt: number;
  values: JsonRecord;
  transaction?: Transaction;
}

function getRequiredString(ctx: Context, value: unknown, name: string) {
  const stringValue = getString(value);
  if (!stringValue) {
    ctx.throw(400, `${name} is required`);
  }
  return stringValue;
}

function getRequiredNonNegativeInteger(ctx: Context, value: unknown, name: string) {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'boolean' ||
    (typeof value === 'string' && !value.trim())
  ) {
    ctx.throw(400, `${name} is required`);
  }

  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    ctx.throw(400, `${name} is required`);
  }
  return numberValue;
}

function getOptionalNonNegativeInteger(ctx: Context, value: unknown, name: string) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    ctx.throw(400, `${name} must be a non-negative integer`);
  }
  return numberValue;
}

function serializeModel(model: ModelRecord) {
  return getModelJson(model);
}

function serializeArtifact(model: ModelRecord) {
  const {
    storageId: _storageId,
    objectPath: _objectPath,
    objectFilename: _objectFilename,
    objectKey: _objectKey,
    storageSizeBytes: _storageSizeBytes,
    storageSha256: _storageSha256,
    contentText: _contentText,
    ...artifact
  } = serializeModel(model);
  return artifact;
}

function getArtifactStorageObject(artifact: ModelRecord) {
  return parseSharedStorageObject({
    storageId: getModelValue(artifact, 'storageId'),
    objectPath: getModelValue(artifact, 'objectPath'),
    objectFilename: getModelValue(artifact, 'objectFilename'),
    objectKey: getModelValue(artifact, 'objectKey'),
    sizeBytes: getModelValue(artifact, 'storageSizeBytes'),
    mimetype: getModelValue(artifact, 'mimeType'),
  });
}

function normalizeArtifactPath(value: string) {
  return value
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/^([A-Za-z]:)?\/+/, '$1');
}

function escapeRegex(value: string) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegex(pattern: string) {
  let source = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char !== '*') {
      source += escapeRegex(char);
      continue;
    }
    if (pattern[index + 1] === '*') {
      index += 1;
      if (pattern[index + 1] === '/') {
        index += 1;
        source += '(?:.*\\/)?';
      } else {
        source += '.*';
      }
      continue;
    }
    source += '[^/]*';
  }
  return new RegExp(`${source}$`);
}

function getArtifactGroupDeclarations(run: ModelRecord) {
  const payload = getRecord(getModelValue(run, 'executionPayloadJson'));
  const artifacts = Array.isArray(payload.artifacts) ? payload.artifacts : [];
  const declarations: ArtifactGroupDeclaration[] = [];
  for (const value of artifacts) {
    const record = getRecord(value);
    const artifactPath = getString(record.path || record.filePath);
    const glob = getString(record.glob || record.pattern);
    const groupKey = getString(record.groupKey);
    const groupLabel = getString(record.groupLabel || record.group);
    if ((!artifactPath && !glob) || (!groupKey && !groupLabel)) {
      continue;
    }
    declarations.push({
      ...(artifactPath ? { path: normalizeArtifactPath(artifactPath) } : {}),
      ...(glob ? { glob: normalizeArtifactPath(glob) } : {}),
      ...(groupKey ? { groupKey } : {}),
      ...(groupLabel ? { groupLabel } : {}),
    });
  }
  return declarations;
}

function getDeclaredArtifactRelativePath(artifact: JsonRecord) {
  const metadata = getRecord(artifact.metadataJson);
  const relativePath = getString(metadata.relativePath);
  if (relativePath) {
    return normalizeArtifactPath(relativePath);
  }
  const artifactKey = getString(artifact.artifactKey);
  if (!artifactKey.startsWith('declared:')) {
    return '';
  }
  return normalizeArtifactPath(artifactKey.slice('declared:'.length));
}

function findArtifactGroupDeclaration(relativePath: string, declarations: ArtifactGroupDeclaration[]) {
  if (!relativePath) {
    return null;
  }
  for (const declaration of declarations) {
    if (declaration.path && normalizeArtifactPath(declaration.path) === relativePath) {
      return declaration;
    }
    if (declaration.glob && globToRegex(declaration.glob).test(relativePath)) {
      return declaration;
    }
  }
  return null;
}

function applyDeclaredArtifactGroups(artifacts: JsonRecord[], run: ModelRecord) {
  const declarations = getArtifactGroupDeclarations(run);
  if (!declarations.length) {
    return artifacts;
  }
  return artifacts.map((artifact) => {
    const metadata = getRecord(artifact.metadataJson);
    if (getString(metadata.artifactGroupKey) || getString(metadata.artifactGroupLabel)) {
      return artifact;
    }
    const declaration = findArtifactGroupDeclaration(getDeclaredArtifactRelativePath(artifact), declarations);
    if (!declaration) {
      return artifact;
    }
    return {
      ...artifact,
      metadataJson: {
        ...metadata,
        ...(declaration.groupKey ? { artifactGroupKey: declaration.groupKey } : {}),
        ...(declaration.groupLabel ? { artifactGroupLabel: declaration.groupLabel } : {}),
      },
    };
  });
}

async function requireObservabilityRead(ctx: Context, action: string, message: string) {
  await requireAgentGatewayPermission(ctx, action, message);
}

async function assertObservationCapability(ctx: Context, run: ModelRecord, capability: AgentCapabilityKey) {
  const capabilitySummary = await getRunProviderCapabilitySummary(ctx, run);
  if (isRunCapabilitySupported(capabilitySummary, capability)) {
    return capabilitySummary;
  }
  ctx.throw(409, {
    code: AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE,
    message: getUnsupportedCapabilityMessage(capability),
  });
}

function getRedactedPayload(ctx: Context, payload: unknown) {
  const redactedPayload = redactEventPayload(payload);
  const serializedPayload = JSON.stringify(redactedPayload) || '';
  if (serializedPayload.length > MAX_EVENT_PAYLOAD_CHARS) {
    ctx.throw(413, 'Event payload is too large; store large logs as artifacts');
  }
  return redactedPayload;
}

function getBoundedRedactedJson(
  ctx: Context,
  value: unknown,
  name: string,
  maxChars: number,
  redactValue: (source: unknown) => unknown = redactSnapshotJson,
) {
  const rawSerializedValue = JSON.stringify(value) || '';
  if (rawSerializedValue.length > maxChars) {
    ctx.throw(413, `${name} is too large`);
  }

  const redactedValue = redactValue(value);
  const serializedValue = JSON.stringify(redactedValue) || '';
  if (serializedValue.length > maxChars) {
    ctx.throw(413, `${name} is too large`);
  }

  return redactedValue;
}

function preserveJson(source: unknown) {
  return source;
}

function getEventMessage(ctx: Context, value: unknown) {
  const message = getString(value);
  if (message.length > MAX_EVENT_MESSAGE_LENGTH) {
    ctx.throw(413, 'Event message is too large; store large logs as artifacts');
  }
  return message ? redactObservabilityText(message) : null;
}

async function getCurrentNodeId(ctx: Context) {
  const auth = await authenticateNodeToken(ctx);
  return String(auth.subject.nodeId);
}

async function appendEvent(ctx: Context, runId: string) {
  const nodeId = await getCurrentNodeId(ctx);
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction, {
      allowExpiredLeaseStatuses: ['finalizing', 'stalled'],
      allowStaleLeaseVersion: true,
      allowedStatuses: OBSERVABILITY_WRITE_RUN_STATUSES,
    });
    if (!lease) {
      return null;
    }

    const source = getRequiredString(ctx, values.source, 'source');
    const sequence = getRequiredNonNegativeInteger(ctx, values.sequence, 'sequence');
    const eventRepo = ctx.db.getRepository('agRunEvents');
    const uniqueFilter = {
      runId,
      claimAttempt: lease.claimAttempt,
      source,
      sequence,
    };
    const existingEvent = (await eventRepo.findOne({
      filter: uniqueFilter,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (existingEvent) {
      return {
        ...serializeModel(existingEvent),
        idempotent: true,
      };
    }

    const latestEvent = (await eventRepo.findOne({
      filter: {
        runId,
        claimAttempt: lease.claimAttempt,
        source,
      },
      sort: ['-sequence'],
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (latestEvent && getModelNumber(latestEvent, 'sequence') >= sequence) {
      ctx.throw(409, 'Event sequence must be monotonic per source and claim attempt');
    }

    const now = new Date();
    const event = (await eventRepo.create({
      values: {
        id: randomUUID(),
        ...uniqueFilter,
        level: getString(values.level) || 'info',
        eventType: getRequiredString(ctx, values.eventType, 'eventType'),
        message: getEventMessage(ctx, values.message),
        payloadJson: getRedactedPayload(ctx, values.contentJson),
        emittedAt: getDate(values.emittedAt) || now,
      },
      transaction,
    })) as ModelRecord;

    return {
      ...serializeModel(event),
      idempotent: false,
    };
  });

  if (result) {
    ctx.body = result;
  }
}

function getArtifactContentText(ctx: Context, value: unknown, mimeType: string) {
  const contentText = typeof value === 'string' ? value : '';
  const sizeBytes = Buffer.byteLength(contentText);
  if (sizeBytes > MAX_ARTIFACT_TEXT_BYTES) {
    ctx.throw(413, 'Artifact text is too large for plugin-hosted P0 storage');
  }

  if (contentText && mimeType.includes('json')) {
    try {
      const formattedJsonText = JSON.stringify(JSON.parse(contentText), null, 2);
      return {
        contentText: formattedJsonText,
        computedSizeBytes: sizeBytes,
        previewBytes: Buffer.byteLength(formattedJsonText),
        jsonValid: true,
      };
    } catch {
      return {
        contentText,
        computedSizeBytes: sizeBytes,
        previewBytes: Buffer.byteLength(contentText),
        jsonValid: false,
      };
    }
  }

  return {
    contentText: contentText || null,
    computedSizeBytes: sizeBytes,
    previewBytes: contentText ? Buffer.byteLength(contentText) : 0,
    jsonValid: null,
  };
}

export async function createRunArtifact(ctx: Context, options: CreateRunArtifactOptions) {
  const artifactKey = getString(options.values.artifactKey) || null;
  const artifactRepo = ctx.db.getRepository('agRunArtifacts');
  if (artifactKey) {
    const existingArtifact = (await artifactRepo.findOne({
      filter: {
        runId: options.runId,
        claimAttempt: options.claimAttempt,
        artifactKey,
      },
      transaction: options.transaction,
      lock: options.transaction?.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (existingArtifact) {
      return {
        ...serializeArtifact(existingArtifact),
        idempotent: true,
      };
    }
  }

  const mimeType = getString(options.values.mimeType) || 'text/plain';
  const rawMetadata = getRecord(options.values.metadataJson);
  const metadataWithJsonStatus = {
    ...rawMetadata,
  };
  const { contentText, computedSizeBytes, previewBytes, jsonValid } = getArtifactContentText(
    ctx,
    options.values.contentText,
    mimeType,
  );
  if (jsonValid !== null) {
    metadataWithJsonStatus.jsonValid = jsonValid;
  }
  const providedSizeBytes = getOptionalNonNegativeInteger(ctx, options.values.sizeBytes, 'sizeBytes');
  const metadataOriginalSizeBytes = getOptionalNonNegativeInteger(
    ctx,
    rawMetadata.originalSizeBytes,
    'metadata.originalSizeBytes',
  );
  const metadataUploadedBytes = getOptionalNonNegativeInteger(ctx, rawMetadata.uploadedBytes, 'metadata.uploadedBytes');
  const content = contentText === null ? null : Buffer.from(contentText);
  const storageObject = content
    ? await putSharedStorageBuffer(
        { app: ctx.app },
        {
          content,
          filename: `${randomUUID()}.txt`,
          mimetype: mimeType,
          subPath: `agent-gateway/run-artifacts/${options.runId}`,
        },
      )
    : null;
  try {
    const artifact = (await artifactRepo.create({
      values: {
        id: randomUUID(),
        runId: options.runId,
        claimAttempt: options.claimAttempt,
        artifactKey,
        artifactType: getRequiredString(ctx, options.values.artifactType, 'artifactType'),
        mimeType,
        sizeBytes: providedSizeBytes ?? computedSizeBytes,
        originalSizeBytes: metadataOriginalSizeBytes ?? providedSizeBytes ?? computedSizeBytes,
        previewBytes: metadataUploadedBytes ?? previewBytes,
        truncated: rawMetadata.truncated === true,
        storageMode: getString(rawMetadata.storageMode) || (rawMetadata.truncated === true ? 'preview' : 'shared'),
        contentSha256: getString(rawMetadata.sha256) || null,
        storageSha256: content ? createHash('sha256').update(content).digest('hex') : null,
        ...(storageObject
          ? {
              storageId: storageObject.storageId,
              objectPath: storageObject.path,
              objectFilename: storageObject.filename,
              objectKey: storageObject.objectKey,
              storageSizeBytes: storageObject.sizeBytes,
            }
          : {}),
        contentText: null,
        metadataJson: getBoundedRedactedJson(
          ctx,
          metadataWithJsonStatus,
          'Artifact metadata',
          MAX_METADATA_JSON_CHARS,
          preserveJson,
        ),
      },
      transaction: options.transaction,
    })) as ModelRecord;

    return {
      ...serializeArtifact(artifact),
      idempotent: false,
    };
  } catch (error) {
    if (storageObject) {
      await deleteSharedStorageObject({ app: ctx.app }, storageObject).catch(() => undefined);
    }
    throw error;
  }
}

async function registerArtifact(ctx: Context, runId: string) {
  const nodeId = await getCurrentNodeId(ctx);
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction, {
      allowExpiredLeaseStatuses: ['finalizing', 'stalled'],
      allowStaleLeaseVersion: true,
      allowedStatuses: OBSERVABILITY_WRITE_RUN_STATUSES,
    });
    if (!lease) {
      return null;
    }

    const result = await createRunArtifact(ctx, {
      runId,
      claimAttempt: lease.claimAttempt,
      values,
      transaction,
    });
    return result;
  });

  if (result) {
    ctx.body = result;
  }
}

async function registerSnapshot(ctx: Context, runId: string) {
  const nodeId = await getCurrentNodeId(ctx);
  const values = getBodyValues(ctx);
  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction, {
      allowExpiredLeaseStatuses: ['finalizing', 'stalled'],
      allowStaleLeaseVersion: true,
      allowedStatuses: OBSERVABILITY_WRITE_RUN_STATUSES,
    });
    if (!lease) {
      return null;
    }

    const snapshotType = getRequiredString(ctx, values.snapshotType, 'snapshotType');
    if (!SUPPORTED_SNAPSHOT_TYPES.has(snapshotType)) {
      ctx.throw(400, 'Unsupported snapshot type');
    }

    const snapshot = (await ctx.db.getRepository('agRunSnapshots').create({
      values: {
        id: randomUUID(),
        runId,
        claimAttempt: lease.claimAttempt,
        snapshotType,
        snapshotJson: getBoundedRedactedJson(ctx, values.snapshotJson, 'Snapshot JSON', MAX_SNAPSHOT_JSON_CHARS),
        metadataJson: getBoundedRedactedJson(ctx, values.metadataJson, 'Snapshot metadata', MAX_METADATA_JSON_CHARS),
        capturedAt: getDate(values.capturedAt) || new Date(),
      },
      transaction,
    })) as ModelRecord;

    return serializeModel(snapshot);
  });

  if (result) {
    ctx.body = result;
  }
}

async function listRunEvents(ctx: Context, runId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRawLogs,
    'Agent Gateway raw log read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'structuredEvents');

  const page = await findRunEventPage(ctx, runId);
  ctx.body = {
    rows: page.rows.map(serializeModel),
    pageSize: page.pageSize,
    beforeCursor: page.beforeCursor,
    afterCursor: page.afterCursor,
    hasMoreBefore: page.hasMoreBefore,
    hasMoreAfter: page.hasMoreAfter,
  };
}

async function listRunArtifacts(ctx: Context, runId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readArtifacts,
    'Agent Gateway artifact read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'artifacts');

  const { page, pageSize, offset } = getDetailPagination(ctx);
  const repository = ctx.db.getRepository('agRunArtifacts');
  const [artifacts, count] = await Promise.all([
    repository.find({
      filter: {
        runId,
      },
      sort: ['-createdAt', '-id'],
      offset,
      limit: pageSize,
      except: ['contentText'],
    }) as Promise<ModelRecord[]>,
    repository.count({
      filter: {
        runId,
      },
    }),
  ]);

  ctx.body = {
    rows: applyDeclaredArtifactGroups(artifacts.map(serializeArtifact), run),
    count,
    page,
    pageSize,
    totalPage: Math.ceil(count / pageSize),
  };
}

async function getRunArtifactContent(ctx: Context, runId: string, artifactId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readArtifacts,
    'Agent Gateway artifact read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'artifacts');

  const artifact = (await ctx.db.getRepository('agRunArtifacts').findOne({
    filter: {
      id: artifactId,
      runId,
    },
  })) as ModelRecord | null;
  if (!artifact) {
    ctx.throw(404, 'Artifact not found');
  }
  const storageId = getModelValue(artifact, 'storageId');
  if (storageId === null || storageId === undefined) {
    ctx.body = {
      id: artifactId,
      contentText: artifact.get('contentText') ?? null,
    };
    return;
  }

  let storageObject;
  try {
    storageObject = getArtifactStorageObject(artifact);
  } catch {
    ctx.throw(409, 'Artifact storage locator is invalid');
  }
  let content: Buffer;
  try {
    content = await readSharedStorageBuffer({ app: ctx.app }, storageObject, MAX_ARTIFACT_TEXT_BYTES);
  } catch {
    ctx.throw(409, 'Artifact storage content is unavailable');
  }
  const storageSha256 = getModelValue(artifact, 'storageSha256');
  if (
    content.byteLength !== storageObject.sizeBytes ||
    typeof storageSha256 !== 'string' ||
    !storageSha256 ||
    createHash('sha256').update(content).digest('hex') !== storageSha256
  ) {
    ctx.throw(409, 'Artifact storage integrity check failed');
  }
  ctx.body = {
    id: artifactId,
    contentText: content.toString('utf8'),
  };
}

async function listRunSnapshots(ctx: Context, runId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readArtifacts,
    'Agent Gateway artifact read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'artifacts');

  const { page, pageSize, offset } = getDetailPagination(ctx);
  const repository = ctx.db.getRepository('agRunSnapshots');
  const [snapshots, count] = await Promise.all([
    repository.find({
      filter: {
        runId,
      },
      sort: ['-capturedAt', '-createdAt', '-id'],
      offset,
      limit: pageSize,
    }) as Promise<ModelRecord[]>,
    repository.count({
      filter: {
        runId,
      },
    }),
  ]);

  ctx.body = {
    rows: snapshots.map(serializeModel),
    count,
    page,
    pageSize,
    totalPage: Math.ceil(count / pageSize),
  };
}

async function listRunApiCallLogs(ctx: Context, runId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRawLogs,
    'Agent Gateway raw log read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'structuredEvents');

  const { page, pageSize, offset } = getDetailPagination(ctx);
  const repository = ctx.db.getRepository('agApiCallLogs');
  const [apiCallLogs, count] = await Promise.all([
    repository.find({
      filter: {
        runId,
      },
      sort: ['-createdAt', '-id'],
      offset,
      limit: pageSize,
    }) as Promise<ModelRecord[]>,
    repository.count({
      filter: {
        runId,
      },
    }),
  ]);

  ctx.body = {
    rows: apiCallLogs.map(serializeModel),
    count,
    page,
    pageSize,
    totalPage: Math.ceil(count / pageSize),
  };
}

export function registerRunObservabilityRoutes(plugin: Plugin) {
  const getRunId = (ctx: Context) => {
    const runId = getActionTargetKey(ctx);
    if (!UUID_PATTERN.test(runId)) {
      ctx.throw(400, 'runId must be a valid UUID');
    }
    return runId;
  };
  plugin.app.resourceManager.registerActionHandlers({
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.appendRunEvents)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await appendEvent(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.registerRunArtifact)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await registerArtifact(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await registerSnapshot(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRunEvents)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await listRunEvents(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await listRunArtifacts(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await listRunSnapshots(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await listRunApiCallLogs(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const runId = getRunId(actionCtx);
      const artifactId = getString(getRecord(actionCtx.query).artifactId);
      if (!UUID_PATTERN.test(artifactId)) {
        actionCtx.throw(400, 'artifactId must be a valid UUID');
      }
      await getRunArtifactContent(actionCtx, runId, artifactId);
      await next();
    },
  });

  plugin.app.use(
    async (ctx: Context, next: Next) => {
      const standardCollectionAction = matchStandardCollectionAction(ctx.path, STANDARD_OBSERVABILITY_COLLECTIONS);
      if (standardCollectionAction) {
        if (ctx.method === 'GET' && DIRECT_OBSERVABILITY_READ_ACTIONS.has(standardCollectionAction.action)) {
          ctx.throw(403, 'Use Agent Gateway observability routes to read run data');
        }
        await requireManagePermission(ctx);
        await next();
        return;
      }

      await next();
    },
    {
      tag: 'agentGatewayRunObservabilityRoutes',
      after: 'agentGatewayRunLifecycleRoutes',
      before: 'dataSource',
    },
  );
}
