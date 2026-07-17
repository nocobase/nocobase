/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type {
  RemoteSyncRuntime,
  VscFileRemoteRecord,
  VscRemoteProvider,
  VscRemoteSyncPlan,
} from '@nocobase/plugin-vsc-file';

import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionRepoRecord, LightExtensionTreeEntryInput } from '../../shared/types';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import { LightExtensionRepoService, type LightExtensionServiceContext } from './LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from './LightExtensionRuntimeCompileService';
import { hasErrorDiagnostic } from './LightExtensionValidator';

const remoteName = 'origin';

export interface LightExtensionCreateFromRemoteInput {
  name: string;
  title?: string | null;
  description?: string | null;
  provider: VscRemoteProvider;
  config: unknown;
  authRef: string | null;
}

export interface LightExtensionCreateFromRemoteResult {
  repo: LightExtensionRepoRecord;
  remote: VscFileRemoteRecord;
  plan: VscRemoteSyncPlan;
  revision: string;
  fileCount: number;
}

export class LightExtensionCreateFromRemoteService {
  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly repoService: LightExtensionRepoService,
    private readonly runtimeCompileService: LightExtensionRuntimeCompileService,
    private readonly getRemoteSyncRuntime: () => RemoteSyncRuntime,
  ) {}

  async create(
    input: LightExtensionCreateFromRemoteInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionCreateFromRemoteResult> {
    const metadata = this.repoService.normalizeCreateMetadata(input);
    const runtime = this.getRemoteSyncRuntime();
    const config = runtime.normalizeConfig(input.provider, input.config);
    const fetched = await runtime.fetchTarget({
      provider: input.provider,
      config,
      authRef: input.authRef,
    });
    const revision = requireRemoteRevision(fetched.snapshot.revision);
    const initialFiles = toInitialFiles(fetched.snapshot.files);
    this.assertValidInitialFiles(initialFiles);

    return this.db.sequelize.transaction(async (transaction) => {
      const transactionContext: LightExtensionServiceContext = {
        ...ctx,
        transaction,
        requestSource: ctx.requestSource || 'light-extension-create-from-git',
      };
      const repo = await this.repoService.createRepo(
        {
          name: metadata.name,
          title: metadata.title,
          description: metadata.description,
          initialFiles,
          message: 'Import light extension source from Git',
        },
        transactionContext,
      );
      if (!repo.headCommitId) {
        throw new LightExtensionError(
          'LIGHT_EXTENSION_SOURCE_ERROR',
          'Light extension initial source commit is missing',
          {
            details: { repoId: repo.id },
          },
        );
      }

      const compiled = await this.runtimeCompileService.compileCurrentRuntime(repo.id, repo.headCommitId, {
        ...transactionContext,
        requestSource: 'light-extension-create-from-git-compile',
      });
      const internalRepo = await this.repoService.getInternalRepo(repo.id, transactionContext);
      const established = await runtime.establishInitialBaseline(
        {
          repoId: internalRepo.vscRepoId,
          name: remoteName,
          provider: fetched.provider,
          config: fetched.config,
          authRef: input.authRef,
          localCommitId: repo.headCommitId,
          snapshot: fetched.snapshot,
        },
        transaction,
      );
      await this.auditService.recordSyncEvent({
        repoId: compiled.repo.id,
        action: 'syncCreateFromGit',
        result: 'success',
        requestId: ctx.requestId || `syncCreateFromGit:${compiled.repo.id}`,
        actorUserId: ctx.actorUserId,
        provider: established.remote.provider,
        remoteTargetVersion: established.remote.version,
        remoteRevision: revision,
        localCommitId: compiled.repo.headCommitId,
        state: established.plan.state,
        syncAction: established.plan.action,
        fileCount: initialFiles.length,
        message: 'syncCreateFromGit succeeded',
        transaction,
      });

      return {
        repo: compiled.repo,
        remote: established.remote,
        plan: established.plan,
        revision,
        fileCount: initialFiles.length,
      };
    });
  }

  private assertValidInitialFiles(files: LightExtensionTreeEntryInput[]): void {
    if (!files.length) {
      throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Remote source is empty', {
        status: 422,
        details: { diagnostics: [] },
      });
    }
    const diagnostics = this.repoService.getValidator().validateInitialFiles({ files });
    if (!hasErrorDiagnostic(diagnostics)) {
      return;
    }
    throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension initial source is invalid', {
      status: 422,
      details: { diagnostics },
    });
  }
}

function requireRemoteRevision(revision: string | null): string {
  if (!revision) {
    throw new LightExtensionError('LIGHT_EXTENSION_SYNC_REMOTE_NOT_FOUND', 'Remote branch has no revision', {
      details: { reasonCode: 'remote-branch-empty' },
    });
  }
  return revision;
}

function toInitialFiles(
  files: ReadonlyArray<{ path: string; content: string; mode?: string; language?: string }>,
): LightExtensionTreeEntryInput[] {
  return files.map((file) => ({
    path: file.path,
    content: file.content,
    mode: file.mode,
    language: file.language,
  }));
}
