// @vitest-environment node
/**
 * The production route contribution with scoped API keys: the command manifest accepts them and carries the key's
 * scope into the caller the gate is asked about, the admin API accepts them only where a settings check decides everything, and refuses them on
 * what a person does for themselves.
 */
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { KeyScope } from '@nocobase/authorization/core';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import { every } from 'hono/combine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BUSINESS_ACTIONS,
  KEY_SCOPE_GROUPS,
  PAGES,
  SETTINGS_ACTIONS,
} from '../shared/access.js';
import {
  AGENTS_VIEW_ACTION,
  type CallerIdentity,
} from '../server/core/callers/index.js';
import { apiRoutes } from '../server/routes/index.js';
import { agentsToken } from '../server/tokens.js';
import { createCliApp } from './cli-app.js';
import { createHarness, type Harness } from './harness.js';

const keyScope: KeyScope = {
  keyId: 'key-1',
  allows: (resource, action) =>
    resource.type === 'settings' &&
    resource.id === 'agents.agents' &&
    action === 'read',
  objects: () => 'all',
  permissions: [
    { resource: { type: 'settings', id: 'agents.agents' }, actions: ['read'] },
  ],
};

/** The identity carries `keyScope` when the request has `x-test-scoped`, as the API keys plugin's step adds it. */
function fakeAuthorization(): { middleware(): MiddlewareHandler } {
  return {
    middleware: () => async (context, next) => {
      const scoped = context.req.header('x-test-scoped') === 'yes';
      context.set('authz', {
        identity: {
          principal: { type: 'user', id: 'alice' },
          ...(scoped ? { keyScope } : {}),
        },
        can: ({
          resource,
          action,
        }: {
          resource: { type: string; id: string };
          action: string;
        }) => Promise.resolve(!scoped || keyScope.allows(resource, action)),
      } as never);
      await next();
    },
  };
}

let h: Harness;
let router: Hono;
let api: Hono;
let authentication: Auth;
let seen: CallerIdentity[];

beforeEach(async () => {
  h = await createHarness();
  seen = [];
  h.services.gate.set({
    allowed: (identity) => {
      seen.push(identity);
      return Promise.resolve(new Set<string>());
    },
  });
  authentication = new Auth({
    connection: h.database.connection(),
    secret: 'agents-routes-test-secret-at-least-32-characters',
    baseURL: 'http://example.test',
  });
  vi.spyOn(authentication, 'getSession').mockImplementation((headers) => {
    const now = new Date();
    return Promise.resolve({
      user: {
        id: 'alice',
        name: 'Alice',
        email: 'alice@example.test',
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      session: {
        id: 's',
        token: headers.get('x-api-key') ?? 't',
        userId: 'alice',
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: now,
        updatedAt: now,
      },
    });
  });
  authentication.addScopedCredentialCheck(
    (_session, request) => request.headers.get('x-test-scoped') === 'yes',
  );
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  container.instance(authorizationToken, fakeAuthorization() as never);
  container.instance(agentsToken, h.services);
  router = new Hono();
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: { app: { name: 'main', publicBasePath: '' } },
    paths: createAppPaths({ rootDir: '/tmp/agents-routes' }),
    router,
    container,
  };
  api = await apiRoutes.createRouter(app);
  router.route('/api', api);
});
afterEach(() => h.close());

const scoped = { 'x-test-scoped': 'yes', 'x-api-key': 'k' };

describe('scoped API keys', () => {
  it('reach the command manifest, and the caller carries the key scope', async () => {
    h.services.gate.set({
      allowed: (identity) => {
        seen.push(identity);
        return Promise.resolve(new Set([AGENTS_VIEW_ACTION]));
      },
    });
    const { app } = createCliApp(h.services, api, {
      authenticatePerson: every(
        authentication.required({ scopedKeys: true }),
        fakeAuthorization().middleware(),
      ),
    });
    const response = await app.request('/api/cli/manifest', {
      headers: scoped,
    });
    expect(response.status).toBe(200);
    const manifest = (await response.json()) as {
      data: { commands: { id: string }[] };
    };
    expect(manifest.data.commands.map((command) => command.id)).toContain(
      'agent:list',
    );
    expect(seen.at(-1)).toMatchObject({ kind: 'user', userId: 'alice' });
    expect(seen.at(-1)?.keyScope).toBe(keyScope);
    // The command itself takes the key.
    expect(
      (await router.request('/api/agents/available', { headers: scoped }))
        .status,
    ).toBe(200);

    expect((await app.request('/api/cli/manifest')).status).toBe(200);
    expect(seen.at(-1)?.keyScope).toBeUndefined();
  });

  it('reach agents within their scope, and nothing a person does for themselves', async () => {
    expect(
      (await router.request('/api/agents', { headers: scoped })).status,
    ).toBe(200);
    expect(
      (await router.request('/api/agents/prices', { headers: scoped })).status,
    ).toBe(403);
    for (const path of ['/runs', '/runners', '/conversations', '/vocabulary']) {
      const response = await router.request(`/api/agents${path}`, {
        headers: scoped,
      });
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        error: { reason: 'SCOPED_KEY_FORBIDDEN', domain: 'authentication' },
      });
    }
    expect((await router.request('/api/agents/runs')).status).toBe(200);
  });
});

describe('the permission groups for scoped keys', () => {
  it('name only pages, settings actions and business actions the plugin declares', () => {
    for (const group of KEY_SCOPE_GROUPS)
      for (const refs of Object.values(group.levels))
        for (const ref of refs ?? [])
          if (ref.kind === 'page')
            expect(PAGES as readonly string[]).toContain(ref.id);
          else if (ref.kind === 'business')
            expect(BUSINESS_ACTIONS[ref.id] as readonly string[]).toContain(
              ref.action,
            );
          else
            expect(SETTINGS_ACTIONS[ref.id] as readonly string[]).toContain(
              ref.action,
            );
    expect(KEY_SCOPE_GROUPS.map((group) => group.id)).toEqual([
      'agents.agents',
      'agents.prices',
      'agents.runners',
      'agents.services',
    ]);
  });
});
