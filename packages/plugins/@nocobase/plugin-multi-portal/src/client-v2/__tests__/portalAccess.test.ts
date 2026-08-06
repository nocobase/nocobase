/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { MultiPortalRuntimeRecord } from '../layoutRegistration';
import { PortalAccessController } from '../portalAccess';

const customerPortal: MultiPortalRuntimeRecord = {
  uid: 'customer-portal',
  title: 'Customer portal',
  portalType: 'no-code',
  portalName: 'customer',
  routePath: '/customer',
  authCheck: true,
  enabled: true,
  uiLayoutUid: 'admin-layout-model',
};

function createHarness(initialPathname = '/v/customer') {
  let pathname = initialPathname;
  let role: string | null = 'admin';
  const api = axios.create();
  const apiClient = {
    axios: api,
    auth: {
      get role() {
        return role;
      },
      setRole(nextRole: string | null) {
        role = nextRole;
      },
    },
    request: api.request.bind(api),
    resource: vi.fn(),
  };
  const controller = new PortalAccessController({
    apiClient,
    getBasename: () => '/v',
    getCurrentPathname: () => pathname,
  });
  const mock = new MockAdapter(api);

  return {
    api,
    apiClient,
    controller,
    mock,
    setPathname(nextPathname: string) {
      pathname = nextPathname;
    },
  };
}

