// @vitest-environment jsdom
import {
  type AuthorizationCheck,
  authorizationClientToken as clientToken,
} from '@nocobase/app-plugin-authorization/client';
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

import plugin from '../../client/plugin.js';
import reactProviders from '../../client/react-providers.js';
import { AuthorizationServiceProvider } from '../../client/service-provider.js';
import { AuthorizationClient } from '../../client/authorization-client.js';
import { useAuthorizationClient } from '../../client/use-authorization-client.js';
import { authorizationClientToken } from '../../client/tokens.js';

describe('@nocobase/app-plugin-authorization client', () => {
  it('contributes its provider and no pages', () => {
    expect(plugin().routes).toEqual([]);
    expect(reactProviders).toMatchObject([
      {
        name: 'authorization',
        after: ['@nocobase/app-plugin-authentication:authentication'],
        component: expect.any(Function),
      },
    ]);
  });

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
});

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

  it('calls the /api/authorization endpoints and unwraps lists', async () => {
    const request = vi.fn().mockResolvedValue({
      data: [{ id: 'sales', title: 'Sales' }],
      meta: { page: 2, pageSize: 20, total: 21 },
    });
    const client = new AuthorizationClient({ request } as never);

    await expect(
      client.listSubjects('sharingRules', 'department', {
        search: 'sa',
        page: 2,
        pageSize: 20,
      }),
    ).resolves.toEqual({ items: [{ id: 'sales', title: 'Sales' }], total: 21 });
    await client.getEffective({ type: 'user', id: 'alice' });
    await client.updatePermissionSet('a/b', { key: 'a/b', grants: [] });
    await client.inspect({
      subject: { type: 'user', id: 'alice' },
      resource: { type: 'page', id: 'orders' },
      action: 'access',
    });
    await client.inspectBatch({ type: 'user', id: 'alice' }, []);
    await client.inspectConfigured({ type: 'user', id: 'alice' });

    expect(request.mock.calls.map(([options]: [unknown]) => options)).toEqual([
      {
        path: 'authorization/sharingRules/subjects/department',
        query: { page: 2, pageSize: 20, q: 'sa' },
      },
      {
        path: 'authorization/permissionSets',
        query: { subjectType: 'user', subjectId: 'alice' },
      },
      {
        path: 'authorization/permissionSets/a%2Fb',
        method: 'PATCH',
        json: { key: 'a/b', grants: [] },
      },
      expect.objectContaining({
        path: 'authorization/inspector/decide',
        method: 'POST',
      }),
      expect.objectContaining({
        path: 'authorization/inspector/batchDecide',
        method: 'POST',
      }),
      {
        path: 'authorization/inspector/configuredAccess',
        query: { subjectType: 'user', subjectId: 'alice' },
      },
    ]);
  });

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
