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
  VscDraftRecord,
  VscFileChange,
  VscNormalizedTreeEntry,
  VscRefName,
  VscRepositoryIdentity,
  VscRepositoryRecord,
  VscStoredBlob,
  VscStoredTree,
  VscTreeEntryInput,
} from '../../shared/types';
import { BlobService } from './BlobService';
import { CommitService } from './CommitService';
import type {
  ActiveDraftResult,
  DiscardDraftInput,
  GetDraftInput,
  SaveDraftInput,
  VscDraftWritePermissionChecker,
} from './DraftService';
import { DraftService } from './DraftService';
import { RepositoryService } from './RepositoryService';
import { TreeService } from './TreeService';

export interface VscServiceContext {
  transaction?: Transaction;
  authorId?: string | null;
  assertCanWrite?: VscDraftWritePermissionChecker;
}

export interface CreateRepositoryInput extends VscRepositoryIdentity {
  initialFiles?: VscTreeEntryInput[];
  message?: string;
  authorId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateRepositoryResult {
  repository: VscRepositoryRecord;
  initialCommit: VscCommitRecord | null;
}

export type EnsureRepositoryInput = CreateRepositoryInput;

export interface PushInput {
  repoId: string;
  baseCommitId: string | null;
  message: string;
  files: VscFileChange[];
  allowEmptyCommit?: boolean;
  draftId?: string;
  authorId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PushResult {
  repository: VscRepositoryRecord;
  commit: VscCommitRecord;
  tree: VscStoredTree;
}

export type IncludeContentMode = 'none' | 'selected' | 'all';

export interface PullInput {
  repoId: string;
  ref?: VscRefName;
  knownTreeHash?: string;
  includeContent?: IncludeContentMode;
  selectedPaths?: string[];
}

export interface PulledFile extends VscNormalizedTreeEntry {
  content?: string;
}

export interface PullResult {
  repository: VscRepositoryRecord;
  commit: VscCommitRecord | null;
  tree: VscStoredTree | null;
  unchanged: boolean;
  files?: PulledFile[];
}

export interface GetFileInput {
  repoId: string;
  ref?: VscRefName;
  path: string;
}

export interface GetFileResult extends VscNormalizedTreeEntry {
  content: string;
}

interface ResolvedRef {
  repository: VscRepositoryRecord;
  commit: VscCommitRecord | null;
}

export class VscFileService {
  private readonly blobService: BlobService;

  private readonly treeService: TreeService;

  private readonly repositoryService: RepositoryService;

  private readonly commitService: CommitService;

  private readonly draftService: DraftService;

  constructor(private readonly db: Database) {
    this.blobService = new BlobService(db);
    this.treeService = new TreeService(db, this.blobService);
    this.repositoryService = new RepositoryService(db);
    this.commitService = new CommitService(db);
    this.draftService = new DraftService(db, this.blobService, this.repositoryService);
  }

  async createRepository(input: CreateRepositoryInput, ctx: VscServiceContext = {}): Promise<CreateRepositoryResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repository = await this.repositoryService.createRepositoryRecord(input, transaction);
      const initialCommit = input.initialFiles
        ? await this.push(
            {
              repoId: repository.id,
              baseCommitId: null,
              message: input.message || 'Initial commit',
              files: input.initialFiles,
              allowEmptyCommit: true,
              authorId: input.authorId,
              metadata: input.metadata,
            },
            { ...ctx, transaction },
          )
        : null;

