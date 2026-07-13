/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';
import { constants, promises as fs } from 'fs';

import { Context } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionName } from '../../shared/apiContract';
import {
  UnsafeFileUploadStoragePathError,
  createFileUploadStorageFile,
  resolveFileUploadStoragePath,
} from '../services/fileUploadStorage';
import {
  AGENT_GATEWAY_ERROR_CODES,
  JsonRecord,
  ModelRecord,
  asActionContext,
  getActionTargetKey,
  getBodyValues,
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  requireManagePermission,
} from './utils';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const MAX_CHUNK_BYTES = 1024 * 1024;
const UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const PURPOSES = new Set(['skill-version', 'run-artifact']);

async function hashFile(filePath: string) {
  const hash = createHash('sha256');
  const handle = await fs.open(filePath, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let position = 0;
    let bytesRead = 0;
    do {
      ({ bytesRead } = await handle.read(buffer, 0, buffer.byteLength, position));
      hash.update(buffer.subarray(0, bytesRead));
      position += bytesRead;
    } while (bytesRead > 0);
  } finally {
    await handle.close();
  }
  return hash.digest('hex');
}

async function getSafeUploadStoragePath(ctx: Context, upload: ModelRecord) {
  try {
    return await resolveFileUploadStoragePath(getModelString(upload, 'storagePath'));
  } catch (error) {
    if (error instanceof UnsafeFileUploadStoragePathError || (error as NodeJS.ErrnoException).code === 'ENOENT') {
      ctx.throw(409, {
        code: AGENT_GATEWAY_ERROR_CODES.unsafeFileUploadStorageLocator,
        message: ctx.t('Upload storage locator is invalid', {
          ns: '@nocobase/plugin-agent-gateway',
        }),
      });
    }
    throw error;
  }
}

