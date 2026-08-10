/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscRemoteSnapshotFile } from '../../shared/vsc-file/remote-sync-types';
import { CommitService, TreeService, VscPermissionHookRegistry } from '@nocobase/runjs/workspace/server';
import { createMockServer, type MockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { ExternalCommitMapStore } from '../vsc-file/remotes/ExternalCommitMapStore';
import { RemoteSyncAdapterRegistry } from '../vsc-file/remotes/RemoteSyncAdapterRegistry';
import { RemoteStore } from '../vsc-file/remotes/RemoteStore';
import { SyncStatePlanner } from '../vsc-file/remotes/SyncStatePlanner';
import { DeterministicRemoteAdapter } from '../vsc-file/remotes/testing/DeterministicRemoteAdapter';
import { VscRemotePullDiscoveryService } from '../vsc-file/remotes/VscRemotePullDiscoveryService';
import { loadVscSnapshot } from '../vsc-file/remotes/VscRemotePushService';
import PluginJsTemplateServer from '../plugin';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import { JsTemplateService } from '../services/JsTemplateService';
import { JsTemplateFileService } from '../services/JsTemplateFileService';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';
import { JsTemplateRemotePullService } from '../services/JsTemplateRemotePullService';
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

describe('JsTemplateRemotePullService', () => {
  let app: MockServer;
  let projectService: JsTemplateProjectService;
  let fileService: JsTemplateFileService;
  let runtimeCompileService: JsTemplateCompileService;
  let remotePullService: JsTemplateRemotePullService;
  let remoteStore: RemoteStore;
  let mapStore: ExternalCommitMapStore;
  let adapter: DeterministicRemoteAdapter;
  let registry: RemoteSyncAdapterRegistry;
  let discovery: VscRemotePullDiscoveryService;

  beforeEach(async () => {
    app = await createMockServer({ plugins: [PluginJsTemplateServer] });
    const auditService = new JsTemplateAuditService(app.db);
    const permissionService = new JsTemplatePermissionService(auditService);
    const permissionHooks = new VscPermissionHookRegistry();
    permissionHooks.register(permissionService.createVscPermissionHook());
    const validator = new JsTemplateValidator();
    projectService = new JsTemplateProjectService(app.db, auditService, permissionService, permissionHooks, validator);
    fileService = new JsTemplateFileService(app.db, permissionService, projectService, permissionHooks, validator);
    const templateService = new JsTemplateService(app.db, fileService, projectService, validator);
    const compilerBridge = new JsTemplateWorkspaceCompilerBridge();
    runtimeCompileService = new JsTemplateCompileService(app.db, fileService, templateService, compilerBridge);
    const usageService = new JsTemplateUsageService(app.db, auditService, permissionService, projectService);
    runtimeCompileService.useJsTemplateUsageService(usageService);
    adapter = new DeterministicRemoteAdapter({ initialRevision: 'remote-base', initialFiles: baselineFiles() });
    registry = new RemoteSyncAdapterRegistry();
    registry.register(adapter);
    remoteStore = new RemoteStore(app.db);
    mapStore = new ExternalCommitMapStore(app.db);
    discovery = new VscRemotePullDiscoveryService(app.db, {
      adapterRegistry: registry,
      permissionHooks,
    });
    remotePullService = new JsTemplateRemotePullService(
      permissionService,
      projectService,
      runtimeCompileService,
      discovery,
    );
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('applies remote-ahead source as one commit and compiles runtime before finalizing the map', async () => {
    const setup = await createMappedProject('Remote Ahead');
    adapter.advanceRemote(updatedFiles('Pulled runtime'));
    const input = await createPullInput(setup.project.id, setup.remote.id);
    const prepareRemoteSnapshot = vi.spyOn(runtimeCompileService, 'prepareRemoteSnapshot');
    const commitPreparedSave = vi.spyOn(runtimeCompileService, 'commitPreparedSave');
    const commitsBefore = await app.db.getRepository('vscFileCommits').count({
      filter: { repoId: setup.internal.vscRepoId },
    });

    const result = await remotePullService.pull(input, { actorUserId: 'user-1', requestId: 'req_pull_success' });

    expect(result).toMatchObject({
      changed: true,
      plan: { state: 'remote-ahead', action: 'pull' },
      compile: { status: 'success' },
    });
    expect(prepareRemoteSnapshot.mock.calls[0][1]?.transaction).toBeUndefined();
    expect(commitPreparedSave.mock.calls[0][1].transaction).toBeDefined();
    expect(JSON.stringify(result)).not.toMatch(/authRef|claimToken|leaseOwner|leaseExpiresAt|Pulled runtime/u);
    await expect(
      app.db.getRepository('vscFileCommits').count({ filter: { repoId: setup.internal.vscRepoId } }),
    ).resolves.toBe(commitsBefore + 1);
    const template = await app.db.getRepository('jsTemplates').findOne({
      filter: { projectId: setup.project.id, templateName: 'sales-kpi' },
    });
    expect(template).toMatchObject({ compiledCommitId: result.commitId });
    expect(template?.get('runtimeArtifact')).toMatchObject({ code: expect.stringContaining('Pulled runtime') });
    await expect(mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({
      localCommitId: result.commitId,
      remoteRevision: adapter.getSnapshot().revision,
      contentHash: adapter.getSnapshot().contentHash,
    });
  });

  it('rolls back Head, templates, artifacts, usages, and map when compile fails', async () => {
    const setup = await createMappedProject('Compile Rollback');
    await compileInitial(setup.project.id);
    const headBefore = (await projectService.getProject(setup.project.id)).headCommitId;
    const templateBefore = await app.db.getRepository('jsTemplates').findOne({
      filter: { projectId: setup.project.id, templateName: 'sales-kpi' },
    });
    const artifactBefore = templateBefore?.get('artifactHash');
    const artifactCountBefore = await app.db.getRepository('jsTemplateArtifacts').count();
    const mapBefore = await mapStore.findLatest(setup.remote.id);
    if (!mapBefore) {
      throw new Error('Expected baseline external commit map');
    }
    adapter.advanceRemote([
      {
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        content: "import Missing from './missing';\nctx.render(<Missing />);\n",
        language: 'typescript',
      },
      baselineFiles()[1],
    ]);
    const input = await createPullInput(setup.project.id, setup.remote.id);

    await expect(remotePullService.pull(input, { requestId: 'req_compile_rollback' })).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
    });

    await expect(projectService.getProject(setup.project.id)).resolves.toMatchObject({ headCommitId: headBefore });
    const templateAfter = await app.db.getRepository('jsTemplates').findOne({
      filter: { projectId: setup.project.id, templateName: 'sales-kpi' },
    });
    expect(templateAfter?.get('artifactHash')).toBe(artifactBefore);
    await expect(app.db.getRepository('jsTemplateArtifacts').count()).resolves.toBe(artifactCountBefore);
    await expect(mapStore.findLatest(setup.remote.id)).resolves.toMatchObject(mapBefore);
    await expect(app.db.getRepository('vscFileSyncJobs').findOne({ sort: ['-createdAt'] })).resolves.toMatchObject({
      status: 'failed',
      lastErrorCode: 'UNSAFE_CONTENT',
    });
  });

  it('rejects archived projects before remote network work', async () => {
    const setup = await createMappedProject('Archived Pull');
    await projectService.archiveProject({ projectId: setup.project.id });
    adapter.advanceRemote(updatedFiles('Must not fetch'));
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');
    const input = await createPullInput(setup.project.id, setup.remote.id, setup.project.headCommitId);

    await expect(remotePullService.pull(input)).rejects.toMatchObject({ code: 'JS_TEMPLATE_PROJECT_ARCHIVED' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a cross-repository remote before its credential or adapter can be used', async () => {
    const first = await createMappedProject('First Project');
    const second = await projectService.createProject({ name: 'Second Project', initialFiles: baselineFiles() });
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');
    const input = await createPullInput(second.id, first.remote.id, second.headCommitId);

    await expect(remotePullService.pull(input)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
      details: { sourceCode: 'PERMISSION_DENIED', reasonCode: 'remote-repository-mismatch' },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('replaces and compiles a 150-file complete snapshot in one local commit', async () => {
    const setup = await createMappedProject('Large Pull');
    adapter.advanceRemote(largeSnapshotFiles(150));
    const input = await createPullInput(setup.project.id, setup.remote.id);
    const commitsBefore = await app.db.getRepository('vscFileCommits').count({
      filter: { repoId: setup.internal.vscRepoId },
    });

    const result = await remotePullService.pull(input, { requestId: 'req_large_pull' });

    expect(result).toMatchObject({ changed: true, compile: { status: 'success' } });
    const pulled = await fileService.pull({ projectId: setup.project.id, includeContent: 'all' });
    expect(pulled.files).toHaveLength(150);
    await expect(
      app.db.getRepository('vscFileCommits').count({ filter: { repoId: setup.internal.vscRepoId } }),
    ).resolves.toBe(commitsBefore + 1);
  });

  it('rejects a 201-file complete snapshot without changing the local Head', async () => {
    const setup = await createMappedProject('Oversized Pull');
    adapter.advanceRemote(largeSnapshotFiles(201));
    const input = await createPullInput(setup.project.id, setup.remote.id);

    await expect(remotePullService.pull(input, { requestId: 'req_oversized_pull' })).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'project_file_count_exceeded' })]),
      },
    });
    await expect(projectService.getProject(setup.project.id)).resolves.toMatchObject({
      headCommitId: setup.project.headCommitId,
    });
  });

  it('retries a completed pull without fetching or creating an empty commit', async () => {
    const setup = await createMappedProject('Completed Retry');
    adapter.advanceRemote(updatedFiles('Retry runtime'));
    const input = await createPullInput(setup.project.id, setup.remote.id);
    const commitsBefore = await app.db.getRepository('vscFileCommits').count({
      filter: { repoId: setup.internal.vscRepoId },
    });
    const fetch = vi.spyOn(adapter, 'fetchSnapshot');

    const first = await remotePullService.pull(input, { requestId: 'req_retry_first' });
    const fetchCount = fetch.mock.calls.length;
    const retried = await remotePullService.pull(input, { requestId: 'req_retry_second' });

    expect(retried).toMatchObject({
      changed: false,
      commitId: first.commitId,
      plan: { state: 'in-sync', action: 'noop' },
      compile: null,
    });
    expect(fetch).toHaveBeenCalledTimes(fetchCount);
    await expect(
      app.db.getRepository('vscFileCommits').count({ filter: { repoId: setup.internal.vscRepoId } }),
    ).resolves.toBe(commitsBefore + 1);
  });

  it('keeps the public incremental saveSource limit at 100 files', async () => {
    const setup = await createMappedProject('Public Limit');
    const files = Array.from({ length: 101 }, (_, index) => ({
      path: `src/shared/public-${String(index).padStart(3, '0')}.ts`,
      content: `export const value${index} = ${index};\n`,
      language: 'typescript',
    }));

    await expect(
      runtimeCompileService.saveSource({
        projectId: setup.project.id,
        expectedHeadCommitId: setup.project.headCommitId,
        message: 'too many public changes',
        files,
      }),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: { diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'sync_batch_too_large' })]) },
    });
  });

  async function createMappedProject(name: string) {
    const project = await projectService.createProject({ name, initialFiles: baselineFiles() });
    const internal = await projectService.getInternalProject(project.id);
    const remote = await remoteStore.create({
      repoId: internal.vscRepoId,
      name: 'origin',
      provider: 'git',
      config: remoteConfig,
      authRef: null,
    });
    const snapshot = adapter.getSnapshot();
    await mapStore.record({
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      localCommitId: project.headCommitId as string,
      remoteRevision: snapshot.revision as string,
      contentHash: snapshot.contentHash,
    });
    return { project, internal, remote };
  }

  async function createPullInput(projectId: string, remoteId: string, expectedHead?: string | null) {
    const project = await projectService.getInternalProject(projectId);
    const headCommitId = expectedHead === undefined ? project.headCommitId : expectedHead;
    const remote = await remoteStore.get(remoteId);
    const localSnapshot = await loadVscSnapshot(
      app.db,
      new CommitService(app.db),
      new TreeService(app.db),
      project.vscRepoId,
      headCommitId,
    );
    const remoteSnapshot = adapter.getSnapshot();
    const baseline = await mapStore.findLatest(remote.id);
    const plan = new SyncStatePlanner().plan({
      configured: true,
      remoteId: remote.id,
      provider: remote.provider,
      remoteTargetVersion: remote.version,
      direction: 'pull',
      capabilities: { canPull: true, canPush: true },
      local: { headCommitId, contentHash: localSnapshot.contentHash },
      remote: {
        revision: remoteSnapshot.revision,
        contentHash: remoteSnapshot.contentHash,
        contentHashKnown: true,
      },
      baseline: baseline
        ? {
            remoteTargetVersion: baseline.remoteTargetVersion,
            lastLocalCommitId: baseline.localCommitId,
            lastRemoteRevision: baseline.remoteRevision,
            lastSyncedContentHash: baseline.contentHash,
          }
        : null,
    });
    return {
      projectId,
      remoteId,
      expectedLocalCommitId: headCommitId,
      expectedRemoteRevision: remoteSnapshot.revision,
      expectedRemoteTargetVersion: remote.version,
      planFingerprint: plan.fingerprint,
    };
  }

  async function compileInitial(projectId: string) {
    const project = await projectService.getProject(projectId);
    return runtimeCompileService.compileCurrentRuntime(projectId, project.headCommitId as string);
  }
});

function baselineFiles(): VscRemoteSnapshotFile[] {
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
    baselineFiles()[1],
  ];
}

function largeSnapshotFiles(total: number): VscRemoteSnapshotFile[] {
  const sharedCount = total - 2;
  return [
    ...updatedFiles('Large pull'),
    ...Array.from({ length: sharedCount }, (_, index) => ({
      path: `src/shared/value-${String(index).padStart(3, '0')}.ts`,
      content: `export const value${index} = ${index};\n`,
      language: 'typescript',
    })),
  ];
}
