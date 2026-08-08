/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { VscPermissionHookRegistry } from '@nocobase/runjs-workspace/server';
import type { VscRemoteSnapshotFile } from '../../shared/vsc-file/remote-sync-types';
import { RemoteSyncAdapterRegistry, RemoteSyncError, RemoteSyncRuntimeService } from '../vsc-file/remotes';
import { createMockServer, type MockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { DeterministicRemoteAdapter } from '../vsc-file/remotes/testing/DeterministicRemoteAdapter';
import { GitCommandRunner, GitRemoteAdapter } from '../vsc-file/remotes/providers/git';
import { validateVscRemoteAuthRef } from '../vsc-file/remotes/credentialRef';
import PluginJsTemplateServer from '../plugin';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import { JsTemplateCreateFromRemoteService } from '../services/JsTemplateCreateFromRemoteService';
import { JsTemplateService } from '../services/JsTemplateService';
import { JsTemplateFileService } from '../services/JsTemplateFileService';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';
import { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import { JsTemplateCompileService } from '../services/JsTemplateCompileService';
import { JsTemplateValidator } from '../services/JsTemplateValidator';
import { JsTemplateWorkspaceCompilerBridge } from '../services/JsTemplateWorkspaceCompilerBridge';
import { JsTemplateUsageService } from '../services/JsTemplateUsageService';

const remoteConfig = {
  url: 'https://git.example.com/nocobase/extensions.git',
  branch: 'main',
  subdirectory: null,
  transport: 'https',
};

describe('JsTemplateCreateFromRemoteService', () => {
  let app: MockServer;
  let adapter: DeterministicRemoteAdapter;
  let runtime: RemoteSyncRuntimeService;
  let auditService: JsTemplateAuditService;
  let projectService: JsTemplateProjectService;
  let runtimeCompileService: JsTemplateCompileService;
  let service: JsTemplateCreateFromRemoteService;
  let validateCredential: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    app = await createMockServer({ plugins: [PluginJsTemplateServer] });
    auditService = new JsTemplateAuditService(app.db);
    const permissionService = new JsTemplatePermissionService(auditService);
    const permissionHooks = new VscPermissionHookRegistry();
    permissionHooks.register(permissionService.createVscPermissionHook());
    const validator = new JsTemplateValidator();
    projectService = new JsTemplateProjectService(app.db, auditService, permissionService, permissionHooks, validator);
    const fileService = new JsTemplateFileService(
      app.db,
      permissionService,
      projectService,
      permissionHooks,
      validator,
    );
    const templateService = new JsTemplateService(app.db, fileService, projectService, validator);
    const compilerBridge = new JsTemplateWorkspaceCompilerBridge();
    runtimeCompileService = new JsTemplateCompileService(app.db, fileService, templateService, compilerBridge);
    const usageService = new JsTemplateUsageService(app.db, auditService, permissionService, projectService);
    runtimeCompileService.useJsTemplateUsageService(usageService);
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
    service = new JsTemplateCreateFromRemoteService(
      app.db,
      auditService,
      projectService,
      runtimeCompileService,
      () => runtime,
    );
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('atomically creates the Git source with exactly one primary business audit', async () => {
    const prepareInitialWorkspace = vi.spyOn(runtimeCompileService, 'prepareInitialWorkspace');
    const applyPreparedInitialWorkspace = vi.spyOn(runtimeCompileService, 'applyPreparedInitialWorkspace');
    const result = await service.create(
      {
        name: 'Remote Sales KPI',
        title: 'Remote Sales KPI',
        description: 'Imported from Git',
        provider: 'git',
        config: remoteConfig,
        authRef: '{{ $env.GIT_SYNC }}',
      },
      { requestId: 'req_create_from_git_main_audit' },
      { targetProjectId: 'jtp_durable_target' },
    );
    const internalProject = await projectService.getInternalProject(result.project.id);
    const remote = await runtime.getRemote(internalProject.vscRepoId, 'origin');
    const templates = await app.db.getRepository('jsTemplates').find({ filter: { projectId: result.project.id } });
    const mapping = await app.db.getRepository('vscFileExternalCommitMaps').findOne({
      filter: { remoteId: remote?.id },
    });
    const job = await app.db.getRepository('vscFileSyncJobs').findOne({ filter: { remoteId: remote?.id } });
    const auditLogs = await app.db.getRepository('jsTemplateLogs').find({
      filter: { projectId: result.project.id, requestId: 'req_create_from_git_main_audit' },
    });

    expect(validateCredential).toHaveBeenCalledWith('{{ $env.GIT_SYNC }}');
    expect(prepareInitialWorkspace.mock.calls[0][1]?.transaction).toBeUndefined();
    expect(applyPreparedInitialWorkspace.mock.calls[0][2].transaction).toBeDefined();
    expect(result).toMatchObject({
      project: { id: 'jtp_durable_target', healthStatus: 'ready', headCommitId: expect.stringMatching(/^vscc_/) },
      remote: { config: { branch: 'main' }, authRef: '{{ $env.GIT_SYNC }}' },
      plan: { state: 'in-sync', action: 'noop' },
      revision: 'remote-initial',
      fileCount: 2,
    });
    expect(templates).toEqual([
      expect.objectContaining({
        templateName: 'sales-kpi',
        healthStatus: 'ready',
        runtimeArtifact: expect.any(Object),
      }),
    ]);
    expect(mapping).toMatchObject({
      localCommitId: result.project.headCommitId,
      remoteRevision: 'remote-initial',
      contentHash: adapter.getSnapshot().contentHash,
    });
    expect(job).toMatchObject({
      operation: 'pull',
      status: 'succeeded',
      phase: 'finalized',
      resultLocalCommitId: result.project.headCommitId,
      resultRemoteRevision: 'remote-initial',
    });
    expect(remote).toMatchObject({ lastSyncedAt: expect.any(String) });
    expect(auditLogs.map((log) => log.get('action'))).toEqual(['syncCreateFromGit']);
    expect(JSON.stringify(auditLogs.map((log) => log.toJSON()))).not.toContain('GIT_SYNC');
  });

  it.skipIf(process.env.RUN_JS_TEMPLATE_GITHUB_SSH_E2E !== '1')(
    'imports and compiles all templates from gchust/nocobase-js-template at 6fd1c4f8',
    async () => {
      const registry = new RemoteSyncAdapterRegistry();
      registry.register(
        new GitRemoteAdapter({
          credentialResolver: { resolve: async () => null },
          runner: new GitCommandRunner(),
        }),
      );
      const gitRuntime = new RemoteSyncRuntimeService(app.db, {
        adapterRegistry: registry,
        credentialResolver: { validate: validateCredential },
      });
      const gitService = new JsTemplateCreateFromRemoteService(
        app.db,
        auditService,
        projectService,
        runtimeCompileService,
        () => gitRuntime,
      );

      const result = await gitService.create({
        name: 'Git compile fixture',
        title: 'Git compile fixture',
        provider: 'git',
        config: {
          url: 'https://github.com/gchust/nocobase-js-template.git',
          branch: 'main',
          subdirectory: null,
          transport: 'https',
        },
        authRef: null,
      });
      const templates = await app.db.getRepository('jsTemplates').find({ filter: { projectId: result.project.id } });

      expect(result).toMatchObject({
        project: { lifecycleStatus: 'enabled', healthStatus: 'ready' },
        revision: '6fd1c4f8bfaec9010298ff514aea3b41212c59a8',
        fileCount: 60,
      });
      expect(templates).toHaveLength(16);
      expect(templates.every((template) => template.get('healthStatus') === 'ready')).toBe(true);
    },
    60_000,
  );

  it('preserves removed generic RunJS files as inert remote source', async () => {
    adapter.advanceRemote([...validFiles(), ...removedGenericRunJSFiles()], { branch: 'main' });

    const result = await service.create({
      name: 'Remote Legacy RunJS',
      provider: 'git',
      config: remoteConfig,
      authRef: null,
    });
    const internalProject = await projectService.getInternalProject(result.project.id);
    const remote = await runtime.getRemote(internalProject.vscRepoId, 'origin');
    const templates = await app.db.getRepository('jsTemplates').find({ filter: { projectId: result.project.id } });
    const plan = await runtime.planRemote(remote?.id as string);

    expect(result).toMatchObject({
      project: { healthStatus: 'ready' },
      plan: { state: 'in-sync', action: 'noop' },
      fileCount: 4,
    });
    expect(templates).toEqual([
      expect.objectContaining({ kind: 'js-block', templateName: 'sales-kpi', healthStatus: 'ready' }),
    ]);
    expect(plan).toMatchObject({ state: 'in-sync', action: 'noop' });
  });

  it('keeps the fetched revision as the baseline when the remote advances later', async () => {
    const result = await service.create({
      name: 'Remote Advances',
      provider: 'git',
      config: remoteConfig,
      authRef: null,
    });
    const internalProject = await projectService.getInternalProject(result.project.id);
    const remote = await runtime.getRemote(internalProject.vscRepoId, 'origin');

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
      provider: 'git',
      config: remoteConfig,
      authRef: null,
    });
    const counts = await persistenceCounts();

    await expect(
      service.create({
        name: 'duplicate remote',
        provider: 'git',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_PROJECT_CONFLICT' });
    await expect(persistenceCounts()).resolves.toEqual(counts);
  });

  it('does not begin local persistence when remote fetch or source validation fails', async () => {
    const counts = await persistenceCounts();
    adapter.setFailure(
      'fetch',
      new RemoteSyncError('REMOTE_UNAVAILABLE', 'provider details', {
        details: { provider: 'git', reasonCode: 'fetch-failed' },
      }),
    );
    await expect(
      service.create({
        name: 'Fetch Failure',
        provider: 'git',
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
        provider: 'git',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_VALIDATION_FAILED' });
    await expect(persistenceCounts()).resolves.toEqual(counts);
  });

  it('validates canonical metadata before credential validation or remote access', async () => {
    const probe = vi.spyOn(adapter, 'probe');
    const fetchSnapshot = vi.spyOn(adapter, 'fetchSnapshot');
    const createProject = vi.spyOn(projectService, 'createProject');

    await expect(
      service.create({
        name: '!!!',
        title: '  Invalid metadata  ',
        description: '  Must fail before remote access  ',
        provider: 'git',
        config: remoteConfig,
        authRef: '{{ $env.GIT_SYNC }}',
      }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_INVALID_INPUT' });

    expect(validateCredential).not.toHaveBeenCalled();
    expect(probe).not.toHaveBeenCalled();
    expect(fetchSnapshot).not.toHaveBeenCalled();
    expect(createProject).not.toHaveBeenCalled();
  });

  it('rejects an invalid fetched snapshot before opening the local transaction', async () => {
    const snapshot = adapter.getSnapshot();
    vi.spyOn(adapter, 'fetchSnapshot').mockResolvedValueOnce({
      ...snapshot,
      contentHash: 'sha256:invalid',
    });
    const transaction = vi.spyOn(app.db.sequelize, 'transaction');
    const createProject = vi.spyOn(projectService, 'createProject');

    await expect(
      service.create({
        name: 'Invalid Snapshot',
        provider: 'git',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({
      code: 'UNSAFE_CONTENT',
      details: { reasonCode: 'snapshot-content-hash-mismatch' },
    });

    expect(transaction).not.toHaveBeenCalled();
    expect(createProject).not.toHaveBeenCalled();
  });

  it('rolls back project, templates, artifacts, remote, mapping, and job when compile or baseline persistence fails', async () => {
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
        provider: 'git',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_VALIDATION_FAILED' });
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
        provider: 'git',
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
        provider: 'git',
        config: remoteConfig,
        authRef: null,
      }),
    ).rejects.toThrow('audit persistence failed');
    await expect(persistenceCounts()).resolves.toEqual(compileCounts);
  });

  async function persistenceCounts() {
    return {
      projects: await app.db.getRepository('jsTemplateProjects').count(),
      vscRepos: await app.db.getRepository('vscFileRepositories').count(),
      commits: await app.db.getRepository('vscFileCommits').count(),
      templates: await app.db.getRepository('jsTemplates').count(),
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

function removedGenericRunJSFiles(): VscRemoteSnapshotFile[] {
  return [
    {
      path: 'src/client/runjs/calculate-subtotal/index.ts',
      content: 'return 1;\n',
      language: 'typescript',
    },
    {
      path: 'src/client/runjs/calculate-subtotal/entry.json',
      content: '{"schemaVersion":1,"key":"calculate-subtotal"}',
      language: 'json',
    },
  ];
}
