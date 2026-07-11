/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';

import { VscError } from '../../shared/errors';
import { normalizePath, pathHash } from '../../shared/path';
import type {
  VscCommitRecord,
  VscNormalizedTreeEntry,
  VscRefRecord,
  VscRepositoryRecord,
  VscStoredTree,
  VscTreeEntryInput,
} from '../../shared/types';
import { CommitService } from './CommitService';
import { RepositoryService, refFromRecord } from './RepositoryService';
import { TreeService } from './TreeService';

export interface RefServiceContext {
  transaction?: Transaction;
  authorId?: string | null;
}

export interface ListRefsInput {
  repoId: string;
}

export interface UpdateRefInput {
  repoId: string;
  name: string;
  targetCommitId: string;
}

export interface UpdateRefResult {
  repository: VscRepositoryRecord;
  ref: VscRefRecord;
  commit: VscCommitRecord;
}

export interface RestoreFileInput {
  repoId: string;
  sourceCommitId: string;
  path: string;
  message?: string;
  authorId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RestoreCommitInput {
  repoId: string;
  sourceCommitId: string;
  message?: string;
  authorId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RestoreResult {
  repository: VscRepositoryRecord;
  commit: VscCommitRecord;
  tree: VscStoredTree;
}

export class RefService {
  private readonly commitService: CommitService;

  private readonly repositoryService: RepositoryService;

  private readonly treeService: TreeService;

  constructor(
    private readonly db: Database,
    commitService?: CommitService,
    repositoryService?: RepositoryService,
    treeService?: TreeService,
  ) {
    this.commitService = commitService || new CommitService(db);
    this.repositoryService = repositoryService || new RepositoryService(db);
    this.treeService = treeService || new TreeService(db);
  }

  async listRefs(input: ListRefsInput, transaction?: Transaction): Promise<VscRefRecord[]> {
    await this.repositoryService.getRepository(input.repoId, transaction);
    const records = await this.db.getRepository('vscFileRefs').find({
      filter: {
        repoId: input.repoId,
        name: 'head',
      },
      sort: ['name'],
      transaction,
    });

    return records.map(refFromRecord);
  }

  async updateRef(input: UpdateRefInput, ctx: RefServiceContext = {}): Promise<UpdateRefResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      if (input.name !== 'head') {
        throw new VscError('PATH_INVALID', `Unsupported ref "${input.name}"`);
      }

      const repository = await this.getWritableRepository(input.repoId, transaction);
      const targetCommit = await this.commitService.getCommit(repository.id, input.targetCommitId, transaction);

      return this.updateHeadRef(repository, targetCommit, transaction);
    });
  }

  async restoreFile(input: RestoreFileInput, ctx: RefServiceContext = {}): Promise<RestoreResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repository = await this.getWritableRepository(input.repoId, transaction);
      const sourceCommit = await this.commitService.getCommit(repository.id, input.sourceCommitId, transaction);
      const headCommit = repository.headCommitId
        ? await this.commitService.getCommit(repository.id, repository.headCommitId, transaction)
        : null;
      const baseEntries = headCommit
        ? await this.treeService.loadTreeEntries(headCommit.treeHash, { transaction })
        : [];
      const sourceEntries = await this.treeService.loadTreeEntries(sourceCommit.treeHash, { transaction });
      const normalizedPath = normalizePath(input.path);
      const sourceEntry = sourceEntries.find((entry) => entry.pathHash === pathHash(normalizedPath)) || null;
      const nextEntries = restorePath(baseEntries, normalizedPath, sourceEntry);
      const nextTreeHash = await this.treeService.hashTree(nextEntries, { transaction });
      const baseTreeHash = headCommit ? headCommit.treeHash : await this.treeService.hashTree([], { transaction });

      if (nextTreeHash === baseTreeHash) {
        throw new VscError('NO_CHANGES', 'Restore does not change the repository tree');
      }

      const tree = await this.treeService.ensureTree(nextEntries, transaction);
      const commit = await this.commitService.createCommit(
        {
          repoId: repository.id,
          seq: repository.headSeq + 1,
          parentCommitId: headCommit?.id || null,
          treeHash: tree.hash,
          message: input.message || `Restore ${normalizedPath}`,
          authorId: input.authorId || ctx.authorId || null,
          metadata: input.metadata,
        },
        transaction,
      );
      const updatedRepository = await this.repositoryService.updateHead(repository, commit.id, commit.seq, transaction);

      return {
        repository: updatedRepository,
        commit,
        tree,
      };
    });
  }

  async restoreCommit(input: RestoreCommitInput, ctx: RefServiceContext = {}): Promise<RestoreResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repository = await this.getWritableRepository(input.repoId, transaction);
      const sourceCommit = await this.commitService.getCommit(repository.id, input.sourceCommitId, transaction);
      const tree = await this.commitService.getTree(sourceCommit.treeHash, transaction);
      const commit = await this.commitService.createCommit(
        {
          repoId: repository.id,
          seq: repository.headSeq + 1,
          parentCommitId: repository.headCommitId,
          treeHash: sourceCommit.treeHash,
          message: input.message || `Restore commit ${sourceCommit.id}`,
          authorId: input.authorId || ctx.authorId || null,
          metadata: input.metadata,
        },
        transaction,
      );
      const updatedRepository = await this.repositoryService.updateHead(repository, commit.id, commit.seq, transaction);

      return {
        repository: updatedRepository,
        commit,
        tree,
      };
    });
  }

  private async updateHeadRef(
    repository: VscRepositoryRecord,
    targetCommit: VscCommitRecord,
    transaction: Transaction,
  ): Promise<UpdateRefResult> {
    if (targetCommit.id === repository.headCommitId) {
      return {
        repository,
        ref: await this.repositoryService.getRef(repository.id, 'head', transaction),
        commit: targetCommit,
      };
    }

    const advancesCurrentHead =
      targetCommit.parentCommitId === repository.headCommitId && targetCommit.seq === repository.headSeq + 1;

    if (!advancesCurrentHead) {
      throw new VscError('BASE_COMMIT_OUTDATED', 'Head can only advance to the next linear commit');
    }

    const updatedRepository = await this.repositoryService.updateHead(
      repository,
      targetCommit.id,
      targetCommit.seq,
      transaction,
    );
    const ref = await this.repositoryService.getRef(repository.id, 'head', transaction);

    return {
      repository: updatedRepository,
      ref,
      commit: targetCommit,
    };
  }

  private async getWritableRepository(repoId: string, transaction: Transaction): Promise<VscRepositoryRecord> {
    const repository = await this.repositoryService.getRepository(repoId, transaction);
    if (repository.status === 'archived') {
      throw new VscError('REPO_ARCHIVED', `Repository "${repository.id}" is archived`);
    }

    return repository;
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

function restorePath(
  baseEntries: VscNormalizedTreeEntry[],
  normalizedPath: string,
  sourceEntry: VscNormalizedTreeEntry | null,
): VscTreeEntryInput[] {
  const targetPathHash = pathHash(normalizedPath);
  const entries = baseEntries
    .filter((entry) => entry.pathHash !== targetPathHash)
    .map((entry) => treeInputFromEntry(entry));

  if (sourceEntry) {
    entries.push({
      path: normalizedPath,
      blobHash: sourceEntry.blobHash,
      size: sourceEntry.size,
      language: sourceEntry.language,
      mode: sourceEntry.mode,
    });
  }

  return entries;
}

function treeInputFromEntry(entry: VscNormalizedTreeEntry): VscTreeEntryInput {
  return {
    path: entry.path,
    blobHash: entry.blobHash,
    size: entry.size,
    language: entry.language,
    mode: entry.mode,
  };
}