async function getUpload(ctx: Context, uploadId: string, transaction?: Transaction) {
  const upload = (await ctx.db.getRepository('agFileUploads').findOne({
    filterByTk: uploadId,
    transaction,
    lock: transaction?.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!upload) {
    ctx.throw(404, 'Upload not found');
  }
  return upload;
}

function serializeUpload(upload: ModelRecord) {
  return {
    id: String(getModelTargetKey(upload, 'id')),
    purpose: getModelString(upload, 'purpose'),
    status: getModelString(upload, 'status'),
    fileName: getModelString(upload, 'fileName') || null,
    mimeType: getModelString(upload, 'mimeType') || null,
    expectedBytes: getModelNumber(upload, 'expectedBytes'),
    receivedBytes: getModelNumber(upload, 'receivedBytes'),
    sha256: getModelString(upload, 'sha256') || null,
    expiresAt: getModelValue(upload, 'expiresAt'),
  };
}

async function initUpload(ctx: Context) {
  await requireManagePermission(ctx);
  const values = getBodyValues(ctx);
  const purpose = getString(values.purpose);
  const expectedBytes = Number(values.sizeBytes);
  if (!PURPOSES.has(purpose)) {
    ctx.throw(400, 'Unsupported upload purpose');
  }
  if (!Number.isInteger(expectedBytes) || expectedBytes <= 0 || expectedBytes > MAX_UPLOAD_BYTES) {
    ctx.throw(413, `Upload size must be between 1 and ${MAX_UPLOAD_BYTES} bytes`);
  }
  const id = randomUUID();
  const storagePath = await createFileUploadStorageFile(id);
  let upload: ModelRecord;
  try {
    upload = (await ctx.db.getRepository('agFileUploads').create({
      values: {
        id,
        purpose,
        status: 'pending',
        fileName: getString(values.fileName) || null,
        mimeType: getString(values.mimeType) || null,
        expectedBytes,
        receivedBytes: 0,
        storagePath,
        expiresAt: new Date(Date.now() + UPLOAD_TTL_MS),
        metadataJson: getRecord(values.metadata),
      },
    })) as ModelRecord;
  } catch (error) {
    await fs.rm(storagePath, { force: true });
    throw error;
  }
  ctx.body = { ...serializeUpload(upload), chunkSize: MAX_CHUNK_BYTES };
}

async function appendUpload(ctx: Context, uploadId: string) {
  await requireManagePermission(ctx);
  const values = getBodyValues(ctx);
  const offset = Number(values.offset);
  const contentBase64 = getString(values.contentBase64);
  if (!Number.isInteger(offset) || offset < 0 || !contentBase64 || !BASE64_PATTERN.test(contentBase64)) {
    ctx.throw(400, 'Invalid upload chunk');
  }
  const content = Buffer.from(contentBase64, 'base64');
  if (!content.byteLength || content.byteLength > MAX_CHUNK_BYTES) {
    ctx.throw(413, `Upload chunk must not exceed ${MAX_CHUNK_BYTES} bytes`);
  }
  ctx.body = await ctx.db.sequelize.transaction(async (transaction) => {
    const upload = await getUpload(ctx, uploadId, transaction);
    if (getModelString(upload, 'status') !== 'pending') {
      ctx.throw(409, 'Upload is not pending');
    }
    const receivedBytes = getModelNumber(upload, 'receivedBytes');
    const expectedBytes = getModelNumber(upload, 'expectedBytes');
    const storagePath = await getSafeUploadStoragePath(ctx, upload);
    if (offset < receivedBytes && offset + content.byteLength <= receivedBytes) {
      const handle = await fs.open(storagePath, constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const existing = Buffer.allocUnsafe(content.byteLength);
        await handle.read(existing, 0, existing.byteLength, offset);
        if (existing.equals(content)) {
          return { uploadId, receivedBytes, idempotent: true };
        }
      } finally {
        await handle.close();
      }
    }
    if (offset !== receivedBytes) {
      ctx.throw(409, `Upload offset mismatch; expected ${receivedBytes}`);
    }
    if (receivedBytes + content.byteLength > expectedBytes) {
      ctx.throw(413, 'Upload exceeds the declared size');
    }
    const handle = await fs.open(storagePath, constants.O_RDWR | constants.O_NOFOLLOW);
    try {
      await handle.write(content, 0, content.byteLength, offset);
      await handle.sync();
    } finally {
      await handle.close();
    }
    const nextReceivedBytes = receivedBytes + content.byteLength;
    try {
      await ctx.db.getRepository('agFileUploads').update({
        filterByTk: uploadId,
        values: { receivedBytes: nextReceivedBytes },
        transaction,
      });
    } catch (error) {
      const truncateHandle = await fs.open(storagePath, constants.O_WRONLY | constants.O_NOFOLLOW);
      try {
        await truncateHandle.truncate(receivedBytes);
      } finally {
        await truncateHandle.close();
      }
      throw error;
    }
    return { uploadId, receivedBytes: nextReceivedBytes, idempotent: false };
  });
}

async function completeUpload(ctx: Context, uploadId: string) {
  await requireManagePermission(ctx);
  const upload = await getUpload(ctx, uploadId);
  if (getModelString(upload, 'status') !== 'pending') {
    ctx.throw(409, 'Upload is not pending');
  }
  if (getModelNumber(upload, 'receivedBytes') !== getModelNumber(upload, 'expectedBytes')) {
    ctx.throw(409, 'Upload is incomplete');
  }
  const storagePath = await getSafeUploadStoragePath(ctx, upload);
  const sha256 = await hashFile(storagePath);
  await ctx.db.getRepository('agFileUploads').update({
    filterByTk: uploadId,
    values: { status: 'completed', sha256 },
  });
  ctx.body = { ...serializeUpload(upload), status: 'completed', sha256 };
}

async function abortUpload(ctx: Context, uploadId: string) {
  await requireManagePermission(ctx);
  const upload = await getUpload(ctx, uploadId);
  const storagePath = await getSafeUploadStoragePath(ctx, upload);
  await fs.rm(storagePath, { force: true });
  await ctx.db.getRepository('agFileUploads').destroy({ filterByTk: uploadId });
  ctx.body = { uploadId, aborted: true };
}

export async function consumeCompletedUpload(ctx: Context, uploadId: string, purpose: string) {
  const upload = await getUpload(ctx, uploadId);
  if (getModelString(upload, 'status') !== 'completed' || getModelString(upload, 'purpose') !== purpose) {
    ctx.throw(409, 'Upload is not ready for this operation');
  }
  const storagePath = await getSafeUploadStoragePath(ctx, upload);
  return {
    upload,
    storagePath,
    sha256: getModelString(upload, 'sha256'),
    sizeBytes: getModelNumber(upload, 'expectedBytes'),
  };
}

export async function cleanupExpiredFileUploads(plugin: Pick<Plugin, 'app' | 'db'>, now = new Date()) {
  if (!plugin.db.hasCollection('agFileUploads') || !(await plugin.db.collectionExistsInDb('agFileUploads'))) {
    return 0;
  }
  const repository = plugin.db.getRepository('agFileUploads');
  const uploads = (await repository.find({
    filter: {
      expiresAt: {
        $lt: now,
      },
    },
    fields: ['id', 'storagePath'],
    sort: ['expiresAt', 'id'],
    limit: 1000,
  })) as ModelRecord[];
  for (const upload of uploads) {
    try {
      const storagePath = await resolveFileUploadStoragePath(getModelString(upload, 'storagePath'));
      await fs.rm(storagePath, { force: true });
    } catch (error) {
      plugin.app.logger?.warn?.('Agent Gateway skipped unsafe file upload cleanup locator', {
        uploadId: getModelTargetKey(upload, 'id'),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const uploadIds = uploads.map((upload) => getModelTargetKey(upload, 'id')).filter(Boolean);
  if (uploadIds.length) {
    await repository.destroy({
      filter: {
        id: {
          $in: uploadIds,
        },
      },
    });
  }
  return uploadIds.length;
}

export function registerFileUploadActions(plugin: Plugin) {
  plugin.app.resourceManager.registerActionHandlers({
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.initFileUpload)]: async (ctx, next) => {
      await initUpload(asActionContext(ctx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.appendFileUpload)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await appendUpload(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.completeFileUpload)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await completeUpload(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.abortFileUpload)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await abortUpload(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
  });
}
