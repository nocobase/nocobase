// @vitest-environment jsdom
import {
  type AuthorizationCheck,
  authorizationClientToken as clientToken,
} from '@nocobase/app-plugin-authorization/client';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import {
  apiClientToken,
  ClientApplicationContext,
  realtimeClientToken,
  type ApiClient,
  type ClientApplication,
  type RealtimeClient,
} from '@nocobase/app-client';
import { renderHook } from '@testing-library/react';
import { createElement, type PropsWithChildren } from 'react';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import reactProviders from '../../client/react-providers.js';
import { AuthorizationServiceProvider } from '../../client/service-provider.js';
import routes from '../../client/routes.js';
import { firstActions } from '../../client/components/rule-utils.js';
import { AuthorizationClient } from '../../client/authorization-client.js';
import { permissionSetErrorMessage } from '../../client/components/permission-set-access.js';
import { useAuthorizationClient } from '../../client/use-authorization-client.js';

import {
  grantablePages,
  pageGroups,
} from '../../client/components/page-options.js';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { authorizationClientToken } from '../../client/tokens.js';
import en from '../../client/locales/en-US.js';
import { translate } from '../helpers/i18n.js';
import { subsection, withSubsections } from '../helpers/workspace-options.js';

describe('@nocobase/app-plugin-authorization client', () => {
  it('contributes its administration pages as one settings group, each at the URL it was published at', () => {
    expect(routes).toMatchObject({ parent: 'settings' });
    expect(reactProviders).toMatchObject([
      {
        name: 'authorization',
        after: ['@nocobase/app-plugin-authentication:authentication'],
        component: expect.any(Function),
      },
    ]);
    const resolved = resolveAppClientContributions([
      { packageName: '@nocobase/app-plugin-authorization', routes },
    ]);

    expect(resolved.settings.map((setting) => setting.path)).toEqual([
      '/settings/authorization/permission-sets',
      '/settings/authorization/permission-sets/new',
      '/settings/authorization/permission-sets/edit/:permissionSetKey',
      '/settings/authorization/permission-sets/edit/:permissionSetKey/assignments',
      '/settings/authorization/permission-sets/edit/:permissionSetKey/details',
      '/settings/authorization/inspector',
    ]);
    expect(
      resolved.settings.map((setting) =>
        typeof setting.authz !== 'object'
          ? undefined
          : `${setting.authz.resource.type}.${setting.authz.resource.id}`,
      ),
    ).toEqual([
      'settings.authorization.permission-sets',
      'settings.authorization.permission-sets',
      'settings.authorization.permission-sets',
      'settings.authorization.permission-sets',
      // The inspector has its own permission.
      'settings.authorization.permission-sets',
      'settings.authorization.inspector',
    ]);
  });

  it.each([
    [
      "CRUD order among a collection's actions",
      'database.collection',
      undefined,
      ['read'],
    ],
    [
      'the actions the selected resource declares',
      'settings',
      'audit-log',
      ['update'],
    ],
  ] as const)(
    'chooses the initial action by %s',
    (_name, type, resource, expected) => {
      expect(
        firstActions(
          {
            sections: withSubsections({
              administration: [
                subsection('administration.other', 'Other', [
                  {
                    type: 'database.collection',
                    value: 'orders',
                    label: 'Orders',
                    actions: [
                      { value: 'delete', label: 'Delete' },
                      { value: 'update', label: 'Update' },
                      { value: 'read', label: 'Read' },
                    ],
                  },
                  {
                    type: 'settings',
                    value: 'users',
                    label: 'Users',
                    actions: [
                      { value: 'create', label: 'Create' },
                      { value: 'read', label: 'Read' },
                    ],
                  },
                  {
                    type: 'settings',
                    value: 'audit-log',
                    label: 'Audit Log',
                    actions: [{ value: 'update', label: 'Update' }],
                  },
                ]),
              ],
            }),
            subjectTypes: [],
            collections: [],
            recordAccess: [],
          },
          type,
          resource,
        ),
      ).toEqual(expected);
    },
  );

  it('registers one injectable Authorization Client that preserves domain actions and resource ids without falling back to page grants', async () => {
    const container = new ServiceContainer();
    const request = vi.fn().mockResolvedValue({
      data: {
        permissions: [
          {
            resource: { type: 'hub.app', id: '*' },
            actions: ['upload-release'],
          },
          { resource: { type: 'report', id: 'one' }, actions: ['read'] },
          { resource: { type: 'page', id: 'hub' }, actions: ['access'] },
          { resource: { type: 'page', id: 'hub.app' }, actions: ['access'] },
          {
            resource: { type: 'settings', id: 'authorization.permission-sets' },
            actions: ['read'],
          },
        ],
      },
    });
    const realtime = {
      connected: false,
      subscribe: vi.fn(() => vi.fn()),
      onOpen: vi.fn(() => vi.fn()),
      onError: vi.fn(() => vi.fn()),
      reconnect: vi.fn(),
      close: vi.fn(),
    } satisfies RealtimeClient;
    container.instance(apiClientToken, { request } as unknown as ApiClient);
    container.instance(realtimeClientToken, realtime);
    const provider = new AuthorizationServiceProvider({
      container,
    } as never);

    provider.register();
    expect(
      container.resolveIfCreated(authorizationClientToken),
    ).toBeUndefined();
    await provider.boot();
    expect(container.resolve(authorizationClientToken)).toBeInstanceOf(
      AuthorizationClient,
    );
    expect(realtime.subscribe).toHaveBeenCalledTimes(2);
    expect(realtime.onOpen).toHaveBeenCalledOnce();

    const can = (check: AuthorizationCheck) =>
      container.resolve(clientToken).can(check);
    for (const [check, expected] of [
      [
        { resource: { type: 'hub.app', id: '*' }, action: 'upload-release' },
        true,
      ],
      [
        { resource: { type: 'hub.app', id: '*' }, action: 'manage-api-keys' },
        false,
      ],
      [{ resource: { type: 'report', id: 'one' }, action: 'read' }, true],
      [{ resource: { type: 'report', id: 'two' }, action: 'read' }, false],
      [{ resource: { type: 'report', id: '' }, action: 'read' }, false],
      [{ resource: { type: 'page', id: 'hub' }, action: 'access' }, true],
      [
        {
          resource: { type: 'settings', id: 'authorization.permission-sets' },
          action: 'read',
        },
        true,
      ],
    ] as const)
      expect(await can(check)).toBe(expected);
    await provider.shutdown();
  });

  it('resolves the client from the current application without module-level state', () => {
    const application = () => {
      const api = { request: vi.fn() };
      const authorization = new AuthorizationClient(api as never);
      const services = new ServiceContainer();
      services.instance(apiClientToken, api as never);
      services.instance(authorizationClientToken, authorization);
      return {
        app: { services } as unknown as ClientApplication,
        authorization,
      };
    };
    const first = application();
    const second = application();
    let app = first.app;
    const { result, rerender } = renderHook(() => useAuthorizationClient(), {
      wrapper: ({ children }: PropsWithChildren) =>
        createElement(
          ClientApplicationContext.Provider,
          { value: app },
          children,
        ),
    });
    expect(result.current).toBe(first.authorization);
    app = second.app;
    rerender();
    expect(result.current).toBe(second.authorization);
  });

  it('explains the refusal to remove the last assignment instead of showing its code', () => {
    const lastAssignment = Object.assign(
      new Error(
        'The last active assignment of the root Permission Set cannot be removed.',
      ),
      { code: 'LAST_ASSIGNMENT' },
    );

    const shown = permissionSetErrorMessage(translate, lastAssignment);
    expect(shown).not.toContain('LAST_ASSIGNMENT');
    expect(shown).toBe(en.errors.lastAssignment);
    expect(
      permissionSetErrorMessage(
        translate,
        Object.assign(new Error('forbidden'), {
          code: 'PROTECTED_PERMISSION_SET',
        }),
      ),
    ).toBe(en.errors.protectedSet);
    expect(
      permissionSetErrorMessage(translate, new Error('Network down')),
    ).toBe('Network down');
  });

  it('lists pages and groups in menu order', () => {
    const routes = [
      route({ name: 'late', navigation: { title: 'Late', order: 20 } }),
      route({
        name: 'group',
        componentLoader: undefined,
        navigation: { title: 'Group', order: 10 },
        children: [
          route({ name: 'second', navigation: { title: 'Second', order: 2 } }),
          route({ name: 'first', navigation: { title: 'First', order: 1 } }),
        ],
      }),
      route({ name: 'unordered', navigation: { title: 'Unordered' } }),
      route({ name: 'early', navigation: { title: 'Early', order: -1 } }),
    ];
    expect(grantablePages(routes).map((page) => page.name)).toEqual([
      'early',
      // No order counts as 0.
      'unordered',
      'first',
      'second',
      'late',
    ]);
    expect(pageGroups(routes, (title) => title)).toEqual([
      { value: 'group', label: 'Group' },
    ]);
  });

  it('offers only the routes a page grant can name', () => {
    const routes: readonly AppClientRegisteredRoute[] = [
      route({
        name: 'home',
        // Declared unconditional: signed in is enough, so there is nothing to grant or withhold.
        authz: 'skip',
      }),
      route({ name: 'orders', navigation: { title: 'navigation.orders' } }),
      route({
        name: 'orders-alias',
        authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
      }),
      route({
        name: 'orders-detail',
        authz: {
          resource: { type: 'page', id: 'orders-detail' },
          action: 'access',
        },
      }),
      route({
        name: 'hub',
        // Authorized as something other than a page.
        authz: { resource: { type: 'hub.app', id: '*' }, action: 'read' },
      }),
      route({ name: 'login', auth: 'guest', authz: 'skip' }),
      route({
        name: 'root-only',
        // Unrestricted identities only: nothing grants it, so it is no page option.
        authz: 'unrestricted',
        navigation: { title: 'Root only' },
      }),
      route({ name: 'group', componentLoader: undefined }),
      route({
        name: 'reports',
        children: [
          // Nested under a page, so the parent's check is the only one.
          route({ name: 'report-detail', authz: 'skip' }),
        ],
      }),
      route({
        name: 'section',
        componentLoader: undefined,
        // A group is not a page, so its children are still authorized on their own.
        children: [route({ name: 'inside-group' })],
      }),
    ];

    expect(grantablePages(routes)).toEqual([
      { name: 'orders', packageName: 'app', title: 'navigation.orders' },
      { name: 'orders-detail', packageName: 'app' },
      { name: 'reports', packageName: 'app' },
      { name: 'inside-group', packageName: 'app' },
    ]);
  });
});

