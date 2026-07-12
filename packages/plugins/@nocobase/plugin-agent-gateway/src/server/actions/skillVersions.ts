/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { storagePathJoin } from '@nocobase/utils';
import { Transaction } from 'sequelize';

import { persistSkillZipUpload, validateSkillZipArchive } from '../../daemon/skillSync';
import { authenticateNodeToken } from '../security';
import { consumeCompletedUpload } from './fileUploads';
import {
  AGENT_GATEWAY_API_RESOURCE,
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

function hasOwnKey(value: JsonRecord, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isWithinPath(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function sha256File(filePath: string) {
  const hash = createHash('sha256');
  const content = await fs.readFile(filePath);
  hash.update(content);
  return hash.digest('hex');
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

function getArchiveDownloadUrl(ctx: Context, skillVersionId: string, source: JsonRecord) {
  const sha256 = getString(source.sha256);
  const query = sha256 ? `?sha256=${encodeURIComponent(sha256)}` : '';
  return `${getRequestOrigin(ctx)}/api/${AGENT_GATEWAY_API_RESOURCE}:downloadSkillVersion/${encodeURIComponent(
    skillVersionId,
  )}${query}`;
}

export function serializeSkillVersionSourceForNode(ctx: Context, skillVersionId: string, source: JsonRecord) {
  if (source.type === 'github') {
    return source;
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
  if (getString(source.archivePath)) {
    publicSource.archiveUrl = getArchiveDownloadUrl(ctx, skillVersionId, source);
    publicSource.auth = 'node-token';
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

async function persistValidatedSkillZipUpload(ctx: Context, content: Buffer) {
  try {
    return await persistSkillZipUpload({
      content,
      uploadDir: storagePathJoin('agent-gateway', 'skill-uploads'),
      validateArchive: true,
    });
  } catch {
    ctx.throw(400, 'Invalid Skill ZIP archive');
    throw new Error('Invalid Skill ZIP archive');
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

  ctx.body = await ctx.db.sequelize.transaction(async (transaction) => {
    return await upsertSkillVersion(ctx, values, source, transaction);
  });
}

async function createSkillVersionFromUpload(ctx: Context) {
  await requireManagePermission(ctx);
  const values = getBodyValues(ctx);
  const uploadId = getRequiredString(ctx, values.uploadId, 'uploadId');
  const completedUpload = await consumeCompletedUpload(ctx, uploadId, 'skill-version');
  try {
    await validateSkillZipArchive(completedUpload.storagePath);
  } catch {
    ctx.throw(400, 'Invalid Skill ZIP archive');
  }

  const uploadDir = storagePathJoin('agent-gateway', 'skill-uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  const archivePath = path.join(uploadDir, `${completedUpload.sha256}.zip`);
  await fs.copyFile(completedUpload.storagePath, archivePath);
  await fs.chmod(archivePath, 0o600);
  const source: JsonRecord = {
    type: 'zip',
    archivePath,
    sha256: completedUpload.sha256,
    sizeBytes: completedUpload.sizeBytes,
    uploadedAt: new Date().toISOString(),
  };

  ctx.body = await ctx.db.sequelize.transaction(async (transaction) => {
    const result = await upsertSkillVersion(ctx, values, source, transaction);
    await ctx.db.getRepository('agFileUploads').update({
      filterByTk: uploadId,
      values: { status: 'consumed' },
      transaction,
    });
    return result;
  });
  await fs.rm(completedUpload.storagePath, { force: true });
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

function serializeSkillVersionForManagement(skillVersion: ModelRecord) {
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
  const skillVersions = (await ctx.db.getRepository('agSkillVersions').find({
    appends: ['skill'],
    sort: ['-createdAt'],
  })) as ModelRecord[];
  ctx.body = skillVersions.map(serializeSkillVersionForManagement);
}

async function downloadSkillVersionArchive(ctx: Context, skillVersionId: string) {
  await authenticateNodeToken(ctx);
  const skillVersion = (await ctx.db.getRepository('agSkillVersions').findOne({
    filterByTk: skillVersionId,
  })) as ModelRecord | null;
  if (!skillVersion) {
    ctx.throw(404, 'Skill version not found');
    return;
  }

  const metadata = getRecord(getModelValue(skillVersion, 'metadataJson'));
  const source = getRecord(metadata.source);
  if (source.type !== 'zip') {
    ctx.throw(404, 'Skill version archive not found');
    return;
  }

  const archivePath = getString(source.archivePath);
  const sha256 = getString(source.sha256);
  const requestedSha256 = getString(getRecord(ctx.query).sha256);
  if (!archivePath || !SHA256_PATTERN.test(sha256) || (requestedSha256 && requestedSha256 !== sha256)) {
    ctx.throw(404, 'Skill version archive not found');
    return;
  }

  const uploadDir = storagePathJoin('agent-gateway', 'skill-uploads');
  const [realUploadDir, realArchivePath] = await Promise.all([
    fs.realpath(uploadDir).catch(() => null),
    fs.realpath(archivePath).catch(() => null),
  ]);
  if (!realUploadDir || !realArchivePath || !isWithinPath(realUploadDir, realArchivePath)) {
    ctx.throw(404, 'Skill version archive not found');
    return;
  }

  const stat = await fs.stat(realArchivePath).catch(() => null);
  if (!stat?.isFile()) {
    ctx.throw(404, 'Skill version archive not found');
    return;
  }

  const actualSha256 = await sha256File(realArchivePath).catch(() => null);
  if (actualSha256 !== sha256) {
    ctx.throw(404, 'Skill version archive not found');
    return;
  }

  ctx.set('Content-Type', 'application/zip');
  ctx.set('Content-Length', String(stat.size));
  ctx.set('Content-Disposition', `attachment; filename="${sha256}.zip"`);
  ctx.body = createReadStream(realArchivePath);
}

export function registerSkillVersionRoutes(plugin: Plugin) {
  plugin.app.resourceManager.registerActionHandlers({
    [`${AGENT_GATEWAY_API_RESOURCE}:uploadSkillVersion`]: async (ctx, next) => {
      await uploadSkillVersionZip(asActionContext(ctx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:createSkillVersionFromUpload`]: async (ctx, next) => {
      await createSkillVersionFromUpload(asActionContext(ctx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:listSkillVersions`]: async (ctx, next) => {
      await listSkillVersions(asActionContext(ctx));
      await next();
    },
    [`${AGENT_GATEWAY_API_RESOURCE}:downloadSkillVersion`]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await downloadSkillVersionArchive(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
  });
}
