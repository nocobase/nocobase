/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { RemoteSyncRuntime } from '../vsc-file/remotes';
import type {
  VscFileRemoteRecord,
  VscRemoteProvider,
  VscRemoteSyncPlan,
} from '../../shared/vsc-file/remote-sync-types';
import { uid } from '@nocobase/utils';

import { JsTemplateError } from '../../shared/errors';
import type { JsTemplateProject, JsTemplateTreeEntryInput } from '../../shared/types';
import { JsTemplateAuditService } from './JsTemplateAuditService';
import { JsTemplateProjectService, type JsTemplateServiceContext } from './JsTemplateProjectService';
import { JsTemplateCompileService } from './JsTemplateCompileService';
import { hasErrorDiagnostic } from './JsTemplateValidator';

const remoteName = 'origin';

export interface JsTemplateCreateFromRemoteInput {
  name: string;
  title?: string | null;
  description?: string | null;
  provider: VscRemoteProvider;
  config: unknown;
  authRef: string | null;
}

export interface JsTemplateCreateFromRemoteResult {
  project: JsTemplateProject;
  remote: VscFileRemoteRecord;
  plan: VscRemoteSyncPlan;
  revision: string;
  fileCount: number;
}

export interface JsTemplateCreateFromRemoteOptions {
  targetProjectId?: string;
}

export class JsTemplateCreateFromRemoteService {
  constructor(
    private readonly db: Database,
    private readonly auditService: JsTemplateAuditService,
    private readonly projectService: JsTemplateProjectService,
    private readonly runtimeCompileService: JsTemplateCompileService,
    private readonly getRemoteSyncRuntime: () => RemoteSyncRuntime,
  ) {}

  async create(
    input: JsTemplateCreateFromRemoteInput,
    ctx: JsTemplateServiceContext = {},
    options: JsTemplateCreateFromRemoteOptions = {},
  ): Promise<JsTemplateCreateFromRemoteResult> {
    const metadata = this.projectService.normalizeCreateMetadata(input);
    const runtime = this.getRemoteSyncRuntime();
    const fetched = await runtime.fetchTarget({
      provider: input.provider,
      config: input.config,
      authRef: input.authRef,
    });
    const revision = requireRemoteRevision(fetched.snapshot.revision);
    const initialFiles = toInitialFiles(fetched.snapshot.files);
    this.assertValidInitialFiles(initialFiles);
    const projectId = options.targetProjectId || `jtp_${uid()}`;
    const prepared = await this.runtimeCompileService.prepareInitialWorkspace(
      { projectId, files: initialFiles },
      {
        ...ctx,
        requestSource: ctx.requestSource || 'js-template-create-from-git-prepare',
      },
    );

    return this.db.sequelize.transaction(async (transaction) => {
      const transactionContext: JsTemplateServiceContext = {
        ...ctx,
        transaction,
        requestSource: ctx.requestSource || 'js-template-create-from-git',
        allowRemovedGenericRunJSSource: true,
      };
      const project = await this.projectService.createProjectForCompositeUseCase(
        {
          name: metadata.name,
          title: metadata.title,
          description: metadata.description,
          initialFiles,
          message: 'Import JS Template source from Git',
        },
        transactionContext,
        { projectId },
      );
      if (!project.headCommitId) {
        throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'JS Template initial source commit is missing', {
          details: { projectId: project.id },
        });
      }

      const compiled = await this.runtimeCompileService.applyPreparedInitialWorkspace(prepared, project.headCommitId, {
        ...transactionContext,
        requestSource: 'js-template-create-from-git-apply',
      });
      const internalProject = await this.projectService.getInternalProject(project.id, transactionContext);
      const established = await runtime.establishInitialBaseline(
        {
          repoId: internalProject.vscRepoId,
          name: remoteName,
          provider: fetched.provider,
          config: fetched.config,
          authRef: input.authRef,
          localCommitId: project.headCommitId,
          snapshot: fetched.snapshot,
        },
        transaction,
      );
      await this.auditService.recordSyncEvent({
        projectId: compiled.project.id,
        action: 'syncCreateFromGit',
        result: 'success',
        requestId: ctx.requestId || `syncCreateFromGit:${compiled.project.id}`,
        actorUserId: ctx.actorUserId,
        provider: established.remote.provider,
        remoteTargetVersion: established.remote.version,
        remoteRevision: revision,
        localCommitId: compiled.project.headCommitId,
        state: established.plan.state,
        syncAction: established.plan.action,
        fileCount: initialFiles.length,
        message: 'syncCreateFromGit succeeded',
        transaction,
      });

      return {
        project: compiled.project,
        remote: established.remote,
        plan: established.plan,
        revision,
        fileCount: initialFiles.length,
      };
    });
  }

  private assertValidInitialFiles(files: JsTemplateTreeEntryInput[]): void {
    if (!files.length) {
      throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'Remote source is empty', {
        status: 422,
        details: { diagnostics: [] },
      });
    }
    const diagnostics = this.projectService.getValidator().validateInitialFiles({
      files,
      allowRemovedGenericRunJSSource: true,
    });
    if (!hasErrorDiagnostic(diagnostics)) {
      return;
    }
    throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template initial source is invalid', {
      status: 422,
      details: { diagnostics },
    });
  }
}

function requireRemoteRevision(revision: string | null): string {
  if (!revision) {
    throw new JsTemplateError('JS_TEMPLATE_SYNC_REMOTE_NOT_FOUND', 'Remote branch has no revision', {
      details: { reasonCode: 'remote-branch-empty' },
    });
  }
  return revision;
}

function toInitialFiles(
  files: ReadonlyArray<{ path: string; content: string; mode?: string; language?: string }>,
): JsTemplateTreeEntryInput[] {
  return files.map((file) => ({
    path: file.path,
    content: file.content,
    mode: file.mode,
    language: file.language,
  }));
}
