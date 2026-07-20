/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { UniqueConstraintError } from '@nocobase/database';

import {
  commitHistoryDefaultLimit,
  commitHistoryMaxLimit,
  maxCommitMessageLength,
} from '../../../shared/vsc-file/constants';
import { VscError } from '../../../shared/vsc-file/errors';
import { sha256Hex } from '../../../shared/vsc-file/hash';
import type { VscCommitRecord } from '../../../shared/vsc-file/types';

export interface CreateCommitInput {
  repoId: string;
  seq: number;
  parentCommitId: string | null;
  treeHash: string;
  message: string;
  authorId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ListCommitsInput {
  repoId: string;
  limit?: number;
  beforeSeq?: number;
}

export class CommitService {
  constructor(private readonly db: Database) {}

  async createCommit(input: CreateCommitInput, transaction?: Transaction): Promise<VscCommitRecord> {
    if (input.message.length > maxCommitMessageLength) {
      throw new VscError('PATH_INVALID', `Commit message length must not exceed ${maxCommitMessageLength}`, {
        details: {
          maxCommitMessageLength,
        },
      });
    }

    try {
      const record = await this.db.getRepository('vscFileCommits').create({
        values: {
          repoId: input.repoId,
          hash: commitHash(input),
          seq: input.seq,
          parentCommitId: input.parentCommitId,
          treeHash: input.treeHash,
          message: input.message,
          authorId: input.authorId || null,
          metadata: input.metadata || {},
        },
        transaction,
      });

      return commitFromRecord(record);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new VscError('BASE_COMMIT_OUTDATED', 'Commit sequence was already used');
      }
      throw error;
    }
  }

  async getCommit(repoId: string, commitId: string, transaction?: Transaction): Promise<VscCommitRecord> {
    const record = await this.db.getRepository('vscFileCommits').findOne({
      filter: {
        id: commitId,
        repoId,
      },
      transaction,
    });

    if (!record) {
      throw new VscError('COMMIT_NOT_FOUND', `Commit "${commitId}" was not found`);
    }

    return commitFromRecord(record);
  }

  async listCommits(input: ListCommitsInput, transaction?: Transaction): Promise<VscCommitRecord[]> {
    const limit = normalizeCommitListLimit(input.limit);
    const beforeSeq = normalizeBeforeSeq(input.beforeSeq);
    const filter = beforeSeq
      ? {
          repoId: input.repoId,
          seq: {
            $lt: beforeSeq,
          },
        }
      : {
          repoId: input.repoId,
        };

    const records = await this.db.getRepository('vscFileCommits').find({
      filter,
      sort: ['-seq'],
      limit,
      transaction,
    });

    return records.map(commitFromRecord);
  }

  async getTree(treeHash: string, transaction?: Transaction) {
    const record = await this.db.getRepository('vscFileTrees').findOne({
      filterByTk: treeHash,
      transaction,
    });

    if (!record) {
      throw new VscError('COMMIT_NOT_FOUND', `Tree "${treeHash}" was not found`);
    }

    return {
      hash: record.get('hash') as string,
      entryCount: record.get('entryCount') as number,
      byteSize: record.get('byteSize') as number,
    };
  }
}

function normalizeCommitListLimit(limit: number | undefined): number {
  if (typeof limit === 'undefined') {
    return commitHistoryDefaultLimit;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new VscError('PATH_INVALID', 'Commit history limit must be a positive integer');
  }

  return Math.min(limit, commitHistoryMaxLimit);
}

function normalizeBeforeSeq(beforeSeq: number | undefined): number | undefined {
  if (typeof beforeSeq === 'undefined') {
    return undefined;
  }

  if (!Number.isInteger(beforeSeq) || beforeSeq < 1) {
    throw new VscError('PATH_INVALID', 'Commit history beforeSeq must be a positive integer');
  }

  return beforeSeq;
}

function commitHash(input: CreateCommitInput): string {
  return sha256Hex(
    [
      input.repoId,
      String(input.seq),
      input.parentCommitId || '',
      input.treeHash,
      input.message,
      input.authorId || '',
      JSON.stringify(input.metadata || {}),
    ].join('\0'),
  );
}

export function commitFromRecord(record: Model): VscCommitRecord {
  return {
    id: record.get('id') as string,
    repoId: record.get('repoId') as string,
    hash: record.get('hash') as string,
    seq: record.get('seq') as number,
    parentCommitId: (record.get('parentCommitId') as string | null) || null,
    treeHash: record.get('treeHash') as string,
    message: record.get('message') as string,
    authorId: (record.get('authorId') as string | null) || null,
    metadata: (record.get('metadata') as Record<string, unknown> | null) || {},
    createdAt: normalizeRecordDate(record.get('createdAt')),
  };
}

function normalizeRecordDate(value: unknown): string | undefined {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === 'string' ? value : undefined;
}
