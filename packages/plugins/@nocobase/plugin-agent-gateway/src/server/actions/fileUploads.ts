/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';
import { createReadStream, promises as fs } from 'fs';
import path from 'path';

import { Context } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';
import { storagePathJoin } from '@nocobase/utils';

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionName } from '../../shared/apiContract';
import {
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
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
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
  const uploadDir = storagePathJoin('agent-gateway', 'file-uploads');
  const storagePath = path.join(uploadDir, `${id}.part`);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(storagePath, Buffer.alloc(0), { mode: 0o600 });
  const upload = (await ctx.db.getRepository('agFileUploads').create({
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
    if (offset < receivedBytes && offset + content.byteLength <= receivedBytes) {
      const handle = await fs.open(getModelString(upload, 'storagePath'), 'r');
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
    const storagePath = getModelString(upload, 'storagePath');
    const handle = await fs.open(storagePath, 'r+');
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
      await fs.truncate(storagePath, receivedBytes);
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
  const sha256 = await hashFile(getModelString(upload, 'storagePath'));
  await ctx.db.getRepository('agFileUploads').update({
    filterByTk: uploadId,
    values: { status: 'completed', sha256 },
  });
  ctx.body = { ...serializeUpload(upload), status: 'completed', sha256 };
}

async function abortUpload(ctx: Context, uploadId: string) {
  await requireManagePermission(ctx);
  const upload = await getUpload(ctx, uploadId);
  await fs.rm(getModelString(upload, 'storagePath'), { force: true });
  await ctx.db.getRepository('agFileUploads').destroy({ filterByTk: uploadId });
  ctx.body = { uploadId, aborted: true };
}

export async function consumeCompletedUpload(ctx: Context, uploadId: string, purpose: string) {
  const upload = await getUpload(ctx, uploadId);
  if (getModelString(upload, 'status') !== 'completed' || getModelString(upload, 'purpose') !== purpose) {
    ctx.throw(409, 'Upload is not ready for this operation');
  }
  return {
    upload,
    storagePath: getModelString(upload, 'storagePath'),
    sha256: getModelString(upload, 'sha256'),
    sizeBytes: getModelNumber(upload, 'expectedBytes'),
  };
}

export async function cleanupExpiredFileUploads(plugin: Pick<Plugin, 'db'>, now = new Date()) {
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
    await fs.rm(getModelString(upload, 'storagePath'), { force: true });
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
