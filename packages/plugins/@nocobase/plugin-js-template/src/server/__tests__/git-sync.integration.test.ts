/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { spawn } from 'node:child_process';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { VscPermissionHookRegistry } from '@nocobase/runjs/workspace/server';
import { RemoteSyncAdapterRegistry, RemoteSyncError, RemoteSyncRuntimeService } from '../vsc-file/remotes';
import { vi } from 'vitest';

import type { GitCommandRequest, GitCommandResult } from '../vsc-file/remotes/providers/git/GitCommandRunner';
import { GitRemoteAdapter } from '../vsc-file/remotes/providers/git/GitRemoteAdapter';
import type { GitCommandExecutor } from '../vsc-file/remotes/providers/git/GitRepositoryWorkspace';
import { RemoteCredentialResolver } from '../vsc-file/remotes/security/RemoteCredentialResolver';
import { JsTemplateCreateFromRemoteService } from '../services/JsTemplateCreateFromRemoteService';
import {
  createGitSyncAcceptanceFixture,
  gitSyncRemoteConfig,
  type GitSyncAcceptanceFixture,
  validGitSyncFiles,
} from './helpers/gitSyncAcceptance';

describe('JS Template Git sync integration', () => {
  let fixture: GitSyncAcceptanceFixture;
  let temporaryDirectories: string[];

  beforeEach(async () => {
    temporaryDirectories = [];
    fixture = await createGitSyncAcceptanceFixture();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(temporaryDirectories.map((directory) => rm(directory, { force: true, recursive: true })));
    await fixture?.close();
  });

  it('atomically creates credentialed and public Git sources with compiled templates, mappings, and jobs', async () => {
    const credentialedResult = await fixture.createFromRemote('Credentialed Git Source', '{{ $env.GIT_SYNC }}');
    const publicResult = await fixture.createFromRemote('Public Git Source');

    expect(fixture.validateCredential).toHaveBeenCalledTimes(2);
    expect(fixture.validateCredential).toHaveBeenNthCalledWith(1, '{{ $env.GIT_SYNC }}');
    expect(fixture.validateCredential).toHaveBeenNthCalledWith(2, '{{ $env.GIT_SYNC }}');
    for (const result of [credentialedResult, publicResult]) {
      const internal = await fixture.projectService.getInternalProject(result.project.id);
      const remote = await fixture.runtime.getRemote(internal.vscRepoId, 'origin');
      expect(result).toMatchObject({
        project: { healthStatus: 'ready', headCommitId: expect.stringMatching(/^vscc_/) },
        plan: { state: 'in-sync', action: 'noop' },
        revision: 'remote-base',
        fileCount: 2,
      });
      await expect(
        fixture.app.db.getRepository('jsTemplates').findOne({ filter: { projectId: result.project.id } }),
      ).resolves.toMatchObject({ healthStatus: 'ready', runtimeArtifact: expect.any(Object) });
      await expect(
        fixture.app.db.getRepository('vscFileExternalCommitMaps').findOne({ filter: { remoteId: remote?.id } }),
      ).resolves.toMatchObject({
        localCommitId: result.project.headCommitId,
        remoteRevision: 'remote-base',
      });
      await expect(
        fixture.app.db.getRepository('vscFileSyncJobs').findOne({ filter: { remoteId: remote?.id } }),
      ).resolves.toMatchObject({ operation: 'pull', status: 'succeeded', phase: 'finalized' });
    }
  });

  it('rejects anonymous private-source creation and resolves credentials and the default branch before persistence', async () => {
    const credential = 'git-private-source-password';
    const authRef = '{{ $env.PRIVATE_GIT }}';
    const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'git-sync-integration-'));
    temporaryDirectories.push(temporaryDirectory);
    const remoteDirectory = path.join(temporaryDirectory, 'remote.git');
    await seedGitRemote(remoteDirectory);
    const runner = new CredentialGatedLocalGitRunner(new Map([[gitSyncRemoteConfig.url, remoteDirectory]]), credential);
    const credentialResolver = new RemoteCredentialResolver({
      db: createSecretDatabase({ PRIVATE_GIT: 'secret' }),
      environment: {
        getVariables: () => ({
          PRIVATE_GIT: JSON.stringify({ kind: 'https', username: 'git-user', password: credential }),
        }),
      },
    });
    const registry = new RemoteSyncAdapterRegistry();
    registry.register(new GitRemoteAdapter({ runner, credentialResolver, temporaryDirectory }));
    const permissionHooks = new VscPermissionHookRegistry();
    permissionHooks.register(fixture.permissionService.createVscPermissionHook());
    const runtime = new RemoteSyncRuntimeService(fixture.app.db, {
      adapterRegistry: registry,
      credentialResolver,
      permissionHooks,
    });
    const service = new JsTemplateCreateFromRemoteService(
      fixture.app.db,
      fixture.auditService,
      fixture.projectService,
      fixture.runtimeCompileService,
      () => runtime,
    );
    const countsBefore = await persistenceCounts();

    await expect(
      service.create({
        name: 'Anonymous Private Source',
        provider: 'git',
        config: gitSyncRemoteConfig,
        authRef: null,
      }),
    ).rejects.toMatchObject({ code: 'AUTH_FAILED' });
    await expect(persistenceCounts()).resolves.toEqual(countsBefore);
    expect(runner.requests[0]?.credential).toBeNull();
    runner.requests.length = 0;

    const created = await service.create({
      name: 'Authenticated Private Source',
      provider: 'git',
      config: gitSyncRemoteConfig,
      authRef,
    });
    const createdFromDefaultBranch = await service.create({
      name: 'Resolved Default Branch Source',
      provider: 'git',
      config: { ...gitSyncRemoteConfig, branch: null },
      authRef,
    });

    expect(created).toMatchObject({
      project: { healthStatus: 'ready' },
      remote: { authRef },
      revision: expect.stringMatching(/^[0-9a-f]{40}$/u),
      plan: { state: 'in-sync' },
    });
    expect(createdFromDefaultBranch).toMatchObject({
      project: { healthStatus: 'ready' },
      remote: { config: { branch: 'main' }, authRef },
      revision: expect.stringMatching(/^[0-9a-f]{40}$/u),
      plan: { state: 'in-sync' },
    });
    expect(runner.requests).not.toHaveLength(0);
    const remoteRequests = runner.requests.filter((request) => request.remoteUrl);
    expect(remoteRequests).not.toHaveLength(0);
    expect(remoteRequests.every((request) => request.credential?.kind === 'https')).toBe(true);
    expect(
      remoteRequests.every(
        (request) => request.credential?.kind === 'https' && request.credential.password === credential,
      ),
    ).toBe(true);

    async function persistenceCounts() {
      return {
        projects: await fixture.app.db.getRepository('jsTemplateProjects').count(),
        vscRepos: await fixture.app.db.getRepository('vscFileRepositories').count(),
        templates: await fixture.app.db.getRepository('jsTemplates').count(),
        remotes: await fixture.app.db.getRepository('vscFileRemotes').count(),
        maps: await fixture.app.db.getRepository('vscFileExternalCommitMaps').count(),
        jobs: await fixture.app.db.getRepository('vscFileSyncJobs').count(),
      };
    }
  });

  it('pulls and compiles an immutable remote snapshot while a later branch advance remains remote-ahead', async () => {
    const created = await fixture.createFromRemote('Immutable Pull');
    const planned = fixture.adapter.advanceRemote(validGitSyncFiles('Pulled revision'));
    const input = await fixture.createPullInput(created.project.id);
    const fetchSnapshot = fixture.adapter.fetchSnapshot.bind(fixture.adapter);
    vi.spyOn(fixture.adapter, 'fetchSnapshot').mockImplementationOnce(async (target, expectedRevision) => {
      const fetched = await fetchSnapshot(target, expectedRevision);
      fixture.adapter.advanceRemote(validGitSyncFiles('Later revision'));
      return fetched;
    });

    const pulled = await fixture.pullService.pull(input, { requestId: 'git-sync-immutable-pull' });
    const internal = await fixture.projectService.getInternalProject(created.project.id);
    const remote = await fixture.runtime.getRemote(internal.vscRepoId, 'origin');
    const nextPlan = await fixture.runtime.planRemote(remote?.id as string);
    const template = await fixture.app.db.getRepository('jsTemplates').findOne({
      filter: { projectId: created.project.id, templateName: 'sales-kpi' },
    });

    expect(pulled).toMatchObject({ changed: true, compile: { status: 'success' } });
    expect(template?.get('runtimeArtifact')).toMatchObject({ code: expect.stringContaining('Pulled revision') });
    await expect(
      fixture.app.db.getRepository('vscFileExternalCommitMaps').findOne({
        filter: { remoteId: remote?.id, remoteTargetVersion: remote?.version },
        sort: ['-createdAt'],
      }),
    ).resolves.toMatchObject({ remoteRevision: planned.revision, localCommitId: pulled.commitId });
    expect(nextPlan).toMatchObject({ state: 'remote-ahead', action: 'pull' });
  });

  it('pushes the current local snapshot and records the new remote baseline', async () => {
    const created = await fixture.createFromRemote('Push Source');
    const saved = await fixture.runtimeCompileService.saveSource({
      projectId: created.project.id,
      expectedHeadCommitId: created.project.headCommitId,
      message: 'local push change',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Pushed revision</div>);\n',
        },
      ],
    });
    const internal = await fixture.projectService.getInternalProject(created.project.id);
    const remote = await fixture.runtime.getRemote(internal.vscRepoId, 'origin');
    const plan = await fixture.runtime.planRemote(remote?.id as string);

    const pushed = await fixture.runtime.push(
      {
        remoteId: remote?.id as string,
        expectedLocalCommitId: plan.local.headCommitId,
        expectedRemoteRevision: plan.remote.revision,
        expectedRemoteTargetVersion: plan.remoteTargetVersion,
        planFingerprint: plan.fingerprint,
      },
      {
        request: fixture.permissionService.createInternalVscRequestContext({
          requestId: 'git-sync-push',
          reason: 'test Git push',
          allowedActions: ['push'],
          jsTemplateProjectId: created.project.id,
          aclAction: 'pushToSyncSource',
          requestSource: 'git-sync-integration',
        }),
      },
    );
    const afterPushPlan = await fixture.runtime.planRemote(remote?.id as string);

    expect(plan).toMatchObject({ state: 'local-ahead', action: 'push' });
    expect(pushed).toMatchObject({
      job: { status: 'succeeded', resultLocalCommitId: saved.commit.id },
      plan: { state: 'local-ahead', action: 'push' },
    });
    expect(afterPushPlan).toMatchObject({ state: 'in-sync', action: 'noop' });
    expect(fixture.adapter.getSnapshot().files).toContainEqual(
      expect.objectContaining({
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        content: 'ctx.render(<div>Pushed revision</div>);\n',
      }),
    );
  });

  it('records diverged state without changing local source or runtime artifacts', async () => {
    const created = await fixture.createFromRemote('Diverged Source');
    const local = await fixture.runtimeCompileService.saveSource({
      projectId: created.project.id,
      expectedHeadCommitId: created.project.headCommitId,
      message: 'local source change',
      files: [{ path: 'src/shared/local.ts', content: 'export const local = true;\n' }],
    });
    const entryBefore = await fixture.app.db.getRepository('jsTemplates').findOne({
      filter: { projectId: created.project.id, templateName: 'sales-kpi' },
    });
    fixture.adapter.advanceRemote(validGitSyncFiles('Remote divergence'));
    const input = await fixture.createPullInput(created.project.id);

    await expect(fixture.pullService.pull(input)).rejects.toMatchObject({ code: 'JS_TEMPLATE_SYNC_DIVERGED' });
    await expect(fixture.projectService.getProject(created.project.id)).resolves.toMatchObject({
      headCommitId: local.project.headCommitId,
    });
    const entryAfter = await fixture.app.db.getRepository('jsTemplates').findOne({
      filter: { projectId: created.project.id, templateName: 'sales-kpi' },
    });
    expect(entryAfter?.get('artifactHash')).toBe(entryBefore?.get('artifactHash'));
    await expect(fixture.app.db.getRepository('vscFileConflicts').findOne()).resolves.toMatchObject({
      status: 'open',
      reasonCode: 'both-content-changed',
    });
  });

  it('reports initial-ambiguous when binding an existing non-empty project and writes neither side', async () => {
    const localFiles = validGitSyncFiles('Existing local source');
    const project = await fixture.projectService.createProject({
      name: 'Existing Ambiguous',
      initialFiles: localFiles,
    });
    const internal = await fixture.projectService.getInternalProject(project.id);
    const remoteBefore = fixture.adapter.getSnapshot();
    const countsBefore = {
      maps: await fixture.app.db.getRepository('vscFileExternalCommitMaps').count(),
      jobs: await fixture.app.db.getRepository('vscFileSyncJobs').count(),
      conflicts: await fixture.app.db.getRepository('vscFileConflicts').count(),
    };
    const remote = await fixture.runtime.configureRemote({
      repoId: internal.vscRepoId,
      name: 'origin',
      provider: 'git',
      config: gitSyncRemoteConfig,
      authRef: null,
    });

    const plan = await fixture.runtime.planRemote(remote.id);

    expect(plan).toMatchObject({ state: 'diverged', action: 'conflict', reasonCode: 'initial-ambiguous' });
    await expect(fixture.projectService.getProject(project.id)).resolves.toMatchObject({
      headCommitId: project.headCommitId,
    });
    expect(fixture.adapter.getSnapshot()).toEqual(remoteBefore);
    await expect(fixture.app.db.getRepository('vscFileExternalCommitMaps').count()).resolves.toBe(countsBefore.maps);
    await expect(fixture.app.db.getRepository('vscFileSyncJobs').count()).resolves.toBe(countsBefore.jobs);
    await expect(fixture.app.db.getRepository('vscFileConflicts').count()).resolves.toBe(countsBefore.conflicts);
  });
});

