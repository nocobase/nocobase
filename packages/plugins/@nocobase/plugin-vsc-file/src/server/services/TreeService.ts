/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';

import { maxFileSize, maxFilesPerRepo, maxRepoTextSize } from '../../shared/constants';
import { VscError } from '../../shared/errors';
import { sha256Hex } from '../../shared/hash';
import { normalizePath, pathHash, pathLowerHash } from '../../shared/path';
import type { VscNormalizedTreeEntry, VscStoredTree, VscTreeEntryInput } from '../../shared/types';
import { BlobService, normalizeBlob } from './BlobService';

const defaultFileMode = '100644';
const maxLanguageLength = 64;
const maxModeLength = 16;

const languageByExtension: Record<string, string> = {
  css: 'css',
  html: 'html',
  js: 'javascript',
  jsx: 'javascript',
  json: 'json',
  md: 'markdown',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  yaml: 'yaml',
  yml: 'yaml',
};

export interface EnsureTreeOptions {
  transaction?: Transaction;
}

export class TreeService {
  private readonly blobService: BlobService;

  constructor(
    private readonly db: Database,
    blobService?: BlobService,
  ) {
    this.blobService = blobService || new BlobService(db);
  }

  async hashTree(entries: VscTreeEntryInput[], options: EnsureTreeOptions = {}): Promise<string> {
    const normalizedEntries = await this.normalizeEntries(entries, {
      persistBlobs: false,
      transaction: options.transaction,
    });
    return hashNormalizedTree(normalizedEntries);
  }

  async ensureTree(entries: VscTreeEntryInput[], transaction?: Transaction): Promise<VscStoredTree> {
    return this.withTransaction(transaction, async (activeTransaction) => {
      const normalizedEntries = await this.normalizeEntries(entries, {
        persistBlobs: true,
        transaction: activeTransaction,
      });
      const hash = hashNormalizedTree(normalizedEntries);
      const treeModel = this.db.getModel<Model<VscStoredTree>>('vscFileTrees');
      const [tree, created] = await treeModel.findOrCreate({
        where: {
          hash,
        },
        defaults: {
          hash,
          entryCount: normalizedEntries.length,
          byteSize: normalizedEntries.reduce((total, entry) => total + entry.size, 0),
        },
        transaction: activeTransaction,
      });

      if (!created) {
        return treeFromRecord(tree);
      }

      await this.db.getRepository('vscFileTreeEntries').createMany({
        records: normalizedEntries.map((entry) => ({
          treeHash: hash,
          path: entry.path,
          pathHash: entry.pathHash,
          pathLowerHash: entry.pathLowerHash,
          blobHash: entry.blobHash,
          language: entry.language,
          mode: entry.mode,
          size: entry.size,
        })),
        transaction: activeTransaction,
      });

      return treeFromRecord(tree);
    });
  }

  async loadTreeEntries(treeHash: string, options: EnsureTreeOptions = {}): Promise<VscNormalizedTreeEntry[]> {
    const records = await this.db.getRepository('vscFileTreeEntries').find({
      filter: {
        treeHash,
      },
      fields: ['path', 'pathHash', 'pathLowerHash', 'blobHash', 'language', 'mode', 'size'],
      sort: ['path'],
      transaction: options.transaction,
    });

    return records.map(entryFromRecord);
  }

  private async normalizeEntries(
    entries: VscTreeEntryInput[],
    options: { persistBlobs: boolean; transaction?: Transaction },
  ): Promise<VscNormalizedTreeEntry[]> {
    if (entries.length > maxFilesPerRepo) {
      throw new VscError('REPO_LIMIT_EXCEEDED', `Tree must not exceed ${maxFilesPerRepo} files`, {
        details: { fileCount: entries.length, maxFilesPerRepo },
      });
    }

    const byPath = new Set<string>();
    const byLowerPathHash = new Map<string, string>();
    const normalizedEntries: VscNormalizedTreeEntry[] = [];

    for (const entry of entries) {
      const normalizedPath = normalizePath(entry.path);
      const normalizedPathHash = pathHash(normalizedPath);
      const normalizedPathLowerHash = pathLowerHash(normalizedPath);
      const conflictingPath = byLowerPathHash.get(normalizedPathLowerHash);

      if (byPath.has(normalizedPath)) {
        throw new VscError('PATH_INVALID', `Duplicate path "${normalizedPath}"`);
      }
      if (conflictingPath && conflictingPath !== normalizedPath) {
        throw new VscError(
          'PATH_INVALID',
          `Case-only path conflict between "${conflictingPath}" and "${normalizedPath}"`,
        );
      }

      const blob = await this.resolveBlob(entry, options);
      byPath.add(normalizedPath);
      byLowerPathHash.set(normalizedPathLowerHash, normalizedPath);
      normalizedEntries.push({
        path: normalizedPath,
        pathHash: normalizedPathHash,
        pathLowerHash: normalizedPathLowerHash,
        blobHash: blob.blobHash,
        size: blob.size,
        language: normalizeEntryMetadata(entry.language, inferLanguage(normalizedPath), 'language', maxLanguageLength),
        mode: normalizeEntryMetadata(entry.mode, defaultFileMode, 'mode', maxModeLength),
      });
    }

    const byteSize = normalizedEntries.reduce((total, entry) => total + entry.size, 0);
    if (byteSize > maxRepoTextSize) {
      throw new VscError('REPO_LIMIT_EXCEEDED', `Tree content must not exceed ${maxRepoTextSize} bytes`, {
        details: { byteSize, maxRepoTextSize },
      });
    }

    return normalizedEntries;
  }

