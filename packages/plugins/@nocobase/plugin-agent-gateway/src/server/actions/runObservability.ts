/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';

import {
  AGENT_GATEWAY_ACTIONS,
  authenticateNodeToken,
  redactEventPayload,
  redactObservabilityText,
  redactSnapshotJson,
} from '../security';
import {
  API_PREFIX,
  JsonRecord,
  ModelRecord,
  getBodyValues,
  getDate,
  getModelJson,
  getModelNumber,
  getRecord,
  getString,
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

const MAX_EVENT_MESSAGE_LENGTH = 4000;
const MAX_EVENT_PAYLOAD_CHARS = 16000;
const MAX_ARTIFACT_TEXT_BYTES = COMMAND_CONTENT_JSON_LIMIT_CHARS;
const MAX_METADATA_JSON_CHARS = 16 * 1024;
const MAX_SNAPSHOT_JSON_CHARS = 64 * 1024;
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

function getPayloadValue(values: JsonRecord, canonicalKey: string, aliasKey: string) {
  return Object.prototype.hasOwnProperty.call(values, canonicalKey) ? values[canonicalKey] : values[aliasKey];
}

function serializeModel(model: ModelRecord) {
  return getModelJson(model);
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
        eventType: getRequiredString(ctx, values.eventType || values.type, 'eventType'),
        message: getEventMessage(ctx, values.message),
        payloadJson: getRedactedPayload(ctx, getPayloadValue(values, 'payloadJson', 'payload')),
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

    const artifactKey = getString(values.artifactKey) || null;
    const artifactRepo = ctx.db.getRepository('agRunArtifacts');
    if (artifactKey) {
      const existingArtifact = (await artifactRepo.findOne({
        filter: {
          runId,
          claimAttempt: lease.claimAttempt,
          artifactKey,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord | null;
      if (existingArtifact) {
        return {
          ...serializeModel(existingArtifact),
          idempotent: true,
        };
      }
    }

    const mimeType = getString(values.mimeType) || 'text/plain';
    const rawMetadata = getRecord(getPayloadValue(values, 'metadataJson', 'metadata'));
    const metadataWithJsonStatus = {
      ...rawMetadata,
    };
    const { contentText, computedSizeBytes, previewBytes, jsonValid } = getArtifactContentText(
      ctx,
      values.contentText,
      mimeType,
    );
    if (jsonValid !== null) {
      metadataWithJsonStatus.jsonValid = jsonValid;
    }
    const providedSizeBytes = getOptionalNonNegativeInteger(ctx, values.sizeBytes, 'sizeBytes');
    const metadataOriginalSizeBytes = getOptionalNonNegativeInteger(
      ctx,
      rawMetadata.originalSizeBytes,
      'metadata.originalSizeBytes',
    );
    const metadataUploadedBytes = getOptionalNonNegativeInteger(
      ctx,
      rawMetadata.uploadedBytes,
      'metadata.uploadedBytes',
    );
    const artifact = (await artifactRepo.create({
      values: {
        id: randomUUID(),
        runId,
        claimAttempt: lease.claimAttempt,
        artifactKey,
        artifactType: getRequiredString(ctx, values.artifactType || values.type, 'artifactType'),
        mimeType,
        sizeBytes: providedSizeBytes ?? computedSizeBytes,
        originalSizeBytes: metadataOriginalSizeBytes ?? providedSizeBytes ?? computedSizeBytes,
        previewBytes: metadataUploadedBytes ?? previewBytes,
        truncated: rawMetadata.truncated === true,
        storageMode: getString(rawMetadata.storageMode) || (rawMetadata.truncated === true ? 'preview' : 'inline'),
        contentSha256: getString(rawMetadata.sha256) || null,
        contentText,
        metadataJson: getBoundedRedactedJson(
          ctx,
          metadataWithJsonStatus,
          'Artifact metadata',
          MAX_METADATA_JSON_CHARS,
          preserveJson,
        ),
      },
      transaction,
    })) as ModelRecord;

    return {
      ...serializeModel(artifact),
      idempotent: false,
    };
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

    const snapshotType = getRequiredString(ctx, values.snapshotType || values.type, 'snapshotType');
    if (!SUPPORTED_SNAPSHOT_TYPES.has(snapshotType)) {
      ctx.throw(400, 'Unsupported snapshot type');
    }

    const snapshot = (await ctx.db.getRepository('agRunSnapshots').create({
      values: {
        id: randomUUID(),
        runId,
        claimAttempt: lease.claimAttempt,
        snapshotType,
        snapshotJson: getBoundedRedactedJson(
          ctx,
          getPayloadValue(values, 'snapshotJson', 'snapshot'),
          'Snapshot JSON',
          MAX_SNAPSHOT_JSON_CHARS,
        ),
        metadataJson: getBoundedRedactedJson(
          ctx,
          getPayloadValue(values, 'metadataJson', 'metadata'),
          'Snapshot metadata',
          MAX_METADATA_JSON_CHARS,
        ),
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

  const events = (await ctx.db.getRepository('agRunEvents').find({
    filter: {
      runId,
    },
    sort: ['claimAttempt', 'source', 'sequence', 'createdAt'],
  })) as ModelRecord[];

  ctx.body = events.map(serializeModel);
}

async function listRunArtifacts(ctx: Context, runId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readArtifacts,
    'Agent Gateway artifact read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'artifacts');

  const artifacts = (await ctx.db.getRepository('agRunArtifacts').find({
    filter: {
      runId,
    },
    sort: ['claimAttempt', 'artifactKey', 'createdAt'],
  })) as ModelRecord[];

  ctx.body = artifacts.map(serializeModel);
}

async function listRunSnapshots(ctx: Context, runId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readArtifacts,
    'Agent Gateway artifact read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'artifacts');

  const snapshots = (await ctx.db.getRepository('agRunSnapshots').find({
    filter: {
      runId,
    },
    sort: ['capturedAt', 'createdAt'],
  })) as ModelRecord[];

  ctx.body = snapshots.map(serializeModel);
}

async function listRunApiCallLogs(ctx: Context, runId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRawLogs,
    'Agent Gateway raw log read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'structuredEvents');

  const apiCallLogs = (await ctx.db.getRepository('agApiCallLogs').find({
    filter: {
      runId,
    },
    sort: ['createdAt'],
  })) as ModelRecord[];

  ctx.body = apiCallLogs.map(serializeModel);
}

export function registerRunObservabilityRoutes(plugin: Plugin) {
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

      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }

      const routePath = ctx.path.slice(API_PREFIX.length);
      const observationMatch = routePath.match(
        /^\/runs\/([^/]+)\/(events:append|artifacts:register|snapshots:register)$/,
      );
      const observationReadMatch = routePath.match(
        /^\/runs\/([^/]+)\/(events:list|artifacts:list|snapshots:list|api-call-logs:list)$/,
      );
      if (ctx.method === 'GET' && observationReadMatch) {
        const [, runId, action] = observationReadMatch;
        if (!UUID_PATTERN.test(runId)) {
          ctx.throw(400, 'runId must be a valid UUID');
        }
        if (action === 'events:list') {
          await listRunEvents(ctx, runId);
          return;
        }
        if (action === 'artifacts:list') {
          await listRunArtifacts(ctx, runId);
          return;
        }
        if (action === 'snapshots:list') {
          await listRunSnapshots(ctx, runId);
          return;
        }
        if (action === 'api-call-logs:list') {
          await listRunApiCallLogs(ctx, runId);
          return;
        }
      }

      if (ctx.method === 'POST' && observationMatch) {
        const [, runId, action] = observationMatch;
        if (!UUID_PATTERN.test(runId)) {
          ctx.throw(400, 'runId must be a valid UUID');
        }
        if (action === 'events:append') {
          await appendEvent(ctx, runId);
          return;
        }
        if (action === 'artifacts:register') {
          await registerArtifact(ctx, runId);
          return;
        }
        if (action === 'snapshots:register') {
          await registerSnapshot(ctx, runId);
          return;
        }
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
