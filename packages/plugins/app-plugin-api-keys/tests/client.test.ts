import {
  applyClientRouteComponentOverrides,
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import apiKeys from '../client/plugin.js';
import {
  API_KEY_EXPIRY_CHOICES,
  expiryChoiceToSeconds,
  formatKeyHint,
  isExpired,
} from '../client/expiry.js';
import { daysLeft, idleDays, permissionCounts } from '../client/lib/format.js';
import { API_KEY_ROUTES } from '../client/routes.js';
import { ApiKeysServiceProvider } from '../client/service-provider.js';

describe('@nocobase/app-plugin-api-keys Client', () => {
  it('registers the personal API keys pages, which an application may leave out', () => {
    const registration = apiKeys();
    expect(registration.serviceProviders).toEqual([ApiKeysServiceProvider]);
    const [contribution] = registration.routes as readonly {
      parent: string;
      routes: readonly {
        name: string;
        path: string;
        children?: readonly {
          name: string;
          path: string;
          authz?: unknown;
        }[];
      }[];
    }[];
    expect(contribution?.parent).toBe('personalSettings');
    const [list] = contribution?.routes ?? [];
    expect(list).toMatchObject({ name: 'apiKeysPersonal', path: '/api-keys' });
    expect(list?.children).toEqual([
      expect.objectContaining({
        name: 'apiKeysPersonalCreate',
        path: 'create',
      }),
      expect.objectContaining({
        name: 'apiKeysPersonalDetail',
        path: ':keyId',
      }),
    ]);
    expect(API_KEY_ROUTES.personalCreate).toBe(
      '@nocobase/app-plugin-api-keys:apiKeysPersonalCreate',
    );
    expect(apiKeys({ routes: false }).routes).toEqual([]);
  });

  it('registers System settings › API keys: system keys, managed keys, members’ keys and rules', () => {
    const registration = apiKeys();
    const { routes } = resolveAppClientContributions([
      { packageName: registration.packageName, routes: registration.routes },
    ]);
    const paths = new Map<string, { path?: string; authz?: unknown }>();
    const walk = (nodes: readonly AppClientRegisteredRoute[]) => {
      for (const node of nodes) {
        paths.set(node.id, node as { path?: string; authz?: unknown });
        walk(node.children ?? []);
      }
    };
    walk(routes);
    const read = {
      resource: { type: 'settings', id: 'apiKeys' },
      action: 'read',
    };
    expect(paths.get(API_KEY_ROUTES.system)).toMatchObject({
      path: '/settings/api-keys',
      authz: read,
    });
    expect(paths.get(API_KEY_ROUTES.systemCreate)).toMatchObject({
      path: '/settings/api-keys/create',
      authz: { ...read, action: 'manage' },
    });
    for (const [id, path] of [
      [API_KEY_ROUTES.systemDetail, '/settings/api-keys/:identityId'],
      [API_KEY_ROUTES.managed, '/settings/api-keys/managed'],
      [API_KEY_ROUTES.managedDetail, '/settings/api-keys/managed/:identityId'],
      [API_KEY_ROUTES.members, '/settings/api-keys/members'],
      [API_KEY_ROUTES.rules, '/settings/api-keys/rules'],
    ] as const)
      expect(paths.get(id)).toMatchObject({ path });
    // Every page has a loader. Loading them all here would import every page's whole UI cold, which took longer than a
    // test's 5 seconds on a busy CI machine; each loader is a literal `import()` of its page, which typecheck and build
    // already resolve.
    for (const id of Object.values(API_KEY_ROUTES))
      expect({
        id,
        loader: typeof (paths.get(id) as { componentLoader?: unknown })
          ?.componentLoader,
      }).toEqual({ id, loader: 'function' });
  });

  it('lets an application replace a page with its own through routeComponentOverrides', async () => {
    const registration = apiKeys();
    const { routes } = resolveAppClientContributions([
      {
        packageName: registration.packageName,
        routes: registration.routes,
      },
    ]);
    const OwnPage = () => null;
    const own = () => Promise.resolve({ default: OwnPage });
    const replaced = applyClientRouteComponentOverrides(routes, [
      { routeId: API_KEY_ROUTES.personal, componentLoader: own },
    ]);
    const find = (
      nodes: readonly AppClientRegisteredRoute[],
      id: string,
    ): AppClientRegisteredRoute | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = find(node.children ?? [], id);
        if (found) return found;
      }
      return undefined;
    };
    const loaded = await find(
      replaced,
      API_KEY_ROUTES.personal,
    )?.componentLoader?.();
    expect(loaded?.default).toBe(OwnPage);
    expect(find(replaced, API_KEY_ROUTES.personalDetail)).toMatchObject({
      path: '/me/api-keys/:keyId',
    });
  });

  it('counts days left, idle days and permissions for the list', () => {
    const now = new Date('2026-11-21T00:00:00Z');
    expect(daysLeft(null, now)).toBeNull();
    expect(daysLeft('2026-11-22T12:00:00Z', now)).toBe(2);
    expect(daysLeft('2026-11-20T00:00:00Z', now)).toBeLessThanOrEqual(0);
    expect(
      idleDays(
        {
          createdAt: '2026-05-01T00:00:00Z',
          lastUsedAt: null,
        } as Parameters<typeof idleDays>[0],
        now,
      ),
    ).toBe(204);
    expect(
      permissionCounts({
        grants: [
          {
            resource: { type: 'rel', id: 'rel.apps' },
            actions: [{ action: 'view' }, { action: 'deploy' }],
          },
        ],
        objects: { 'rel.apps': ['a', 'b'] },
      }),
    ).toEqual({ actions: 2, resources: 1, records: 2 });
  });

  it('offers only lifetimes Better Auth accepts', () => {
    // Better Auth validates expiresIn in whole days against a 1..365 window.
    for (const choice of API_KEY_EXPIRY_CHOICES) {
      const seconds = expiryChoiceToSeconds(choice);
      if (seconds === undefined) continue;
      const days = seconds / 86_400;
      expect(days).toBeGreaterThanOrEqual(1);
      expect(days).toBeLessThanOrEqual(365);
      expect(Number.isInteger(days)).toBe(true);
    }
    expect(expiryChoiceToSeconds('never')).toBeUndefined();
    expect(expiryChoiceToSeconds('30')).toBe(2_592_000);
  });

  it('shows only the part of a key that was stored in the clear', () => {
    expect(formatKeyHint({ start: 'nb_abc', prefix: 'nb_' })).toBe('nb_abc…');
    expect(formatKeyHint({ start: null, prefix: 'nb_' })).toBe('nb_…');
    expect(formatKeyHint({ start: null, prefix: null })).toBe('—');
  });

  it('treats a key with no expiry as current', () => {
    const now = new Date('2026-09-15T00:00:00.000Z');

    expect(isExpired(null, now)).toBe(false);
    expect(isExpired('2026-09-14T23:59:59.000Z', now)).toBe(true);
    expect(isExpired('2026-09-15T00:00:01.000Z', now)).toBe(false);
  });
});
