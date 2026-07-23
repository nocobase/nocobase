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
  provider: 'github',
  config: { owner: 'nocobase', repository: 'demo', branch: 'main', subdirectory: null },
  authRef: '{{ $env.GITHUB_TOKEN }}',
  status: 'active',
  version: 1,
  lastCheckedAt: null,
  lastSyncedAt: null,
  lastErrorCode: null,
};

describe('lightExtensionSync resource', () => {
  it('returns a deeply frozen safe DTO and masks the saved auth reference', async () => {
    const fixture = createFixture();
    const ctx = await runAction(fixture, 'get', { repoId: repo.id }, ['pullFromSyncSource']);

    expect(ctx.status).toBeUndefined();
    expect(ctx.body).toEqual({
      repoId: repo.id,
      source: {
        provider: 'github',
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

  it('rejects a direct token before persistence or remote access', async () => {
    const directToken = 'github_pat_test_direct_123';
    const fixture = createFixture();
    const ctx = await runAction(
      fixture,
      'configure',
      {
        repoId: repo.id,
        provider: 'github',
        config: remote.config,
        authRef: directToken,
      },
      ['manageSyncSource'],
    );

    expect(ctx.status).toBe(400);
    expect(fixture.runtime.configureRemote).not.toHaveBeenCalled();
    expect(fixture.runtime.testTarget).not.toHaveBeenCalled();
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
      { repoId: repo.id, provider: 'github', config: remote.config, authRef: remote.authRef },
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
        provider: 'github',
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
    ['configure', { repoId: repo.id, provider: 'github', config: remote.config, authRef: null }, 'manageSyncSource'],
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

  it('allows createFromGit only with all permissions and returns no credential or internal identifiers', async () => {
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

    expect(ctx.status).toBeUndefined();
    expect(fixture.runtime.fetchTarget).toHaveBeenCalledWith(
      expect.objectContaining({ authRef: remote.authRef, config: remote.config }),
    );
    expect(fixture.runtime.establishInitialBaseline).toHaveBeenCalled();
    expect(ctx.body).toMatchObject({
      repo: { id: repo.id },
      source: { revision: 'rev_remote', authRefDisplay: '********' },
      plan: { state: 'in-sync' },
    });
    const serialized = JSON.stringify(ctx.body);
    expect(serialized).not.toContain('GITHUB_TOKEN');
    expect(serialized).not.toContain(repo.vscRepoId);
    expect(serialized).not.toContain(remote.id);
    expect(fixture.auditService.recordSyncEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: repo.id,
        action: 'syncCreateFromGit',
        provider: 'github',
        remoteRevision: 'rev_remote',
        fileCount: 1,
      }),
    );
    expect(JSON.stringify(fixture.auditService.recordSyncEvent.mock.calls)).not.toContain('secret-source');
    expect(JSON.stringify(fixture.auditService.recordSyncEvent.mock.calls)).not.toContain('GITHUB_TOKEN');
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

    expect(allowed.status).toBeUndefined();
    expect(allowedFixture.runtime.fetchTarget).toHaveBeenCalledTimes(1);

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
  });

  it.each([{ token: 'ghp_secret' }, { vscRepoId: repo.vscRepoId }, { remoteId: remote.id }])(
    'rejects forbidden createFromGit input before remote access',
    async (forbidden) => {
      const fixture = createFixture();
      const ctx = await runAction(fixture, 'createFromGit', { ...createFromGitInput(), ...forbidden }, [
        'create',
        'manageSyncSource',
        'pullFromSyncSource',
      ]);

      expect(ctx.status).toBe(400);
      expect(fixture.runtime.fetchTarget).not.toHaveBeenCalled();
    },
  );

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
    ['configure', { repoId: repo.id, provider: 'github', config: remote.config }],
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
        provider: 'github',
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

  it('allows public GitHub Pull with the saved null authRef and keeps internal handles out of the response', async () => {
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
      { repoId: repo.id, provider: 'github', config: remote.config },
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
      { repoId: repo.id, provider: 'github', config: remote.config },
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
      { repoId: repo.id, provider: 'github', config: remote.config },
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
        provider: 'github',
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
    fetchTarget: vi.fn(async () => ({ provider: 'github', config: configuredRemote.config, snapshot })),
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
    provider: 'github',
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
  });
  return { resource, runtime, auditService, repoService, pullCoordinator };
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
    provider: 'github',
    config: remote.config,
    authRef: remote.authRef,
    name: 'demo',
    title: 'Demo',
    description: 'Remote demo',
  };
}
