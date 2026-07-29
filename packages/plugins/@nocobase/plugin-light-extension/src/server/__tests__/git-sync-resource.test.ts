/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HandlerType } from '@nocobase/resourcer';
import type { RemoteSyncRuntime, VscFileRemoteRecord, VscRemoteSyncPlan } from '../vsc-file';
import { computeRemoteSnapshotContentHash, RemoteSyncError } from '../vsc-file';
import { vi } from 'vitest';

import { LightExtensionError } from '../../shared/errors';
import { createLightExtensionSyncResource } from '../resources/lightExtensionSync';

import {
  LIGHT_EXTENSION_SYNC_ERROR_CODE_BY_REMOTE_CODE,
  mapRemoteSyncErrorToLightExtension,
} from '../../shared/errors';
import type {
  LightExtensionCreateJobActionName,
  LightExtensionCreateJobRecord,
  LightExtensionCreateJobStatus,
  LightExtensionCreateJobSummary,
  LightExtensionCreateSourceType,
  LightExtensionSyncActionName,
  LightExtensionSyncConfigureInput,
  LightExtensionSyncCreateFromGitInput,
  LightExtensionSyncDisconnectInput,
  LightExtensionSyncGetInput,
  LightExtensionSyncPlan,
  LightExtensionSyncPlanInput,
  LightExtensionSyncPlanResult,
  LightExtensionSyncPullInput,
  LightExtensionSyncPushInput,
  LightExtensionSyncSourceSummary,
  LightExtensionSyncState,
  LightExtensionSyncTestConnectionInput,
} from '../../shared/types';

const repo = {
  id: 'ler_demo',
  vscRepoId: 'vscr_demo',
  name: 'demo',
  normalizedName: 'demo',
  lifecycleStatus: 'enabled',
  healthStatus: 'ready',
  headCommitId: 'commit_local',
};

const plan: VscRemoteSyncPlan = {
  state: 'in-sync',
  action: 'noop',
  reasonCode: null,
  canPull: false,
  canPush: false,
  fingerprint: 'sha256:plan',
  remoteTargetVersion: 1,
  local: { headCommitId: 'commit_local', contentHash: 'sha256:local' },
  remote: { revision: 'rev_remote', contentHash: 'sha256:local', contentHashKnown: true },
  baseline: null,
};

const remote: VscFileRemoteRecord = {
  id: 'vscrmt_demo',
  repoId: repo.vscRepoId,
  name: 'origin',
  provider: 'git',
  config: { url: 'https://git.example.com/nocobase/demo.git', branch: 'main', subdirectory: null, transport: 'https' },
  authRef: '{{ $env.GITHUB_TOKEN }}',
  status: 'active',
  version: 1,
  lastCheckedAt: null,
  lastSyncedAt: null,
  lastErrorCode: null,
};

const createJob = {
  id: 'lecj_git_demo',
  applicationName: 'main',
  targetRepoId: 'ler_git_target',
  name: 'demo',
  normalizedName: 'demo',
  title: 'Demo',
  description: 'Remote demo',
  sourceType: 'git' as const,
  status: 'pending' as const,
  payload: { sourceType: 'git', provider: 'git' },
  errorCode: null,
  errorMessage: null,
  reservationKey: 'sha256:reservation',
  actorUserId: null,
  requestId: null,
  startedAt: null,
  finishedAt: null,
  createdAt: '2026-07-27T00:00:00.000Z',
  updatedAt: '2026-07-27T00:00:00.000Z',
};

