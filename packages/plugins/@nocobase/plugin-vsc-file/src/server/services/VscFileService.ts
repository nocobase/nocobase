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
  VscFileChange,
  VscNormalizedTreeEntry,
  VscRefRecord,
  VscRefName,
  VscRepositoryIdentity,
  VscRepositoryRecord,
  VscStoredBlob,
  VscStoredTree,
  VscTreeEntryInput,
} from '../../shared/types';
import { BlobService } from './BlobService';
import { CanonicalCandidateService, type CanonicalCandidateSnapshot } from './CanonicalCandidateService';
import type { ListCommitsInput } from './CommitService';
import { CommitService } from './CommitService';
import type { DiffCommitsInput, DiffFileEndpoint, DiffFileInput, DiffFileResult, FileDiffResult } from './DiffService';
import { DiffService } from './DiffService';
import type {
  ListRefsInput,
  RestoreCommitInput,
  RestoreFileInput,
  RestoreResult,
  UpdateRefInput,
  UpdateRefResult,
} from './RefService';
import { RefService } from './RefService';
import { RepositoryService } from './RepositoryService';
import { TreeService } from './TreeService';
import { incrementVscFileMetric, type VscFileMetricsCollector } from './VscFileMetrics';
import type { VscPermissionAction, VscPermissionHookInput, VscPermissionRequestMetadata } from '../permissions';
import { VscPermissionHookRegistry } from '../permissions';

export interface VscServiceContext {
  transaction?: Transaction;
  authorId?: string | null;
  request?: VscPermissionRequestMetadata;
  metricsCollector?: VscFileMetricsCollector;
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

export interface RepositoryIdInput {
  repoId: string;
}

export interface GetCommitInput extends RepositoryIdInput {
  commitId: string;
}

export interface PushInput {
  repoId: string;
  baseCommitId: string | null;
  message: string;
  files: VscFileChange[];
  allowEmptyCommit?: boolean;
  authorId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PushResult {
  repository: VscRepositoryRecord;
  commit: VscCommitRecord;
  tree: VscStoredTree;
}

export interface PushWithCandidateOptions {
  validateBaseEntries?: (entries: readonly Readonly<VscNormalizedTreeEntry>[]) => Promise<void> | void;
  measureCandidateMaterialization?: (
    materialize: () => Promise<CanonicalCandidateSnapshot>,
  ) => Promise<CanonicalCandidateSnapshot>;
}

export interface PushWithCandidateResult extends PushResult {
  candidate: CanonicalCandidateSnapshot;
}

export type IncludeContentMode = 'none' | 'selected' | 'all';

export interface PullInput {
  repoId: string;
  ref?: VscRefName;
  knownTreeHash?: string;
  includeContent?: IncludeContentMode;
  selectedPaths?: string[];
}

export interface PullCommitInput {
  repoId: string;
  commitId: string;
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

interface PermissionTarget {
  action: VscPermissionAction;
  repository?: VscRepositoryRecord;
  repoId?: string;
  ownerType?: string;
  ownerId?: string;
  actionMetadata?: Record<string, unknown>;
  targetCommitId?: string;
  sourceCommitId?: string;
  refName?: string;
}

interface InternalPushResult extends PushResult {
  candidate?: CanonicalCandidateSnapshot;
}

export class VscFileService {
  private readonly blobService: BlobService;

  private readonly candidateService: CanonicalCandidateService;

  private readonly treeService: TreeService;

  private readonly repositoryService: RepositoryService;

  private readonly commitService: CommitService;

  private readonly diffService: DiffService;

  private readonly refService: RefService;

  constructor(
    private readonly db: Database,
    private readonly permissionHooks = new VscPermissionHookRegistry(),
  ) {
    this.blobService = new BlobService(db);
    this.candidateService = new CanonicalCandidateService(this.blobService);
    this.treeService = new TreeService(db, this.blobService);
    this.repositoryService = new RepositoryService(db);
    this.commitService = new CommitService(db);
    this.diffService = new DiffService(
      db,
      this.blobService,
      this.commitService,
      this.repositoryService,
      this.treeService,
    );
    this.refService = new RefService(db, this.commitService, this.repositoryService, this.treeService);
  }

  async createRepository(input: CreateRepositoryInput, ctx: VscServiceContext = {}): Promise<CreateRepositoryResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      await this.assertPermission(
        {
          action: 'createRepository',
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          actionMetadata: input.metadata,
        },
        ctx,
      );

