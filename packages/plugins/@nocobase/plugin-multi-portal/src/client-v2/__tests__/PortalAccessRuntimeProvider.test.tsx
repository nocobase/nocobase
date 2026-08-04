/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, render, waitFor } from '@testing-library/react';
import axios from 'axios';
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
  refresh: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    useACLContext: () => ({ refresh: runtimeMocks.refresh }),
    useApp: () => runtimeMocks.app,
  };
});

import { PortalAccessRuntimeProvider } from '../PortalAccessBoundary';
import { PortalAccessController } from '../portalAccess';

function DefaultPortalRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/customer', { replace: true });
  }, [navigate]);
  return null;
}

describe('PortalAccessRuntimeProvider', () => {
  afterEach(() => {
    cleanup();
    runtimeMocks.refresh.mockClear();
  });

  it('actively refreshes roles:check after the root landing redirects to the default Portal', async () => {
    const api = axios.create();
    const controller = new PortalAccessController({
      apiClient: {
        axios: api,
        auth: runtimeMocks.app.apiClient.auth,
        request: api.request.bind(api),
        resource: vi.fn(),
      },
      getBasename: () => '/',
      getCurrentPathname: () => '/',
    });
    controller.setRecords([
      {
        uid: 'customer-portal',
        portalName: 'customer',
        portalType: 'no-code',
        routePath: '/customer',
        authCheck: true,
        enabled: true,
        uiLayoutUid: 'admin-layout-model',
      },
    ]);

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
