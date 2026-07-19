/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import type {
  VscCommitRecord,
  VscFileChange,
  VscPermissionAction,
  PreparedPush,
  VscRefName,
  VscRemoteSnapshot,
} from '@nocobase/plugin-vsc-file';
import { computeRemoteSnapshotContentHash, isVscError } from '@nocobase/plugin-vsc-file';
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
import { createPreparedCandidateWorkspace, type PreparedCandidateWorkspace } from './PreparedCandidateWorkspace';
import type { LightExtensionRepoInternalRecord, LightExtensionServiceContext } from './LightExtensionRepoService';
import { LightExtensionRepoService, stripInternalRepo } from './LightExtensionRepoService';
import {
  LightExtensionValidator,
  hasErrorDiagnostic,
  type LightExtensionWorkspaceValidationResult,
} from './LightExtensionValidator';
import { normalizeVscBridgeError } from './errorContract';

export interface LightExtensionPullInput {
  repoId: string;
  ref?: VscRefName;
  knownTreeHash?: string;
  includeContent?: LightExtensionIncludeContentMode;
  selectedPaths?: string[];
}

export interface LightExtensionPullCommitInput {
  repoId: string;
  commitId: string;
  knownTreeHash?: string;
  includeContent?: LightExtensionIncludeContentMode;
  selectedPaths?: string[];
}

export interface LightExtensionGetFileInput {
  repoId: string;
  ref?: VscRefName;
  path: string;
}

export interface LightExtensionListCommitsInput {
  repoId: string;
  limit?: number;
  beforeSeq?: number;
}

export interface LightExtensionReplaceSourceSnapshotInput {
  repoId: string;
  expectedHeadCommitId: string | null;
  snapshot: VscRemoteSnapshot;
  message: string;
  remoteId?: string;
}

export interface LightExtensionReplaceSourceSnapshotResult {
  repo: LightExtensionPushResult['repo'];
  commit: LightExtensionPushResult['commit'] | null;
  tree: LightExtensionPushResult['tree'] | null;
  contentHash: string;
  changed: boolean;
}

const preparedSourceCandidateBrand = Symbol('light-extension-prepared-source-candidate');

export interface LightExtensionPreparedSourceCandidate {
  readonly [preparedSourceCandidateBrand]: true;
  readonly repo: Readonly<LightExtensionRepoInternalRecord>;
  readonly expectedHeadCommitId: string | null;
  readonly requestId: string;
  readonly files: readonly Readonly<LightExtensionFileChange>[];
  readonly validation: LightExtensionWorkspaceValidationResult;
  readonly vscPreparedPush: PreparedPush;
}

export class LightExtensionFileService {
  private readonly repoService: LightExtensionRepoService;

  private vscFileService: VscFileService;

  private readonly preparedSourceCandidates = new WeakSet<object>();

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

  async pullCommit(
    input: LightExtensionPullCommitInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPullResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const repo = await this.repoService.getInternalRepo(input.repoId, { ...ctx, transaction });
      assertRepoNotArchived(repo, 'read source');
      return this.pullCommitInternal(repo, input, ctx, transaction, 'readSource');
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
    const candidate = await this.pushPreparedCandidate(input, ctx);

    return {
      repo: candidate.repo,
      commit: candidate.commit,
      tree: candidate.tree,
    };
  }