      const repository = await this.repositoryService.createRepositoryRecord(input, transaction);
      const initialCommit = input.initialFiles
        ? await this.pushInternal(
            {
              repoId: repository.id,
              baseCommitId: null,
              message: input.message || 'Initial commit',
              files: input.initialFiles,
              allowEmptyCommit: true,
              authorId: input.authorId || ctx.authorId || null,
              metadata: input.metadata,
            },
            { ...ctx, transaction },
            { checkPermission: false },
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
      await this.assertPermission(
        {
          action: 'createRepository',
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          actionMetadata: input.metadata,
        },
        ctx,
      );

      const result = await this.repositoryService.ensureRepositoryRecord(input, transaction);

      if (!result.created || !input.initialFiles) {
        return {
          repository: result.repository,
          initialCommit: null,
        };
      }

      const initialCommit = await this.pushInternal(
        {
          repoId: result.repository.id,
          baseCommitId: null,
          message: input.message || 'Initial commit',
          files: input.initialFiles,
          allowEmptyCommit: true,
          authorId: input.authorId || ctx.authorId || null,
          metadata: input.metadata,
        },
        { ...ctx, transaction },
        { checkPermission: false },
      );

      return {
        repository: initialCommit.repository,
        initialCommit: initialCommit.commit,
      };
    });
  }

  async getRepository(input: RepositoryIdInput, ctx: VscServiceContext = {}): Promise<VscRepositoryRecord> {
    const repository = await this.repositoryService.getRepository(input.repoId, ctx.transaction);
    await this.assertPermission({ action: 'getRepository', repository }, ctx);
    return repository;
  }

  async getRepositoryForUpdate(input: RepositoryIdInput, ctx: VscServiceContext): Promise<VscRepositoryRecord> {
    if (!ctx.transaction) {
      throw new VscError('INTERNAL_ERROR', 'A transaction is required to lock a repository');
    }

    const repository = await this.repositoryService.getRepositoryForUpdate(input.repoId, ctx.transaction);
    await this.assertPermission({ action: 'getRepository', repository }, ctx);
    return repository;
  }

