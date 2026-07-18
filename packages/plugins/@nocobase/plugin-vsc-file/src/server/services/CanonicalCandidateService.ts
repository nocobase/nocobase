/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';

import { VscError } from '../../shared/errors';
import type {
  VscCommitRecord,
  VscFileOperation,
  VscNormalizedTreeEntry,
  VscStoredBlob,
  VscStoredTree,
} from '../../shared/types';
import { BlobService } from './BlobService';
import type { PreparedTree } from './TreeService';
import { incrementVscFileMetric, type VscFileMetricsCollector } from './VscFileMetrics';

export interface CanonicalCandidateFile extends VscNormalizedTreeEntry {
  readonly content: string;
}

export interface CanonicalCandidateChange {
  readonly path: string;
  readonly operation: VscFileOperation;
}

export interface CanonicalCandidateSnapshot {
  readonly baseCommitId: string | null;
  readonly baseTreeHash: string | null;
  readonly commitId: string;
  readonly treeHash: string;
  readonly changedPaths: readonly string[];
  readonly changes: readonly CanonicalCandidateChange[];
  readonly files: readonly CanonicalCandidateFile[];
}

export type PreparedCanonicalCandidateSnapshot = Omit<CanonicalCandidateSnapshot, 'commitId'>;

interface MaterializeCandidateInput {
  baseCommit: VscCommitRecord | null;
  baseEntries: readonly Readonly<VscNormalizedTreeEntry>[];
  commit: VscCommitRecord;
  tree: VscStoredTree;
  preparedTree: PreparedTree;
}

export class CanonicalCandidateService {
  constructor(private readonly blobService: BlobService) {}

  async materializePrepared(
    input: Pick<MaterializeCandidateInput, 'baseCommit' | 'baseEntries' | 'preparedTree'>,
    options: { transaction?: Transaction; metricsCollector?: VscFileMetricsCollector } = {},
  ): Promise<PreparedCanonicalCandidateSnapshot> {
    const blobsByHash = new Map<string, Readonly<VscStoredBlob>>(
      input.preparedTree.canonicalBlobs.map((blob) => [blob.hash, blob]),
    );
    const storedBlobHashes = input.preparedTree.entries
      .map((entry) => entry.blobHash)
      .filter((hash) => !blobsByHash.has(hash));

    if (storedBlobHashes.length > 0) {
      incrementVscFileMetric(options.metricsCollector, 'blobContentQueryCount');
      const storedBlobs = await this.blobService.loadBlobs(storedBlobHashes, {
        transaction: options.transaction,
      });
      incrementVscFileMetric(options.metricsCollector, 'blobContentRowCount', storedBlobs.size);
      for (const [hash, blob] of storedBlobs) {
        blobsByHash.set(hash, blob);
      }
    }

    const files = Object.freeze(
      input.preparedTree.entries.map((entry) => {
        const blob = blobsByHash.get(entry.blobHash);
        if (!blob) {
          throw new VscError('BLOB_NOT_FOUND', `Blob "${entry.blobHash}" was not found`);
        }
        if (blob.size !== entry.size) {
          throw new VscError('INTERNAL_ERROR', `Blob "${entry.blobHash}" size does not match the prepared tree`);
        }

        return Object.freeze({
          ...entry,
          content: blob.content,
        });
      }),
    );
    const changes = Object.freeze(buildCandidateChanges(input.baseEntries, input.preparedTree.entries));

    return Object.freeze({
      baseCommitId: input.baseCommit?.id || null,
      baseTreeHash: input.baseCommit?.treeHash || null,
      treeHash: input.preparedTree.hash,
      changedPaths: Object.freeze(changes.map((change) => change.path)),
      changes,
      files,
    });
  }

  async materialize(
    input: MaterializeCandidateInput,
    options: { transaction?: Transaction; metricsCollector?: VscFileMetricsCollector } = {},
  ): Promise<CanonicalCandidateSnapshot> {
    this.assertIdentity(input);
    const prepared = await this.materializePrepared(input, options);

    return Object.freeze({
      ...prepared,
      commitId: input.commit.id,
    });
  }

  private assertIdentity(input: MaterializeCandidateInput): void {
    if (input.preparedTree.hash !== input.tree.hash || input.commit.treeHash !== input.tree.hash) {
      throw new VscError('INTERNAL_ERROR', 'Candidate snapshot identity does not match the prepared tree and commit');
    }
  }
}

function buildCandidateChanges(
  baseEntries: readonly Readonly<VscNormalizedTreeEntry>[],
  candidateEntries: readonly Readonly<VscNormalizedTreeEntry>[],
): CanonicalCandidateChange[] {
  const baseByPath = new Map(baseEntries.map((entry) => [entry.path, entry]));
  const candidateByPath = new Map(candidateEntries.map((entry) => [entry.path, entry]));
  const paths = new Set([...baseByPath.keys(), ...candidateByPath.keys()]);
  const changes: CanonicalCandidateChange[] = [];

  for (const path of [...paths].sort()) {
    const baseEntry = baseByPath.get(path);
    const candidateEntry = candidateByPath.get(path);
    if (!candidateEntry) {
      changes.push(Object.freeze({ path, operation: 'delete' }));
      continue;
    }
    if (!baseEntry || !treeEntriesEqual(baseEntry, candidateEntry)) {
      changes.push(Object.freeze({ path, operation: 'upsert' }));
    }
  }

  return changes;
}

function treeEntriesEqual(left: Readonly<VscNormalizedTreeEntry>, right: Readonly<VscNormalizedTreeEntry>): boolean {
  return (
    left.path === right.path &&
    left.pathHash === right.pathHash &&
    left.pathLowerHash === right.pathLowerHash &&
    left.blobHash === right.blobHash &&
    left.size === right.size &&
    left.language === right.language &&
    left.mode === right.mode
  );
}