  async prepareSourceCandidate(
    input: LightExtensionPushInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPreparedSourceCandidate> {
    if (ctx.transaction) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'Source candidates must be prepared outside a database transaction',
      );
    }
    const requestId = getRequestId(ctx);
    try {
      const repo = await this.repoService.getInternalRepo(input.repoId, ctx);
      assertRepoNotArchived(repo, 'write source');
      assertExpectedHead(input.expectedHeadCommitId, repo.headCommitId, repo.id);
      const vscPreparedPush = await this.runVsc(repo.id, () =>
        this.vscFileService.preparePush(
          {
            repoId: repo.vscRepoId,
            baseCommitId: repo.headCommitId,
            message: input.message,
            files: input.files.map(toVscFileChange),
            allowEmptyCommit: input.allowEmptyCommit,
            authorId: ctx.actorUserId || null,
            metadata: buildSourceCommitMetadata(repo.id, requestId, ctx),
          },
          this.createVscContext({
            ctx,
            requestId,
            repoId: repo.id,
            aclAction: 'writeSource',
            reason: 'prepare light-extension source files',
            allowedActions: ['push'],
          }),
          {
            validateBaseEntries: (entries) =>
              this.assertValidSyncBatch(
                input.files,
                entries.map((entry) => entry.path),
              ),
          },
        ),
      );
      const validation = this.validator.validateWorkspace({
        files: vscPreparedPush.candidate.files.map((file) => ({
          path: file.path,
          content: file.content,
          blobHash: file.blobHash,
          size: file.size,
          language: file.language,
        })),
      });
      if (hasErrorDiagnostic(validation.diagnostics)) {
        throw new LightExtensionError(
          'LIGHT_EXTENSION_VALIDATION_FAILED',
          'Light extension source workspace is invalid',
          { details: { diagnostics: validation.diagnostics } },
        );
      }
      const prepared: LightExtensionPreparedSourceCandidate = Object.freeze({
        [preparedSourceCandidateBrand]: true as const,
        repo: Object.freeze({ ...repo }),
        expectedHeadCommitId: input.expectedHeadCommitId,
        requestId,
        files: Object.freeze(input.files.map((file) => Object.freeze({ ...file }))),
        validation,
        vscPreparedPush,
      });
      this.preparedSourceCandidates.add(prepared);
      return prepared;
    } catch (error) {
      const recordRejectedPush = () => this.recordRejectedPush(input, ctx, requestId, error);
      if (ctx.deferredRejectedPushAudits) {
        ctx.deferredRejectedPushAudits.push(recordRejectedPush);
      } else {
        await recordRejectedPush();
      }
      throw normalizeVscBridgeError(error, input.repoId);
    }
  }

  async publishSourceCandidate(
    prepared: LightExtensionPreparedSourceCandidate,
    ctx: LightExtensionServiceContext,
  ): Promise<PreparedCandidateWorkspace> {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'A transaction is required to publish a prepared source candidate',
      );
    }
    if (!prepared || !this.preparedSourceCandidates.has(prepared)) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'Prepared source candidate must be created by this file service instance',
      );
    }
    const repo = await this.repoService.lockInternalRepoForUpdate(prepared.repo.id, { ...ctx, transaction });
    assertRepoNotArchived(repo, 'write source');
    assertExpectedHead(prepared.expectedHeadCommitId, repo.headCommitId, repo.id);
    if (repo.vscRepoId !== prepared.repo.vscRepoId) {
      throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_OUTDATED', 'Light extension source repository changed');
    }
    const result = await this.runVsc(repo.id, () =>
      this.vscFileService.publishPreparedPush(
        prepared.vscPreparedPush,
        this.createVscContext({
          ctx,
          transaction,
          requestId: prepared.requestId,
          repoId: repo.id,
          aclAction: 'writeSource',
          reason: 'publish prepared light-extension source files',
          allowedActions: ['push'],
        }),
      ),
    );
    const repoModel = this.db.getModel<Model>('lightExtensionRepos');
    const [updatedCount] = await repoModel.update(
      { headCommitId: result.commit.id },
      {
        where: { id: repo.id, headCommitId: prepared.expectedHeadCommitId },
        transaction,
      },
    );
    if (updatedCount !== 1) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_OUTDATED',
        'Light extension source changed after the workspace was opened',
        {
          details: {
            repoId: repo.id,
            expectedHeadCommitId: prepared.expectedHeadCommitId,
          },
        },
      );
    }
    const updatedRepo = await this.repoService.getInternalRepo(repo.id, { ...ctx, transaction });
    const publicCommit = toPublicCommit(result.commit, repo.id);
    const candidate = createPreparedCandidateWorkspace(
      {
        repo: stripInternalRepo(updatedRepo),
        commit: publicCommit,
        tree: result.tree,
        validation: prepared.validation,
        vscSnapshot: result.candidate,
      },
      transaction,
    );
    await this.auditService.recordFileWrite({
      repoId: repo.id,
      action: 'sourcePush',
      result: 'success',
      requestId: prepared.requestId,
      actorUserId: ctx.actorUserId,
      baseCommitId: prepared.expectedHeadCommitId,
      commitId: result.commit.id,
      message: 'Light extension source files committed',
      files: prepared.files.map(summarizeFileChange),
      details: { treeHash: result.tree.hash },
      transaction,
    });
    return candidate;
  }

  async pushPreparedCandidate(
    input: LightExtensionPushInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<PreparedCandidateWorkspace> {
    const requestId = getRequestId(ctx);

    try {
      return await this.withTransaction(ctx.transaction, async (transaction) => {
        const repo = await this.repoService.lockInternalRepoForUpdate(input.repoId, { ...ctx, transaction });
        assertRepoNotArchived(repo, 'write source');
        assertExpectedHead(input.expectedHeadCommitId, repo.headCommitId, repo.id);
        const result = await this.runVsc(repo.id, () =>
          this.vscFileService.pushWithCandidate(
            {
              repoId: repo.vscRepoId,
              baseCommitId: repo.headCommitId,
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
            {
              validateBaseEntries: (entries) =>
                this.assertValidSyncBatch(
                  input.files,
                  entries.map((entry) => entry.path),
                ),
            },
          ),
        );
        const validation = this.validator.validateWorkspace({
          files: result.candidate.files.map((file) => ({
            path: file.path,
            content: file.content,
            blobHash: file.blobHash,
            size: file.size,
            language: file.language,
          })),
        });
        if (hasErrorDiagnostic(validation.diagnostics)) {
          throw new LightExtensionError(
            'LIGHT_EXTENSION_VALIDATION_FAILED',
            'Light extension source workspace is invalid',
            {
              details: {
                diagnostics: validation.diagnostics,
              },
            },
          );
        }

        await this.db.getRepository('lightExtensionRepos').update({
          filterByTk: repo.id,
          values: {
            headCommitId: result.repository.headCommitId || null,
          },
          transaction,
        });
        const updatedRepo = await this.repoService.getInternalRepo(repo.id, { ...ctx, transaction });
        const publicRepo = stripInternalRepo(updatedRepo);
        const publicCommit = toPublicCommit(result.commit, repo.id);
        const candidate = createPreparedCandidateWorkspace(
          {
            repo: publicRepo,
            commit: publicCommit,
            tree: result.tree,
            validation,
            vscSnapshot: result.candidate,
          },
          transaction,
        );

        await this.auditService.recordFileWrite({
          repoId: repo.id,
          action: 'sourcePush',
          result: 'success',
          requestId,
          actorUserId: ctx.actorUserId,
          baseCommitId: repo.headCommitId,
          commitId: result.commit.id,
          message: 'Light extension source files committed',
          files: input.files.map(summarizeFileChange),
          details: {
            treeHash: result.tree.hash,
          },
          transaction,
        });

        return candidate;
      });
    } catch (error) {
      const recordRejectedPush = () => this.recordRejectedPush(input, ctx, requestId, error);
      if (ctx.deferredRejectedPushAudits) {
        ctx.deferredRejectedPushAudits.push(recordRejectedPush);
      } else {
        await recordRejectedPush();
      }
      throw normalizeVscBridgeError(error, input.repoId);
    }
  }

  async replaceSourceSnapshot(
    input: LightExtensionReplaceSourceSnapshotInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionReplaceSourceSnapshotResult> {
    const requestId = getRequestId(ctx);

    try {
      return await this.withTransaction(ctx.transaction, async (transaction) => {
        const repo = await this.repoService.lockInternalRepoForUpdate(input.repoId, { ...ctx, transaction });
        assertRepoNotArchived(repo, 'replace source');
        assertExpectedHead(input.expectedHeadCommitId, repo.headCommitId, repo.id);
        assertCompleteSnapshot(input.snapshot);
        const validation = this.validator.validateWorkspace({ files: input.snapshot.files });
        if (hasErrorDiagnostic(validation.diagnostics)) {
          throw new LightExtensionError(
            'LIGHT_EXTENSION_VALIDATION_FAILED',
            'Light extension source snapshot is invalid',
            {
              details: {
                diagnostics: validation.diagnostics,
              },
            },
          );
        }

        const current = await this.pullInternal(
          repo,
          { repoId: repo.id, includeContent: 'all' },
          { ...ctx, requestId },
          transaction,
          'writeSource',
        );
        const changes = buildSnapshotReplacementChanges(current.files || [], input.snapshot.files);
        if (changes.length === 0) {
          return {
            repo: stripInternalRepo(repo),
            commit: null,
            tree: current.tree,
            contentHash: input.snapshot.contentHash,
            changed: false,
          };
        }

        const result = await this.runVsc(repo.id, () =>
          this.vscFileService.push(
            {
              repoId: repo.vscRepoId,
              baseCommitId: repo.headCommitId,
              message: input.message,
              files: changes.map(toVscFileChange),
              allowEmptyCommit: false,
              authorId: ctx.actorUserId || null,
              metadata: {
                ...buildSourceCommitMetadata(repo.id, requestId, ctx),
                remoteId: input.remoteId || '',
                remoteRevision: input.snapshot.revision || '',
              },
            },
            this.createVscContext({
              ctx,
              transaction,
              requestId,
              repoId: repo.id,
              aclAction: 'writeSource',
              reason: 'replace light-extension source from a remote snapshot',
              allowedActions: ['push'],
            }),
          ),
        );
        await this.db.getRepository('lightExtensionRepos').update({
          filterByTk: repo.id,
          values: { headCommitId: result.repository.headCommitId || null },
          transaction,
        });
        const updatedRepo = await this.repoService.getInternalRepo(repo.id, { ...ctx, transaction });
        await this.auditService.recordFileWrite({
          repoId: repo.id,
          action: 'sourcePush',
          result: 'success',
          requestId,
          actorUserId: ctx.actorUserId,
          baseCommitId: repo.headCommitId,
          commitId: result.commit.id,
          message: 'Light extension source snapshot replaced from remote',
          files: changes.map(summarizeFileChange),
          details: {
            treeHash: result.tree.hash,
            remoteId: input.remoteId,
            remoteRevision: input.snapshot.revision,
            source: 'remote-pull',
          },
          transaction,
        });

        return {
          repo: stripInternalRepo(updatedRepo),
          commit: toPublicCommit(result.commit, repo.id),
          tree: result.tree,
          contentHash: input.snapshot.contentHash,
          changed: true,
        };
      });
    } catch (error) {
      await this.recordRejectedSnapshotReplace(input, ctx, requestId, error);
      throw normalizeVscBridgeError(error, input.repoId);
    }
  }

  private assertValidSyncBatch(files: LightExtensionFileChange[], existingPaths: Iterable<string> = []): void {
    const diagnostics = this.validator.validateSyncBatch({
      files,
      existingPaths,
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

  private async pullCommitInternal(
    repo: LightExtensionRepoInternalRecord,
    input: LightExtensionPullCommitInput,
    ctx: LightExtensionServiceContext,
    transaction: Transaction,
    aclAction: LightExtensionAclAction,
  ): Promise<LightExtensionPullResult> {
    const result = await this.runVsc(repo.id, () =>
      this.vscFileService.pullCommit(
        {
          repoId: repo.vscRepoId,
          commitId: input.commitId,
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
          reason: 'read light-extension source commit tree',
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
    transaction?: Transaction;
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
        commitId: null,
        reasonCode: getErrorCode(error),
        message: 'Light extension source file write rejected',
        files: input.files.map(summarizeFileChange),
      });
    } catch {
      // Rejected write audits must not mask the original write failure.
    }
  }

  private async recordRejectedSnapshotReplace(
    input: LightExtensionReplaceSourceSnapshotInput,
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
        commitId: null,
        reasonCode: getErrorCode(error),
        message: 'Light extension remote source snapshot replacement rejected',
        files: input.snapshot.files.map((file) => ({
          path: file.path,
          operation: 'upsert',
          size: Buffer.byteLength(file.content, 'utf8'),
          language: file.language,
        })),
        details: {
          remoteId: input.remoteId,
          remoteRevision: input.snapshot.revision,
          source: 'remote-pull',
        },
      });
    } catch {
      // Rejected remote snapshot audits must not mask the original write failure.
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

function assertExpectedHead(expectedHeadCommitId: string | null, currentHeadCommitId: string | null, repoId: string) {
  if (expectedHeadCommitId === currentHeadCommitId) {
    return;
  }

  throw new LightExtensionError(
    'LIGHT_EXTENSION_SOURCE_OUTDATED',
    'Light extension source changed after the workspace was opened',
    {
      details: {
        repoId,
        expectedHeadCommitId,
        currentHeadCommitId,
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

function buildSnapshotReplacementChanges(
  currentFiles: LightExtensionPulledFile[],
  snapshotFiles: VscRemoteSnapshot['files'],
): LightExtensionFileChange[] {
  const currentByPath = new Map(currentFiles.map((file) => [normalizeLightExtensionFilePath(file.path), file]));
  const nextPaths = new Set<string>();
  const changes: LightExtensionFileChange[] = [];

  for (const file of snapshotFiles) {
    const path = normalizeLightExtensionFilePath(file.path);
    nextPaths.add(path);
    const current = currentByPath.get(path);
    if (
      current?.content === file.content &&
      (file.mode === undefined || current.mode === file.mode) &&
      (file.language === undefined || current.language === file.language)
    ) {
      continue;
    }
    changes.push({
      path,
      content: file.content,
      mode: file.mode,
      language: file.language,
      operation: 'upsert',
    });
  }
  for (const current of currentFiles) {
    const path = normalizeLightExtensionFilePath(current.path);
    if (!nextPaths.has(path)) {
      changes.push({ path, operation: 'delete' });
    }
  }

  return changes.sort((left, right) => left.path.localeCompare(right.path));
}

function assertCompleteSnapshot(snapshot: VscRemoteSnapshot): void {
  if (computeRemoteSnapshotContentHash(snapshot.files) !== snapshot.contentHash) {
    throw new LightExtensionError('LIGHT_EXTENSION_SYNC_UNSAFE_CONTENT', 'Remote snapshot hash is inconsistent', {
      details: { reasonCode: 'snapshot-content-hash-mismatch' },
    });
  }
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
