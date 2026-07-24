/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';

import { maxFileSize } from '../../../shared/vsc-file/constants';
import { VscError } from '../../../shared/vsc-file/errors';
import { sha256Hex } from '../../../shared/vsc-file/hash';
import { normalizeText } from '../../../shared/vsc-file/text';
import type { VscStoredBlob } from '../../../shared/vsc-file/types';

export interface EnsureBlobOptions {
  transaction?: Transaction;
}

export interface VscStoredBlobMetadata {
  hash: VscStoredBlob['hash'];
  size: number;
}

export class BlobService {
  constructor(private readonly db: Database) {}

  async ensureBlob(content: string, options: EnsureBlobOptions = {}): Promise<VscStoredBlob> {
    const blob = normalizeBlob(content);
    const blobModel = this.db.getModel<Model<VscStoredBlob>>('vscFileBlobs');
    for (let attempt = 0; ; attempt += 1) {
      try {
        const [record] = await blobModel.findOrCreate({
          where: {
            hash: blob.hash,
          },
          defaults: blob,
          transaction: options.transaction,
        });
        return blobFromRecord(record);
      } catch (error) {
        if (
          options.transaction ||
          this.db.sequelize.getDialect() !== 'sqlite' ||
          !isSqliteBusyError(error) ||
          attempt >= 2
        ) {
          throw error;
        }
        await delay(100);
      }
    }
  }

  async loadBlobMetadata(
    hashes: readonly string[],
    options: EnsureBlobOptions = {},
  ): Promise<Map<string, VscStoredBlobMetadata>> {
    const uniqueHashes = [...new Set(hashes)];
    if (!uniqueHashes.length) {
      return new Map();
    }

    const records = await this.db.getRepository('vscFileBlobs').find({
      filter: {
        hash: { $in: uniqueHashes },
      },
      fields: ['hash', 'size'],
      transaction: options.transaction,
    });
    const blobs = new Map<string, VscStoredBlobMetadata>(
      records.map((record) => {
        const blob = blobMetadataFromRecord(record);
        return [blob.hash, blob];
      }),
    );

    assertRequestedBlobsExist(uniqueHashes, blobs);
    return blobs;
  }

  async loadBlobs(hashes: readonly string[], options: EnsureBlobOptions = {}): Promise<Map<string, VscStoredBlob>> {
    const uniqueHashes = [...new Set(hashes)];
    if (!uniqueHashes.length) {
      return new Map();
    }

    const records = await this.db.getRepository('vscFileBlobs').find({
      filter: {
        hash: { $in: uniqueHashes },
      },
      fields: ['hash', 'size', 'content'],
      transaction: options.transaction,
    });
    const blobs = new Map<string, VscStoredBlob>(
      records.map((record) => {
        const blob = blobFromRecord(record);
        return [blob.hash, blob];
      }),
    );

    assertRequestedBlobsExist(uniqueHashes, blobs);
    return blobs;
  }
}

export function normalizeBlob(content: string): VscStoredBlob {
  const normalizedContent = normalizeText(content);
  const size = Buffer.byteLength(normalizedContent, 'utf8');

  if (size > maxFileSize) {
    throw new VscError('FILE_TOO_LARGE', `File size must not exceed ${maxFileSize} bytes`, {
      details: { size, maxFileSize },
    });
  }

  return {
    hash: sha256Hex(normalizedContent),
    size,
    content: normalizedContent,
  };
}

function blobFromRecord(record: Model<VscStoredBlob>): VscStoredBlob {
  return {
    hash: record.get('hash') as string,
    size: record.get('size') as number,
    content: record.get('content') as string,
  };
}

function isSqliteBusyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as {
    original?: { code?: unknown };
    parent?: { code?: unknown };
  };
  return candidate.original?.code === 'SQLITE_BUSY' || candidate.parent?.code === 'SQLITE_BUSY';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function blobMetadataFromRecord(record: Model<VscStoredBlobMetadata>): VscStoredBlobMetadata {
  return {
    hash: record.get('hash') as string,
    size: record.get('size') as number,
  };
}

function assertRequestedBlobsExist(hashes: readonly string[], blobs: ReadonlyMap<string, VscStoredBlobMetadata>): void {
  const missingHash = hashes.find((hash) => !blobs.has(hash));
  if (missingHash) {
    throw new VscError('BLOB_NOT_FOUND', `Blob "${missingHash}" was not found`);
  }
}
