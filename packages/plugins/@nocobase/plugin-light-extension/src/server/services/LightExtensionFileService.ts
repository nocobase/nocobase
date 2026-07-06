/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import type { VscCommitRecord, VscFileChange, VscPermissionAction } from '@nocobase/plugin-vsc-file';
import { isVscError } from '@nocobase/plugin-vsc-file';
import { VscFileService, VscPermissionHookRegistry } from '@nocobase/plugin-vsc-file';
import { randomUUID } from 'crypto';
import { posix as pathPosix } from 'path';

import type { LightExtensionAclAction } from '../../constants';
import { LightExtensionError, isLightExtensionError } from '../../shared/errors';
import type {
  LightExtensionCommitRecord,
  LightExtensionFileChange,
  LightExtensionFileResult,
  LightExtensionIncludeContentMode,
  LightExtensionPullResult,
  LightExtensionPulledFile,
  LightExtensionPushInput,
  LightExtensionPushResult,
} from '../../shared/types';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import type { LightExtensionRepoInternalRecord, LightExtensionServiceContext } from './LightExtensionRepoService';
import { LightExtensionRepoService, stripInternalRepo } from './LightExtensionRepoService';
import { LightExtensionValidator, hasErrorDiagnostic } from './LightExtensionValidator';
import { normalizeVscBridgeError } from './errorContract';

export interface LightExtensionPullInput {
  repoId: string;
  ref?: string;
  knownTreeHash?: string;
  includeContent?: LightExtensionIncludeContentMode;
  selectedPaths?: string[];
}

export interface LightExtensionGetFileInput {
  repoId: string;
  ref?: string;
  path: string;
}

export interface LightExtensionListCommitsInput {
  repoId: string;
  limit?: number;
  beforeSeq?: number;
}

export interface LightExtensionGetCommitInput {
  repoId: string;
  commitId: string;
}

export interface LightExtensionDiffInput {
  repoId: string;
  fromCommitId: string;
  toCommitId: string;
}

export interface LightExtensionDiffFileEndpoint {
  type: 'commit';
  commitId: string;
  path: string;
}

export interface LightExtensionDiffFileInput {
  repoId: string;
  from?: LightExtensionDiffFileEndpoint | null;
  to?: LightExtensionDiffFileEndpoint | null;
}

export class LightExtensionFileService {
  private readonly repoService: LightExtensionRepoService;

