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
  VscCommitDiffResult,
  VscCommitRecord,
  VscFileChange,
  VscPermissionAction,
  PreparedPush,
  VscRefName,
} from '@nocobase/runjs-workspace/server';
import { VscFileService, VscPermissionHookRegistry } from '@nocobase/runjs-workspace/server';
import type { VscRemoteSnapshot } from '../../shared/vsc-file/remote-sync-types';
import { computeRemoteSnapshotContentHash } from '../vsc-file/remotes/snapshot';
import { randomUUID } from 'crypto';
import { posix as pathPosix } from 'path';

import { JS_TEMPLATE_COLLECTIONS, type JsTemplateAclAction } from '../../constants';
import { JsTemplateError } from '../../shared/errors';
import type {
  JsTemplateCommitRecord,
  JsTemplateFileChange,
  JsTemplateFileResult,
  JsTemplateIncludeContentMode,
  JsTemplateProject,
  JsTemplatePullResult,
  JsTemplatePulledFile,
  JsTemplatePushInput,
} from '../../shared/types';
import { validateJsTemplateWorkspace } from './JsTemplateCompileContract';
import { JsTemplatePermissionService } from './JsTemplatePermissionService';
import { createPreparedCandidateWorkspace, type PreparedCandidateWorkspace } from './PreparedCandidateWorkspace';
import type { JsTemplateProjectInternalRecord, JsTemplateServiceContext } from './JsTemplateProjectService';
import { JsTemplateProjectService, stripInternalProject } from './JsTemplateProjectService';
import {
  JsTemplateValidator,
  hasErrorDiagnostic,
  type JsTemplateWorkspaceValidationResult,
} from './JsTemplateValidator';
import { normalizeVscBridgeError } from './errorContract';

export interface JsTemplatePullInput {
  projectId: string;
  ref?: VscRefName;
  knownTreeHash?: string;
  includeContent?: JsTemplateIncludeContentMode;
  selectedPaths?: string[];
}

export interface JsTemplatePullCommitInput {
  projectId: string;
  commitId: string;
  knownTreeHash?: string;
  includeContent?: JsTemplateIncludeContentMode;
  selectedPaths?: string[];
}

export interface JsTemplateGetFileInput {
  projectId: string;
  ref?: VscRefName;
  path: string;
}

export interface JsTemplateListCommitsInput {
  projectId: string;
  limit?: number;
  beforeSeq?: number;
}

export interface JsTemplateDiffCommitsInput {
  projectId: string;
  fromCommitId: string;
  toCommitId: string;
}

export interface JsTemplateReplaceSourceSnapshotInput {
  projectId: string;
  expectedHeadCommitId: string | null;
  snapshot: VscRemoteSnapshot;
  message: string;
  remoteId?: string;
}

export interface JsTemplatePreparedSourceSnapshot {
  candidate: JsTemplatePreparedSourceCandidate | null;
  project: JsTemplateProject;
  commitId: string | null;
  contentHash: string;
  changed: boolean;
}

interface PrepareSourceCandidateOptions {
  allowCompleteSnapshot?: boolean;
  commitMetadata?: Record<string, string>;
}

const preparedSourceCandidateBrand = Symbol('js-template-prepared-source-candidate');

export interface JsTemplatePreparedSourceCandidate {
  readonly [preparedSourceCandidateBrand]: true;
  readonly project: Readonly<JsTemplateProjectInternalRecord>;
  readonly expectedHeadCommitId: string | null;
  readonly requestId: string;
  readonly files: readonly Readonly<JsTemplateFileChange>[];
  readonly validation: JsTemplateWorkspaceValidationResult;
  readonly vscPreparedPush: PreparedPush;
}

export class JsTemplateFileService {
  private readonly projectService: JsTemplateProjectService;

  private vscFileService: VscFileService;

  private readonly preparedSourceCandidates = new WeakSet<object>();

  constructor(
    private readonly db: Database,
    private readonly permissionService: JsTemplatePermissionService,
    projectService: JsTemplateProjectService,
    permissionHooks?: VscPermissionHookRegistry,
    private readonly validator = new JsTemplateValidator(),
  ) {
    this.projectService = projectService;
    this.useVscPermissionHookRegistry(permissionHooks || createLocalJsTemplatePermissionRegistry(permissionService));
  }

  useVscPermissionHookRegistry(permissionHooks: VscPermissionHookRegistry): void {
    this.vscFileService = new VscFileService(this.db, permissionHooks);
    this.projectService.useVscPermissionHookRegistry(permissionHooks);
  }

