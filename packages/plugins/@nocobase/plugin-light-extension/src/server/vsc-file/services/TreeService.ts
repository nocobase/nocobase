/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';

import { maxFileSize, maxFilesPerRepo, maxRepoTextSize } from '../../../shared/vsc-file/constants';
import { VscError } from '../../../shared/vsc-file/errors';
import { sha256Hex } from '../../../shared/vsc-file/hash';
import { normalizePath, pathHash, pathLowerHash } from '../../../shared/vsc-file/path';
import type {
  VscNormalizedTreeEntry,
  VscStoredBlob,
  VscStoredTree,
  VscTreeEntryInput,
} from '../../../shared/vsc-file/types';
import { BlobService, normalizeBlob } from './BlobService';
import { incrementVscFileMetric, type VscFileMetricsCollector } from './VscFileMetrics';

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
  metricsCollector?: VscFileMetricsCollector;
}

const preparedTreeBrand = Symbol('vsc-file-prepared-tree');

export interface PreparedTreeBlobMetadata {
  readonly hash: string;
  readonly size: number;
}

export interface PreparedTree {
  readonly [preparedTreeBrand]: true;
  readonly entries: readonly Readonly<VscNormalizedTreeEntry>[];
  readonly hash: string;
  readonly entryCount: number;
  readonly byteSize: number;
  readonly canonicalBlobs: readonly Readonly<VscStoredBlob>[];
  readonly blobMetadata: readonly Readonly<PreparedTreeBlobMetadata>[];
}

interface PreparedEntryDraft {
  readonly path: string;
  readonly pathHash: string;
  readonly pathLowerHash: string;
  readonly blobHash: string;
  readonly explicitSize?: number;
  readonly contentBlob?: VscStoredBlob;
  readonly language: string;
  readonly mode: string;
}

export class TreeService {
  private readonly blobService: BlobService;

  private readonly preparedTrees = new WeakSet<object>();

  readonly emptyTreeHash = hashNormalizedTree([]);

  constructor(
    private readonly db: Database,
    blobService?: BlobService,
  ) {
    this.blobService = blobService || new BlobService(db);
  }

  async hashTree(entries: VscTreeEntryInput[], options: EnsureTreeOptions = {}): Promise<string> {
    return (await this.prepareTree(entries, options)).hash;
  }

  async ensureTree(
    entries: VscTreeEntryInput[],
    transaction?: Transaction,
    metricsCollector?: VscFileMetricsCollector,
  ): Promise<VscStoredTree> {
    return this.withTransaction(transaction, async (activeTransaction) => {
      const prepared = await this.prepareTree(entries, {
        transaction: activeTransaction,
        metricsCollector,
      });
      return this.ensurePreparedTree(prepared, activeTransaction);
    });
  }

  async prepareTree(entries: readonly VscTreeEntryInput[], options: EnsureTreeOptions = {}): Promise<PreparedTree> {
    incrementVscFileMetric(options.metricsCollector, 'treeNormalizationCount');

    if (entries.length > maxFilesPerRepo) {
      throw new VscError('REPO_LIMIT_EXCEEDED', `Tree must not exceed ${maxFilesPerRepo} files`, {
        details: { fileCount: entries.length, maxFilesPerRepo },
      });
    }

    const byPath = new Set<string>();
    const byLowerPathHash = new Map<string, string>();
    const drafts: PreparedEntryDraft[] = [];
    const hashOnlyBlobHashes: string[] = [];
    const canonicalBlobsByHash = new Map<string, VscStoredBlob>();

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

      const contentBlob = typeof entry.content === 'string' ? normalizeBlob(entry.content) : undefined;
      if (!contentBlob && !entry.blobHash) {
        throw new VscError(
          'BLOB_NOT_FOUND',
          `Tree entry "${entry.path}" must include content or an existing blob hash`,
        );
      }

      let blobHash: string;
      if (contentBlob) {
        blobHash = contentBlob.hash;
        canonicalBlobsByHash.set(contentBlob.hash, contentBlob);
      } else {
        blobHash = entry.blobHash as string;
        hashOnlyBlobHashes.push(blobHash);
      }

      byPath.add(normalizedPath);
      byLowerPathHash.set(normalizedPathLowerHash, normalizedPath);
      drafts.push({
        path: normalizedPath,
        pathHash: normalizedPathHash,
        pathLowerHash: normalizedPathLowerHash,
        blobHash,
        explicitSize: entry.size,
        contentBlob,
        language: normalizeEntryMetadata(entry.language, inferLanguage(normalizedPath), 'language', maxLanguageLength),
        mode: normalizeEntryMetadata(entry.mode, defaultFileMode, 'mode', maxModeLength),
      });
    }

    const loadedMetadata = await this.blobService.loadBlobMetadata(hashOnlyBlobHashes, {
      transaction: options.transaction,
    });
    const metadataByHash = new Map<string, PreparedTreeBlobMetadata>();
    for (const blob of canonicalBlobsByHash.values()) {
      metadataByHash.set(blob.hash, { hash: blob.hash, size: blob.size });
    }
    for (const blob of loadedMetadata.values()) {
      metadataByHash.set(blob.hash, { hash: blob.hash, size: blob.size });
    }