  private vscFileService: VscFileService;

  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly permissionService: LightExtensionPermissionService,
    repoService?: LightExtensionRepoService,
    permissionHooks?: VscPermissionHookRegistry,
    private readonly validator = new LightExtensionValidator(),
  ) {
    this.repoService = repoService || new LightExtensionRepoService(db, auditService, permissionService);
    this.useVscPermissionHookRegistry(
      permissionHooks || createLocalLightExtensionPermissionRegistry(permissionService),
    );
  }

  useVscPermissionHookRegistry(permissionHooks: VscPermissionHookRegistry): void {
    this.vscFileService = new VscFileService(this.db, permissionHooks);
    this.repoService.useVscPermissionHookRegistry(permissionHooks);
  }

  async pull(
    input: LightExtensionPullInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPullResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repo = await this.repoService.getInternalRepo(input.repoId, { ...ctx, transaction });
      assertRepoNotArchived(repo, 'read source');
      return this.pullInternal(repo, input, ctx, transaction, 'readSource');
    });
  }

  async getFile(
    input: LightExtensionGetFileInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionFileResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repo = await this.repoService.getInternalRepo(input.repoId, { ...ctx, transaction });
      assertRepoNotArchived(repo, 'read source');
      return this.getFileInternal(repo, input, ctx, transaction, 'readSource');
    });
  }

  async readArchivedSource(
    input: LightExtensionGetFileInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionFileResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repo = await this.repoService.getInternalRepo(input.repoId, { ...ctx, transaction });
      assertRepoArchived(repo, 'read archived source');
      return this.getFileInternal(repo, input, ctx, transaction, 'readArchivedSource');
    });
  }

  async push(
    input: LightExtensionPushInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPushResult> {
    const requestId = getRequestId(ctx);

    try {
      return await this.withTransaction(ctx.transaction, async (transaction) => {
        const repo = await this.repoService.lockInternalRepoForUpdate(input.repoId, { ...ctx, transaction });
        assertRepoNotArchived(repo, 'write source');
        const current = await this.pullInternal(
          repo,
          {
            repoId: repo.id,
            includeContent: 'all',
          },
          {
            ...ctx,
            requestId,
          },
          transaction,
          'writeSource',
        );
        this.assertValidSyncBatch(input.files, current.files || []);
        this.assertValidWorkspaceAfterPush(current.files || [], input);

        const result = await this.runVsc(repo.id, () =>
          this.vscFileService.push(
            {
              repoId: repo.vscRepoId,
              baseCommitId: input.baseCommitId,
              message: input.message,
              files: input.files.map(toVscFileChange),
              allowEmptyCommit: input.allowEmptyCommit,
              authorId: ctx.actorUserId || null,
              metadata: buildSourceCommitMetadata(repo.id, requestId, ctx),
            },
            this.createVscContext({
              ctx,
              transaction,
              requestId,
              repoId: repo.id,
              aclAction: 'writeSource',
              reason: 'write light-extension source files',
              allowedActions: ['push'],
            }),
          ),
        );

        await this.db.getRepository('lightExtensionRepos').update({
          filterByTk: repo.id,
          values: {
            headCommitId: result.repository.headCommitId || null,
            version: repo.version + 1,
          },
          transaction,
        });
        const updatedRepo = await this.repoService.getInternalRepo(repo.id, { ...ctx, transaction });

        await this.auditService.recordFileWrite({
          repoId: repo.id,
          action: 'sourcePush',
          result: 'success',
          requestId,
          actorUserId: ctx.actorUserId,
          baseCommitId: input.baseCommitId,
          commitId: result.commit.id,
          message: 'Light extension source files committed',
          files: input.files.map(summarizeFileChange),
          details: {
            treeHash: result.tree.hash,
          },
          transaction,
        });

        return {
          repo: stripInternalRepo(updatedRepo),
          commit: toPublicCommit(result.commit, repo.id),
          tree: result.tree,
        };
      });
    } catch (error) {
      await this.recordRejectedPush(input, ctx, requestId, error);
      throw normalizeVscBridgeError(error, input.repoId);
    }
  }

  private assertValidSyncBatch(
    files: LightExtensionFileChange[],
    existingFiles: LightExtensionPulledFile[] = [],
  ): void {
    const diagnostics = this.validator.validateSyncBatch({
      files,
      existingPaths: existingFiles.map((file) => file.path),
    });
    if (!hasErrorDiagnostic(diagnostics)) {
      return;
    }

    throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension source batch is invalid', {
      details: {
        diagnostics,
      },
    });
  }

  private assertValidWorkspaceAfterPush(
    currentFiles: LightExtensionPulledFile[],
    input: LightExtensionPushInput,
  ): void {
    const validation = this.validator.validateWorkspace({
      files: applyLightExtensionFileChanges(currentFiles, input.files),
    });

    if (!hasErrorDiagnostic(validation.diagnostics)) {
      return;
    }

    throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension source workspace is invalid', {
      details: {
        diagnostics: validation.diagnostics,
      },
    });
  }

  async listCommits(
    input: LightExtensionListCommitsInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionCommitRecord[]> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repo = await this.repoService.getInternalRepo(input.repoId, { ...ctx, transaction });
      assertRepoNotArchived(repo, 'read source');
      const commits = await this.runVsc(repo.id, () =>
        this.vscFileService.listCommits(
          {
            repoId: repo.vscRepoId,
            limit: input.limit,
            beforeSeq: input.beforeSeq,
          },
          this.createVscContext({
            ctx,
            transaction,
            requestId: getRequestId(ctx),
            repoId: repo.id,
            aclAction: 'readSource',
            reason: 'read light-extension source history',
            allowedActions: ['listCommits'],
          }),
        ),
      );

      return commits.map((commit) => toPublicCommit(commit, repo.id));
    });
  }

  async getCommit(
    input: LightExtensionGetCommitInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionCommitRecord> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repo = await this.repoService.getInternalRepo(input.repoId, { ...ctx, transaction });
      assertRepoNotArchived(repo, 'read source');
      const commit = await this.runVsc(repo.id, () =>
        this.vscFileService.getCommit(
          {
            repoId: repo.vscRepoId,
            commitId: input.commitId,
          },
          this.createVscContext({
            ctx,
            transaction,
            requestId: getRequestId(ctx),
            repoId: repo.id,
            aclAction: 'readSource',
            reason: 'read light-extension source commit',
            allowedActions: ['getCommit'],
          }),
        ),
      );

      return toPublicCommit(commit, repo.id);
    });
  }

  async diff(input: LightExtensionDiffInput, ctx: LightExtensionServiceContext = {}) {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repo = await this.repoService.getInternalRepo(input.repoId, { ...ctx, transaction });
      assertRepoNotArchived(repo, 'read source');
      return this.runVsc(repo.id, () =>
        this.vscFileService.diff(
          {
            repoId: repo.vscRepoId,
            fromCommitId: input.fromCommitId,
            toCommitId: input.toCommitId,
          },
          this.createVscContext({
            ctx,
            transaction,
            requestId: getRequestId(ctx),
            repoId: repo.id,
            aclAction: 'readSource',
            reason: 'diff light-extension source commits',
            allowedActions: ['diff'],
          }),
        ),
      );
    });
  }

  async diffFile(input: LightExtensionDiffFileInput, ctx: LightExtensionServiceContext = {}) {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repo = await this.repoService.getInternalRepo(input.repoId, { ...ctx, transaction });
      assertRepoNotArchived(repo, 'read source');
      return this.runVsc(repo.id, () =>
        this.vscFileService.diffFile(
          {
            repoId: repo.vscRepoId,
            from: input.from,
            to: input.to,
          },
          this.createVscContext({
            ctx,
            transaction,
            requestId: getRequestId(ctx),
            repoId: repo.id,
            aclAction: 'readSource',
            reason: 'diff light-extension source file',
            allowedActions: ['diffFile'],
          }),
        ),
      );
    });
  }

  private async pullInternal(
    repo: LightExtensionRepoInternalRecord,
    input: LightExtensionPullInput,
    ctx: LightExtensionServiceContext,
    transaction: Transaction,
    aclAction: LightExtensionAclAction,
  ): Promise<LightExtensionPullResult> {
    const result = await this.runVsc(repo.id, () =>
      this.vscFileService.pull(
        {
          repoId: repo.vscRepoId,
          ref: input.ref,
          knownTreeHash: input.knownTreeHash,
          includeContent: input.includeContent,
          selectedPaths: input.selectedPaths,
        },
        this.createVscContext({
          ctx,
          transaction,
          requestId: getRequestId(ctx),
          repoId: repo.id,
          aclAction,
          reason: 'read light-extension source tree',
          allowedActions: ['pull'],
        }),
      ),
    );

    return {
      repo: stripInternalRepo(repo),
      commit: result.commit ? toPublicCommit(result.commit, repo.id) : null,
      tree: result.tree,
      unchanged: result.unchanged,
      files: result.files as LightExtensionPulledFile[] | undefined,
    };
  }

  private async getFileInternal(
    repo: LightExtensionRepoInternalRecord,
    input: LightExtensionGetFileInput,
    ctx: LightExtensionServiceContext,
    transaction: Transaction,
    aclAction: LightExtensionAclAction,
  ): Promise<LightExtensionFileResult> {
    const result = await this.runVsc(repo.id, () =>
      this.vscFileService.getFile(
        {
          repoId: repo.vscRepoId,
          ref: input.ref,
          path: input.path,
        },
        this.createVscContext({
          ctx,
          transaction,
          requestId: getRequestId(ctx),
          repoId: repo.id,
          aclAction,
          reason: 'read light-extension source file',
          allowedActions: ['getFile'],
        }),
      ),
    );

    return result;
  }

  private async runVsc<T>(repoId: string, run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      throw normalizeVscBridgeError(error, repoId);
    }
  }

  private createVscContext(input: {
    ctx: LightExtensionServiceContext;
    transaction: Transaction;
    requestId: string;
    repoId: string;
    reason: string;
    allowedActions: readonly VscPermissionAction[];
    aclAction: LightExtensionAclAction;
  }) {
    return {
      transaction: input.transaction,
      authorId: input.ctx.actorUserId || null,
      request: this.permissionService.createInternalVscRequestContext({
        requestId: input.requestId,
        reason: input.reason,
        allowedActions: input.allowedActions,
        actorUserId: input.ctx.actorUserId,
        lightExtensionRepoId: input.repoId,
        aclAction: input.aclAction,
        requestSource: input.ctx.requestSource,
      }),
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

  private async recordRejectedPush(
    input: LightExtensionPushInput,
    ctx: LightExtensionServiceContext,
    requestId: string,
    error: unknown,
  ): Promise<void> {
    try {
      if (!(await this.repoExists(input.repoId))) {
        return;
      }
      await this.auditService.recordFileWrite({
        repoId: input.repoId,
        action: 'sourcePush',
        result: 'blocked',
        requestId,
        actorUserId: ctx.actorUserId,
        baseCommitId: input.baseCommitId,
        commitId: null,
        reasonCode: getErrorCode(error),
        message: 'Light extension source file write rejected',
        files: input.files.map(summarizeFileChange),
      });
    } catch {
      // Rejected write audits must not mask the original write failure.
    }
  }

  private async repoExists(repoId: string): Promise<boolean> {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repoId,
    });

    return Boolean(repo);
  }
}

