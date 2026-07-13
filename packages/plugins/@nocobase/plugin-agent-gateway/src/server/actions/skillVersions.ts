/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';

import {
  AGENT_GATEWAY_API_ACTIONS,
  AgentGatewaySkillVersionSummary,
  getAgentGatewayApiActionName,
  getAgentGatewayApiPath,
} from '../../shared/apiContract';
import {
  SKILL_ARCHIVE_LIMITS,
  getSkillArchiveErrorCode,
  persistSkillZipUpload,
  validateSkillZipArchive,
} from '../../node/skillArchive';
import { AGENT_GATEWAY_SKILL_CAPABILITY_HEADER, SKILL_CAPABILITY_REPLAY_POLICY } from '../../shared/skillCapability';
import { authenticateNodeToken } from '../security';
import {
  SharedStorageObject,
  copySharedStorageObject,
  deleteSharedStorageObject,
  materializeSharedStorageObjects,
  parseSharedStorageObject,
  putSharedStorageFile,
  readSharedStorageBuffer,
  serializeSharedStorageObject,
} from '../services/sharedFileStorage';
import { consumeCompletedUpload } from './fileUploads';
import { validateSkillDownloadCapability } from './skillCapabilities';
import {
  JsonRecord,
  ModelRecord,
  getBodyValues,
  asActionContext,
  getActionTargetKey,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  hasModelGetter,
  requireManagePermission,
} from './utils';

const MAX_SKILL_ZIP_UPLOAD_BYTES = 50 * 1024 * 1024;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;
const VERSION_STATUSES = new Set(['active', 'inactive', 'deprecated']);
const DEFAULT_SKILL_VERSION_PAGE_SIZE = 20;
const MAX_SKILL_VERSION_PAGE_SIZE = 100;

