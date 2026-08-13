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
import { AuditManager, type Application } from '@nocobase/server';
import { vi } from 'vitest';

import { NAMESPACE } from '../../constants';
import { createJsTemplateSyncResource } from '../resources/jsTemplateSync';
import PluginJsTemplateServer from '../plugin';
import {
  createGitSyncAcceptanceFixture,
  gitSyncRemoteConfig,
  type GitSyncAcceptanceFixture,
} from './helpers/gitSyncAcceptance';

import type { AuditLog } from '@nocobase/server';
import { createMockServer, type MockServer } from '@nocobase/test';

import { computeRemoteSnapshotContentHash, RemoteSyncAdapterRegistry, type VscRemoteSnapshot } from '../vsc-file';
import { validGitSyncFiles } from './helpers/gitSyncAcceptance';

describe('JS Template Git sync permissions acceptance', () => {
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
          provider: 'git',
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
      auditManager: new AuditManager(),
      pm: { get: vi.fn(() => null), getPlugins: vi.fn(() => new Map()) },
      resourceManager: { define: vi.fn(), options: {} },
      on: vi.fn(),
      off: vi.fn(),
      use: vi.fn(),
    } as unknown as Application;
    await new PluginJsTemplateServer(app, { name: 'js-template', packageName: NAMESPACE }).load();
    const conditions = new Map(
      registrations
        .filter((registration) => registration.resource === 'jsTemplateSync')
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
      { request: { path: `/api/jsTemplateSync:configure/credential/${token}` } },
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
    const plan = await fixture.createPullInput(created.project.id);
    const values =
      action === 'configure'
        ? { projectId: created.project.id, provider: 'git', config: gitSyncRemoteConfig }
        : action === 'pull' || action === 'push'
          ? {
              projectId: created.project.id,
              expectedHeadCommitId: plan.expectedLocalCommitId,
              expectedRemoteRevision: plan.expectedRemoteRevision,
              expectedRemoteTargetVersion: plan.expectedRemoteTargetVersion,
              planFingerprint: plan.planFingerprint,
            }
          : { projectId: created.project.id };

    const ctx = await runAction(action, values, []);
    expect(ctx.status).toBe(403);
    expect(ctx.body).toMatchObject({ errors: [{ code: 'JS_TEMPLATE_PERMISSION_DENIED' }] });
  });

  it.each(['get', 'plan', 'pull', 'push'] as const)(
    'rejects caller-supplied authRef on %s before it can replace the stored credential',
    async (action) => {
      const created = await fixture.createFromRemote(`Injected auth ${action}`, '{{ $env.SAVED_SECRET }}');
      const execution = await fixture.createPullInput(created.project.id);
      const values = {
        projectId: created.project.id,
        expectedHeadCommitId: execution.expectedLocalCommitId,
        expectedRemoteRevision: execution.expectedRemoteRevision,
        expectedRemoteTargetVersion: execution.expectedRemoteTargetVersion,
        planFingerprint: execution.planFingerprint,
        authRef: '{{ $env.ATTACKER_SECRET }}',
      };
      const permission = action === 'push' ? 'pushToSyncSource' : 'pullFromSyncSource';
      const ctx = await runAction(action, values, [permission]);
      const internal = await fixture.projectService.getInternalProject(created.project.id);
      const remote = await fixture.runtime.getRemote(internal.vscRepoId, 'origin');

      expect(ctx.status).toBe(400);
      expect(ctx.body).toMatchObject({ errors: [{ code: 'JS_TEMPLATE_INVALID_INPUT' }] });
      expect(remote?.authRef).toBe('{{ $env.SAVED_SECRET }}');
    },
  );

  function resource() {
    return createJsTemplateSyncResource({
      db: fixture.app.db,
      auditService: fixture.auditService,
      permissionService: fixture.permissionService,
      projectService: fixture.projectService,
      runtimeCompileService: fixture.runtimeCompileService,
      getRemoteSyncRuntime: () => fixture.runtime,
    });
  }

  async function runAction(actionName: string, values: Record<string, unknown>, allowedActions: readonly string[]) {
    const handler = (resource().actions as Record<string, HandlerType>)[actionName];
    const ctx = {
      action: { resourceName: 'jsTemplateSync', actionName, params: { values } },
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

describe('JS Template Git credential logging integration', () => {
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

      const adapter = getGitAdapter(app);
      const baseSnapshot = createSnapshot('remote-base', 'Base');
      const nextSnapshot = createSnapshot('remote-next', 'Remote next');
      vi.spyOn(adapter, 'probe').mockResolvedValue({ revision: baseSnapshot.revision, metadata: { branch: 'main' } });
      const fetchSnapshot = vi.spyOn(adapter, 'fetchSnapshot').mockResolvedValue(baseSnapshot);

      const user = await app.db.getRepository('users').findOne();
      const agent = await app.agent().login(user);
      const createResponse = await agent.post('/jsTemplateSync:createFromGit').send({
        idempotencyKey: `credential-logging-${Date.now()}`,
        provider: 'git',
        config: gitSyncRemoteConfig,
        name: 'Credential logging integration',
      });
      expect(createResponse.status).toBe(202);
      const accepted = responseData(createResponse.body);
      const createJobId = requireString(accepted.id, 'creation job id');
      const projectId = requireString(accepted.targetProjectId, 'project id');
      await waitForSuccessfulCreate(app, createJobId, projectId);

      fetchSnapshot.mockResolvedValue(nextSnapshot);
      const planResponse = await agent.post('/jsTemplateSync:plan').send({ projectId });
      expect(planResponse.status).toBe(200);
      const plan = toRecord(responseData(planResponse.body).plan);
      const local = toRecord(plan.local);
      const remote = toRecord(plan.remote);
      expect(plan).toMatchObject({ state: 'remote-ahead', action: 'pull' });
      const restrictedAgent = await createRestrictedAgent(app);

      requestLogs.length = 0;
      auditLogs.length = 0;
      const secretMarkers = {
        httpsPassword: 'https-password-cross-layer-secret',
        nestedCredential: 'nested-credential-cross-layer-secret',
        queryCredential: 'query-credential-cross-layer-secret',
        responseCredential: 'response-credential-cross-layer-secret',
      };
      const authorization = `Bearer ${secretMarkers.httpsPassword}`;
      const requestValues = { projectId, provider: 'git', config: gitSyncRemoteConfig };
      const bodyResponse = await agent
        .post('/jsTemplateSync:configure')
        .set('x-request-id', 'credential-body-rejected')
        .send({ ...requestValues, authRef: secretMarkers.httpsPassword });
      const queryResponse = await restrictedAgent
        .post('/jsTemplateSync:configure')
        .set('x-request-id', 'credential-query-rejected')
        .query({ authRef: secretMarkers.queryCredential })
        .send(requestValues);
      const permissionResponse = await restrictedAgent
        .post('/jsTemplateSync:configure')
        .set('x-request-id', 'credential-permission-rejected')
        .send(requestValues);
      const headerResponse = await agent
        .post('/jsTemplateSync:configure')
        .set('x-request-id', 'credential-header-rejected')
        .set('x-git-credential', authorization)
        .send(requestValues);

      expect(bodyResponse.status).toBe(422);
      expect(bodyResponse.body).toMatchObject({
        errors: [
          {
            code: 'JS_TEMPLATE_SYNC_AUTH_REF_INVALID',
            details: { reasonCode: 'secret-variable-required' },
          },
        ],
      });
      expect(queryResponse.status).toBe(400);
      expect(permissionResponse.status).toBe(403);
      expect(headerResponse.status).toBe(400);

      const rawProviderError = Object.assign(new Error(`provider raw failure: ${authorization}`), {
        cause: new Error(secretMarkers.nestedCredential),
        config: { headers: { Authorization: authorization } },
        request: { body: secretMarkers.queryCredential },
        response: { data: { credential: secretMarkers.responseCredential } },
        vscRepoId: 'vscr_internal_secret',
        remoteId: 'vscrmt_internal_secret',
        jobId: 'job_internal_secret',
        claimToken: 'claim_internal_secret',
      });
      fetchSnapshot.mockRejectedValueOnce(rawProviderError);
      app.auditManager.registerAction('jsTemplateSync:pull');
      const pullResponse = await agent
        .post('/jsTemplateSync:pull')
        .set('x-request-id', 'provider-error-rejected')
        .send({
          projectId,
          expectedHeadCommitId: local.headCommitId ?? null,
          expectedRemoteRevision: remote.revision ?? null,
          expectedRemoteTargetVersion: plan.remoteTargetVersion,
          planFingerprint: plan.fingerprint,
        });

      expect(pullResponse.status).toBe(502);
      expect(pullResponse.body).toMatchObject({
        errors: [{ code: 'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE' }],
      });
      expect(requestLogs).toHaveLength(6);
      expect(requestLogs.filter((entry) => toRecord(entry).message?.toString().startsWith('request '))).toHaveLength(3);
      expect(auditLogs).toHaveLength(3);
      expect(auditLogs.find((log) => log.action === 'pull')).toMatchObject({
        resource: 'jsTemplateSync',
        action: 'pull',
        status: 502,
      });

      const persistedLogs = await app.db.getRepository('jsTemplateLogs').find({
        filter: { action: 'syncPull', result: 'blocked' },
      });
      expect(persistedLogs).toHaveLength(1);
      expect(persistedLogs[0]).toMatchObject({
        requestId: 'provider-error-rejected',
        reasonCode: 'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE',
      });

      const serialized = JSON.stringify({
        responses: [
          bodyResponse.body,
          queryResponse.body,
          permissionResponse.body,
          headerResponse.body,
          pullResponse.body,
        ],
        requestLogs,
        auditLogs,
        persistedLogs: persistedLogs.map((log) => log.toJSON()),
      });
      expect(serialized).toContain('[REDACTED]');
      expect(serialized).not.toContain(authorization);
      for (const marker of Object.values(secretMarkers)) {
        expect(serialized).not.toContain(marker);
      }
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

type JsTemplatePluginInternals = {
  remoteSyncModule: {
    remoteAdapters: RemoteSyncAdapterRegistry;
  };
};

async function createApp(): Promise<MockServer> {
  return createMockServer({
    registerActions: true,
    acl: true,
    plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', 'system-settings', PluginJsTemplateServer],
  });
}

function getGitAdapter(app: MockServer) {
  const plugin = app.pm.get(PluginJsTemplateServer) as PluginJsTemplateServer;
  const registry = (plugin as unknown as JsTemplatePluginInternals).remoteSyncModule.remoteAdapters;
  const adapter = registry.get('git');
  if (!adapter) {
    throw new Error('Expected the Git remote adapter');
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

async function waitForSuccessfulCreate(app: MockServer, jobId: string, projectId: string): Promise<void> {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const job = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: jobId });
    if (job?.get('status') === 'failed') {
      throw new Error(`Creation job ${jobId} failed with ${String(job.get('errorCode'))}`);
    }
    if (job?.get('status') === 'succeeded' && job.get('resultProjectId') === projectId) {
      const project = await app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: projectId });
      if (project) {
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Creation job ${jobId} did not finish`);
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