function assertRepoNotArchived(repo: LightExtensionRepoInternalRecord, actionLabel: string) {
  if (repo.lifecycleStatus !== 'archived') {
    return;
  }

  throw new LightExtensionError(
    'LIGHT_EXTENSION_REPO_ARCHIVED',
    `Archived light extension repositories cannot ${actionLabel}`,
    {
      details: {
        repoId: repo.id,
        lifecycleStatus: repo.lifecycleStatus,
      },
    },
  );
}

function assertRepoArchived(repo: LightExtensionRepoInternalRecord, actionLabel: string) {
  if (repo.lifecycleStatus === 'archived') {
    return;
  }

  throw new LightExtensionError(
    'LIGHT_EXTENSION_REPO_NOT_ARCHIVED',
    `Only archived light extension repositories can ${actionLabel}`,
    {
      details: {
        repoId: repo.id,
        lifecycleStatus: repo.lifecycleStatus,
      },
    },
  );
}

function getRequestId(ctx: LightExtensionServiceContext): string {
  return ctx.requestId || randomUUID();
}

function toVscFileChange(file: LightExtensionFileChange): VscFileChange {
  return {
    path: file.path,
    content: file.content,
    blobHash: file.blobHash,
    size: file.size,
    language: file.language,
    mode: file.mode,
    operation: file.operation,
  };
}