const execFileAsync = promisify(execFile);

class CredentialGatedLocalGitRunner implements GitCommandExecutor {
  readonly requests: GitCommandRequest[] = [];

  constructor(
    private readonly remotes: ReadonlyMap<string, string>,
    private readonly expectedPassword: string,
  ) {}

  async run(request: GitCommandRequest): Promise<GitCommandResult> {
    this.requests.push(request);
    if (
      request.remoteUrl &&
      (request.credential?.kind !== 'https' || request.credential.password !== this.expectedPassword)
    ) {
      throw new RemoteSyncError('AUTH_FAILED', 'Private Git repository authentication failed', {
        details: { provider: 'git', reasonCode: 'private-repository-auth-required' },
      });
    }
    return runGitProcess(
      request.args.map((argument) => this.remotes.get(argument) || argument),
      request,
    );
  }
}

function runGitProcess(args: readonly string[], request: GitCommandRequest): Promise<GitCommandResult> {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn('git', [...args], {
      cwd: request.cwd,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...request.environment },
      stdio: 'pipe',
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
        durationMs: Date.now() - startedAt,
      });
    });
    child.stdin.end(request.stdin);
  });
}

async function seedGitRemote(remoteDirectory: string): Promise<void> {
  const workingDirectory = `${remoteDirectory}-working`;
  await git(['init', '--bare', remoteDirectory]);
  await git(['init', workingDirectory]);
  await git(['-C', workingDirectory, 'config', 'user.name', 'Test']);
  await git(['-C', workingDirectory, 'config', 'user.email', 'test@example.com']);
  for (const file of validGitSyncFiles()) {
    const targetPath = path.join(workingDirectory, file.path);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, file.content);
  }
  await git(['-C', workingDirectory, 'add', '.']);
  await git(['-C', workingDirectory, 'commit', '-m', 'seed']);
  await git(['-C', workingDirectory, 'branch', '-M', 'main']);
  await git(['-C', workingDirectory, 'push', remoteDirectory, 'main']);
  await git(['--git-dir', remoteDirectory, 'symbolic-ref', 'HEAD', 'refs/heads/main']);
}