function hasOwnKey(value: JsonRecord, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function getRequiredString(ctx: Context, value: unknown, name: string) {
  const stringValue = getString(value);
  if (!stringValue) {
    ctx.throw(400, `${name} is required`);
  }
  return stringValue;
}

function decodeContentBase64(ctx: Context, value: unknown) {
  const contentBase64 = getRequiredString(ctx, value, 'contentBase64');
  const maxEncodedLength = Math.ceil(MAX_SKILL_ZIP_UPLOAD_BYTES / 3) * 4;
  if (contentBase64.length > maxEncodedLength || !BASE64_PATTERN.test(contentBase64)) {
    ctx.throw(400, 'contentBase64 must be canonical base64 ZIP bytes');
  }

  const content = Buffer.from(contentBase64, 'base64');
  if (!content.byteLength) {
    ctx.throw(400, 'Skill ZIP content cannot be empty');
  }
  if (content.byteLength > MAX_SKILL_ZIP_UPLOAD_BYTES) {
    ctx.throw(413, 'Skill ZIP upload is too large');
  }
  return content;
}

function getVersionStatus(ctx: Context, value: unknown, existingVersion?: ModelRecord | null) {
  const status =
    getString(value) || (existingVersion ? getModelString(existingVersion, 'status') : 'active') || 'active';
  if (!VERSION_STATUSES.has(status)) {
    ctx.throw(400, 'Skill version status must be active, inactive, or deprecated');
  }
  return status;
}

function getVersionMetadata(values: JsonRecord, source: JsonRecord, existingVersion?: ModelRecord | null) {
  const existingMetadata = existingVersion ? getRecord(getModelValue(existingVersion, 'metadataJson')) : {};
  const requestMetadata =
    hasOwnKey(values, 'metadataJson') || hasOwnKey(values, 'metadata')
      ? getRecord(values.metadataJson || values.metadata)
      : {};
  return {
    ...existingMetadata,
    ...requestMetadata,
    source,
  };
}

function getRequestOrigin(ctx: Context) {
  const origin = getString(ctx.origin);
  if (origin) {
    return origin.replace(/\/$/, '');
  }

  const forwardedProto = getString(ctx.get('x-forwarded-proto')).split(',')[0]?.trim();
  const protocol = forwardedProto || getString(ctx.protocol) || 'http';
  const host = getString(ctx.get('x-forwarded-host')) || getString(ctx.host) || getString(ctx.get('host'));
  if (!host) {
    ctx.throw(400, 'Cannot build Skill archive download URL without request host');
    throw new Error('Cannot build Skill archive download URL without request host');
  }
  return `${protocol}://${host}`.replace(/\/$/, '');
}

export interface SkillVersionSourceAccess {
  capabilityToken: string;
  runId: string;
  claimAttempt: number;
  expiresAt: Date;
}

function getArchiveDownloadUrl(
  ctx: Context,
  skillVersionId: string,
  source: JsonRecord,
  access?: SkillVersionSourceAccess,
) {
  const sha256 = getString(source.sha256);
  const query = new URLSearchParams();
  if (sha256) {
    query.set('sha256', sha256);
  }
  if (access) {
    query.set('runId', access.runId);
    query.set('claimAttempt', String(access.claimAttempt));
  }
  const serializedQuery = query.toString();
  const queryString = serializedQuery ? `?${serializedQuery}` : '';
  return `${getRequestOrigin(ctx)}${getAgentGatewayApiPath(
    AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion,
    skillVersionId,
  )}${queryString}`;
}

export function serializeSkillVersionSourceForNode(
  ctx: Context,
  skillVersionId: string,
  source: JsonRecord,
  access?: SkillVersionSourceAccess,
) {
  if (source.type === 'github') {
    return access
      ? {
          ...source,
          capabilityToken: access.capabilityToken,
          capabilityExpiresAt: access.expiresAt.toISOString(),
          capabilityReplayPolicy: SKILL_CAPABILITY_REPLAY_POLICY,
          runId: access.runId,
          claimAttempt: access.claimAttempt,
        }
      : source;
  }
  if (source.type !== 'zip') {
    return null;
  }

  const sha256 = getString(source.sha256);
  if (!sha256) {
    return null;
  }

  const publicSource: JsonRecord = {
    type: 'zip',
    sha256,
  };
  if (typeof source.sizeBytes === 'number') {
    publicSource.sizeBytes = source.sizeBytes;
  }
  const uploadedAt = getString(source.uploadedAt);
  if (uploadedAt) {
    publicSource.uploadedAt = uploadedAt;
  }
  if (access) {
    publicSource.capabilityToken = access.capabilityToken;
    publicSource.capabilityExpiresAt = access.expiresAt.toISOString();
    publicSource.capabilityReplayPolicy = SKILL_CAPABILITY_REPLAY_POLICY;
    publicSource.runId = access.runId;
    publicSource.claimAttempt = access.claimAttempt;
  }
  if (getString(source.objectKey) && (typeof source.storageId === 'string' || typeof source.storageId === 'number')) {
    publicSource.archiveUrl = getArchiveDownloadUrl(ctx, skillVersionId, source, access);
    if (access) {
      publicSource.auth = 'skill-capability';
    }
    return publicSource;
  }

  const archiveUrl = getString(source.archiveUrl);
  if (archiveUrl) {
    publicSource.archiveUrl = archiveUrl;
    return publicSource;
  }
  return null;
}

function applyOptionalJsonField(
  target: JsonRecord,
  targetKey: string,
  values: JsonRecord,
  valueKeys: string[],
  existingVersion?: ModelRecord | null,
) {
  const inputKey = valueKeys.find((key) => hasOwnKey(values, key));
  if (inputKey) {
    target[targetKey] = getRecord(values[inputKey]);
    return;
  }
  if (!existingVersion) {
    target[targetKey] = {};
  }
}

async function findSkillByKey(ctx: Context, skillKey: string, transaction: Transaction) {
  return (await ctx.db.getRepository('agSkills').findOne({
    filter: {
      skillKey,
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
}

async function upsertSkill(ctx: Context, values: JsonRecord, transaction: Transaction) {
  const skillKey = getRequiredString(ctx, values.skillKey, 'skillKey');
  const displayName = getString(values.displayName);
  const description = getString(values.description);
  const skillRepo = ctx.db.getRepository('agSkills');
  const existingSkill = await findSkillByKey(ctx, skillKey, transaction);
  if (existingSkill) {
    const updateValues: JsonRecord = {};
    if (displayName) {
      updateValues.displayName = displayName;
    }
    if (description) {
      updateValues.description = description;
    }
    if (Object.keys(updateValues).length) {
      await skillRepo.update({
        filterByTk: getModelTargetKey(existingSkill, 'id'),
        values: updateValues,
        transaction,
      });
    }
    return {
      skillId: String(getModelTargetKey(existingSkill, 'id')),
      skillKey,
    };
  }

  const skillId = randomUUID();
  await skillRepo.create({
    values: {
      id: skillId,
      skillKey,
      displayName: displayName || skillKey,
      description: description || null,
      status: 'active',
      metadataJson: {},
    },
    transaction,
  });
  return {
    skillId,
    skillKey,
  };
}

function getExistingSourceSha(existingVersion: ModelRecord | null) {
  const metadata = existingVersion ? getRecord(getModelValue(existingVersion, 'metadataJson')) : {};
  return getString(getRecord(metadata.source).sha256);
}

async function upsertSkillVersion(ctx: Context, values: JsonRecord, source: JsonRecord, transaction: Transaction) {
  const { skillId, skillKey } = await upsertSkill(ctx, values, transaction);
  const versionLabel = getRequiredString(ctx, values.versionLabel, 'versionLabel');
  const versionRepo = ctx.db.getRepository('agSkillVersions');
  const existingVersion = (await versionRepo.findOne({
    filter: {
      skillId,
      versionLabel,
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  const versionValues: JsonRecord = {
    skillId,
    versionLabel,
    status: getVersionStatus(ctx, values.status, existingVersion),
    metadataJson: getVersionMetadata(values, source, existingVersion),
  };
  applyOptionalJsonField(versionValues, 'manifestJson', values, ['manifestJson', 'manifest'], existingVersion);
  applyOptionalJsonField(versionValues, 'inputSchemaJson', values, ['inputSchemaJson', 'inputSchema'], existingVersion);
  applyOptionalJsonField(
    versionValues,
    'outputSchemaJson',
    values,
    ['outputSchemaJson', 'outputSchema'],
    existingVersion,
  );

  const wasSameSource = getExistingSourceSha(existingVersion) === getString(source.sha256);
  if (existingVersion) {
    await versionRepo.update({
      filterByTk: getModelTargetKey(existingVersion, 'id'),
      values: versionValues,
      transaction,
    });
    return {
      skillId,
      skillKey,
      skillVersionId: String(getModelTargetKey(existingVersion, 'id')),
      versionLabel,
      status: String(versionValues.status),
      source: serializeSkillVersionSourceForNode(ctx, String(getModelTargetKey(existingVersion, 'id')), source),
      idempotent: wasSameSource,
    };
  }

  const skillVersionId = randomUUID();
  await versionRepo.create({
    values: {
      id: skillVersionId,
      ...versionValues,
    },
    transaction,
  });
  return {
    skillId,
    skillKey,
    skillVersionId,
    versionLabel,
    status: String(versionValues.status),
    source: serializeSkillVersionSourceForNode(ctx, skillVersionId, source),
    idempotent: false,
  };
}

function getStorageHost(ctx: Context) {
  return { app: ctx.app };
}

function buildSkillZipSource(locator: SharedStorageObject, sha256: string, sizeBytes: number): JsonRecord {
  return {
    type: 'zip',
    ...serializeSharedStorageObject(locator),
    sha256,
    sizeBytes,
    uploadedAt: new Date().toISOString(),
  };
}

function parseSkillZipSource(source: JsonRecord) {
  return parseSharedStorageObject({
    storageId: source.storageId,
    objectPath: source.objectPath,
    objectFilename: source.objectFilename,
    objectKey: source.objectKey,
    sizeBytes: source.sizeBytes,
    mimetype: 'application/zip',
  });
}

async function solidifySkillArchive(ctx: Context, source: SharedStorageObject, sha256: string) {
  return await copySharedStorageObject(getStorageHost(ctx), source, {
    filename: `${sha256}.zip`,
    mimetype: 'application/zip',
    subPath: `agent-gateway/skills/${sha256.slice(0, 2)}`,
  });
}

async function persistValidatedSkillZipUpload(ctx: Context, content: Buffer) {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-gateway-skill-upload-'));
  let stagedObject: SharedStorageObject | undefined;
  try {
    let persisted: Awaited<ReturnType<typeof persistSkillZipUpload>>;
    try {
      persisted = await persistSkillZipUpload({
        content,
        uploadDir: temporaryDirectory,
        validateArchive: true,
      });
    } catch (error) {
      const errorCode = getSkillArchiveErrorCode(error);
      ctx.throw(400, errorCode);
      throw new Error(errorCode);
    }
    stagedObject = await putSharedStorageFile(getStorageHost(ctx), {
      filePath: persisted.archivePath,
      subPath: `agent-gateway/skills/staging/${randomUUID()}`,
    });
    const solidified = await solidifySkillArchive(ctx, stagedObject, persisted.sha256);
    return buildSkillZipSource(solidified, persisted.sha256, persisted.sizeBytes);
  } finally {
    if (stagedObject) {
      await deleteSharedStorageObject(getStorageHost(ctx), stagedObject).catch(() => undefined);
    }
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function uploadSkillVersionZip(ctx: Context) {
  await requireManagePermission(ctx);
  const values = getBodyValues(ctx);
  const content = decodeContentBase64(ctx, values.contentBase64);
  const uploadedSource = await persistValidatedSkillZipUpload(ctx, content);
  const source: JsonRecord = {
    ...uploadedSource,
  };

  try {
    ctx.body = await ctx.db.sequelize.transaction(async (transaction) => {
      return await upsertSkillVersion(ctx, values, source, transaction);
    });
  } catch (error) {
    await deleteSharedStorageObject(getStorageHost(ctx), parseSkillZipSource(source)).catch(() => undefined);
    throw error;
  }
}

async function createSkillVersionFromUpload(ctx: Context) {
  await requireManagePermission(ctx);
  const values = getBodyValues(ctx);
  const uploadId = getRequiredString(ctx, values.uploadId, 'uploadId');
  const completedUpload = await consumeCompletedUpload(ctx, uploadId, 'skill-version');
  const materialized = await materializeSharedStorageObjects(
    getStorageHost(ctx),
    [completedUpload.storageObject],
    SKILL_ARCHIVE_LIMITS.maxDownloadBytes,
  );
  if (materialized.sha256 !== completedUpload.sha256 || materialized.sizeBytes !== completedUpload.sizeBytes) {
    await materialized.cleanup();
    ctx.throw(409, 'Upload storage object does not match its declared digest');
  }
  try {
    await validateSkillZipArchive(materialized.filePath);
  } catch (error) {
    ctx.throw(400, getSkillArchiveErrorCode(error));
  } finally {
    await materialized.cleanup();
  }

  const solidifiedObject = await solidifySkillArchive(ctx, completedUpload.storageObject, completedUpload.sha256);
  const source = buildSkillZipSource(solidifiedObject, completedUpload.sha256, completedUpload.sizeBytes);

  try {
    ctx.body = await ctx.db.sequelize.transaction(async (transaction) => {
      const result = await upsertSkillVersion(ctx, values, source, transaction);
      await ctx.db.getRepository('agFileUploads').update({
        filterByTk: uploadId,
        values: { status: 'consumed' },
        transaction,
      });
      return result;
    });
  } catch (error) {
    await deleteSharedStorageObject(getStorageHost(ctx), solidifiedObject).catch(() => undefined);
    throw error;
  }
  await deleteSharedStorageObject(getStorageHost(ctx), completedUpload.storageObject);
}

function getDateISOString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const text = getString(value);
  if (!text) {
    return null;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getRelatedSkillString(skillVersion: ModelRecord, key: string) {
  const skill = getModelValue(skillVersion, 'skill');
  if (hasModelGetter(skill)) {
    return getModelString(skill, key);
  }
  return getString(getRecord(skill)[key]);
}

function getRelatedSkillTargetKey(skillVersion: ModelRecord, key: string) {
  const skill = getModelValue(skillVersion, 'skill');
  if (hasModelGetter(skill)) {
    const value = getModelTargetKey(skill, key);
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }
  const value = getRecord(skill)[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function serializeSkillVersionForManagement(skillVersion: ModelRecord): AgentGatewaySkillVersionSummary {
  const metadata = getRecord(getModelValue(skillVersion, 'metadataJson'));
  const source = getRecord(metadata.source);
  return {
    id: String(getModelTargetKey(skillVersion, 'id')),
    skillVersionId: String(getModelTargetKey(skillVersion, 'id')),
    skillId: getRelatedSkillTargetKey(skillVersion, 'id') || getModelString(skillVersion, 'skillId') || null,
    skillKey: getRelatedSkillString(skillVersion, 'skillKey') || null,
    displayName: getRelatedSkillString(skillVersion, 'displayName') || null,
    skillStatus: getRelatedSkillString(skillVersion, 'status') || null,
    versionLabel: getModelString(skillVersion, 'versionLabel'),
    status: getModelString(skillVersion, 'status') || 'active',
    sourceType: getString(source.type) || null,
    sourceSha256: getString(source.sha256) || null,
    sourceSizeBytes: typeof source.sizeBytes === 'number' ? source.sizeBytes : null,
    sourceUploadedAt: getString(source.uploadedAt) || null,
    createdAt: getDateISOString(getModelValue(skillVersion, 'createdAt')),
    updatedAt: getDateISOString(getModelValue(skillVersion, 'updatedAt')),
  };
}

async function listSkillVersions(ctx: Context) {
  await requireManagePermission(ctx);
  const query = getRecord(ctx.query);
  const requestedPage = Number(query.page || 1);
  const requestedPageSize = Number(query.pageSize || query.limit || DEFAULT_SKILL_VERSION_PAGE_SIZE);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize =
    Number.isInteger(requestedPageSize) && requestedPageSize > 0
      ? Math.min(requestedPageSize, MAX_SKILL_VERSION_PAGE_SIZE)
      : DEFAULT_SKILL_VERSION_PAGE_SIZE;
  const repository = ctx.db.getRepository('agSkillVersions');
  const [count, skillVersions] = await Promise.all([
    repository.count(),
    repository.find({
      appends: ['skill'],
      sort: ['-createdAt'],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }) as Promise<ModelRecord[]>,
  ]);
  ctx.body = {
    rows: skillVersions.map(serializeSkillVersionForManagement),
    count,
    page,
    pageSize,
    totalPage: Math.ceil(count / pageSize),
  };
}

async function getSkillVersion(ctx: Context, skillVersionId: string) {
  await requireManagePermission(ctx);
  const skillVersion = (await ctx.db.getRepository('agSkillVersions').findOne({
    filterByTk: skillVersionId,
    appends: ['skill'],
  })) as ModelRecord | null;
  if (!skillVersion) {
    ctx.throw(404, 'Skill version not found');
  }
  ctx.body = serializeSkillVersionForManagement(skillVersion);
}

async function downloadSkillVersionArchive(ctx: Context, skillVersionId: string) {
  const auth = await authenticateNodeToken(ctx);
  const requested = getRecord(ctx.query);
  const capabilityToken = getString(ctx.get(AGENT_GATEWAY_SKILL_CAPABILITY_HEADER));
  const runId = getString(requested.runId);
  const claimAttempt = Number(requested.claimAttempt);
  const requestedSha256 = getString(requested.sha256);
  const notFound = () => ctx.throw(404, 'Skill version archive not found');
  if (!capabilityToken || !runId || !Number.isInteger(claimAttempt) || claimAttempt <= 0 || !requestedSha256) {
    notFound();
    return;
  }

  const authorized = await validateSkillDownloadCapability(ctx, {
    capabilityToken,
    nodeId: String(auth.subject.nodeId),
    runId,
    claimAttempt,
    skillVersionId,
    sha256: requestedSha256,
  });
  if (!authorized) {
    notFound();
    return;
  }

  const skillVersion = (await ctx.db.getRepository('agSkillVersions').findOne({
    filterByTk: skillVersionId,
  })) as ModelRecord | null;
  if (!skillVersion) {
    notFound();
    return;
  }

  const metadata = getRecord(getModelValue(skillVersion, 'metadataJson'));
  const source = getRecord(metadata.source);
  if (source.type !== 'zip') {
    ctx.throw(404, 'Skill version archive not found');
    return;
  }

  const sha256 = getString(source.sha256);
  if (!SHA256_PATTERN.test(sha256) || requestedSha256 !== sha256) {
    notFound();
    return;
  }

  let storageObject: SharedStorageObject;
  try {
    storageObject = parseSkillZipSource(source);
  } catch {
    notFound();
    return;
  }
  const content = await readSharedStorageBuffer(
    getStorageHost(ctx),
    storageObject,
    SKILL_ARCHIVE_LIMITS.maxDownloadBytes,
  ).catch(() => null);
  if (!content || content.byteLength !== storageObject.sizeBytes) {
    notFound();
    return;
  }
  const actualSha256 = createHash('sha256').update(content).digest('hex');
  if (actualSha256 !== sha256) {
    notFound();
    return;
  }

  ctx.set('Content-Type', 'application/zip');
  ctx.set('Content-Length', String(content.byteLength));
  ctx.set('Content-Disposition', `attachment; filename="${sha256}.zip"`);
  ctx.body = content;
}

export function registerSkillVersionRoutes(plugin: Plugin) {
  plugin.app.resourceManager.registerActionHandlers({
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion)]: async (ctx, next) => {
      await uploadSkillVersionZip(asActionContext(ctx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload)]: async (ctx, next) => {
      await createSkillVersionFromUpload(asActionContext(ctx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listSkillVersions)]: async (ctx, next) => {
      await listSkillVersions(asActionContext(ctx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getSkillVersion)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await getSkillVersion(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await downloadSkillVersionArchive(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
  });
}