describe('lightExtensionSync resource', () => {
  it('returns a deeply frozen safe DTO and masks the saved auth reference', async () => {
    const fixture = createFixture();
    const ctx = await runAction(fixture, 'get', { repoId: repo.id }, ['pullFromSyncSource']);

    expect(ctx.status).toBeUndefined();
    expect(ctx.body).toEqual({
      repoId: repo.id,
      source: {
        provider: 'git',
        config: remote.config,
        status: 'active',
        remoteTargetVersion: 1,
        revision: 'rev_remote',
        credentialConfigured: true,
        authRefDisplay: '********',
        lastSyncedAt: null,
      },
    });
    expect(Object.isFrozen(ctx.body)).toBe(true);
    expect(Object.isFrozen((ctx.body as { source: object }).source)).toBe(true);
    const serialized = JSON.stringify(ctx.body);
    expect(serialized).not.toContain('vscrmt_demo');
    expect(serialized).not.toContain('vscr_demo');
    expect(serialized).not.toContain('GITHUB_TOKEN');
    expect(serialized).not.toContain('"authRef":');
  });

  it('accepts a direct token while masking it from the response and request context', async () => {
    const directToken = 'github_pat_test_direct_123';
    const fixture = createFixture();
    const ctx = await runAction(
      fixture,
      'configure',
      {
        repoId: repo.id,
        provider: 'git',
        config: remote.config,
        authRef: directToken,
      },
      ['manageSyncSource'],
    );

    expect(ctx.status).toBeUndefined();
    expect(fixture.runtime.testTarget).toHaveBeenCalledWith(expect.objectContaining({ authRef: directToken }));
    expect(fixture.runtime.configureRemote).toHaveBeenCalledWith(expect.objectContaining({ authRef: directToken }));
    expect(ctx.body).toMatchObject({ source: { credentialConfigured: true, authRefDisplay: '********' } });
    expect(JSON.stringify(ctx)).not.toContain(directToken);
    expect(JSON.stringify(ctx.body)).not.toContain(directToken);
  });

  it('returns only an irreversible credential mask from testConnection', async () => {
    const fixture = createFixture();
    const ctx = await runAction(fixture, 'testConnection', { repoId: repo.id, authRef: remote.authRef }, [
      'manageSyncSource',
    ]);

    expect(ctx.body).toMatchObject({ credentialConfigured: true, authRefDisplay: '********' });
    expect(JSON.stringify(ctx.body)).not.toContain('GITHUB_TOKEN');
    expect(JSON.stringify(ctx.body)).not.toContain('"authRef":');
  });

  it('does not expose credentials when the remote handler throws', async () => {
    const token = 'github_pat_provider_error_secret';
    const fixture = createFixture();
    vi.mocked(fixture.runtime.configureRemote).mockRejectedValueOnce(
      new RemoteSyncError('AUTH_FAILED', token, { details: { token } }),
    );
    const ctx = await runAction(
      fixture,
      'configure',
      { repoId: repo.id, provider: 'git', config: remote.config, authRef: remote.authRef },
      ['manageSyncSource'],
    );

    expect(ctx.status).toBe(422);
    expect(ctx.body).toMatchObject({ errors: [{ code: 'LIGHT_EXTENSION_SYNC_AUTH_FAILED' }] });
    expect(JSON.stringify(ctx.body)).not.toContain(token);
  });

  it('treats a soft-disabled remote as unconfigured while retaining its internal baseline', async () => {
    const disabledRemote = { ...remote, status: 'disabled' as const, authRef: null };
    const fixture = createFixture({ remote: disabledRemote });
    const unconfiguredPlan = {
      ...plan,
      state: 'unconfigured' as const,
      action: 'configure' as const,
      remoteTargetVersion: null,
      remote: { revision: null, contentHash: null, contentHashKnown: true },
      baseline: null,
    };
    vi.mocked(fixture.runtime.planUnconfigured).mockResolvedValueOnce(unconfiguredPlan);

    const get = await runAction(fixture, 'get', { repoId: repo.id }, ['manageSyncSource']);
    const planned = await runAction(fixture, 'plan', { repoId: repo.id }, ['manageSyncSource']);

    expect(get.body).toEqual({ repoId: repo.id, source: null });
    expect(planned.body).toMatchObject({ repoId: repo.id, source: null, plan: { state: 'unconfigured' } });
    expect(fixture.runtime.planRemote).not.toHaveBeenCalled();
    expect(fixture.runtime.planUnconfigured).toHaveBeenCalledWith(repo.vscRepoId);
  });

  it('enforces strict input allowlists before calling the runtime', async () => {
    const fixture = createFixture();
    const ctx = await runAction(
      fixture,
      'configure',
      {
        repoId: repo.id,
        provider: 'git',
        config: remote.config,
        token: 'ghp_secret',
      },
      ['manageSyncSource'],
    );

    expect(ctx.status).toBe(400);
    expect(ctx.body).toMatchObject({ errors: [{ code: 'LIGHT_EXTENSION_INVALID_INPUT' }] });
    expect(fixture.runtime.configureRemote).not.toHaveBeenCalled();
    expect(JSON.stringify(ctx.body)).not.toContain('ghp_secret');
  });

  it('rejects the removed legacy provider before calling the runtime', async () => {
    const fixture = createFixture();
    const ctx = await runAction(
      fixture,
      'configure',
      {
        repoId: repo.id,
        provider: 'git' + 'hub',
        config: remote.config,
      },
      ['manageSyncSource'],
    );

    expect(ctx.status).toBe(400);
    expect(ctx.body).toMatchObject({ errors: [{ code: 'LIGHT_EXTENSION_INVALID_INPUT' }] });
    expect(fixture.runtime.configureRemote).not.toHaveBeenCalled();
  });

  it('keeps manage, Pull, Push, OR permissions, and repository scope separate', async () => {
    const fixture = createFixture();
    const manageOnlyPull = await runAction(fixture, 'pull', executionInput(), ['manageSyncSource']);
    expect(manageOnlyPull.status).toBe(403);

    const pullOnlyPush = await runAction(fixture, 'push', executionInput(), ['pullFromSyncSource']);
    expect(pullOnlyPush.status).toBe(403);

    const pullPlan = await runAction(fixture, 'plan', { repoId: repo.id }, ['pullFromSyncSource']);
    expect(pullPlan.status).toBeUndefined();
    expect(fixture.runtime.planRemote).toHaveBeenCalledWith(remote.id);

    const scopedOut = await runAction(fixture, 'get', { repoId: repo.id }, ['manageSyncSource'], false);
    expect(scopedOut.status).toBe(403);
  });

  it.each([
    ['get', { repoId: repo.id }, 'manageSyncSource'],
    ['configure', { repoId: repo.id, provider: 'git', config: remote.config, authRef: null }, 'manageSyncSource'],
    ['disconnect', { repoId: repo.id }, 'manageSyncSource'],
    ['testConnection', { repoId: repo.id }, 'manageSyncSource'],
    ['plan', { repoId: repo.id }, 'pullFromSyncSource'],
    ['pull', executionInput(), 'pullFromSyncSource'],
    ['push', executionInput(), 'pushToSyncSource'],
  ] as const)('independently allows and denies %s with its fixed ACL mapping', async (action, values, permission) => {
    const allowedFixture = createFixture();
    const allowed = await runAction(allowedFixture, action, values, [permission]);
    expect(allowed.status).toBeUndefined();

    const deniedFixture = createFixture();
    const denied = await runAction(deniedFixture, action, values, []);
    expect(denied.status).toBe(403);
    expect(denied.body).toMatchObject({ errors: [{ code: 'LIGHT_EXTENSION_PERMISSION_DENIED' }] });
  });

  it.each(['create', 'manageSyncSource', 'pullFromSyncSource'] as const)(
    'denies createFromGit before remote access when %s permission is missing',
    async (missingPermission) => {
      const fixture = createFixture();
      const permissions = ['create', 'manageSyncSource', 'pullFromSyncSource'].filter(
        (permission) => permission !== missingPermission,
      );
      const ctx = await runAction(fixture, 'createFromGit', createFromGitInput(), permissions);

      expect(ctx.status).toBe(403);
      expect(fixture.runtime.fetchTarget).not.toHaveBeenCalled();
      expect(fixture.runtime.establishInitialBaseline).not.toHaveBeenCalled();
    },
  );

  it('enqueues createFromGit with all permissions and returns 202 without remote access', async () => {
    const fixture = createFixture();
    const ctx = await runAction(
      fixture,
      'createFromGit',
      createFromGitInput(),
      ['create', 'manageSyncSource', 'pullFromSyncSource'],
      true,
      {},
      { headers: { 'x-csrf-token': 'csrf-token' } },
    );

    expect(ctx.status).toBe(202);
    expect(fixture.runtime.fetchTarget).not.toHaveBeenCalled();
    expect(fixture.runtime.establishInitialBaseline).not.toHaveBeenCalled();
    expect(fixture.createJobStore.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: 'git',
        payload: expect.objectContaining({ authRef: remote.authRef, provider: 'git' }),
      }),
      expect.anything(),
    );
    expect(fixture.createJobRunner.publish).toHaveBeenCalledWith(createJob.id);
    expect(ctx.body).toMatchObject({
      id: createJob.id,
      targetRepoId: createJob.targetRepoId,
      sourceType: 'git',
      status: 'pending',
    });
    const serialized = JSON.stringify(ctx.body);
    expect(serialized).not.toContain('GITHUB_TOKEN');
    expect(serialized).not.toContain(repo.vscRepoId);
    expect(serialized).not.toContain(remote.id);
    expect(fixture.auditService.recordSyncEvent).not.toHaveBeenCalled();
    expect(fixture.auditService.recordCreateJobEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'createJobEnqueue', jobId: createJob.id, sourceType: 'git' }),
    );
  });

  it('ignores an undefined framework filterByTk while rejecting a supplied createFromGit filterByTk', async () => {
    const allowedFixture = createFixture();
    const allowed = await runAction(
      allowedFixture,
      'createFromGit',
      createFromGitInput(),
      ['create', 'manageSyncSource', 'pullFromSyncSource'],
      true,
      { filterByTk: undefined },
    );

    expect(allowed.status).toBe(202);
    expect(allowedFixture.createJobStore.enqueue).toHaveBeenCalledTimes(1);

    const rejectedFixture = createFixture();
    const rejected = await runAction(
      rejectedFixture,
      'createFromGit',
      createFromGitInput(),
      ['create', 'manageSyncSource', 'pullFromSyncSource'],
      true,
      { filterByTk: 'unexpected-repository-id' },
    );

    expect(rejected.status).toBe(400);
    expect(rejectedFixture.runtime.fetchTarget).not.toHaveBeenCalled();
    expect(rejectedFixture.createJobStore.enqueue).not.toHaveBeenCalled();
  });

  it.each([
    { token: 'ghp_secret' },
    { vscRepoId: repo.vscRepoId },
    { remoteId: remote.id },
    { zipBase64: 'not-allowed' },
    { initialFiles: [] },
  ])('rejects forbidden createFromGit input before remote access', async (forbidden) => {
    const fixture = createFixture();
    const ctx = await runAction(fixture, 'createFromGit', { ...createFromGitInput(), ...forbidden }, [
      'create',
      'manageSyncSource',
      'pullFromSyncSource',
    ]);

    expect(ctx.status).toBe(400);
    expect(fixture.runtime.fetchTarget).not.toHaveBeenCalled();
  });

  it('rejects unknown provider config fields before resolving the remote credential', async () => {
    const fixture = createFixture();
    vi.mocked(fixture.runtime.normalizeConfig).mockImplementationOnce(() => {
      throw new LightExtensionError('LIGHT_EXTENSION_SYNC_CONFIG_INVALID', 'Invalid config');
    });
    const ctx = await runAction(
      fixture,
      'createFromGit',
      {
        ...createFromGitInput(),
        config: { ...remote.config, accessToken: 'ghp_secret' },
      },
      ['create', 'manageSyncSource', 'pullFromSyncSource'],
    );

    expect(ctx.status).toBe(400);
    expect(fixture.runtime.normalizeConfig).not.toHaveBeenCalled();
    expect(fixture.runtime.fetchTarget).not.toHaveBeenCalled();
    expect(JSON.stringify(ctx.body)).not.toContain('ghp_secret');
  });

  it.each([
    ['get', { repoId: repo.id }],
    ['configure', { repoId: repo.id, provider: 'git', config: remote.config }],
    ['disconnect', { repoId: repo.id }],
    ['testConnection', { repoId: repo.id }],
    ['plan', { repoId: repo.id }],
    ['pull', executionInput()],
    ['push', executionInput()],
    ['createFromGit', createFromGitInput()],
  ] as const)(
    'denies ordinary logged-in runtime access to %s without a sync action permission',
    async (action, values) => {
      const fixture = createFixture();
      const ctx = await runAction(fixture, action, values, []);
      expect(ctx.status).toBe(403);
    },
  );

  it('preserves an omitted authRef, pins the configured branch, and never exposes the stored reference', async () => {
    const fixture = createFixture();
    vi.mocked(fixture.runtime.configureRemote).mockResolvedValueOnce({
      ...remote,
      config: { ...remote.config, branch: 'release' },
    });
    const ctx = await runAction(
      fixture,
      'configure',
      {
        repoId: repo.id,
        provider: 'git',
        config: { ...remote.config, branch: '' },
      },
      ['manageSyncSource'],
    );

    expect(fixture.runtime.testTarget).toHaveBeenCalledWith(
      expect.objectContaining({ authRef: remote.authRef, config: expect.objectContaining({ branch: '' }) }),
    );
    expect(fixture.runtime.configureRemote).toHaveBeenCalledWith(
      expect.objectContaining({ authRef: remote.authRef, config: expect.objectContaining({ branch: 'main' }) }),
    );
    expect(ctx.body).toMatchObject({
      source: {
        config: { branch: 'release' },
        revision: 'rev_remote',
        authRefDisplay: '********',
      },
    });
    expect(JSON.stringify(ctx.body)).not.toContain('GITHUB_TOKEN');
  });

  it('allows public Git Pull with the saved null authRef and keeps internal handles out of the response', async () => {
    const fixture = createFixture({ remote: { ...remote, authRef: null } });
    const ctx = await runAction(fixture, 'pull', executionInput(), ['pullFromSyncSource']);

    expect(ctx.status).toBeUndefined();
    expect(fixture.pullCoordinator.discover).toHaveBeenCalled();
    const serialized = JSON.stringify(ctx.body);
    expect(serialized).not.toContain('claimToken');
    expect(serialized).not.toContain('jobId');
    expect(serialized).not.toContain('files');
    expect(serialized).not.toContain('vscr_demo');
  });

  it('rejects and sanitizes credentials supplied through query, headers, or paths', async () => {
    const token = 'github_pat_transport_secret';
    const queryFixture = createFixture();
    const query = await runAction(
      queryFixture,
      'configure',
      { repoId: repo.id, provider: 'git', config: remote.config },
      ['manageSyncSource'],
      true,
      { authRef: token },
    );
    expect(query.status).toBe(400);
    expect(JSON.stringify(query)).not.toContain(token);
    expect(queryFixture.runtime.configureRemote).not.toHaveBeenCalled();

    const headerFixture = createFixture();
    const header = await runAction(
      headerFixture,
      'configure',
      { repoId: repo.id, provider: 'git', config: remote.config },
      ['manageSyncSource'],
      true,
      {},
      { headers: { 'x-git-credential': token } },
    );
    expect(header.status).toBe(400);
    expect(JSON.stringify(header)).not.toContain(token);
    expect(headerFixture.runtime.configureRemote).not.toHaveBeenCalled();

    const pathFixture = createFixture();
    const path = await runAction(
      pathFixture,
      'configure',
      { repoId: repo.id, provider: 'git', config: remote.config },
      ['manageSyncSource'],
      true,
      {},
      { path: `/api/lightExtensionSync:configure/credential/${token}` },
    );
    expect(path.status).toBe(400);
    expect(JSON.stringify(path)).not.toContain(token);
    expect(pathFixture.runtime.configureRemote).not.toHaveBeenCalled();
  });

  it('rejects and sanitizes credentials nested in request body arrays', async () => {
    const token = 'github_pat_nested_array_secret';
    const fixture = createFixture();
    const ctx = await runAction(
      fixture,
      'configure',
      {
        repoId: repo.id,
        provider: 'git',
        config: { ...remote.config, nested: [{ authRef: token }] },
      },
      ['manageSyncSource'],
    );

    expect(ctx.status).toBe(400);
    expect(JSON.stringify(ctx)).not.toContain(token);
    expect(fixture.runtime.configureRemote).not.toHaveBeenCalled();
  });

  it('records a safe blocked sync audit when owner apply or compile fails', async () => {
    const fixture = createFixture({ applyFails: true });
    const ctx = await runAction(fixture, 'pull', executionInput(), ['pullFromSyncSource']);

    expect(ctx.status).toBe(422);
    expect(ctx.body).toMatchObject({ errors: [{ code: 'LIGHT_EXTENSION_VALIDATION_FAILED' }] });
    expect(fixture.auditService.recordSyncEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: repo.id,
        action: 'syncPull',
        result: 'blocked',
        reasonCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      }),
    );
    const auditJson = JSON.stringify(fixture.auditService.recordSyncEvent.mock.calls);
    expect(auditJson).not.toContain('secret-source');
    expect(auditJson).not.toContain('claim_secret');
  });
});