function git(args: readonly string[]) {
  return execFileAsync('git', [...args], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}

function createSecretDatabase(records: Record<string, string>): Database {
  return {
    hasCollection: (name: string) => name === 'environmentVariables',
    getRepository: () => ({
      collection: { existsInDb: async () => true },
      findOne: async (options: { filterByTk?: string }) => {
        const name = options.filterByTk;
        const type = name ? records[name] : undefined;
        return name && type ? { get: (field: string) => (field === 'name' ? name : type) } : null;
      },
    }),
  } as unknown as Database;
}

describe('JS Template Git sync rollback and race acceptance', () => {
  let fixture: GitSyncAcceptanceFixture;

  beforeEach(async () => {
    fixture = await createGitSyncAcceptanceFixture();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fixture?.close();
  });

  it('rolls back Project, VSC, Template, Artifact, remote, map, and job when initial baseline persistence fails', async () => {
    const countsBefore = await persistenceCounts();
    vi.spyOn(fixture.runtime, 'establishInitialBaseline').mockRejectedValueOnce(new Error('injected baseline failure'));

    await expect(fixture.createFromRemote('Atomic Create Rollback')).rejects.toThrow('injected baseline failure');
    await expect(persistenceCounts()).resolves.toEqual(countsBefore);
  });

  it('rolls back Head, Template, Artifact, Usage, map, and job finalization when Pull compilation fails', async () => {
    const created = await fixture.createFromRemote('Compile Rollback');
    const headBefore = created.project.headCommitId;
    const templateBefore = await fixture.app.db.getRepository('jsTemplates').findOne({
      filter: { projectId: created.project.id, templateName: 'sales-kpi' },
    });
    const artifactCountBefore = await fixture.app.db.getRepository('jsTemplateArtifacts').count();
    const usageCountBefore = await fixture.app.db.getRepository('jsTemplateUsages').count();
    fixture.adapter.advanceRemote([
      {
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        content: "import Missing from './missing';\nctx.render(<Missing />);\n",
        language: 'typescript',
      },
      validGitSyncFiles()[1],
    ]);
    const input = await fixture.createPullInput(created.project.id);
    const internal = await fixture.projectService.getInternalProject(created.project.id);
    const remote = await fixture.runtime.getRemote(internal.vscRepoId, 'origin');
    const mapBefore = await fixture.app.db.getRepository('vscFileExternalCommitMaps').findOne({
      filter: { remoteId: remote?.id },
      sort: ['-createdAt'],
    });

    await expect(fixture.pullService.pull(input)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
    });

    await expect(fixture.projectService.getProject(created.project.id)).resolves.toMatchObject({
      headCommitId: headBefore,
    });
    const templateAfter = await fixture.app.db.getRepository('jsTemplates').findOne({
      filter: { projectId: created.project.id, templateName: 'sales-kpi' },
    });
    expect(templateAfter?.get('artifactHash')).toBe(templateBefore?.get('artifactHash'));
    await expect(fixture.app.db.getRepository('jsTemplateArtifacts').count()).resolves.toBe(artifactCountBefore);
    await expect(fixture.app.db.getRepository('jsTemplateUsages').count()).resolves.toBe(usageCountBefore);
    await expect(
      fixture.app.db.getRepository('vscFileExternalCommitMaps').findOne({
        filter: { remoteId: remote?.id },
        sort: ['-createdAt'],
      }),
    ).resolves.toMatchObject({ id: mapBefore?.get('id') });
    await expect(
      fixture.app.db
        .getRepository('vscFileSyncJobs')
        .findOne({ filter: { remoteId: remote?.id }, sort: ['-createdAt'] }),
    ).resolves.toMatchObject({ status: 'failed' });
  });

  it('refuses to apply after local Head or remote target changes during fetch', async () => {
    const localRace = await fixture.createFromRemote('Local Fetch Race');
    fixture.adapter.advanceRemote(validGitSyncFiles('Remote local-race update'));
    const localInput = await fixture.createPullInput(localRace.project.id);
    const fetchSnapshot = fixture.adapter.fetchSnapshot.bind(fixture.adapter);
    vi.spyOn(fixture.adapter, 'fetchSnapshot').mockImplementationOnce(async (target, expectedRevision) => {
      const result = await fetchSnapshot(target, expectedRevision);
      await fixture.runtimeCompileService.saveSource({
        projectId: localRace.project.id,
        expectedHeadCommitId: localRace.project.headCommitId,
        message: 'concurrent local write',
        files: [{ path: 'src/shared/concurrent.ts', content: 'export const concurrent = true;\n' }],
      });
      return result;
    });
    await expect(fixture.pullService.pull(localInput)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_SYNC_LOCAL_OUTDATED',
    });

    const targetRace = await fixture.createFromRemote('Target Fetch Race');
    fixture.adapter.advanceRemote(validGitSyncFiles('Remote target-race update'));
    const targetInput = await fixture.createPullInput(targetRace.project.id);
    vi.spyOn(fixture.adapter, 'fetchSnapshot').mockImplementationOnce(async (target, expectedRevision) => {
      const result = await fetchSnapshot(target, expectedRevision);
      const internal = await fixture.projectService.getInternalProject(targetRace.project.id);
      const remote = await fixture.runtime.getRemote(internal.vscRepoId, 'origin');
      if (!remote) {
        throw new Error('Expected an origin remote');
      }
      await fixture.app.db.getRepository('vscFileRemotes').update({
        filterByTk: remote.id,
        values: { version: remote.version + 1, status: 'disabled' },
      });
      return result;
    });
    await expect(fixture.pullService.pull(targetInput)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_SYNC_REMOTE_CHANGED',
    });
  });

  async function persistenceCounts() {
    return {
      projects: await fixture.app.db.getRepository('jsTemplateProjects').count(),
      vscRepos: await fixture.app.db.getRepository('vscFileRepositories').count(),
      commits: await fixture.app.db.getRepository('vscFileCommits').count(),
      templates: await fixture.app.db.getRepository('jsTemplates').count(),
      artifacts: await fixture.app.db.getRepository('jsTemplateArtifacts').count(),
      remotes: await fixture.app.db.getRepository('vscFileRemotes').count(),
      maps: await fixture.app.db.getRepository('vscFileExternalCommitMaps').count(),
      jobs: await fixture.app.db.getRepository('vscFileSyncJobs').count(),
    };
  }
});
