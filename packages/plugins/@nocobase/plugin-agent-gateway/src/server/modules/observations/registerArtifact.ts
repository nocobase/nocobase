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
import { Transaction } from 'sequelize';

import { COMMAND_CONTENT_JSON_LIMIT_CHARS } from '../../../shared/conversationLimits';
import { JsonRecord, ModelRecord, getModelJson, getRecord, getString } from '../../actions/utils';
import { deleteSharedStorageObject, putSharedStorageBuffer } from '../../services/sharedFileStorage';

const MAX_ARTIFACT_TEXT_BYTES = COMMAND_CONTENT_JSON_LIMIT_CHARS;
const MAX_METADATA_JSON_CHARS = 16 * 1024;

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
  } = getModelJson(model);
  return artifact;
}

function getBoundedMetadata(ctx: Context, value: unknown) {
  const serializedValue = JSON.stringify(value) || '';
  if (serializedValue.length > MAX_METADATA_JSON_CHARS) {
    ctx.throw(413, 'Artifact metadata is too large');
  }
  return value;
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
      filter: { runId: options.runId, claimAttempt: options.claimAttempt, artifactKey },
      transaction: options.transaction,
      lock: options.transaction?.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (existingArtifact) {
      return { ...serializeArtifact(existingArtifact), idempotent: true };
    }
  }

  const mimeType = getString(options.values.mimeType) || 'text/plain';
  const rawMetadata = getRecord(options.values.metadataJson);
  const metadataWithJsonStatus = { ...rawMetadata };
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
        metadataJson: getBoundedMetadata(ctx, metadataWithJsonStatus),
      },
      transaction: options.transaction,
    })) as ModelRecord;
    return { ...serializeArtifact(artifact), idempotent: false };
  } catch (error) {
    if (storageObject) {
      await deleteSharedStorageObject({ app: ctx.app }, storageObject).catch(() => undefined);
    }
    throw error;
  }
}
