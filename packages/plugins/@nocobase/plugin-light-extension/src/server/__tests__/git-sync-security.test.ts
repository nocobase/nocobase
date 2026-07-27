/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { HandlerType } from '@nocobase/resourcer';
import type { Application } from '@nocobase/server';
import { vi } from 'vitest';

import { NAMESPACE } from '../../constants';
import { createLightExtensionSyncResource } from '../resources/lightExtensionSync';
import PluginLightExtensionServer from '../plugin';
import {
  createGitSyncAcceptanceFixture,
  gitSyncRemoteConfig,
  type GitSyncAcceptanceFixture,
} from './helpers/gitSyncAcceptance';

import type { AuditLog } from '@nocobase/server';
import { createMockServer, type MockServer } from '@nocobase/test';

import { computeRemoteSnapshotContentHash, RemoteSyncAdapterRegistry, type VscRemoteSnapshot } from '../vsc-file';
import { validGitSyncFiles } from './helpers/gitSyncAcceptance';

describe('light extension Git sync permissions acceptance', () => {
  let fixture: GitSyncAcceptanceFixture;

  beforeEach(async () => {
    fixture = await createGitSyncAcceptanceFixture();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fixture?.close();
  });

  it.each(['create', 'manageSyncSource', 'pullFromSyncSource'] as const)(
    'denies createFromGit without %s before credential validation or network access',
    async (missingPermission) => {
      const probe = vi.spyOn(fixture.adapter, 'probe');
      const fetch = vi.spyOn(fixture.adapter, 'fetchSnapshot');
      const ctx = await runAction(
        'createFromGit',
        {
          provider: 'github',
          config: gitSyncRemoteConfig,
          authRef: '{{ $env.GITHUB_SYNC }}',
          name: 'Denied Git Source',
        },
        ['create', 'manageSyncSource', 'pullFromSyncSource'].filter((action) => action !== missingPermission),
      );

      expect(ctx.status).toBe(403);
      expect(fixture.validateCredential).not.toHaveBeenCalled();
      expect(probe).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('registers the real ACL predicate for the no-access, manage-only, pull-only, and push-only role matrix', async () => {
    type AclCondition = (ctx: {
      can?: (input: { resource: string; action: string }) => unknown | Promise<unknown>;
      action?: { params?: Record<string, unknown> };
      request?: { path?: string; headers?: Record<string, string> };
    }) => boolean | Promise<boolean>;
    const registrations: Array<{ resource: string; action: string; condition: string | AclCondition }> = [];
    const app = {
      db: {} as Database,
      environment: { getVariables: vi.fn(() => ({})) },
      acl: {
        allow: vi.fn((resource: string, actions: string | string[], condition: string | AclCondition) => {
          for (const action of Array.isArray(actions) ? actions : [actions]) {
            registrations.push({ resource, action, condition });
          }
        }),
        registerSnippet: vi.fn(),
      },
      auditManager: { registerActions: vi.fn(), log: vi.fn() },
      pm: { get: vi.fn(() => null), getPlugins: vi.fn(() => new Map()) },
      resourceManager: { define: vi.fn(), options: {} },
      on: vi.fn(),
      off: vi.fn(),
      use: vi.fn(),
    } as unknown as Application;
    await new PluginLightExtensionServer(app, { name: 'light-extension', packageName: NAMESPACE }).load();
    const conditions = new Map(
      registrations
        .filter((registration) => registration.resource === 'lightExtensionSync')
        .map((registration) => [registration.action, registration.condition]),
    );
    const roleMatrix = [
      { permissions: [] as string[], allowed: [] as string[] },
      {
        permissions: ['manageSyncSource'],
        allowed: ['get', 'configure', 'disconnect', 'testConnection', 'plan'],
      },
      { permissions: ['pullFromSyncSource'], allowed: ['get', 'plan', 'pull'] },
      { permissions: ['pushToSyncSource'], allowed: ['get', 'plan', 'push'] },
      {
        permissions: ['create', 'manageSyncSource', 'pullFromSyncSource'],
        allowed: ['get', 'configure', 'disconnect', 'testConnection', 'plan', 'pull', 'createFromGit'],
      },
    ];

    expect(conditions.size).toBe(8);
    for (const role of roleMatrix) {
      for (const [action, condition] of conditions) {
        if (typeof condition !== 'function') {
          throw new Error(`Expected a predicate ACL condition for ${action}`);
        }
        const allowed = await condition({
          can: ({ action: permission }) => (role.permissions.includes(permission) ? {} : null),
        });
        expect(allowed, `${role.permissions.join(',') || 'no-access'}:${action}`).toBe(role.allowed.includes(action));
      }
    }

    const configure = conditions.get('configure');
    if (typeof configure !== 'function') {
      throw new Error('Expected configure ACL predicate');
    }
    const token = 'github_pat_acl_transport_secret';
    const transportContexts = [
      { action: { params: { authRef: token, values: {} } } },
      { request: { headers: { 'x-git-credential': token } } },
      { request: { path: `/api/lightExtensionSync:configure/credential/${token}` } },
    ];
    for (const transportContext of transportContexts) {
      const ctx = {
        ...transportContext,
        can: () => ({}),
      };
      await expect(configure(ctx)).resolves.toBe(false);
      expect(JSON.stringify(ctx)).not.toContain(token);
    }
  });

  it.each([
    ['get', ['manageSyncSource']],
    ['configure', ['manageSyncSource']],
    ['disconnect', ['manageSyncSource']],
    ['testConnection', ['manageSyncSource']],
    ['plan', ['pullFromSyncSource']],
    ['pull', ['pullFromSyncSource']],
    ['push', ['pushToSyncSource']],
  ] as const)('denies %s to an ordinary logged-in user without its dedicated permission', async (action) => {
    const created = await fixture.createFromRemote(`Permission ${action}`);
    const plan = await fixture.createPullInput(created.repo.id);
    const values =
      action === 'configure'
        ? { repoId: created.repo.id, provider: 'github', config: gitSyncRemoteConfig }
        : action === 'pull' || action === 'push'
          ? {
              repoId: created.repo.id,
              expectedHeadCommitId: plan.expectedLocalCommitId,
              expectedRemoteRevision: plan.expectedRemoteRevision,
              expectedRemoteTargetVersion: plan.expectedRemoteTargetVersion,
              planFingerprint: plan.planFingerprint,
            }
          : { repoId: created.repo.id };

    const ctx = await runAction(action, values, []);
    expect(ctx.status).toBe(403);
    expect(ctx.body).toMatchObject({ errors: [{ code: 'LIGHT_EXTENSION_PERMISSION_DENIED' }] });
  });

  it.each(['get', 'plan', 'pull', 'push'] as const)(
    'rejects caller-supplied authRef on %s before it can replace the stored credential',
    async (action) => {
      const created = await fixture.createFromRemote(`Injected auth ${action}`, '{{ $env.SAVED_SECRET }}');
      const execution = await fixture.createPullInput(created.repo.id);
      const values = {
        repoId: created.repo.id,
        expectedHeadCommitId: execution.expectedLocalCommitId,
        expectedRemoteRevision: execution.expectedRemoteRevision,
        expectedRemoteTargetVersion: execution.expectedRemoteTargetVersion,
        planFingerprint: execution.planFingerprint,
        authRef: '{{ $env.ATTACKER_SECRET }}',
      };
      const permission = action === 'push' ? 'pushToSyncSource' : 'pullFromSyncSource';
      const ctx = await runAction(action, values, [permission]);
      const internal = await fixture.repoService.getInternalRepo(created.repo.id);
      const remote = await fixture.runtime.getRemote(internal.vscRepoId, 'origin');

      expect(ctx.status).toBe(400);
      expect(ctx.body).toMatchObject({ errors: [{ code: 'LIGHT_EXTENSION_INVALID_INPUT' }] });
      expect(remote?.authRef).toBe('{{ $env.SAVED_SECRET }}');
    },
  );

  function resource() {
    return createLightExtensionSyncResource({
      db: fixture.app.db,
      auditService: fixture.auditService,
      permissionService: fixture.permissionService,
      repoService: fixture.repoService,
      runtimeCompileService: fixture.runtimeCompileService,
      getRemoteSyncRuntime: () => fixture.runtime,
    });
  }

  async function runAction(actionName: string, values: Record<string, unknown>, allowedActions: readonly string[]) {
    const handler = (resource().actions as Record<string, HandlerType>)[actionName];
    const ctx = {
      action: { resourceName: 'lightExtensionSync', actionName, params: { values } },
      auth: { user: { id: 'ordinary-user' } },
      can: ({ action }: { resource: string; action: string }) => (allowedActions.includes(action) ? {} : null),
    };
    await handler(
      ctx,
      vi.fn(async () => undefined),
    );
    return ctx as typeof ctx & { body?: unknown; status?: number };
  }
});

describe('light extension Git credential logging integration', () => {
  it('keeps rejected credentials and raw provider failures out of every logging surface', async () => {
    const app = await createApp();
    const requestLogs: unknown[] = [];
    const auditLogs: AuditLog[] = [];
    try {
      vi.spyOn(app.requestLogger, 'info').mockImplementation((entry) => {
        requestLogs.push(entry);
        return app.requestLogger;
      });
      vi.spyOn(app.requestLogger, 'warn').mockImplementation((entry) => {
        requestLogs.push(entry);
        return app.requestLogger;
      });
      vi.spyOn(app.requestLogger, 'error').mockImplementation((entry) => {
        requestLogs.push(entry);
        return app.requestLogger;
      });
      app.auditManager.setLogger({
        log: async (auditLog) => {
          auditLogs.push(auditLog);
        },
      });

      const adapter = getGitHubAdapter(app);
      const baseSnapshot = createSnapshot('remote-base', 'Base');
      const nextSnapshot = createSnapshot('remote-next', 'Remote next');
      vi.spyOn(adapter, 'probe').mockResolvedValue({ revision: baseSnapshot.revision, metadata: { branch: 'main' } });
      const fetchSnapshot = vi.spyOn(adapter, 'fetchSnapshot').mockResolvedValue(baseSnapshot);

      const user = await app.db.getRepository('users').findOne();
      const agent = await app.agent().login(user);
      const createResponse = await agent.post('/lightExtensionSync:createFromGit').send({
        provider: 'github',
        config: gitSyncRemoteConfig,
        name: 'Credential logging integration',
      });
      expect(createResponse.status).toBe(200);
      const repoId = requireString(toRecord(responseData(createResponse.body).repo).id, 'repo id');

      fetchSnapshot.mockResolvedValue(nextSnapshot);
      const planResponse = await agent.post('/lightExtensionSync:plan').send({ repoId });
      expect(planResponse.status).toBe(200);
      const plan = toRecord(responseData(planResponse.body).plan);
      const local = toRecord(plan.local);
      const remote = toRecord(plan.remote);
      expect(plan).toMatchObject({ state: 'remote-ahead', action: 'pull' });
      const restrictedAgent = await createRestrictedAgent(app);

      requestLogs.length = 0;
      auditLogs.length = 0;
      const token = 'github_pat_cross_layer_012345678901234567890123456789';
      const authorization = `Bearer ${token}`;
      const requestValues = { repoId, provider: 'github', config: gitSyncRemoteConfig };
      const bodyResponse = await agent
        .post('/lightExtensionSync:configure')
        .set('x-request-id', 'credential-body-rejected')
        .send({ ...requestValues, authRef: token });
      const queryResponse = await restrictedAgent
        .post('/lightExtensionSync:configure')
        .set('x-request-id', 'credential-query-rejected')
        .query({ authRef: token })
        .send(requestValues);
      const headerResponse = await agent
        .post('/lightExtensionSync:configure')
        .set('x-request-id', 'credential-header-rejected')
        .set('x-git-credential', authorization)
        .send(requestValues);

      expect(bodyResponse.status).toBe(400);
      expect(queryResponse.status).toBe(403);
      expect(headerResponse.status).toBe(400);

      const rawProviderError = Object.assign(new Error(`provider raw failure: ${authorization}`), {
        cause: new Error(token),
        config: { headers: { Authorization: authorization } },
        request: { body: token },
        response: { data: { token } },
        vscRepoId: 'vscr_internal_secret',
        remoteId: 'vscrmt_internal_secret',
        jobId: 'job_internal_secret',
        claimToken: 'claim_internal_secret',
      });
      fetchSnapshot.mockRejectedValueOnce(rawProviderError);
      app.auditManager.registerAction('lightExtensionSync:pull');
      const pullResponse = await agent
        .post('/lightExtensionSync:pull')
        .set('x-request-id', 'provider-error-rejected')
        .send({
          repoId,
          expectedHeadCommitId: local.headCommitId ?? null,
          expectedRemoteRevision: remote.revision ?? null,
          expectedRemoteTargetVersion: plan.remoteTargetVersion,
          planFingerprint: plan.fingerprint,
        });

      expect(pullResponse.status).toBe(502);
      expect(pullResponse.body).toMatchObject({
        errors: [{ code: 'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE' }],
      });
      expect(requestLogs).toHaveLength(8);
      expect(requestLogs.filter((entry) => toRecord(entry).message?.toString().startsWith('request '))).toHaveLength(4);
      expect(auditLogs).toHaveLength(4);
      expect(auditLogs.find((log) => log.action === 'pull')).toMatchObject({
        resource: 'lightExtensionSync',
        action: 'pull',
        status: 502,
      });

      const persistedLogs = await app.db.getRepository('lightExtensionLogs').find({
        filter: { action: 'syncPull', result: 'blocked' },
      });
      expect(persistedLogs).toHaveLength(1);
      expect(persistedLogs[0]).toMatchObject({
        requestId: 'provider-error-rejected',
        reasonCode: 'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE',
      });

      const serialized = JSON.stringify({
        responses: [bodyResponse.body, queryResponse.body, headerResponse.body, pullResponse.body],
        requestLogs,
        auditLogs,
        persistedLogs: persistedLogs.map((log) => log.toJSON()),
      });
      expect(serialized).toContain('[REDACTED]');
      expect(serialized).not.toContain(token);
      expect(serialized).not.toContain(authorization);
      expect(serialized).not.toContain('provider raw failure');
      expect(serialized).not.toMatch(
        /vscr_internal_secret|vscrmt_internal_secret|job_internal_secret|claim_internal_secret/u,
      );
      expect(serialized).not.toMatch(/"cause"|"Authorization"/u);
    } finally {
      vi.restoreAllMocks();
      await app.destroy();
    }
  });
});

type LightExtensionPluginInternals = {
  vscFileServerModule: {
    remoteAdapters: RemoteSyncAdapterRegistry;
  };
};

async function createApp(): Promise<MockServer> {
  return createMockServer({
    registerActions: true,
    acl: true,
    plugins: [
      'field-sort',
      'users',
      'auth',
      'acl',
      'data-source-manager',
      'system-settings',
      PluginLightExtensionServer,
    ],
  });
}

function getGitHubAdapter(app: MockServer) {
  const plugin = app.pm.get(PluginLightExtensionServer) as PluginLightExtensionServer;
  const registry = (plugin as unknown as LightExtensionPluginInternals).vscFileServerModule.remoteAdapters;
  const adapter = registry.get('github');
  if (!adapter) {
    throw new Error('Expected the GitHub remote adapter');
  }
  return adapter;
}

async function createRestrictedAgent(app: MockServer) {
  const roleName = 'credentialLoggingRestricted';
  app.acl.define({
    role: roleName,
    strategy: {
      actions: false,
      allowConfigure: false,
    },
  });
  await app.db.getRepository('roles').create({ values: { name: roleName, allowConfigure: false } });
  const user = await app.db.getRepository('users').create({
    values: { nickname: roleName, roles: [roleName] },
  });
  return (await app.agent().login(user)).set('x-role', roleName);
}

function createSnapshot(revision: string, label: string): VscRemoteSnapshot {
  const files = validGitSyncFiles(label);
  return {
    revision,
    contentHash: computeRemoteSnapshotContentHash(files),
    files,
    metadata: { branch: 'main' },
  };
}

function responseData(body: unknown): Record<string, unknown> {
  const record = toRecord(body);
  return isRecord(record.data) ? record.data : record;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) {
    throw new Error(`Expected ${label}`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}