function route(
  overrides: Partial<AppClientRegisteredRoute> & { name: string },
): AppClientRegisteredRoute {
  return {
    id: overrides.name,
    path: `/${overrides.name}`,
    auth: 'required',
    authz: { resource: { type: 'page', id: overrides.name }, action: 'access' },
    packageName: 'app',
    source: 'application',
    componentLoader: async () => ({ default: () => null }),
    ...overrides,
  };
}

describe('permission snapshot lifecycle', () => {
  const resource = { type: 'page', id: 'users' };
  const granted = {
    data: { permissions: [{ resource, actions: ['access'] }] },
  };
  const denied = { data: { permissions: [] } };

  it('passes an unrestricted requirement only for an unrestricted snapshot', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(granted)
      .mockResolvedValueOnce({ data: { unrestricted: true, permissions: [] } });
    const client = new AuthorizationClient({ request } as never);
    expect(await client.can('unrestricted')).toBe(false);
    client.invalidate();
    expect(await client.can('unrestricted')).toBe(true);
  });

  it('refetches permissions across admin, operator, and admin sessions and notifies subscribers of each invalidation', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(granted)
      .mockResolvedValueOnce(denied)
      .mockResolvedValueOnce(granted);
    const client = new AuthorizationClient({ request } as never);
    const listener = vi.fn();
    const unsubscribe = client.onInvalidated(listener);
    expect(await client.can({ resource, action: 'access' })).toBe(true);
    expect(await client.can({ resource, action: 'access' })).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
    client.invalidate();
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    expect(await client.can({ resource, action: 'access' })).toBe(false);
    client.invalidate();
    expect(await client.can({ resource, action: 'access' })).toBe(true);
    expect(request).toHaveBeenCalledTimes(3);
    expect(client.revision()).toBe(2);
  });

  it.each(['resolve', 'reject'] as const)(
    'ignores an obsolete request that finishes with %s',
    async (outcome) => {
      const old = Promise.withResolvers<typeof granted>();
      const request = vi
        .fn()
        .mockReturnValueOnce(old.promise)
        .mockResolvedValueOnce(denied);
      const client = new AuthorizationClient({ request } as never);
      const oldCheck = client.can({ resource, action: 'access' });
      client.invalidate();
      expect(await client.can({ resource, action: 'access' })).toBe(false);
      if (outcome === 'resolve') old.resolve(granted);
      else old.reject(new Error('Previous session expired'));
      expect(await oldCheck).toBe(false);
      expect(await client.can({ resource, action: 'access' })).toBe(false);
      expect(request).toHaveBeenCalledTimes(2);
    },
  );

  it('allows retry after the current request fails', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(granted);
    const client = new AuthorizationClient({ request } as never);
    await expect(client.can({ resource, action: 'access' })).rejects.toThrow(
      'Offline',
    );
    expect(await client.can({ resource, action: 'access' })).toBe(true);
  });
});
