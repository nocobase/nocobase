/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';

import { maxFileSize } from '../../shared/constants';
import { VscError } from '../../shared/errors';
import { sha256Hex } from '../../shared/hash';
import { normalizeText } from '../../shared/text';
import type { VscStoredBlob } from '../../shared/types';

export interface EnsureBlobOptions {
  transaction?: Transaction;
}

export class BlobService {
  constructor(private readonly db: Database) {}

  async ensureBlob(content: string, options: EnsureBlobOptions = {}): Promise<VscStoredBlob> {
    const blob = normalizeBlob(content);
    const blobModel = this.db.getModel<Model<VscStoredBlob>>('vscFileBlobs');
    const [record] = await blobModel.findOrCreate({
      where: {
        hash: blob.hash,
      },
      defaults: blob,
      transaction: options.transaction,
    });

    return blobFromRecord(record);
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