  private async resolveBlob(
    entry: VscTreeEntryInput,
    options: { persistBlobs: boolean; transaction?: Transaction },
  ): Promise<{ blobHash: string; size: number }> {
    if (typeof entry.content === 'string') {
      const blob = options.persistBlobs
        ? await this.blobService.ensureBlob(entry.content, options)
        : normalizeBlob(entry.content);
      return {
        blobHash: blob.hash,
        size: blob.size,
      };
    }

    if (!entry.blobHash) {
      throw new VscError('BLOB_NOT_FOUND', `Tree entry "${entry.path}" must include content or an existing blob hash`);
    }

    const blob = await this.db.getRepository('vscFileBlobs').findOne({
      filterByTk: entry.blobHash,
      fields: ['hash', 'size'],
      transaction: options.transaction,
    });

    if (!blob) {
      throw new VscError('BLOB_NOT_FOUND', `Blob "${entry.blobHash}" was not found`);
    }

    const size = blob.get('size') as number;

    if (size > maxFileSize) {
      throw new VscError('FILE_TOO_LARGE', `File size must not exceed ${maxFileSize} bytes`, {
        details: { size, maxFileSize },
      });
    }

    if (typeof entry.size === 'number' && entry.size !== size) {
      throw new VscError('PATH_INVALID', `Tree entry "${entry.path}" size does not match blob "${entry.blobHash}"`, {
        details: {
          path: entry.path,
          blobHash: entry.blobHash,
          size: entry.size,
          expectedSize: size,
        },
      });
    }

    return {
      blobHash: entry.blobHash,
      size,
    };
  }

  private async withTransaction<T>(
    transaction: Transaction | undefined,
    run: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    if (transaction) {
      return run(transaction);
    }

    return this.db.sequelize.transaction(run);
  }
}

function hashNormalizedTree(entries: VscNormalizedTreeEntry[]): string {
  const manifest = [...entries]
    .sort((left, right) => {
      if (left.path < right.path) {
        return -1;
      }
      if (left.path > right.path) {
        return 1;
      }
      return 0;
    })
    .map((entry) => `${entry.path}\0${entry.blobHash}\0${entry.language}\0${entry.mode}\n`)
    .join('');

  return sha256Hex(manifest);
}

function inferLanguage(path: string): string {
  const filename = path.split('/').pop() || path;
  const extensionIndex = filename.lastIndexOf('.');

  if (extensionIndex <= 0 || extensionIndex === filename.length - 1) {
    return 'text';
  }

  return languageByExtension[filename.slice(extensionIndex + 1).toLowerCase()] || 'text';
}

function normalizeEntryMetadata(
  value: string | undefined,
  fallback: string,
  fieldName: string,
  maxLength: number,
): string {
  const normalized = typeof value === 'string' && value.trim() ? value.trim() : fallback;

  if (normalized.includes('\0') || normalized.includes('\n') || normalized.includes('\r')) {
    throw new VscError('PATH_INVALID', 'Tree entry metadata must not contain line breaks or NUL');
  }
  if (normalized.length > maxLength) {
    throw new VscError('PATH_INVALID', `Tree entry ${fieldName} length must not exceed ${maxLength}`, {
      details: {
        fieldName,
        maxLength,
      },
    });
  }

  return normalized;
}

function treeFromRecord(record: Model<VscStoredTree>): VscStoredTree {
  return {
    hash: record.get('hash') as string,
    entryCount: record.get('entryCount') as number,
    byteSize: record.get('byteSize') as number,
  };
}

function entryFromRecord(record: Model<VscNormalizedTreeEntry>): VscNormalizedTreeEntry {
  return {
    path: record.get('path') as string,
    pathHash: record.get('pathHash') as string,
    pathLowerHash: record.get('pathLowerHash') as string,
    blobHash: record.get('blobHash') as string,
    language: record.get('language') as string,
    mode: record.get('mode') as string,
    size: record.get('size') as number,
  };
}
