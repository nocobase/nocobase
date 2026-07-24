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