  async archiveRepository(input: RepositoryIdInput, ctx: VscServiceContext = {}): Promise<VscRepositoryRecord> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repository = await this.repositoryService.getRepositoryForUpdate(input.repoId, transaction);
      await this.assertPermission({ action: 'archiveRepository', repository }, ctx);
      return this.repositoryService.archiveRepository(input.repoId, transaction);
    });
  }

  async listCommits(input: ListCommitsInput, ctx: VscServiceContext = {}): Promise<VscCommitRecord[]> {
    const repository = await this.repositoryService.getRepository(input.repoId, ctx.transaction);
    await this.assertPermission({ action: 'listCommits', repository }, ctx);
    return this.commitService.listCommits(input, ctx.transaction);
  }

  async getCommit(input: GetCommitInput, ctx: VscServiceContext = {}): Promise<VscCommitRecord> {
    const repository = await this.repositoryService.getRepository(input.repoId, ctx.transaction);
    await this.assertPermission(
      {
        action: 'getCommit',
        repository,
        targetCommitId: input.commitId,
      },
      ctx,
    );
    return this.commitService.getCommit(input.repoId, input.commitId, ctx.transaction);
  }

  async pull(input: PullInput, ctx: VscServiceContext = {}): Promise<PullResult> {
    const repository = await this.repositoryService.getRepository(input.repoId, ctx.transaction);
    await this.assertPermission(
      {
        action: 'pull',
        repository,
        refName: input.ref,
      },
      ctx,
    );

    const resolved = await this.resolveRef(repository, ctx.transaction);

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

    const files = await this.loadFiles(resolved.commit.treeHash, input, ctx.transaction, ctx.metricsCollector);

    return {
      repository: resolved.repository,
      commit: resolved.commit,
      tree,
      unchanged: false,
      files,
    };
  }

  async pullCommit(input: PullCommitInput, ctx: VscServiceContext = {}): Promise<PullResult> {
    const repository = await this.repositoryService.getRepository(input.repoId, ctx.transaction);
    await this.assertPermission(
      {
        action: 'pull',
        repository,
        targetCommitId: input.commitId,
      },
      ctx,
    );

    const commit = await this.commitService.getCommit(input.repoId, input.commitId, ctx.transaction);
    const tree = await this.commitService.getTree(commit.treeHash, ctx.transaction);
    if (input.knownTreeHash && input.knownTreeHash === tree.hash) {
      return {
        repository,
        commit,
        tree,
        unchanged: true,
      };
    }

    const files = await this.loadFiles(
      tree.hash,
      {
        repoId: input.repoId,
        includeContent: input.includeContent,
        selectedPaths: input.selectedPaths,
      },
      ctx.transaction,
      ctx.metricsCollector,
    );

    return {
      repository,
      commit,
      tree,
      unchanged: false,
      files,
    };
  }

  async getFile(input: GetFileInput, ctx: VscServiceContext = {}): Promise<GetFileResult> {
    const repository = await this.repositoryService.getRepository(input.repoId, ctx.transaction);
    await this.assertPermission(
      {
        action: 'getFile',
        repository,
        refName: input.ref,
      },
      ctx,
    );

    const resolved = await this.resolveRef(repository, ctx.transaction);
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

  async diff(input: DiffCommitsInput, ctx: VscServiceContext = {}): Promise<FileDiffResult> {
    return this.diffCommits(input, ctx);
  }

  async diffCommits(input: DiffCommitsInput, ctx: VscServiceContext = {}): Promise<FileDiffResult> {
    const repository = await this.repositoryService.getRepository(input.repoId, ctx.transaction);
    await this.assertPermission(
      {
        action: 'diff',
        repository,
        sourceCommitId: input.fromCommitId,
        targetCommitId: input.toCommitId,
      },
      ctx,
    );
    return this.diffService.diffCommits(input, ctx.transaction);
  }

  async diffFile(input: DiffFileInput, ctx: VscServiceContext = {}): Promise<DiffFileResult> {
    const repository = await this.repositoryService.getRepository(input.repoId, ctx.transaction);
    await this.assertPermission({ action: 'diffFile', repository }, ctx);
    this.assertDiffFileEndpointsAllowed(input);
    return this.diffService.diffFile(input, ctx.transaction);
  }

  async listRefs(input: ListRefsInput, ctx: VscServiceContext = {}): Promise<VscRefRecord[]> {
    const repository = await this.repositoryService.getRepository(input.repoId, ctx.transaction);
    await this.assertPermission({ action: 'listRefs', repository }, ctx);
    return this.refService.listRefs(input, ctx.transaction);
  }

  async updateRef(input: UpdateRefInput, ctx: VscServiceContext = {}): Promise<UpdateRefResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repository = await this.repositoryService.getRepository(input.repoId, transaction);
      await this.assertPermission(
        {
          action: 'updateRef',
          repository,
          targetCommitId: input.targetCommitId,
          refName: input.name,
        },
        ctx,
      );
      return this.refService.updateRef(input, { ...ctx, transaction });
    });
  }

  async restoreFile(input: RestoreFileInput, ctx: VscServiceContext = {}): Promise<RestoreResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repository = await this.repositoryService.getRepository(input.repoId, transaction);
      await this.assertPermission(
        {
          action: 'restoreFile',
          repository,
          sourceCommitId: input.sourceCommitId,
        },
        ctx,
      );
      return this.refService.restoreFile(input, { ...ctx, transaction });
    });
  }

  async restoreCommit(input: RestoreCommitInput, ctx: VscServiceContext = {}): Promise<RestoreResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repository = await this.repositoryService.getRepository(input.repoId, transaction);
      await this.assertPermission(
        {
          action: 'restoreCommit',
          repository,
          sourceCommitId: input.sourceCommitId,
        },
        ctx,
      );
      return this.refService.restoreCommit(input, { ...ctx, transaction });
    });
  }

  async push(input: PushInput, ctx: VscServiceContext = {}): Promise<PushResult> {
    const result = await this.pushInternal(input, ctx, {
      checkPermission: true,
      materializeCandidate: false,
    });

    return {
      repository: result.repository,
      commit: result.commit,
      tree: result.tree,
    };
  }

  async pushWithCandidate(
    input: PushInput,
    ctx: VscServiceContext = {},
    options: PushWithCandidateOptions = {},
  ): Promise<PushWithCandidateResult> {
    const result = await this.pushInternal(input, ctx, {
      checkPermission: true,
      materializeCandidate: true,
      validateBaseEntries: options.validateBaseEntries,
      measureCandidateMaterialization: options.measureCandidateMaterialization,
    });
    if (!result.candidate) {
      throw new VscError('INTERNAL_ERROR', 'Canonical candidate snapshot was not materialized');
    }

    return {
      repository: result.repository,
      commit: result.commit,
      tree: result.tree,
      candidate: result.candidate,
    };
  }

  private async pushInternal(
    input: PushInput,
    ctx: VscServiceContext,
    options: {
      checkPermission: boolean;
      materializeCandidate?: boolean;
      validateBaseEntries?: PushWithCandidateOptions['validateBaseEntries'];
      measureCandidateMaterialization?: PushWithCandidateOptions['measureCandidateMaterialization'];
    },
  ): Promise<InternalPushResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repository = await this.repositoryService.getRepository(input.repoId, transaction);
      if (options.checkPermission) {
        await this.assertPermission(
          {
            action: 'push',
            repository,
            actionMetadata: input.metadata,
          },
          ctx,
        );
      }
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
      if (options.validateBaseEntries) {
        await options.validateBaseEntries(Object.freeze(baseEntries.map((entry) => Object.freeze({ ...entry }))));
      }
      const allowedBlobHashes = new Set(baseEntries.map((entry) => entry.blobHash));
      const nextEntries = this.applyFileChanges(baseEntries, input.files, allowedBlobHashes);
      const preparedTree = await this.treeService.prepareTree(nextEntries, {
        transaction,
        metricsCollector: ctx.metricsCollector,
      });
      const baseTreeHash = baseCommit?.treeHash || this.treeService.emptyTreeHash;

      if (preparedTree.hash === baseTreeHash && !input.allowEmptyCommit) {
        throw new VscError('NO_CHANGES', 'Push does not change the repository tree');
      }

      const tree = await this.treeService.ensurePreparedTree(preparedTree, transaction);
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

      const materializeCandidate = () =>
        this.candidateService.materialize(
          {
            baseCommit,
            baseEntries,
            commit,
            tree,
            preparedTree,
          },
          {
            transaction,
            metricsCollector: ctx.metricsCollector,
          },
        );
      const candidate = options.materializeCandidate
        ? options.measureCandidateMaterialization
          ? await options.measureCandidateMaterialization(materializeCandidate)
          : await materializeCandidate()
        : undefined;

      return {
        repository: updatedRepository,
        commit,
        tree,
        candidate,
      };
    });
  }

  private async assertPermission(target: PermissionTarget, ctx: VscServiceContext): Promise<void> {
    const repository = target.repository ? { ...target.repository } : undefined;
    const input: VscPermissionHookInput = {
      userId: ctx.authorId ?? null,
      action: target.action,
      repoId: repository?.id || target.repoId,
      repository,
      ownerType: repository?.ownerType || target.ownerType,
      ownerId: repository?.ownerId || target.ownerId,
      request: ctx.request,
      actionMetadata: target.actionMetadata,
      targetCommitId: target.targetCommitId,
      sourceCommitId: target.sourceCommitId,
      refName: target.refName,
    };

    await this.permissionHooks.assertAllowed(input);
  }

  private assertDiffFileEndpointsAllowed(input: DiffFileInput): void {
    if (isBlobDiffEndpoint(input.from) || isBlobDiffEndpoint(input.to)) {
      throw new VscError('PERMISSION_DENIED', 'Raw blob diff endpoints are not allowed through the public service');
    }
  }

  private applyFileChanges(
    baseEntries: VscNormalizedTreeEntry[],
    changes: VscFileChange[],
    allowedBlobHashes: Set<string>,
  ): VscTreeEntryInput[] {
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

      if (typeof change.content !== 'string' && change.blobHash && !allowedBlobHashes.has(change.blobHash)) {
        throw new VscError('PERMISSION_DENIED', 'Blob hash is not available in the current repository context');
      }

      const currentEntry = entriesByPath.get(normalizedPath);
      entriesByPath.set(normalizedPath, {
        path: normalizedPath,
        content: change.content,
        blobHash: change.blobHash,
        size: change.size,
        language: change.language || currentEntry?.language,
        mode: change.mode || currentEntry?.mode,
      });
    }

    return Array.from(entriesByPath.values());
  }

  private async resolveRef(repository: VscRepositoryRecord, transaction?: Transaction): Promise<ResolvedRef> {
    if (!repository.headCommitId) {
      return {
        repository,
        commit: null,
      };
    }

    return {
      repository,
      commit: await this.commitService.getCommit(repository.id, repository.headCommitId, transaction),
    };
  }

  private async loadFiles(
    treeHash: string,
    input: PullInput,
    transaction?: Transaction,
    metricsCollector?: VscFileMetricsCollector,
  ): Promise<PulledFile[]> {
    const includeContent = input.includeContent || 'none';
    const selectedPathSet =
      includeContent === 'selected' ? new Set((input.selectedPaths || []).map((path) => normalizePath(path))) : null;
    const entries = await this.treeService.loadTreeEntries(treeHash, { transaction });
    const entriesWithContent = entries.filter((entry) => includeContent === 'all' || selectedPathSet?.has(entry.path));
    let blobs = new Map<string, VscStoredBlob>();
    if (entriesWithContent.length) {
      incrementVscFileMetric(metricsCollector, 'blobContentQueryCount');
      blobs = await this.blobService.loadBlobs(
        entriesWithContent.map((entry) => entry.blobHash),
        { transaction },
      );
      incrementVscFileMetric(metricsCollector, 'blobContentRowCount', blobs.size);
    }

    return entries.map((entry) => {
      const shouldLoadContent = includeContent === 'all' || selectedPathSet?.has(entry.path);
      if (!shouldLoadContent) {
        return entry;
      }

      const blob = blobs.get(entry.blobHash);
      if (!blob) {
        throw new VscError('BLOB_NOT_FOUND', `Blob "${entry.blobHash}" was not found`);
      }
      return {
        ...entry,
        content: blob.content,
      };
    });
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

function isBlobDiffEndpoint(endpoint: DiffFileEndpoint | null | undefined): boolean {
  return endpoint?.type === 'blob';
}