function createFixture(options: { remote?: VscFileRemoteRecord; applyFails?: boolean } = {}) {
  const configuredRemote = options.remote || remote;
  const snapshot = {
    revision: 'rev_remote',
    contentHash: computeRemoteSnapshotContentHash([{ path: 'index.ts', content: 'secret-source' }]),
    files: [{ path: 'index.ts', content: 'secret-source' }],
    metadata: {},
  };
  const pullCoordinator = {
    discover: vi.fn(async () => ({
      remote: configuredRemote,
      job: {
        id: 'job_internal',
        resultLocalCommitId: repo.headCommitId,
      },
      snapshot,
      plan,
      applyRequired: options.applyFails,
      handle: options.applyFails
        ? {
            remote: configuredRemote,
            jobId: 'job_internal',
            claimToken: 'claim_secret',
            leaseDurationMs: 30_000,
            expectedLocalCommitId: repo.headCommitId,
            expectedRemoteRevision: 'rev_remote',
            expectedRemoteTargetVersion: 1,
            planFingerprint: plan.fingerprint,
            snapshot,
          }
        : null,
    })),
    apply: vi.fn(async () => {
      throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Compile failed', {
        details: { reasonCode: 'compile-failed' },
      });
    }),
    runWithClaimLease: vi.fn(async (_handle, action: () => Promise<unknown>) => action()),
    failApply: vi.fn(async () => undefined),
    listRecoverablePullJobs: vi.fn(async () => []),
  };
  const runtime = {
    normalizeConfig: vi.fn((_provider: string, config: unknown) => config),
    getRemote: vi.fn(async () => configuredRemote),
    getRemoteById: vi.fn(async () => configuredRemote),
    getLatestMappedRevision: vi.fn(async () => 'rev_remote'),
    configureRemote: vi.fn(async () => configuredRemote),
    disconnectRemote: vi.fn(async () => undefined),
    testTarget: vi.fn(),
    fetchTarget: vi.fn(async () => ({ provider: 'git', config: configuredRemote.config, snapshot })),
    establishInitialBaseline: vi.fn(async () => ({
      remote: configuredRemote,
      job: {
        resultLocalCommitId: repo.headCommitId,
        resultRemoteRevision: snapshot.revision,
      },
      plan,
    })),
    planRemote: vi.fn(async () => plan),
    planUnconfigured: vi.fn(async () => plan),
    push: vi.fn(async () => ({
      remote: configuredRemote,
      job: { resultLocalCommitId: repo.headCommitId, resultRemoteRevision: 'rev_remote' },
      snapshot,
      plan,
    })),
    getPullCoordinator: vi.fn(() => pullCoordinator),
  } as unknown as RemoteSyncRuntime & Record<string, ReturnType<typeof vi.fn>>;
  vi.mocked(runtime.testTarget).mockResolvedValue({
    provider: 'git',
    config: configuredRemote.config,
    snapshot: {
      revision: 'rev_remote',
      contentHash: computeRemoteSnapshotContentHash([]),
      files: [],
      metadata: {},
    },
  });
  const auditService = {
    recordSyncEvent: vi.fn(async () => undefined),
    recordCreateJobEvent: vi.fn(async () => undefined),
  };
  const repoService = {
    getInternalRepo: vi.fn(async () => repo),
    getRepo: vi.fn(async () => {
      const { vscRepoId: _vscRepoId, ...publicRepo } = repo;
      return publicRepo;
    }),
    lockInternalRepoForUpdate: vi.fn(async () => repo),
    createRepo: vi.fn(async () => {
      const { vscRepoId: _vscRepoId, ...publicRepo } = repo;
      return publicRepo;
    }),
    normalizeCreateMetadata: vi.fn((input: { name: string; title?: string | null; description?: string | null }) => ({
      ...input,
      normalizedName: input.name,
    })),
    assertCreateNameAvailable: vi.fn(async () => undefined),
    getValidator: vi.fn(() => ({ validateInitialFiles: vi.fn(() => []) })),
  };
  const db = {
    sequelize: {
      transaction: vi.fn(async (run: (transaction: object) => Promise<unknown>) => run({})),
    },
    getRepository: vi.fn(() => ({
      findOne: vi.fn(async (query: { filter?: { $and?: unknown[] } }) =>
        JSON.stringify(query.filter).includes('scope-miss') ? null : { get: () => repo.id },
      ),
    })),
  };
  const permissionService = {
    assertActionAllowed: vi.fn(async () => undefined),
    createInternalVscRequestContext: vi.fn(() => ({})),
  };
  const createJobStore = {
    enqueue: vi.fn(async () => createJob),
  };
  const createJobRunner = {
    publish: vi.fn(async () => undefined),
  };
  const resource = createLightExtensionSyncResource({
    db,
    auditService,
    permissionService,
    repoService,
    runtimeCompileService: {
      prepareInitialWorkspace: vi.fn(async ({ repoId }: { repoId: string }) => ({ repoId })),
      publishPreparedInitialWorkspace: vi.fn(async () => {
        const { vscRepoId: _vscRepoId, ...publicRepo } = repo;
        return { repo: publicRepo, status: 'success', entries: [], diagnostics: [] };
      }),
      prepareRemoteSnapshot: vi.fn(async () => ({
        source: { changed: true, contentHash: snapshot.contentHash },
        preparedSave: {},
      })),
      compileCurrentRuntime: vi.fn(async () => {
        const { vscRepoId: _vscRepoId, ...publicRepo } = repo;
        return { repo: publicRepo, status: 'success', entries: [], diagnostics: [] };
      }),
    },
    getRemoteSyncRuntime: () => runtime,
    createJobStore,
    createJobRunner,
    applicationName: 'main',
  });
  return { resource, runtime, auditService, repoService, pullCoordinator, createJobStore, createJobRunner };
}

