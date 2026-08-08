/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscRemoteSnapshotFile } from '../../vsc-file';
import {
  RemoteSyncAdapterRegistry,
  RemoteSyncRuntimeService,
  VscPermissionHookRegistry,
  validateVscRemoteAuthRef,
} from '../../vsc-file';
import { createMockServer, type MockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { DeterministicRemoteAdapter } from '../../vsc-file/remotes/testing/DeterministicRemoteAdapter';
import PluginJsTemplateServer from '../../plugin';
import { JsTemplateAuditService } from '../../services/JsTemplateAuditService';
import { JsTemplateCreateFromRemoteService } from '../../services/JsTemplateCreateFromRemoteService';
import { JsTemplateService } from '../../services/JsTemplateService';
import { JsTemplateFileService } from '../../services/JsTemplateFileService';
import { JsTemplatePermissionService } from '../../services/JsTemplatePermissionService';
import { JsTemplateRemotePullService } from '../../services/JsTemplateRemotePullService';
import { JsTemplateProjectService } from '../../services/JsTemplateProjectService';
import { JsTemplateCompileService } from '../../services/JsTemplateCompileService';
import { JsTemplateValidator } from '../../services/JsTemplateValidator';
import { JsTemplateWorkspaceCompilerBridge } from '../../services/JsTemplateWorkspaceCompilerBridge';
import { JsTemplateUsageService } from '../../services/JsTemplateUsageService';

export const gitSyncRemoteConfig = {
  url: 'https://git.example.com/nocobase/extensions.git',
  branch: 'main',
  subdirectory: null,
  transport: 'https',
};

export interface GitSyncAcceptanceFixture {
  app: MockServer;
  adapter: DeterministicRemoteAdapter;
  runtime: RemoteSyncRuntimeService;
  auditService: JsTemplateAuditService;
  permissionService: JsTemplatePermissionService;
  projectService: JsTemplateProjectService;
  fileService: JsTemplateFileService;
  runtimeCompileService: JsTemplateCompileService;
  createService: JsTemplateCreateFromRemoteService;
  pullService: JsTemplateRemotePullService;
  validateCredential: ReturnType<typeof vi.fn>;
  close(): Promise<void>;
  createFromRemote(name: string, authRef?: string | null): ReturnType<JsTemplateCreateFromRemoteService['create']>;
  createPullInput(projectId: string): Promise<{
    projectId: string;
    remoteId: string;
    expectedLocalCommitId: string | null;
    expectedRemoteRevision: string | null;
    expectedRemoteTargetVersion: number;
    planFingerprint: string;
  }>;
}

export async function createGitSyncAcceptanceFixture(): Promise<GitSyncAcceptanceFixture> {
  const app = await createMockServer({ plugins: [PluginJsTemplateServer] });
  const auditService = new JsTemplateAuditService(app.db);
  const permissionService = new JsTemplatePermissionService(auditService);
  const permissionHooks = new VscPermissionHookRegistry();
  permissionHooks.register(permissionService.createVscPermissionHook());
  const validator = new JsTemplateValidator();
  const projectService = new JsTemplateProjectService(
    app.db,
    auditService,
    permissionService,
    permissionHooks,
    validator,
  );
  const fileService = new JsTemplateFileService(app.db, permissionService, projectService, permissionHooks, validator);
  const templateService = new JsTemplateService(app.db, fileService, projectService, validator);
  const compilerBridge = new JsTemplateWorkspaceCompilerBridge();
  const runtimeCompileService = new JsTemplateCompileService(app.db, fileService, templateService, compilerBridge);
  runtimeCompileService.useJsTemplateUsageService(
    new JsTemplateUsageService(app.db, auditService, permissionService, projectService),
  );
  const adapter = new DeterministicRemoteAdapter({
    initialRevision: 'remote-base',
    initialFiles: validGitSyncFiles(),
    initialMetadata: { branch: 'main' },
  });
  const registry = new RemoteSyncAdapterRegistry();
  registry.register(adapter);
  const validateCredential = vi.fn((authRef: unknown) =>
    validateVscRemoteAuthRef(authRef, async (name) => ({ name, type: 'secret' })),
  );
  const runtime = new RemoteSyncRuntimeService(app.db, {
    adapterRegistry: registry,
    credentialResolver: { validate: validateCredential },
    permissionHooks,
  });
  const createService = new JsTemplateCreateFromRemoteService(
    app.db,
    auditService,
    projectService,
    runtimeCompileService,
    () => runtime,
  );
  const pullService = new JsTemplateRemotePullService(
    permissionService,
    projectService,
    runtimeCompileService,
    runtime.getPullCoordinator(),
  );

  return {
    app,
    adapter,
    runtime,
    auditService,
    permissionService,
    projectService,
    fileService,
    runtimeCompileService,
    createService,
    pullService,
    validateCredential,
    close: () => app.destroy(),
    createFromRemote: (name, authRef = null) =>
      createService.create({
        name,
        title: name,
        provider: 'git',
        config: gitSyncRemoteConfig,
        authRef,
      }),
    async createPullInput(projectId) {
      const internal = await projectService.getInternalProject(projectId);
      const remote = await runtime.getRemote(internal.vscRepoId, 'origin');
      if (!remote) {
        throw new Error('Expected an origin remote');
      }
      const plan = await runtime.planRemote(remote.id);
      return {
        projectId,
        remoteId: remote.id,
        expectedLocalCommitId: plan.local.headCommitId,
        expectedRemoteRevision: plan.remote.revision,
        expectedRemoteTargetVersion: plan.remoteTargetVersion,
        planFingerprint: plan.fingerprint,
      };
    },
  };
}

export function validGitSyncFiles(label = 'Initial'): VscRemoteSnapshotFile[] {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: `ctx.render(<div>${label}</div>);\n`,
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/sales-kpi/entry.json',
      content: '{"schemaVersion":1,"key":"sales-kpi"}',
      language: 'json',
    },
  ];
}