function applyLightExtensionFileChanges(
  baseFiles: LightExtensionPulledFile[],
  changes: LightExtensionFileChange[],
): LightExtensionPulledFile[] {
  const filesByPath = new Map<string, LightExtensionPulledFile>();

  for (const file of baseFiles) {
    filesByPath.set(normalizeLightExtensionFilePath(file.path), file);
  }

  for (const change of changes) {
    const path = normalizeLightExtensionFilePath(change.path);
    if (change.operation === 'delete') {
      filesByPath.delete(path);
      continue;
    }

    filesByPath.set(path, {
      path,
      pathHash: '',
      pathLowerHash: '',
      blobHash: change.blobHash || '',
      size: typeof change.content === 'string' ? Buffer.byteLength(change.content, 'utf8') : change.size ?? 0,
      language: change.language || filesByPath.get(path)?.language || '',
      mode: change.mode || filesByPath.get(path)?.mode || '',
      content: change.content,
    });
  }

  return [...filesByPath.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function normalizeLightExtensionFilePath(path: string): string {
  return pathPosix.normalize(path.trim()).replace(/^\.\/+/, '');
}

function summarizeFileChange(file: LightExtensionFileChange) {
  return {
    path: file.path,
    operation: file.operation || 'upsert',
    size: file.size ?? file.content?.length,
    language: file.language,
  };
}

function toPublicCommit(commit: VscCommitRecord, lightExtensionRepoId: string): LightExtensionCommitRecord {
  return {
    ...commit,
    repoId: lightExtensionRepoId,
  };
}

function buildSourceCommitMetadata(
  repoId: string,
  requestId: string,
  ctx: LightExtensionServiceContext,
): Record<string, string> {
  return {
    lightExtensionRepoId: repoId,
    requestId,
    requestSource: ctx.requestSource || 'internal',
  };
}

function getErrorCode(error: unknown): string {
  if (isLightExtensionError(error) || isVscError(error)) {
    return error.code;
  }

  if (error instanceof Error) {
    return error.name;
  }

  return 'unknown_error';
}

function createLocalLightExtensionPermissionRegistry(
  permissionService: LightExtensionPermissionService,
): VscPermissionHookRegistry {
  const permissionHooks = new VscPermissionHookRegistry();
  permissionHooks.register(permissionService.createVscPermissionHook());

  return permissionHooks;
}