      return {
        repository: initialCommit?.repository || repository,
        initialCommit: initialCommit?.commit || null,
      };
    });
  }

  async ensureRepository(input: EnsureRepositoryInput, ctx: VscServiceContext = {}): Promise<CreateRepositoryResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const result = await this.repositoryService.ensureRepositoryRecord(input, transaction);

      if (!result.created || !input.initialFiles) {
        return {
          repository: result.repository,
          initialCommit: null,
        };
      }

      const initialCommit = await this.push(
        {
          repoId: result.repository.id,
          baseCommitId: null,
          message: input.message || 'Initial commit',
          files: input.initialFiles,
          allowEmptyCommit: true,
          authorId: input.authorId,
          metadata: input.metadata,
        },
        { ...ctx, transaction },
      );

      return {
        repository: initialCommit.repository,
        initialCommit: initialCommit.commit,
      };
    });
  }

  async pull(input: PullInput, ctx: VscServiceContext = {}): Promise<PullResult> {
    const resolved = await this.resolveRef(input.repoId, input.ref, ctx.transaction);

    if (!resolved.commit) {
      return {
        repository: resolved.repository,
        commit: null,
        tree: null,
        unchanged: false,
        files: [],
      };
    }

    const tree = await this.commitService.getTree(resolved.commit.treeHash, ctx.transaction);
    if (input.knownTreeHash && input.knownTreeHash === tree.hash) {
      return {
        repository: resolved.repository,
        commit: resolved.commit,
        tree,
        unchanged: true,
      };
    }

    const files = await this.loadFiles(resolved.commit.treeHash, input, ctx.transaction);

    return {
      repository: resolved.repository,
      commit: resolved.commit,
      tree,
      unchanged: false,
      files,
    };
  }

  async getFile(input: GetFileInput, ctx: VscServiceContext = {}): Promise<GetFileResult> {
    const resolved = await this.resolveRef(input.repoId, input.ref, ctx.transaction);
    if (!resolved.commit) {
      throw new VscError('FILE_NOT_FOUND', `File "${input.path}" was not found`);
    }

    const normalizedPath = normalizePath(input.path);
    const entry = await this.findTreeEntry(resolved.commit.treeHash, normalizedPath, ctx.transaction);
    const blob = await this.getBlob(entry.blobHash, ctx.transaction);

    return {
      ...entry,
      content: blob.content,
    };
  }

  async getDraft(input: GetDraftInput, ctx: VscServiceContext = {}): Promise<ActiveDraftResult | null> {
    return this.draftService.getDraft(input, ctx);
  }

  async saveDraft(input: SaveDraftInput, ctx: VscServiceContext = {}): Promise<ActiveDraftResult> {
    return this.draftService.saveDraft(input, ctx);
  }

  async discardDraft(input: DiscardDraftInput, ctx: VscServiceContext = {}): Promise<VscDraftRecord | null> {
    return this.draftService.discardDraft(input, ctx);
  }

  async push(input: PushInput, ctx: VscServiceContext = {}): Promise<PushResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repository = await this.repositoryService.getRepository(input.repoId, transaction);
      if (repository.status === 'archived') {
        throw new VscError('REPO_ARCHIVED', `Repository "${repository.id}" is archived`);
      }
      if (repository.headCommitId !== input.baseCommitId) {
        throw new VscError('BASE_COMMIT_OUTDATED', 'Base commit is no longer the repository head', {
          details: {
            expected: repository.headCommitId,
            received: input.baseCommitId,
          },
        });
      }

      const baseCommit = input.baseCommitId
        ? await this.commitService.getCommit(repository.id, input.baseCommitId, transaction)
        : null;
      const baseEntries = baseCommit
        ? await this.treeService.loadTreeEntries(baseCommit.treeHash, { transaction })
        : [];
      const nextEntries = this.applyFileChanges(baseEntries, input.files);
      const nextTreeHash = await this.treeService.hashTree(nextEntries, { transaction });
      const baseTreeHash = baseCommit ? baseCommit.treeHash : await this.treeService.hashTree([], { transaction });

      if (nextTreeHash === baseTreeHash && !input.allowEmptyCommit) {
        throw new VscError('NO_CHANGES', 'Push does not change the repository tree');
      }

      const tree = await this.treeService.ensureTree(nextEntries, transaction);
      const commit = await this.commitService.createCommit(
        {
          repoId: repository.id,
          seq: repository.headSeq + 1,
          parentCommitId: baseCommit?.id || null,
          treeHash: tree.hash,
          message: input.message,
          authorId: input.authorId || ctx.authorId || null,
          metadata: input.metadata,
        },
        transaction,
      );
      const updatedRepository = await this.repositoryService.updateHead(repository, commit.id, commit.seq, transaction);

      if (input.draftId) {
        await this.draftService.markDraftCommitted(
          {
            draftId: input.draftId,
            repoId: repository.id,
            baseCommitId: input.baseCommitId,
          },
          transaction,
        );
      }

      return {
        repository: updatedRepository,
        commit,
        tree,
      };
    });
  }

  private applyFileChanges(baseEntries: VscNormalizedTreeEntry[], changes: VscFileChange[]): VscTreeEntryInput[] {
    const entriesByPath = new Map<string, VscTreeEntryInput>();

    for (const entry of baseEntries) {
      entriesByPath.set(entry.path, {
        path: entry.path,
        blobHash: entry.blobHash,
        size: entry.size,
        language: entry.language,
        mode: entry.mode,
      });
    }

    for (const change of changes) {
      const normalizedPath = normalizePath(change.path);
      const operation = change.operation || 'upsert';

      if (operation === 'delete') {
        entriesByPath.delete(normalizedPath);
        continue;
      }
      if (operation !== 'upsert') {
        throw new VscError('PATH_INVALID', `Unsupported file operation "${operation}"`);
      }

      entriesByPath.set(normalizedPath, {
        path: normalizedPath,
        content: change.content,
        blobHash: change.blobHash,
        size: change.size,
        language: change.language,
        mode: change.mode,
      });
    }

    return Array.from(entriesByPath.values());
  }

  private async resolveRef(repoId: string, refName?: VscRefName, transaction?: Transaction): Promise<ResolvedRef> {
    const repository = await this.repositoryService.getRepository(repoId, transaction);
    const ref = await this.repositoryService.getRef(repoId, refName || repository.defaultRef, transaction);

    if (!ref.commitId) {
      return {
        repository,
        commit: null,
      };
    }

    return {
      repository,
      commit: await this.commitService.getCommit(repoId, ref.commitId, transaction),
    };
  }

  private async loadFiles(treeHash: string, input: PullInput, transaction?: Transaction): Promise<PulledFile[]> {
    const includeContent = input.includeContent || 'none';
    const selectedPathSet =
      includeContent === 'selected' ? new Set((input.selectedPaths || []).map((path) => normalizePath(path))) : null;
    const entries = await this.treeService.loadTreeEntries(treeHash, { transaction });
    const files: PulledFile[] = [];

    for (const entry of entries) {
      const shouldLoadContent = includeContent === 'all' || selectedPathSet?.has(entry.path);
      if (!shouldLoadContent) {
        files.push(entry);
        continue;
      }

      const blob = await this.getBlob(entry.blobHash, transaction);
      files.push({
        ...entry,
        content: blob.content,
      });
    }

    return files;
  }

  private async findTreeEntry(
    treeHash: string,
    normalizedPath: string,
    transaction?: Transaction,
  ): Promise<VscNormalizedTreeEntry> {
    const record = await this.db.getRepository('vscFileTreeEntries').findOne({
      filter: {
        treeHash,
        pathHash: pathHash(normalizedPath),
      },
      transaction,
    });

    if (!record) {
      throw new VscError('FILE_NOT_FOUND', `File "${normalizedPath}" was not found`);
    }

    return {
      path: record.get('path') as string,
      pathHash: record.get('pathHash') as string,
      pathLowerHash: record.get('pathLowerHash') as string,
      blobHash: record.get('blobHash') as string,
      size: record.get('size') as number,
      language: record.get('language') as string,
      mode: record.get('mode') as string,
    };
  }

  private async getBlob(blobHash: string, transaction?: Transaction): Promise<VscStoredBlob> {
    const record = await this.db.getRepository('vscFileBlobs').findOne({
      filterByTk: blobHash,
      transaction,
    });

    if (!record) {
      throw new VscError('BLOB_NOT_FOUND', `Blob "${blobHash}" was not found`);
    }

    return {
      hash: record.get('hash') as string,
      size: record.get('size') as number,
      content: record.get('content') as string,
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
