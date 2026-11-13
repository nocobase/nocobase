import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import foundation from '../../client/plugin.js';
import { defineClientPlugins } from '@nocobase/app-client/plugins';
import { createAppClientConfig, type ApiClient } from '@nocobase/app-client';
import {
  AuthorizationClient,
  type AuthorizationSnapshot,
} from '@nocobase/app-plugin-authorization/client';
import { describe, expect, it, vi } from 'vitest';
import { CAPABILITY_GUIDE_ACCESS } from '../../client/access.js';
import {
  capabilityGuideDefinitions,
  foundationDefinition,
} from '../../client/routes.js';
import { createCapabilityCatalog } from '../../shared/capability-guide/index.js';
import { SAMPLE_MANIFEST } from '../fixtures/capability-manifest.js';

const routes = capabilityGuideDefinitions(
  createCapabilityCatalog(SAMPLE_MANIFEST),
);
const permission = (id: string, action = 'access') => ({
  resource: { type: 'page', id },
  actions: [action],
});

describe('Features and extensions access', () => {
  it.each([
    { name: 'ordinary member', permissions: [], allowed: false },
    {
      name: 'unrelated page grant',
      permissions: [permission('database-explorer')],
      allowed: false,
    },
    {
      name: 'wrong action',
      permissions: [permission('capability-guide', 'read')],
      allowed: false,
    },
    {
      name: 'explicit catalog grant',
      permissions: [permission('capability-guide')],
      allowed: true,
    },
    {
      name: 'system administrator page wildcard',
      permissions: [permission('*')],
      allowed: true,
    },
    { name: 'root', permissions: [], unrestricted: true, allowed: true },
  ])(
    'checks both catalog and direct details for $name',
    async ({ permissions, unrestricted = false, allowed }) => {
      const snapshot: AuthorizationSnapshot = { permissions, unrestricted };
      const request = vi.fn().mockResolvedValue({ data: snapshot });
      const client = new AuthorizationClient({
        request,
      } as unknown as ApiClient);
      expect(routes.map(({ path }) => path)).toEqual([
        '/settings/capabilities',
        '/settings/capabilities/:entryId',
      ]);
      for (const route of routes) {
        expect(route.auth).toBe('required');
        expect(route.authz).toEqual(CAPABILITY_GUIDE_ACCESS);
        if (typeof route.authz !== 'object')
          throw new Error('Missing page permission');
        expect(await client.can(route.authz)).toBe(allowed);
      }
      // Catalog access never authorizes runtime configuration or scan operations.
      expect(foundationDefinition().authz).toBe('unrestricted');
      expect(await client.can('unrestricted')).toBe(unrestricted);
    },
  );

  it('revokes catalog and detail access when the permission snapshot changes', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          unrestricted: false,
          permissions: [permission('capability-guide')],
        },
      })
      .mockResolvedValueOnce({
        data: { unrestricted: false, permissions: [] },
      });
    const client = new AuthorizationClient({ request } as unknown as ApiClient);
    expect(await client.can(CAPABILITY_GUIDE_ACCESS)).toBe(true);
    client.invalidate();
    for (const route of routes) {
      if (typeof route.authz !== 'object')
        throw new Error('Missing page permission');
      expect(await client.can(route.authz)).toBe(false);
    }
  });
});

describe('optional application usage page', () => {
  it.each([false, true])(
    'keeps the guide when usage is disabled with settingsGroup: %s',
    async (settingsGroup) => {
      const runtime = await resolveAppRuntime(
        defineAppRuntime({
          packageName: 'test-app',
          createAppConfig: createAppClientConfig,
          plugins: defineClientPlugins([
            foundation({
              usagePage: false,
              settingsGroup,
              manifest: SAMPLE_MANIFEST,
            }),
          ]),
        }),
      );
      expect(runtime.routes.map(({ name }) => name).sort()).toEqual([
        'capabilityGuide',
        'capabilityGuideEntry',
      ]);
      for (const route of runtime.routes) {
        expect(route.auth).toBe('required');
        expect(route.authz).toEqual(CAPABILITY_GUIDE_ACCESS);
      }
    },
  );

  it('registers no routes when usage is disabled without a guide manifest', async () => {
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: 'test-app',
        createAppConfig: createAppClientConfig,
        plugins: defineClientPlugins([
          foundation({ usagePage: false, settingsGroup: true }),
        ]),
      }),
    );
    expect(runtime.routes).toEqual([]);
  });

  it('retains the usage page by default', async () => {
    const runtime = await resolveAppRuntime(
      defineAppRuntime({
        packageName: 'test-app',
        createAppConfig: createAppClientConfig,
        plugins: defineClientPlugins([foundation()]),
      }),
    );
    expect(runtime.routes).toHaveLength(1);
    expect(runtime.routes[0]).toMatchObject({
      name: 'foundation',
      path: '/foundation',
      authz: 'unrestricted',
    });
  });
});
