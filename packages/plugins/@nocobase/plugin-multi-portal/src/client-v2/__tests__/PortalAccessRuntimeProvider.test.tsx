/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import axios, { type AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import React, { useEffect } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';

const runtimeMocks = vi.hoisted(() => ({
  app: {
    apiClient: {
      auth: { role: 'admin', setRole: vi.fn() },
    },
    router: {
      isSkippedAuthCheckRoute: vi.fn((pathname: string) => pathname === '/'),
    },
  },
  hasACLProvider: true,
  refresh: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    useACLContext: () => (runtimeMocks.hasACLProvider ? { refresh: runtimeMocks.refresh } : null),
    useApp: () => runtimeMocks.app,
  };
});

import { PortalAccessRuntimeProvider } from '../PortalAccessBoundary';
import type { MultiPortalRuntimeRecord } from '../layoutRegistration';
import { PortalAccessController, type PortalAccessApiClient } from '../portalAccess';

function DefaultPortalRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/customer', { replace: true });
  }, [navigate]);
  return null;
}

function PortalSwitch() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/partner')}>Switch Portal</button>;
}

function InnerACLCheck({ controller }: { controller: PortalAccessController }) {
  useEffect(() => {
    controller.checkAccess().catch(() => undefined);
  }, [controller]);
  return null;
}

const customerPortal: MultiPortalRuntimeRecord = {
  uid: 'customer-portal',
  portalName: 'customer',
  portalType: 'no-code',
  routePath: '/customer',
  authCheck: true,
  enabled: true,
  uiLayoutUid: 'customer-layout-model',
};

const partnerPortal: MultiPortalRuntimeRecord = {
  uid: 'partner-portal',
  portalName: 'partner',
  portalType: 'no-code',
  routePath: '/partner',
  authCheck: true,
  enabled: true,
  uiLayoutUid: 'partner-layout-model',
};

function createController(options: {
  pathname: string;
  records?: MultiPortalRuntimeRecord[];
  request?: PortalAccessApiClient['request'];
}) {
  const api = axios.create();
  const controller = new PortalAccessController({
    apiClient: {
      axios: api,
      auth: runtimeMocks.app.apiClient.auth,
      request: options.request || api.request.bind(api),
      resource: vi.fn(),
    },
    getBasename: () => '/',
    getCurrentPathname: () => options.pathname,
  });
  controller.setRecords(options.records || [customerPortal]);
  return controller;
}

describe('PortalAccessRuntimeProvider', () => {
  afterEach(() => {
    cleanup();
    runtimeMocks.app.apiClient.auth.role = 'admin';
    runtimeMocks.hasACLProvider = true;
    runtimeMocks.refresh.mockClear();
  });

  it('reuses the ACL provider initial check when directly entering a Portal', async () => {
    const controller = createController({ pathname: '/customer' });

    render(
      <MemoryRouter initialEntries={['/customer']}>
        <PortalAccessRuntimeProvider controller={controller}>
          <div>Portal</div>
        </PortalAccessRuntimeProvider>
      </MemoryRouter>,
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(runtimeMocks.refresh).not.toHaveBeenCalled();
  });

  it('actively refreshes after switching to another Portal', async () => {
    const controller = createController({ pathname: '/customer', records: [customerPortal, partnerPortal] });

    const view = render(
      <MemoryRouter initialEntries={['/customer']}>
        <PortalAccessRuntimeProvider controller={controller}>
          <PortalSwitch />
        </PortalAccessRuntimeProvider>
      </MemoryRouter>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(runtimeMocks.refresh).not.toHaveBeenCalled();

    fireEvent.click(view.getByRole('button', { name: 'Switch Portal' }));

    await waitFor(() => {
      expect(runtimeMocks.refresh).toHaveBeenCalledTimes(1);
    });
  });

  it('actively refreshes after the role changes within the current Portal', async () => {
    const controller = createController({ pathname: '/customer' });
    const renderProvider = () => (
      <MemoryRouter initialEntries={['/customer']}>
        <PortalAccessRuntimeProvider controller={controller}>
          <div>Portal</div>
        </PortalAccessRuntimeProvider>
      </MemoryRouter>
    );

    const view = render(renderProvider());
    await act(async () => {
      await Promise.resolve();
    });
    expect(runtimeMocks.refresh).not.toHaveBeenCalled();

    runtimeMocks.app.apiClient.auth.role = 'member';
    view.rerender(renderProvider());

    await waitFor(() => {
      expect(runtimeMocks.refresh).toHaveBeenCalledTimes(1);
    });
  });

  it('falls back to the controller check without an ACL provider', async () => {
    runtimeMocks.hasACLProvider = false;
    const request = vi
      .fn<PortalAccessApiClient['request']>()
      .mockResolvedValue({ data: { data: { role: 'admin' } } } as AxiosResponse);
    const controller = createController({ pathname: '/customer', request });

    render(
      <MemoryRouter initialEntries={['/customer']}>
        <PortalAccessRuntimeProvider controller={controller}>
          <div>Portal</div>
        </PortalAccessRuntimeProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(1);
    });
    expect(request).toHaveBeenCalledWith({
      skipAuth: true,
      skipNotify: true,
      url: 'roles:check',
    });
  });

  it('does not duplicate an inner ACL provider initial check when provider order is reversed', async () => {
    runtimeMocks.hasACLProvider = false;
    const api = axios.create();
    const mock = new MockAdapter(api);
    const controller = new PortalAccessController({
      apiClient: {
        axios: api,
        auth: runtimeMocks.app.apiClient.auth,
        request: api.request.bind(api),
        resource: vi.fn(),
      },
      getBasename: () => '/',
      getCurrentPathname: () => '/customer',
    });
    controller.setRecords([customerPortal]);
    controller.install();
    mock.onGet('roles:check').reply(200, { data: { role: 'admin' } });

    render(
      <MemoryRouter initialEntries={['/customer']}>
        <PortalAccessRuntimeProvider controller={controller}>
          <InnerACLCheck controller={controller} />
        </PortalAccessRuntimeProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(controller.getAccessState('customer', 'admin').status).toBe('allowed');
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(mock.history.get.filter((request) => request.url === 'roles:check')).toHaveLength(1);
    controller.dispose();
    mock.restore();
  });

  it('actively refreshes roles:check after the root landing redirects to the default Portal', async () => {
    const controller = createController({ pathname: '/' });

    render(
      <MemoryRouter initialEntries={['/']}>
        <PortalAccessRuntimeProvider controller={controller}>
          <DefaultPortalRedirect />
        </PortalAccessRuntimeProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(runtimeMocks.refresh).toHaveBeenCalledTimes(1);
    });
  });
});
