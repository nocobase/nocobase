/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';

import { Context } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionName } from '../../shared/apiContract';
import {
  SharedStorageObject,
  deleteSharedStorageObject,
  materializeSharedStorageObjects,
  parseSharedStorageObject,
  putSharedStorageBuffer,
  putSharedStorageFile,
  serializeSharedStorageObject,
} from '../services/sharedFileStorage';
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

interface UploadChunkRecord {
  offset: number;
  sizeBytes: number;
  sha256: string;
  object: ReturnType<typeof serializeSharedStorageObject>;
}

function getStorageHost(ctx: Context) {
  return { app: ctx.app };
}

function getChunkManifest(upload: ModelRecord) {
  const value = getModelValue(upload, 'chunkManifestJson');
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = getRecord(item);
    const offset = Number(record.offset);
    const sizeBytes = Number(record.sizeBytes);
    const sha256 = getString(record.sha256);
    if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(sizeBytes) || sizeBytes <= 0 || !sha256) {
      throw new Error('Invalid Agent Gateway upload chunk manifest');
    }
    return {
      offset,
      sizeBytes,
      sha256,
      object: serializeSharedStorageObject(parseSharedStorageObject(record.object)),
    } satisfies UploadChunkRecord;
  });
}

function getCompletedStorageObject(upload: ModelRecord) {
  return parseSharedStorageObject({
    storageId: getModelValue(upload, 'storageId'),
    objectPath: getModelString(upload, 'objectPath'),
    objectFilename: getModelString(upload, 'objectFilename'),
    objectKey: getModelString(upload, 'objectKey'),
    sizeBytes: getModelNumber(upload, 'expectedBytes'),
    mimetype: getModelString(upload, 'mimeType'),
  });
}

function throwInvalidStorageLocator(ctx: Context): never {
  ctx.throw(409, {
    code: AGENT_GATEWAY_ERROR_CODES.unsafeFileUploadStorageLocator,
    message: ctx.t('Upload storage locator is invalid', {
      ns: '@nocobase/plugin-agent-gateway',
    }),
  });
}