async function runAction(
  fixture: ReturnType<typeof createFixture>,
  actionName: string,
  values: Record<string, unknown>,
  allowedActions: string[],
  scopeMatches = true,
  actionParams: Record<string, unknown> = {},
  request?: { path?: string; headers?: Record<string, string> },
) {
  const handler = (fixture.resource.actions as Record<string, HandlerType>)[actionName];
  const ctx = {
    action: {
      resourceName: 'lightExtensionSync',
      actionName,
      params: { ...actionParams, values },
    },
    request,
    can: ({ action }: { resource: string; action: string }) =>
      allowedActions.includes(action)
        ? { params: scopeMatches ? {} : { filter: { normalizedName: 'scope-miss' } } }
        : null,
  };
  await handler(
    ctx,
    vi.fn(async () => undefined),
  );
  return ctx as typeof ctx & { body?: unknown; status?: number };
}

function executionInput() {
  return {
    repoId: repo.id,
    expectedHeadCommitId: repo.headCommitId,
    expectedRemoteRevision: 'rev_remote',
    expectedRemoteTargetVersion: 1,
    planFingerprint: plan.fingerprint,
  };
}

function createFromGitInput() {
  return {
    provider: 'git',
    config: remote.config,
    authRef: remote.authRef,
    name: 'demo',
    title: 'Demo',
    description: 'Remote demo',
  };
}