    const normalizedEntries = drafts
      .map((draft): VscNormalizedTreeEntry => {
        let size: number;
        if (draft.contentBlob) {
          size = draft.contentBlob.size;
        } else {
          const blobMetadata = loadedMetadata.get(draft.blobHash);
          if (!blobMetadata) {
            throw new VscError('INTERNAL_ERROR', `Prepared blob metadata for "${draft.blobHash}" is incomplete`);
          }
          size = blobMetadata.size;
        }
        assertBlobSizeWithinLimit(size);
        if (typeof draft.explicitSize === 'number' && draft.explicitSize !== size) {
          throw new VscError(
            'PATH_INVALID',
            `Tree entry "${draft.path}" size does not match blob "${draft.blobHash}"`,
            {
              details: {
                path: draft.path,
                blobHash: draft.blobHash,
                size: draft.explicitSize,
                expectedSize: size,
              },
            },
          );
        }

        return {
          path: draft.path,
          pathHash: draft.pathHash,
          pathLowerHash: draft.pathLowerHash,
          blobHash: draft.blobHash,
          size,
          language: draft.language,
          mode: draft.mode,
        };
      })
      .sort(compareEntriesByPath);

    const byteSize = normalizedEntries.reduce((total, entry) => total + entry.size, 0);
    if (byteSize > maxRepoTextSize) {
      throw new VscError('REPO_LIMIT_EXCEEDED', `Tree content must not exceed ${maxRepoTextSize} bytes`, {
        details: { byteSize, maxRepoTextSize },
      });
    }

    const frozenEntries = Object.freeze(normalizedEntries.map((entry) => Object.freeze({ ...entry })));
    const canonicalBlobs = Object.freeze(
      [...canonicalBlobsByHash.values()]
        .sort((left, right) => left.hash.localeCompare(right.hash))
        .map((blob) => Object.freeze({ ...blob })),
    );
    const blobMetadata = Object.freeze(
      [...metadataByHash.values()]
        .sort((left, right) => left.hash.localeCompare(right.hash))
        .map((blob) => Object.freeze({ ...blob })),
    );
    const prepared: PreparedTree = Object.freeze({
      [preparedTreeBrand]: true as const,
      entries: frozenEntries,
      hash: hashNormalizedTree(frozenEntries),
      entryCount: frozenEntries.length,
      byteSize,
      canonicalBlobs,
      blobMetadata,
    });
    this.preparedTrees.add(prepared);
    return prepared;
  }

  async ensurePreparedTree(prepared: PreparedTree, transaction?: Transaction): Promise<VscStoredTree> {
    this.assertPreparedTree(prepared);

    const persist = async (activeTransaction: Transaction): Promise<VscStoredTree> => {
      const blobModel = this.db.getModel<Model<VscStoredBlob>>('vscFileBlobs');
      for (const blob of prepared.canonicalBlobs) {
        await blobModel.findOrCreate({
          where: { hash: blob.hash },
          defaults: blob,
          transaction: activeTransaction,
        });
      }

      const treeModel = this.db.getModel<Model<VscStoredTree>>('vscFileTrees');
      const [tree, created] = await treeModel.findOrCreate({
        where: {
          hash: prepared.hash,
        },
        defaults: {
          hash: prepared.hash,
          entryCount: prepared.entryCount,
          byteSize: prepared.byteSize,
        },
        transaction: activeTransaction,
      });

      if (!created) {
        return treeFromRecord(tree);
      }

      await this.db.getRepository('vscFileTreeEntries').createMany({
        records: prepared.entries.map((entry) => ({
          treeHash: prepared.hash,
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
    };

    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.withTransaction(transaction, persist);
      } catch (error) {
        if (transaction || this.db.sequelize.getDialect() !== 'sqlite' || !isSqliteBusyError(error) || attempt >= 2) {
          throw error;
        }
        await delay(100);
      }
    }
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

  private assertPreparedTree(prepared: PreparedTree): void {
    if (!prepared || !this.preparedTrees.has(prepared)) {
      throw new VscError('INTERNAL_ERROR', 'Prepared tree must be created by this TreeService instance');
    }
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

function hashNormalizedTree(entries: readonly Readonly<VscNormalizedTreeEntry>[]): string {
  const manifest = [...entries]
    .sort(compareEntriesByPath)
    .map((entry) => `${entry.path}\0${entry.blobHash}\0${entry.language}\0${entry.mode}\n`)
    .join('');

  return sha256Hex(manifest);
}

function compareEntriesByPath(left: Readonly<VscNormalizedTreeEntry>, right: Readonly<VscNormalizedTreeEntry>): number {
  if (left.path < right.path) {
    return -1;
  }
  if (left.path > right.path) {
    return 1;
  }
  return 0;
}

function assertBlobSizeWithinLimit(size: number): void {
  if (size > maxFileSize) {
    throw new VscError('FILE_TOO_LARGE', `File size must not exceed ${maxFileSize} bytes`, {
      details: { size, maxFileSize },
    });
  }
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