function getSafeChunkManifest(ctx: Context, upload: ModelRecord) {
  try {
    return getChunkManifest(upload);
  } catch {
    return throwInvalidStorageLocator(ctx);
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
  const upload = (await ctx.db.getRepository('agFileUploads').create({
    values: {
      id,
      purpose,
      status: 'pending',
      fileName: getString(values.fileName) || null,
      mimeType: getString(values.mimeType) || null,
      expectedBytes,
      receivedBytes: 0,
      chunkManifestJson: [],
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
    const chunkManifest = getSafeChunkManifest(ctx, upload);
    const contentSha256 = createHash('sha256').update(content).digest('hex');
    if (offset < receivedBytes && offset + content.byteLength <= receivedBytes) {
      const existingChunk = chunkManifest.find(
        (chunk) => chunk.offset === offset && chunk.sizeBytes === content.byteLength,
      );
      if (existingChunk?.sha256 === contentSha256) {
        return { uploadId, receivedBytes, idempotent: true };
      }
    }
    if (offset !== receivedBytes) {
      ctx.throw(409, `Upload offset mismatch; expected ${receivedBytes}`);
    }
    if (receivedBytes + content.byteLength > expectedBytes) {
      ctx.throw(413, 'Upload exceeds the declared size');
    }
    const storageObject = await putSharedStorageBuffer(getStorageHost(ctx), {
      content,
      filename: `${String(offset).padStart(12, '0')}.part`,
      mimetype: 'application/octet-stream',
      subPath: `agent-gateway/file-uploads/${uploadId}/chunks`,
    });
    const nextManifest: UploadChunkRecord[] = [
      ...chunkManifest,
      {
        offset,
        sizeBytes: content.byteLength,
        sha256: contentSha256,
        object: serializeSharedStorageObject(storageObject),
      },
    ];
    const nextReceivedBytes = receivedBytes + content.byteLength;
    try {
      await ctx.db.getRepository('agFileUploads').update({
        filterByTk: uploadId,
        values: {
          receivedBytes: nextReceivedBytes,
          chunkManifestJson: nextManifest,
        },
        transaction,
      });
    } catch (error) {
      await deleteSharedStorageObject(getStorageHost(ctx), storageObject).catch(() => undefined);
      throw error;
    }
    return { uploadId, receivedBytes: nextReceivedBytes, idempotent: false };
  });
}

async function completeUpload(ctx: Context, uploadId: string) {
  await requireManagePermission(ctx);
  const prepared = await ctx.db.sequelize.transaction(async (transaction) => {
    const upload = await getUpload(ctx, uploadId, transaction);
    if (getModelString(upload, 'status') !== 'pending') {
      ctx.throw(409, 'Upload is not pending');
    }
    if (getModelNumber(upload, 'receivedBytes') !== getModelNumber(upload, 'expectedBytes')) {
      ctx.throw(409, 'Upload is incomplete');
    }
    const chunks = getSafeChunkManifest(ctx, upload).sort((left, right) => left.offset - right.offset);
    let expectedOffset = 0;
    for (const chunk of chunks) {
      if (chunk.offset !== expectedOffset) {
        ctx.throw(409, 'Upload chunk manifest is incomplete');
      }
      expectedOffset += chunk.sizeBytes;
    }
    await ctx.db.getRepository('agFileUploads').update({
      filterByTk: uploadId,
      values: { status: 'completing' },
      transaction,
    });
    return {
      upload,
      expectedBytes: getModelNumber(upload, 'expectedBytes'),
      chunks,
    };
  });

  const chunkObjects = prepared.chunks.map((chunk) => parseSharedStorageObject(chunk.object));
  let materialized: Awaited<ReturnType<typeof materializeSharedStorageObjects>> | undefined;
  let completedObject: SharedStorageObject | undefined;
  try {
    materialized = await materializeSharedStorageObjects(getStorageHost(ctx), chunkObjects, MAX_UPLOAD_BYTES);
    if (materialized.sizeBytes !== prepared.expectedBytes) {
      throw new Error('Upload composed size does not match the declared size');
    }
    completedObject = await putSharedStorageFile(getStorageHost(ctx), {
      filePath: materialized.filePath,
      subPath: `agent-gateway/file-uploads/${uploadId}/completed`,
    });
    await ctx.db.getRepository('agFileUploads').update({
      filterByTk: uploadId,
      values: {
        status: 'completed',
        sha256: materialized.sha256,
        storageId: completedObject.storageId,
        objectPath: completedObject.path,
        objectFilename: completedObject.filename,
        objectKey: completedObject.objectKey,
        chunkManifestJson: [],
      },
    });
  } catch (error) {
    if (completedObject) {
      await deleteSharedStorageObject(getStorageHost(ctx), completedObject).catch(() => undefined);
    }
    await ctx.db.getRepository('agFileUploads').update({
      filterByTk: uploadId,
      values: { status: 'pending' },
    });
    throw error;
  } finally {
    await materialized?.cleanup();
  }

  for (const chunkObject of chunkObjects) {
    await deleteSharedStorageObject(getStorageHost(ctx), chunkObject).catch((error) => {
      ctx.logger?.warn?.('Agent Gateway upload chunk cleanup failed', {
        uploadId,
        objectKey: chunkObject.objectKey,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
  ctx.body = {
    ...serializeUpload(prepared.upload),
    status: 'completed',
    sha256: materialized?.sha256,
  };
}

async function abortUpload(ctx: Context, uploadId: string) {
  await requireManagePermission(ctx);
  const upload = await getUpload(ctx, uploadId);
  const objects = getSafeChunkManifest(ctx, upload).map((chunk) => parseSharedStorageObject(chunk.object));
  if (getModelString(upload, 'objectKey')) {
    try {
      objects.push(getCompletedStorageObject(upload));
    } catch {
      throwInvalidStorageLocator(ctx);
    }
  }
  for (const storageObject of objects) {
    await deleteSharedStorageObject(getStorageHost(ctx), storageObject);
  }
  await ctx.db.getRepository('agFileUploads').destroy({ filterByTk: uploadId });
  ctx.body = { uploadId, aborted: true };
}

export async function consumeCompletedUpload(ctx: Context, uploadId: string, purpose: string) {
  const upload = await getUpload(ctx, uploadId);
  if (getModelString(upload, 'status') !== 'completed' || getModelString(upload, 'purpose') !== purpose) {
    ctx.throw(409, 'Upload is not ready for this operation');
  }
  let storageObject: SharedStorageObject;
  try {
    storageObject = getCompletedStorageObject(upload);
  } catch {
    return throwInvalidStorageLocator(ctx);
  }
  return {
    upload,
    storageObject,
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
    fields: [
      'id',
      'expectedBytes',
      'mimeType',
      'storageId',
      'objectPath',
      'objectFilename',
      'objectKey',
      'chunkManifestJson',
    ],
    sort: ['expiresAt', 'id'],
    limit: 1000,
  })) as ModelRecord[];
  for (const upload of uploads) {
    try {
      const objects = getChunkManifest(upload).map((chunk) => parseSharedStorageObject(chunk.object));
      if (getModelString(upload, 'objectKey')) {
        objects.push(getCompletedStorageObject(upload));
      }
      for (const storageObject of objects) {
        await deleteSharedStorageObject(plugin, storageObject);
      }
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