describe('PortalAccessController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds the bare portalName to every Portal-scoped request and clears a stale header outside Portals', async () => {
    const harness = createHarness('/v/customer/orders');
    harness.controller.setRecords([customerPortal]);
    harness.controller.install();
    harness.mock.onAny().reply(200, { data: [] });

    await harness.api.get('orders:list', { headers: { 'X-Portal': '/x/old-portal' } });
    expect(harness.mock.history.get[0].headers?.['X-Portal']).toBe('customer');

    harness.setPathname('/v/admin/settings');
    await harness.api.get('systemSettings:get', { headers: { 'X-Portal': 'customer' } });
    expect(harness.mock.history.get[1].headers?.['X-Portal']).toBeUndefined();

    harness.setPathname('/v/customer/orders');
    await harness.api.get('https://oss.example.com/signed-file', { headers: { 'X-Portal': 'customer' } });
    expect(harness.mock.history.get[2].headers?.['X-Portal']).toBeUndefined();

    harness.controller.dispose();
  });

  it('removes the full sub-application basename before resolving the Portal', async () => {
    let pathname = '/v/apps/sales/customer/orders';
    const api = axios.create();
    const mock = new MockAdapter(api);
    const controller = new PortalAccessController({
      apiClient: {
        axios: api,
        auth: { role: 'admin', setRole: vi.fn() },
        request: api.request.bind(api),
        resource: vi.fn(),
      },
      getBasename: () => '/v/apps/sales',
      getCurrentPathname: () => pathname,
    });
    controller.setRecords([customerPortal]);
    controller.install();
    mock.onAny().reply(200, { data: [] });

    await api.get('orders:list');
    expect(mock.history.get[0].headers?.['X-Portal']).toBe('customer');

    pathname = '/v/apps/sales/settings';
    await api.get('systemSettings:get');
    expect(mock.history.get[1].headers?.['X-Portal']).toBeUndefined();

    controller.dispose();
  });

  it('derives a direct Portal signin request before listEnabled has returned without tagging global auth routes', async () => {
    const harness = createHarness('/v/customer/signin');
    harness.controller.install();
    harness.mock.onAny().reply(200, { data: [] });

    await harness.api.get('multiPortals:listEnabled');
    expect(harness.mock.history.get[0].headers?.['X-Portal']).toBe('customer');

    harness.setPathname('/v/signin');
    await harness.api.post('auth:signIn');
    expect(harness.mock.history.post[0].headers?.['X-Portal']).toBeUndefined();

    harness.controller.dispose();
  });

  it('marks a successful roles:check as allowed for the server-selected role', async () => {
    const harness = createHarness();
    harness.apiClient.auth.setRole(null);
    harness.controller.setRecords([customerPortal]);
    harness.controller.install();
    harness.mock.onGet('roles:check').reply(200, {
      data: {
        role: 'member',
        snippets: [],
      },
    });

    await harness.api.get('roles:check');

    expect(harness.controller.getAccessState('customer', 'member')).toMatchObject({
      portalName: 'customer',
      role: 'member',
      status: 'allowed',
    });

    harness.controller.dispose();
  });

  it('recognizes only the structured roles:check Portal denial and retains the minimal role context', async () => {
    const harness = createHarness();
    harness.controller.setRecords([customerPortal]);
    harness.controller.install();
    harness.mock.onGet('roles:check').reply(403, {
      errors: [{ code: 'PORTAL_ACCESS_DENIED', message: 'You do not have access to this Portal' }],
      data: {
        portalName: 'customer',
        role: 'admin',
        roles: ['admin'],
        roleMode: 'allow-use-union',
        allowAnonymous: false,
      },
    });

    await expect(harness.api.get('roles:check')).rejects.toMatchObject({ response: { status: 403 } });

    expect(harness.controller.getAccessState('customer', 'admin')).toMatchObject({
      status: 'denied',
      denied: {
        portalName: 'customer',
        role: 'admin',
        roles: ['admin'],
        roleMode: 'allow-use-union',
        allowAnonymous: false,
      },
    });

    harness.controller.dispose();
  });

  it.each([
    [403, 'OTHER_FORBIDDEN'],
    [500, 'PORTAL_ACCESS_DENIED'],
  ])('keeps an ordinary %s roles:check failure out of the denied state', async (status, code) => {
    const harness = createHarness();
    harness.controller.setRecords([customerPortal]);
    harness.controller.install();
    harness.mock.onGet('roles:check').reply(status, {
      errors: [{ code, message: 'Temporary failure' }],
      data: { portalName: 'customer', role: 'admin' },
    });

    await expect(harness.api.get('roles:check')).rejects.toBeTruthy();

    expect(harness.controller.getAccessState('customer', 'admin')).toMatchObject({
      status: 'error',
    });

    harness.controller.dispose();
  });

  it('moves a network failure into the retryable error state', async () => {
    const harness = createHarness();
    harness.controller.setRecords([customerPortal]);
    harness.controller.install();
    harness.mock.onGet('roles:check').networkError();

    await expect(harness.api.get('roles:check')).rejects.toBeTruthy();

    expect(harness.controller.getAccessState('customer', 'admin')).toMatchObject({
      status: 'error',
    });

    harness.controller.dispose();
  });

  it('ignores an older response for the same Portal and role generation', async () => {
    let resolveOlder: (value: [number, Record<string, unknown>]) => void = () => {
      throw new Error('Older request resolver was not initialized');
    };
    let resolveLatest: (value: [number, Record<string, unknown>]) => void = () => {
      throw new Error('Latest request resolver was not initialized');
    };
    const olderResponse = new Promise<[number, Record<string, unknown>]>((resolve) => {
      resolveOlder = resolve;
    });
    const latestResponse = new Promise<[number, Record<string, unknown>]>((resolve) => {
      resolveLatest = resolve;
    });
    const harness = createHarness();
    harness.controller.setRecords([customerPortal]);
    harness.controller.install();
    harness.mock.onGet('roles:check').replyOnce(() => olderResponse);
    harness.mock.onGet('roles:check').replyOnce(() => latestResponse);

    const olderRequest = harness.api.get('roles:check').catch(() => undefined);
    const latestRequest = harness.api.get('roles:check');
    resolveLatest([200, { data: { role: 'admin', snippets: [] } }]);
    await latestRequest;
    resolveOlder([
      403,
      {
        errors: [{ code: 'PORTAL_ACCESS_DENIED', message: 'Denied' }],
        data: { portalName: 'customer', role: 'admin', roles: ['admin'], roleMode: 'default' },
      },
    ]);
    await olderRequest;

    expect(harness.controller.getAccessState('customer', 'admin')).toMatchObject({
      status: 'allowed',
    });

    harness.controller.dispose();
  });

  it('invalidates an in-flight generation before a retry request has started', async () => {
    let resolveOlder: (value: [number, Record<string, unknown>]) => void = () => {
      throw new Error('Older request resolver was not initialized');
    };
    const olderResponse = new Promise<[number, Record<string, unknown>]>((resolve) => {
      resolveOlder = resolve;
    });
    const harness = createHarness();
    harness.controller.setRecords([customerPortal]);
    harness.controller.install();
    harness.mock.onGet('roles:check').replyOnce(() => olderResponse);

    const olderRequest = harness.api.get('roles:check').catch(() => undefined);
    await vi.waitFor(() => {
      expect(harness.mock.history.get).toHaveLength(1);
    });
    harness.controller.invalidate('customer', 'admin');
    resolveOlder([
      403,
      {
        errors: [{ code: 'PORTAL_ACCESS_DENIED', message: 'Denied' }],
        data: { portalName: 'customer', role: 'admin', roles: ['admin'], roleMode: 'default' },
      },
    ]);
    await olderRequest;

    expect(harness.controller.getAccessState('customer', 'admin')).toMatchObject({
      status: 'checking',
    });

    harness.controller.dispose();
  });

  it('isolates delayed Portal A responses from the active Portal B state', async () => {
    const portalB = { ...customerPortal, uid: 'vendor-portal', portalName: 'vendor', routePath: '/vendor' };
    const harness = createHarness('/v/customer');
    harness.controller.setRecords([customerPortal, portalB]);
    harness.controller.install();
    let resolvePortalA: (value: [number, Record<string, unknown>]) => void = () => {
      throw new Error('Portal A request resolver was not initialized');
    };
    const portalAResponse = new Promise<[number, Record<string, unknown>]>((resolve) => {
      resolvePortalA = resolve;
    });
    harness.mock.onGet('roles:check').replyOnce(() => portalAResponse);
    harness.mock.onGet('roles:check').replyOnce(200, { data: { role: 'admin', snippets: [] } });

    const portalARequest = harness.api.get('roles:check');
    harness.setPathname('/v/vendor');
    await harness.api.get('roles:check');
    resolvePortalA([200, { data: { role: 'admin', snippets: [] } }]);
    await portalARequest;

    expect(harness.controller.getAccessState('vendor', 'admin')).toMatchObject({
      portalName: 'vendor',
      status: 'allowed',
    });

    harness.controller.dispose();
  });
});
