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
import PluginLightExtensionServer from '../../plugin';
import { LightExtensionAuditService } from '../../services/LightExtensionAuditService';
import { LightExtensionCreateFromRemoteService } from '../../services/LightExtensionCreateFromRemoteService';
import { LightExtensionEntryService } from '../../services/LightExtensionEntryService';
import { LightExtensionFileService } from '../../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../../services/LightExtensionPermissionService';
import { LightExtensionRemotePullService } from '../../services/LightExtensionRemotePullService';
import { LightExtensionRepoService } from '../../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../../services/LightExtensionWorkspaceCompilerBridge';
import { ReferenceService } from '../../services/ReferenceService';

export const gitSyncRemoteConfig = {
  owner: 'nocobase',
  repository: 'extensions',
  branch: 'main',
  subdirectory: null,
};

export interface GitSyncAcceptanceFixture {
  app: MockServer;
  adapter: DeterministicRemoteAdapter;
  runtime: RemoteSyncRuntimeService;
  auditService: LightExtensionAuditService;
  permissionService: LightExtensionPermissionService;
  repoService: LightExtensionRepoService;
  fileService: LightExtensionFileService;
  runtimeCompileService: LightExtensionRuntimeCompileService;
  createService: LightExtensionCreateFromRemoteService;
  pullService: LightExtensionRemotePullService;
  validateCredential: ReturnType<typeof vi.fn>;
  close(): Promise<void>;
  createFromRemote(name: string, authRef?: string | null): ReturnType<LightExtensionCreateFromRemoteService['create']>;
  createPullInput(repoId: string): Promise<{
    repoId: string;
    remoteId: string;
    expectedLocalCommitId: string | null;
    expectedRemoteRevision: string | null;
    expectedRemoteTargetVersion: number;
    planFingerprint: string;
  }>;
}

export async function createGitSyncAcceptanceFixture(): Promise<GitSyncAcceptanceFixture> {
  const app = await createMockServer({ plugins: [PluginLightExtensionServer] });
  const auditService = new LightExtensionAuditService(app.db);
  const permissionService = new LightExtensionPermissionService(auditService);
  const permissionHooks = new VscPermissionHookRegistry();
  permissionHooks.register(permissionService.createVscPermissionHook());
  const validator = new LightExtensionValidator();
  const repoService = new LightExtensionRepoService(
    app.db,
    auditService,
    permissionService,
    permissionHooks,
    validator,
  );
  const fileService = new LightExtensionFileService(
    app.db,
    auditService,
    permissionService,
    repoService,
    permissionHooks,
    validator,
  );
  const entryService = new LightExtensionEntryService(app.db, fileService, repoService, validator);
  const compilerBridge = new LightExtensionWorkspaceCompilerBridge(auditService, permissionService);
  const runtimeCompileService = new LightExtensionRuntimeCompileService(
    app.db,
    fileService,
    entryService,
    compilerBridge,
  );
  runtimeCompileService.useReferenceService(new ReferenceService(app.db, auditService, permissionService));
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
  const createService = new LightExtensionCreateFromRemoteService(
    app.db,
    auditService,
    repoService,
    runtimeCompileService,
    () => runtime,
  );
  const pullService = new LightExtensionRemotePullService(
    permissionService,
    repoService,
    runtimeCompileService,
    runtime.getPullCoordinator(),
  );

  return {
    app,
    adapter,
    runtime,
    auditService,
    permissionService,
    repoService,
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
        provider: 'github',
        config: gitSyncRemoteConfig,
        authRef,
      }),
    async createPullInput(repoId) {
      const internal = await repoService.getInternalRepo(repoId);
      const remote = await runtime.getRemote(internal.vscRepoId, 'origin');
      if (!remote) {
        throw new Error('Expected an origin remote');
      }
      const plan = await runtime.planRemote(remote.id);
      return {
        repoId,
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