type ForbiddenCredentialKey = 'token' | 'accessToken' | 'encryptedToken';

type HasForbiddenCredentialKey<T> = Extract<keyof T, ForbiddenCredentialKey> extends never ? false : true;

type HasAuthRef<T> = 'authRef' extends keyof T ? true : false;

describe('light-extension remote sync facade contract', () => {
  const config = {
    url: 'https://git.example.com/nocobase/light-extensions.git',
    branch: 'main',
    subdirectory: 'extensions/sales',
    transport: 'https' as const,
  };

  const source: LightExtensionSyncSourceSummary = {
    provider: 'git',
    config,
    status: 'active',
    remoteTargetVersion: 3,
    revision: 'abc123',
    credentialConfigured: true,
    authRefDisplay: '********',
    lastSyncedAt: '2026-07-16T00:00:00.000Z',
  };

  const plan = {
    state: 'local-ahead',
    action: 'push',
    reasonCode: null,
    canPull: false,
    canPush: true,
    fingerprint: 'plan:v1:example',
    remoteTargetVersion: 3,
    local: {
      headCommitId: 'commit_local',
      contentHash: 'sha256:local',
    },
    remote: {
      revision: 'abc123',
      contentHash: 'sha256:remote',
      contentHashKnown: true,
    },
    baseline: {
      remoteTargetVersion: 3,
      lastLocalCommitId: 'commit_base',
      lastRemoteRevision: 'abc122',
      lastSyncedContentHash: 'sha256:base',
    },
  } satisfies LightExtensionSyncPlan;

  it('freezes the public facade action names', () => {
    const actionNames: LightExtensionSyncActionName[] = [
      'get',
      'configure',
      'disconnect',
      'testConnection',
      'plan',
      'pull',
      'push',
      'createFromGit',
    ];

    expect(actionNames).toEqual([
      'get',
      'configure',
      'disconnect',
      'testConnection',
      'plan',
      'pull',
      'push',
      'createFromGit',
    ]);
  });

  it('uses the provider-neutral planner states and represents initial ambiguity as a stable reason', () => {
    const states: LightExtensionSyncState[] = [
      'unconfigured',
      'in-sync',
      'local-ahead',
      'remote-ahead',
      'diverged',
      'error',
    ];
    const ambiguousPlan: LightExtensionSyncPlan = {
      ...plan,
      state: 'diverged',
      action: 'conflict',
      reasonCode: 'initial-ambiguous',
      canPull: false,
      canPush: false,
    };

    expect(states).toEqual(['unconfigured', 'in-sync', 'local-ahead', 'remote-ahead', 'diverged', 'error']);
    expect(ambiguousPlan).toMatchObject({
      reasonCode: 'initial-ambiguous',
      canPull: false,
      canPush: false,
    });
  });

  it('freezes all facade action inputs around the public light-extension repo id', () => {
    const inputs = {
      get: { repoId: 'ler_sales' } satisfies LightExtensionSyncGetInput,
      configure: {
        repoId: 'ler_sales',
        provider: 'git',
        config,
        authRef: '{{ $env.GIT_SYNC_SECRET }}',
      } satisfies LightExtensionSyncConfigureInput,
      disconnect: { repoId: 'ler_sales' } satisfies LightExtensionSyncDisconnectInput,
      testConnection: {
        repoId: 'ler_sales',
        provider: 'git',
        config,
        authRef: '{{ $env.GIT_SYNC_SECRET }}',
      } satisfies LightExtensionSyncTestConnectionInput,
      plan: { repoId: 'ler_sales' } satisfies LightExtensionSyncPlanInput,
      pull: {
        repoId: 'ler_sales',
        expectedHeadCommitId: 'commit_local',
        expectedRemoteRevision: 'abc123',
        expectedRemoteTargetVersion: 3,
        planFingerprint: plan.fingerprint,
      } satisfies LightExtensionSyncPullInput,
      push: {
        repoId: 'ler_sales',
        expectedHeadCommitId: 'commit_local',
        expectedRemoteRevision: 'abc123',
        expectedRemoteTargetVersion: 3,
        planFingerprint: plan.fingerprint,
      } satisfies LightExtensionSyncPushInput,
      createFromGit: {
        name: 'sales',
        title: 'Sales',
        description: 'Sales light extensions',
        provider: 'git',
        config,
        authRef: '{{ $env.GIT_SYNC_SECRET }}',
      } satisfies LightExtensionSyncCreateFromGitInput,
    };

    expect(
      Object.values(inputs)
        .filter((input) => 'repoId' in input)
        .every((input) => input.repoId === 'ler_sales'),
    ).toBe(true);
    expect(JSON.stringify(inputs)).not.toContain('vscRepoId');
    expect(inputs.createFromGit).not.toHaveProperty('zipBase64');
    expect(inputs.createFromGit).not.toHaveProperty('initialFiles');
  });

  it('allows authRef only on configure, testConnection, and createFromGit requests', () => {
    const authRefContract: {
      get: HasAuthRef<LightExtensionSyncGetInput>;
      configure: HasAuthRef<LightExtensionSyncConfigureInput>;
      disconnect: HasAuthRef<LightExtensionSyncDisconnectInput>;
      testConnection: HasAuthRef<LightExtensionSyncTestConnectionInput>;
      plan: HasAuthRef<LightExtensionSyncPlanInput>;
      pull: HasAuthRef<LightExtensionSyncPullInput>;
      push: HasAuthRef<LightExtensionSyncPushInput>;
      createFromGit: HasAuthRef<LightExtensionSyncCreateFromGitInput>;
    } = {
      get: false,
      configure: true,
      disconnect: false,
      testConnection: true,
      plan: false,
      pull: false,
      push: false,
      createFromGit: true,
    };

    expect(authRefContract).toEqual({
      get: false,
      configure: true,
      disconnect: false,
      testConnection: true,
      plan: false,
      pull: false,
      push: false,
      createFromGit: true,
    });
  });

  it('keeps public DTOs free of raw credential fields and internal repository ids', () => {
    const noRawCredentials: {
      configure: HasForbiddenCredentialKey<LightExtensionSyncConfigureInput>;
      testConnection: HasForbiddenCredentialKey<LightExtensionSyncTestConnectionInput>;
      createFromGit: HasForbiddenCredentialKey<LightExtensionSyncCreateFromGitInput>;
      source: HasForbiddenCredentialKey<LightExtensionSyncSourceSummary>;
    } = {
      configure: false,
      testConnection: false,
      createFromGit: false,
      source: false,
    };
    const result: LightExtensionSyncPlanResult = {
      repoId: 'ler_sales',
      source,
      plan,
    };

    expect(noRawCredentials).toEqual({
      configure: false,
      testConnection: false,
      createFromGit: false,
      source: false,
    });
    expect(JSON.stringify(result)).not.toMatch(/(?:accessToken|encryptedToken|"token")/iu);
    expect(JSON.stringify(result)).not.toContain('vscRepoId');
    expect(result.source).toMatchObject({ credentialConfigured: true });
  });

  it('freezes optimistic concurrency fields for Pull and Push', () => {
    const pull: LightExtensionSyncPullInput = {
      repoId: 'ler_sales',
      expectedHeadCommitId: plan.local.headCommitId,
      expectedRemoteRevision: plan.remote.revision,
      expectedRemoteTargetVersion: plan.remoteTargetVersion,
      planFingerprint: plan.fingerprint,
    };
    const push: LightExtensionSyncPushInput = { ...pull };

    expect(pull).toEqual(push);
    expect(Object.keys(pull).sort()).toEqual(
      [
        'expectedHeadCommitId',
        'expectedRemoteRevision',
        'expectedRemoteTargetVersion',
        'planFingerprint',
        'repoId',
      ].sort(),
    );
  });

  it('freezes the durable creation job states, sources, actions, and safe summary boundary', () => {
    const statuses: LightExtensionCreateJobStatus[] = ['pending', 'running', 'failed'];
    const sourceTypes: LightExtensionCreateSourceType[] = ['template', 'zip', 'git'];
    const actions: LightExtensionCreateJobActionName[] = ['list', 'dismiss'];
    const record: LightExtensionCreateJobRecord = {
      id: 'job-1',
      applicationName: 'main',
      targetRepoId: 'repo-1',
      name: 'sales',
      normalizedName: 'sales',
      title: 'Sales',
      description: null,
      sourceType: 'git',
      status: 'pending',
      payload: { authRef: '{{ $env.GIT_SYNC_SECRET }}' },
      errorCode: null,
      errorMessage: null,
      reservationKey: 'main:sales',
      actorUserId: 'user-1',
      requestId: 'request-1',
      startedAt: null,
      finishedAt: null,
      createdAt: '2026-07-27T00:00:00.000Z',
      updatedAt: '2026-07-27T00:00:00.000Z',
    };
    const summary: LightExtensionCreateJobSummary = {
      id: record.id,
      targetRepoId: record.targetRepoId,
      name: record.name,
      title: record.title,
      description: record.description,
      sourceType: record.sourceType,
      status: record.status,
      errorCode: record.errorCode,
      errorMessage: record.errorMessage,
      startedAt: record.startedAt,
      finishedAt: record.finishedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
    const internalFieldContract: {
      payload: 'payload' extends keyof LightExtensionCreateJobSummary ? true : false;
      reservationKey: 'reservationKey' extends keyof LightExtensionCreateJobSummary ? true : false;
      actorUserId: 'actorUserId' extends keyof LightExtensionCreateJobSummary ? true : false;
    } = {
      payload: false,
      reservationKey: false,
      actorUserId: false,
    };

    expect(statuses).toEqual(['pending', 'running', 'failed']);
    expect(sourceTypes).toEqual(['template', 'zip', 'git']);
    expect(actions).toEqual(['list', 'dismiss']);
    expect(internalFieldContract).toEqual({
      payload: false,
      reservationKey: false,
      actorUserId: false,
    });
    expect(JSON.stringify(summary)).not.toMatch(/payload|authRef|reservation|claim|lease|actor|requestId/iu);
  });

  it('maps provider-neutral errors to stable facade codes and statuses', () => {
    const expected = {
      UNSUPPORTED_PROVIDER: ['LIGHT_EXTENSION_SYNC_UNSUPPORTED_PROVIDER', 422],
      CREDENTIAL_UNAVAILABLE: ['LIGHT_EXTENSION_SYNC_CREDENTIAL_UNAVAILABLE', 422],
      AUTH_FAILED: ['LIGHT_EXTENSION_SYNC_AUTH_FAILED', 422],
      REMOTE_NOT_FOUND: ['LIGHT_EXTENSION_SYNC_REMOTE_NOT_FOUND', 404],
      RATE_LIMITED: ['LIGHT_EXTENSION_SYNC_RATE_LIMITED', 429],
      REMOTE_CHANGED: ['LIGHT_EXTENSION_SYNC_REMOTE_CHANGED', 409],
      DIVERGED: ['LIGHT_EXTENSION_SYNC_DIVERGED', 409],
      BUSY: ['LIGHT_EXTENSION_SYNC_BUSY', 409],
      UNSAFE_CONTENT: ['LIGHT_EXTENSION_SYNC_UNSAFE_CONTENT', 422],
      REMOTE_UNAVAILABLE: ['LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE', 502],
      PERMISSION_DENIED: ['LIGHT_EXTENSION_PERMISSION_DENIED', 403],
      REPO_ARCHIVED: ['LIGHT_EXTENSION_REPO_ARCHIVED', 409],
      LOCAL_OUTDATED: ['LIGHT_EXTENSION_SYNC_LOCAL_OUTDATED', 409],
      CONFIG_INVALID: ['LIGHT_EXTENSION_SYNC_CONFIG_INVALID', 422],
      AUTH_REF_INVALID: ['LIGHT_EXTENSION_SYNC_AUTH_REF_INVALID', 422],
    } as const;

    expect(LIGHT_EXTENSION_SYNC_ERROR_CODE_BY_REMOTE_CODE).toEqual(
      Object.fromEntries(Object.entries(expected).map(([remoteCode, [facadeCode]]) => [remoteCode, facadeCode])),
    );

    for (const [remoteCode, [facadeCode, status]] of Object.entries(expected)) {
      const error = mapRemoteSyncErrorToLightExtension({
        code: remoteCode as keyof typeof expected,
        message: `Safe ${remoteCode}`,
      });
      expect(error).toMatchObject({ code: facadeCode, status });
      if (remoteCode === 'AUTH_FAILED') {
        expect(error.status).not.toBe(401);
      }
    }
  });

  it('does not copy provider causes, transport objects, configs, or credential-like details', () => {
    const error = mapRemoteSyncErrorToLightExtension({
      code: 'RATE_LIMITED',
      message: 'Provider request is rate limited',
      details: {
        provider: 'git',
        retryAfterSeconds: 60,
        token: 'raw-secret',
        config: { owner: 'nocobase' },
        request: { headers: { authorization: 'raw-secret' } },
        response: { body: 'raw-provider-body' },
        cause: new Error('raw-provider-error'),
      },
    });
    const serialized = JSON.stringify(error.toResponseBody());

    expect(error.details).toEqual({
      sourceCode: 'RATE_LIMITED',
      provider: 'git',
      retryAfterSeconds: 60,
    });
    expect(serialized).not.toMatch(/raw-secret|raw-provider|authorization|"(?:request|response|cause|config|token)"/iu);
  });
});