  async pull(input: JsTemplatePullInput, ctx: JsTemplateServiceContext = {}): Promise<JsTemplatePullResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const project = await this.projectService.getInternalProject(input.projectId, { ...ctx, transaction });
      assertProjectNotArchived(project, 'read source');
      return this.pullInternal(project, input, ctx, transaction, 'readSource');
    });
  }

  async assertWritableHead(
    projectId: string,
    expectedHeadCommitId: string | null,
    ctx: JsTemplateServiceContext = {},
  ): Promise<void> {
    await this.permissionService.assertActionAllowed({ action: 'writeSource', ctx });
    const project = await this.projectService.getInternalProject(projectId, ctx);
    assertProjectNotArchived(project, 'write source');
    assertExpectedHead(expectedHeadCommitId, project.headCommitId, project.id);
  }

  async pullCommit(
    input: JsTemplatePullCommitInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplatePullResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const project = await this.projectService.getInternalProject(input.projectId, { ...ctx, transaction });
      assertProjectNotArchived(project, 'read source');
      return this.pullCommitInternal(project, input, ctx, transaction, 'readSource');
    });
  }

  async getFile(input: JsTemplateGetFileInput, ctx: JsTemplateServiceContext = {}): Promise<JsTemplateFileResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const project = await this.projectService.getInternalProject(input.projectId, { ...ctx, transaction });
      assertProjectNotArchived(project, 'read source');
      return this.getFileInternal(project, input, ctx, transaction, 'readSource');
    });
  }

  async readArchivedSource(
    input: JsTemplateGetFileInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateFileResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const project = await this.projectService.getInternalProject(input.projectId, { ...ctx, transaction });
      assertProjectArchived(project, 'read archived source');
      return this.getFileInternal(project, input, ctx, transaction, 'readArchivedSource');
    });
  }

  async prepareSourceCandidate(
    input: JsTemplatePushInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplatePreparedSourceCandidate> {
    return this.prepareSourceCandidateInternal(input, ctx);
  }

  async prepareSourceSnapshotCandidate(
    input: JsTemplateReplaceSourceSnapshotInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplatePreparedSourceSnapshot> {
    if (ctx.transaction) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'Remote source snapshots must be prepared outside a database transaction',
      );
    }
    const requestId = getRequestId(ctx);
    try {
      assertCompleteSnapshot(input.snapshot);
      const validation = validateJsTemplateWorkspace(this.validator, input.snapshot.files);
      if (hasErrorDiagnostic(validation.diagnostics)) {
        throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template source snapshot is invalid', {
          details: { diagnostics: validation.diagnostics },
        });
      }
      const current = await this.withTransaction(undefined, async (transaction) => {
        const project = await this.projectService.getInternalProject(input.projectId, { ...ctx, transaction });
        assertProjectNotArchived(project, 'replace source');
        assertExpectedHead(input.expectedHeadCommitId, project.headCommitId, project.id);
        return this.pullInternal(
          project,
          { projectId: project.id, includeContent: 'all' },
          { ...ctx, requestId },
          transaction,
          'writeSource',
        );
      });
      const changes = buildSnapshotReplacementChanges(current.files || [], input.snapshot.files);
      if (changes.length === 0) {
        return {
          candidate: null,
          project: current.project,
          commitId: current.commit?.id || current.project.headCommitId,
          contentHash: input.snapshot.contentHash,
          changed: false,
        };
      }
      const candidate = await this.prepareSourceCandidateInternal(
        {
          projectId: input.projectId,
          expectedHeadCommitId: input.expectedHeadCommitId,
          message: input.message,
          files: changes,
          allowEmptyCommit: false,
        },
        { ...ctx, requestId },
        {
          allowCompleteSnapshot: true,
          commitMetadata: {
            remoteId: input.remoteId || '',
            remoteRevision: input.snapshot.revision || '',
          },
        },
      );
      return {
        candidate,
        project: stripInternalProject(candidate.project),
        commitId: candidate.expectedHeadCommitId,
        contentHash: input.snapshot.contentHash,
        changed: true,
      };
    } catch (error) {
      throw normalizeVscBridgeError(error, input.projectId);
    }
  }

  private async prepareSourceCandidateInternal(
    input: JsTemplatePushInput,
    ctx: JsTemplateServiceContext,
    options: PrepareSourceCandidateOptions = {},
  ): Promise<JsTemplatePreparedSourceCandidate> {
    if (ctx.transaction) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'Source candidates must be prepared outside a database transaction',
      );
    }
    const requestId = getRequestId(ctx);
    try {
      const project = await this.projectService.getInternalProject(input.projectId, ctx);
      assertProjectNotArchived(project, 'write source');
      assertExpectedHead(input.expectedHeadCommitId, project.headCommitId, project.id);
      const vscPreparedPush = await this.runVsc(project.id, () =>
        this.vscFileService.preparePush(
          {
            repoId: project.vscRepoId,
            baseCommitId: project.headCommitId,
            message: input.message,
            files: input.files.map(toVscFileChange),
            allowEmptyCommit: input.allowEmptyCommit,
            authorId: ctx.actorUserId || null,
            metadata: {
              ...buildSourceCommitMetadata(project.id, requestId, ctx),
              ...options.commitMetadata,
            },
          },
          this.createVscContext({
            ctx,
            requestId,
            projectId: project.id,
            aclAction: 'writeSource',
            reason: 'prepare js-template source files',
            allowedActions: ['push'],
          }),
          {
            validateBaseEntries: options.allowCompleteSnapshot
              ? undefined
              : (entries) =>
                  this.assertValidSyncBatch(
                    input.files,
                    entries.map((entry) => entry.path),
                  ),
          },
        ),
      );
      const validation = validateJsTemplateWorkspace(
        this.validator,
        vscPreparedPush.candidate.files.map((file) => ({
          path: file.path,
          content: file.content,
          blobHash: file.blobHash,
          size: file.size,
          language: file.language,
        })),
      );
      if (hasErrorDiagnostic(validation.diagnostics)) {
        throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template source workspace is invalid', {
          details: { diagnostics: validation.diagnostics },
        });
      }
      const prepared: JsTemplatePreparedSourceCandidate = Object.freeze({
        [preparedSourceCandidateBrand]: true as const,
        project: Object.freeze({ ...project }),
        expectedHeadCommitId: input.expectedHeadCommitId,
        requestId,
        files: Object.freeze(input.files.map((file) => Object.freeze({ ...file }))),
        validation,
        vscPreparedPush,
      });
      this.preparedSourceCandidates.add(prepared);
      return prepared;
    } catch (error) {
      throw normalizeVscBridgeError(error, input.projectId);
    }
  }

  async commitSourceCandidate(
    prepared: JsTemplatePreparedSourceCandidate,
    ctx: JsTemplateServiceContext,
  ): Promise<PreparedCandidateWorkspace> {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'A transaction is required to commit a prepared source candidate',
      );
    }
    if (!prepared || !this.preparedSourceCandidates.has(prepared)) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'Prepared source candidate must be created by this file service instance',
      );
    }
    const project = await this.projectService.lockInternalProjectForUpdate(prepared.project.id, {
      ...ctx,
      transaction,
    });
    assertProjectNotArchived(project, 'write source');
    assertExpectedHead(prepared.expectedHeadCommitId, project.headCommitId, project.id);
    if (project.vscRepoId !== prepared.project.vscRepoId) {
      throw new JsTemplateError('JS_TEMPLATE_SOURCE_OUTDATED', 'JS Template source repository changed');
    }
    const result = await this.runVsc(project.id, () =>
      this.vscFileService.publishPreparedPush(
        prepared.vscPreparedPush,
        this.createVscContext({
          ctx,
          transaction,
          requestId: prepared.requestId,
          projectId: project.id,
          aclAction: 'writeSource',
          reason: 'commit prepared js-template source files',
          allowedActions: ['push'],
        }),
      ),
    );
    const projectModel = this.db.getModel<Model>(JS_TEMPLATE_COLLECTIONS.projects);
    const [updatedCount] = await projectModel.update(
      { headCommitId: result.commit.id },
      {
        where: { id: project.id, headCommitId: prepared.expectedHeadCommitId },
        transaction,
      },
    );
    if (updatedCount !== 1) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_OUTDATED',
        'JS Template source changed after the workspace was opened',
        {
          details: {
            projectId: project.id,
            expectedHeadCommitId: prepared.expectedHeadCommitId,
          },
        },
      );
    }
    const updatedProject = await this.projectService.getInternalProject(project.id, { ...ctx, transaction });
    const publicCommit = toPublicCommit(result.commit, project.id);
    const candidate = createPreparedCandidateWorkspace(
      {
        project: stripInternalProject(updatedProject),
        commit: publicCommit,
        tree: result.tree,
        validation: prepared.validation,
        vscSnapshot: result.candidate,
      },
      transaction,
    );
    return candidate;
  }

  private assertValidSyncBatch(files: JsTemplateFileChange[], existingPaths: Iterable<string> = []): void {
    const diagnostics = this.validator.validateSyncBatch({
      files,
      existingPaths,
    });
    if (!hasErrorDiagnostic(diagnostics)) {
      return;
    }

    throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template source batch is invalid', {
      details: {
        diagnostics,
      },
    });
  }

  async listCommits(
    input: JsTemplateListCommitsInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateCommitRecord[]> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const project = await this.projectService.getInternalProject(input.projectId, { ...ctx, transaction });
      assertProjectNotArchived(project, 'read source');
      const commits = await this.runVsc(project.id, () =>
        this.vscFileService.listCommits(
          {
            repoId: project.vscRepoId,
            limit: input.limit,
            beforeSeq: input.beforeSeq,
          },
          this.createVscContext({
            ctx,
            transaction,
            requestId: getRequestId(ctx),
            projectId: project.id,
            aclAction: 'readSource',
            reason: 'read js-template source history',
            allowedActions: ['listCommits'],
          }),
        ),
      );

      return commits.map((commit) => toPublicCommit(commit, project.id));
    });
  }

  async diffCommits(
    input: JsTemplateDiffCommitsInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<VscCommitDiffResult> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const project = await this.projectService.getInternalProject(input.projectId, { ...ctx, transaction });
      assertProjectNotArchived(project, 'read source');
      return this.runVsc(project.id, () =>
        this.vscFileService.diff(
          {
            repoId: project.vscRepoId,
            fromCommitId: input.fromCommitId,
            toCommitId: input.toCommitId,
          },
          this.createVscContext({
            ctx,
            transaction,
            requestId: getRequestId(ctx),
            projectId: project.id,
            aclAction: 'readSource',
            reason: 'read js-template commit diff',
            allowedActions: ['diff'],
          }),
        ),
      );
    });
  }

  private async pullInternal(
    project: JsTemplateProjectInternalRecord,
    input: JsTemplatePullInput,
    ctx: JsTemplateServiceContext,
    transaction: Transaction,
    aclAction: JsTemplateAclAction,
  ): Promise<JsTemplatePullResult> {
    const result = await this.runVsc(project.id, () =>
      this.vscFileService.pull(
        {
          repoId: project.vscRepoId,
          ref: input.ref,
          knownTreeHash: input.knownTreeHash,
          includeContent: input.includeContent,
          selectedPaths: input.selectedPaths,
        },
        this.createVscContext({
          ctx,
          transaction,
          requestId: getRequestId(ctx),
          projectId: project.id,
          aclAction,
          reason: 'read js-template source tree',
          allowedActions: ['pull'],
        }),
      ),
    );

    return {
      project: stripInternalProject(project),
      commit: result.commit ? toPublicCommit(result.commit, project.id) : null,
      tree: result.tree,
      unchanged: result.unchanged,
      files: result.files as JsTemplatePulledFile[] | undefined,
    };
  }

  private async pullCommitInternal(
    project: JsTemplateProjectInternalRecord,
    input: JsTemplatePullCommitInput,
    ctx: JsTemplateServiceContext,
    transaction: Transaction,
    aclAction: JsTemplateAclAction,
  ): Promise<JsTemplatePullResult> {
    const result = await this.runVsc(project.id, () =>
      this.vscFileService.pullCommit(
        {
          repoId: project.vscRepoId,
          commitId: input.commitId,
          knownTreeHash: input.knownTreeHash,
          includeContent: input.includeContent,
          selectedPaths: input.selectedPaths,
        },
        this.createVscContext({
          ctx,
          transaction,
          requestId: getRequestId(ctx),
          projectId: project.id,
          aclAction,
          reason: 'read js-template source commit tree',
          allowedActions: ['pull'],
        }),
      ),
    );

    return {
      project: stripInternalProject(project),
      commit: result.commit ? toPublicCommit(result.commit, project.id) : null,
      tree: result.tree,
      unchanged: result.unchanged,
      files: result.files as JsTemplatePulledFile[] | undefined,
    };
  }

  private async getFileInternal(
    project: JsTemplateProjectInternalRecord,
    input: JsTemplateGetFileInput,
    ctx: JsTemplateServiceContext,
    transaction: Transaction,
    aclAction: JsTemplateAclAction,
  ): Promise<JsTemplateFileResult> {
    const result = await this.runVsc(project.id, () =>
      this.vscFileService.getFile(
        {
          repoId: project.vscRepoId,
          ref: input.ref,
          path: input.path,
        },
        this.createVscContext({
          ctx,
          transaction,
          requestId: getRequestId(ctx),
          projectId: project.id,
          aclAction,
          reason: 'read js-template source file',
          allowedActions: ['getFile'],
        }),
      ),
    );

    return result;
  }

  private async runVsc<T>(projectId: string, run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      throw normalizeVscBridgeError(error, projectId);
    }
  }

  private createVscContext(input: {
    ctx: JsTemplateServiceContext;
    transaction?: Transaction;
    requestId: string;
    projectId: string;
    reason: string;
    allowedActions: readonly VscPermissionAction[];
    aclAction: JsTemplateAclAction;
  }) {
    return {
      transaction: input.transaction,
      authorId: input.ctx.actorUserId || null,
      request: this.permissionService.createInternalVscRequestContext({
        requestId: input.requestId,
        reason: input.reason,
        allowedActions: input.allowedActions,
        actorUserId: input.ctx.actorUserId,
        jsTemplateProjectId: input.projectId,
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
}

function assertProjectNotArchived(project: JsTemplateProjectInternalRecord, actionLabel: string) {
  if (project.lifecycleStatus !== 'archived') {
    return;
  }

  throw new JsTemplateError('JS_TEMPLATE_PROJECT_ARCHIVED', `Archived JS Template projects cannot ${actionLabel}`, {
    details: {
      projectId: project.id,
      lifecycleStatus: project.lifecycleStatus,
    },
  });
}

function assertExpectedHead(
  expectedHeadCommitId: string | null,
  currentHeadCommitId: string | null,
  projectId: string,
) {
  if (expectedHeadCommitId === currentHeadCommitId) {
    return;
  }

  throw new JsTemplateError(
    'JS_TEMPLATE_SOURCE_OUTDATED',
    'JS Template source changed after the workspace was opened',
    {
      details: {
        projectId,
        expectedHeadCommitId,
        currentHeadCommitId,
      },
    },
  );
}

function assertProjectArchived(project: JsTemplateProjectInternalRecord, actionLabel: string) {
  if (project.lifecycleStatus === 'archived') {
    return;
  }

  throw new JsTemplateError(
    'JS_TEMPLATE_PROJECT_NOT_ARCHIVED',
    `Only archived JS Template projects can ${actionLabel}`,
    {
      details: {
        projectId: project.id,
        lifecycleStatus: project.lifecycleStatus,
      },
    },
  );
}

function getRequestId(ctx: JsTemplateServiceContext): string {
  return ctx.requestId || randomUUID();
}

function toVscFileChange(file: JsTemplateFileChange): VscFileChange {
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
  currentFiles: JsTemplatePulledFile[],
  snapshotFiles: VscRemoteSnapshot['files'],
): JsTemplateFileChange[] {
  const currentByPath = new Map(currentFiles.map((file) => [normalizeJsTemplateFilePath(file.path), file]));
  const nextPaths = new Set<string>();
  const changes: JsTemplateFileChange[] = [];

  for (const file of snapshotFiles) {
    const path = normalizeJsTemplateFilePath(file.path);
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
    const path = normalizeJsTemplateFilePath(current.path);
    if (!nextPaths.has(path)) {
      changes.push({ path, operation: 'delete' });
    }
  }

  return changes.sort((left, right) => left.path.localeCompare(right.path));
}

function assertCompleteSnapshot(snapshot: VscRemoteSnapshot): void {
  if (computeRemoteSnapshotContentHash(snapshot.files) !== snapshot.contentHash) {
    throw new JsTemplateError('JS_TEMPLATE_SYNC_UNSAFE_CONTENT', 'Remote snapshot hash is inconsistent', {
      details: { reasonCode: 'snapshot-content-hash-mismatch' },
    });
  }
}

function normalizeJsTemplateFilePath(path: string): string {
  return pathPosix.normalize(path.trim()).replace(/^\.\/+/, '');
}

function toPublicCommit(commit: VscCommitRecord, projectId: string): JsTemplateCommitRecord {
  return {
    id: commit.id,
    projectId,
    hash: commit.hash,
    seq: commit.seq,
    parentCommitId: commit.parentCommitId,
    treeHash: commit.treeHash,
    message: commit.message,
    authorId: commit.authorId,
    metadata: commit.metadata,
    createdAt: commit.createdAt,
  };
}

function buildSourceCommitMetadata(
  projectId: string,
  requestId: string,
  ctx: JsTemplateServiceContext,
): Record<string, string> {
  return {
    jsTemplateProjectId: projectId,
    requestId,
    requestSource: ctx.requestSource || 'internal',
  };
}

function createLocalJsTemplatePermissionRegistry(
  permissionService: JsTemplatePermissionService,
): VscPermissionHookRegistry {
  const permissionHooks = new VscPermissionHookRegistry();
  permissionHooks.register(permissionService.createVscPermissionHook());

  return permissionHooks;
}
