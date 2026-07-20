/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscRemoteSnapshotFile } from '../vsc-file';
import {
  RemoteSyncAdapterRegistry,
  RemoteSyncError,
  RemoteSyncRuntimeService,
  VscPermissionHookRegistry,
  validateVscRemoteAuthRef,
} from '../vsc-file';
import PluginVscFileServer from '../vsc-file';
import { createMockServer, type MockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { DeterministicRemoteAdapter } from '../vsc-file/remotes/testing/DeterministicRemoteAdapter';
import PluginLightExtensionServer from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionCreateFromRemoteService } from '../services/LightExtensionCreateFromRemoteService';
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';
import { ReferenceService } from '../services/ReferenceService';

const remoteConfig = {
  owner: 'nocobase',
  repository: 'extensions',
  branch: '',
  subdirectory: null,
};

describe('LightExtensionCreateFromRemoteService', () => {
  let app: MockServer;
  let adapter: DeterministicRemoteAdapter;
  let runtime: RemoteSyncRuntimeService;
  let auditService: LightExtensionAuditService;
  let repoService: LightExtensionRepoService;
  let service: LightExtensionCreateFromRemoteService;
  let validateCredential: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    app = await createMockServer({ plugins: [PluginVscFileServer, PluginLightExtensionServer] });
    auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const permissionHooks = new VscPermissionHookRegistry();
    permissionHooks.register(permissionService.createVscPermissionHook());
    const validator = new LightExtensionValidator();
    repoService = new LightExtensionRepoService(app.db, auditService, permissionService, permissionHooks, validator);
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
    const referenceService = new ReferenceService(app.db, auditService, permissionService);
    runtimeCompileService.useReferenceService(referenceService);
    adapter = new DeterministicRemoteAdapter({
      initialRevision: 'remote-initial',
      initialFiles: validFiles(),
      initialMetadata: { branch: 'main' },
    });
    const registry = new RemoteSyncAdapterRegistry();
    registry.register(adapter);
    validateCredential = vi.fn((authRef: unknown) =>
      validateVscRemoteAuthRef(authRef, async (name) => ({ name, type: 'secret' })),
    );
    runtime = new RemoteSyncRuntimeService(app.db, {
      adapterRegistry: registry,
      credentialResolver: { validate: validateCredential },
      permissionHooks,
    });
    service = new LightExtensionCreateFromRemoteService(
      app.db,
      auditService,
      repoService,
      runtimeCompileService,
      () => runtime,
    );
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('atomically creates compiled source, a fixed remote target, mapping, succeeded job, and in-sync baseline', async () => {
    const result = await service.create({
      name: 'Remote Sales KPI',
      title: 'Remote Sales KPI',
      description: 'Imported from GitHub',
      provider: 'github',
      config: remoteConfig,
      authRef: '{{ $env.GITHUB_SYNC }}',
    });
    const internalRepo = await repoService.getInternalRepo(result.repo.id);
    const remote = await runtime.getRemote(internalRepo.vscRepoId, 'origin');
    const entries = await app.db.getRepository('lightExtensionEntries').find({ filter: { repoId: result.repo.id } });
    const mapping = await app.db.getRepository('vscFileExternalCommitMaps').findOne({
      filter: { remoteId: remote?.id },
    });
    const job = await app.db.getRepository('vscFileSyncJobs').findOne({ filter: { remoteId: remote?.id } });

    expect(validateCredential).toHaveBeenCalledWith('{{ $env.GITHUB_SYNC }}');
    expect(result).toMatchObject({
      repo: { healthStatus: 'ready', headCommitId: expect.stringMatching(/^vscc_/) },
      remote: { config: { branch: 'main' }, authRef: '{{ $env.GITHUB_SYNC }}' },
      plan: { state: 'in-sync', action: 'noop' },
      revision: 'remote-initial',
      fileCount: 2,
    });
    expect(entries).toEqual([
      expect.objectContaining({ entryName: 'sales-kpi', healthStatus: 'ready', runtimeArtifact: expect.any(Object) }),
    ]);
    expect(mapping).toMatchObject({
      localCommitId: result.repo.headCommitId,
      remoteRevision: 'remote-initial',
      contentHash: adapter.getSnapshot().contentHash,
    });
    expect(job).toMatchObject({
      operation: 'pull',
      status: 'succeeded',
      phase: 'finalized',
      resultLocalCommitId: result.repo.headCommitId,
      resultRemoteRevision: 'remote-initial',
    });
    expect(remote).toMatchObject({ lastSyncedAt: expect.any(String) });
  });

  it('keeps the fetched revision as the baseline when the remote advances later', async () => {
    const result = await service.create({
      name: 'Remote Advances',
      provider: 'github',
      config: remoteConfig,
      authRef: null,
    });
    const internalRepo = await repoService.getInternalRepo(result.repo.id);
    const remote = await runtime.getRemote(internalRepo.vscRepoId, 'origin');

    adapter.advanceRemote(updatedFiles('Remote advanced'), { branch: 'main' });
    const plan = await runtime.planRemote(remote?.id as string);

    expect(result.revision).toBe('remote-initial');
    expect(plan).toMatchObject({
      state: 'remote-ahead',
      action: 'pull',
      baseline: { lastRemoteRevision: 'remote-initial' },
    });
  });

  it('reuses the existing name conflict and leaves no second local or remote records', async () => {
    await service.create({
      name: 'Duplicate Remote',
      provider: 'github',
      config: remoteConfig,
      authRef: null,
    });
    const counts = await persistenceCounts();

    await expect(
      service.create({
        name: 'duplicate remote',
        provider: 'github',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_REPO_CONFLICT' });
    await expect(persistenceCounts()).resolves.toEqual(counts);
  });

  it('does not begin local persistence when remote fetch or source validation fails', async () => {
    const counts = await persistenceCounts();
    adapter.setFailure(
      'fetch',
      new RemoteSyncError('REMOTE_UNAVAILABLE', 'provider details', {
        details: { provider: 'github', reasonCode: 'fetch-failed' },
      }),
    );
    await expect(
      service.create({
        name: 'Fetch Failure',
        provider: 'github',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'REMOTE_UNAVAILABLE' });
    await expect(persistenceCounts()).resolves.toEqual(counts);

    adapter.setFailure('fetch', null);
    adapter.advanceRemote(
      [
        {
          path: 'src/client/js-blocks/broken/index.tsx',
          content: 'ctx.render(<div>Broken</div>);\n',
          language: 'typescript',
        },
      ],
      { branch: 'main' },
    );
    await expect(
      service.create({
        name: 'Validation Failure',
        provider: 'github',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_VALIDATION_FAILED' });
    await expect(persistenceCounts()).resolves.toEqual(counts);
  });

  it('validates canonical metadata before credential validation or remote access', async () => {
    const probe = vi.spyOn(adapter, 'probe');
    const fetchSnapshot = vi.spyOn(adapter, 'fetchSnapshot');
    const createRepo = vi.spyOn(repoService, 'createRepo');

    await expect(
      service.create({
        name: '!!!',
        title: '  Invalid metadata  ',
        description: '  Must fail before GitHub  ',
        provider: 'github',
        config: remoteConfig,
        authRef: '{{ $env.GITHUB_SYNC }}',
      }),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_INVALID_INPUT' });

    expect(validateCredential).not.toHaveBeenCalled();
    expect(probe).not.toHaveBeenCalled();
    expect(fetchSnapshot).not.toHaveBeenCalled();
    expect(createRepo).not.toHaveBeenCalled();
  });

  it('rejects an invalid fetched snapshot before opening the local transaction', async () => {
    const snapshot = adapter.getSnapshot();
    vi.spyOn(adapter, 'fetchSnapshot').mockResolvedValueOnce({
      ...snapshot,
      contentHash: 'sha256:invalid',
    });
    const transaction = vi.spyOn(app.db.sequelize, 'transaction');
    const createRepo = vi.spyOn(repoService, 'createRepo');

    await expect(
      service.create({
        name: 'Invalid Snapshot',
        provider: 'github',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode: 'snapshot-content-hash-mismatch' },
    });

    expect(transaction).not.toHaveBeenCalled();
    expect(createRepo).not.toHaveBeenCalled();
  });

  it('rolls back repo, entries, artifacts, remote, mapping, and job when compile or baseline persistence fails', async () => {
    const compileCounts = await persistenceCounts();
    adapter.advanceRemote(
      [
        {
          path: 'src/client/js-blocks/broken/index.tsx',
          content: "import Missing from './missing';\nctx.render(<Missing />);\n",
          language: 'typescript',
        },
        validFiles()[1],
      ],
      { branch: 'main' },
    );
    await expect(
      service.create({
        name: 'Compile Failure',
        provider: 'github',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_VALIDATION_FAILED' });
    await expect(persistenceCounts()).resolves.toEqual(compileCounts);

    adapter.advanceRemote(validFiles(), { branch: 'main' });
    const establish = vi.spyOn(runtime, 'establishInitialBaseline').mockRejectedValueOnce(
      new RemoteSyncError('REMOTE_CHANGED', 'baseline failure', {
        details: { reasonCode: 'baseline-failed' },
      }),
    );
    await expect(
      service.create({
        name: 'Baseline Failure',
        provider: 'github',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'REMOTE_CHANGED' });
    expect(establish).toHaveBeenCalled();
    await expect(persistenceCounts()).resolves.toEqual(compileCounts);

    vi.spyOn(auditService, 'recordSyncEvent').mockRejectedValueOnce(new Error('audit persistence failed'));
    await expect(
      service.create({
        name: 'Audit Failure',
        provider: 'github',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toThrow('audit persistence failed');
    await expect(persistenceCounts()).resolves.toEqual(compileCounts);
  });

  async function persistenceCounts() {
    return {
      repos: await app.db.getRepository('lightExtensionRepos').count(),
      vscRepos: await app.db.getRepository('vscFileRepositories').count(),
      commits: await app.db.getRepository('vscFileCommits').count(),
      entries: await app.db.getRepository('lightExtensionEntries').count(),
      remotes: await app.db.getRepository('vscFileRemotes').count(),
      maps: await app.db.getRepository('vscFileExternalCommitMaps').count(),
      jobs: await app.db.getRepository('vscFileSyncJobs').count(),
    };
  }
});

function validFiles(): VscRemoteSnapshotFile[] {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: 'ctx.render(<div>Initial</div>);\n',
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/sales-kpi/entry.json',
      content: '{"schemaVersion":1,"key":"sales-kpi"}',
      language: 'json',
    },
  ];
}

function updatedFiles(label: string): VscRemoteSnapshotFile[] {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: `ctx.render(<div>${label}</div>);\n`,
      language: 'typescript',
    },
    validFiles()[1],
  ];
}
