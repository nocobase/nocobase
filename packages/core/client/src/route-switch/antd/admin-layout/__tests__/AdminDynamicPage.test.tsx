/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { render, screen, waitFor } from '@nocobase/test/client';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ADMIN_LAYOUT_MODEL_UID } from '@nocobase/client-v2';
import { CurrentPageUidProvider } from '../../../../application/CustomRouterContextProvider';
import { AdminDynamicPage } from '../AdminDynamicPage';
import { AdminLayoutModelV1 } from '../AdminLayoutModel';
import { NocoBaseDesktopRouteType } from '../route-types';

const { useAllAccessDesktopRoutesMock } = vi.hoisted(() => ({
  useAllAccessDesktopRoutesMock: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    FlowRoute: ({ pageUid }) => ReactModule.createElement('div', { 'data-testid': 'flow-route', 'data-uid': pageUid }),
  };
});

vi.mock('../route-runtime', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../route-runtime')>();
  return {
    ...actual,
    CurrentRouteProvider: ({ children }) => <>{children}</>,
    useAllAccessDesktopRoutes: () => useAllAccessDesktopRoutesMock(),
  };
});

vi.mock('../KeepAlive', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../KeepAlive')>();
  return {
    ...actual,
    KeepAlive: ({ uid, children }) => (
      <div data-testid="keep-alive" data-uid={uid}>
        {children(uid)}
      </div>
    ),
  };
});

vi.mock('../../../../schema-component', () => ({
  RemoteSchemaComponent: ({ uid }) => <div data-testid="remote-schema" data-uid={uid} />,
}));

describe('AdminDynamicPage', () => {
  let engine: FlowEngine;
  let adminLayoutModel: AdminLayoutModelV1;

  beforeEach(() => {
    engine = new FlowEngine();
    adminLayoutModel = engine.createModel<AdminLayoutModelV1>({
      uid: ADMIN_LAYOUT_MODEL_UID,
      use: AdminLayoutModelV1,
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        getRouteBySchemaUid: vi.fn(() => ({ schemaUid: 'flow-page-1', type: NocoBaseDesktopRouteType.flowPage })),
      },
    });
    useAllAccessDesktopRoutesMock.mockReturnValue({
      allAccessRoutes: [{ schemaUid: 'flow-page-1', type: NocoBaseDesktopRouteType.flowPage }],
    });
  });

  afterEach(() => {
    useAllAccessDesktopRoutesMock.mockReset();
  });

  it('should sync legacy admin route into admin layout model', async () => {
    const result = render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/admin/flow-page-1/view/detail']}>
          <Routes>
            <Route
              path="/admin/:name/view/*"
              element={
                <CurrentPageUidProvider>
                  <AdminDynamicPage />
                </CurrentPageUidProvider>
              }
            />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(adminLayoutModel.currentLayoutRoute).toMatchObject({
        type: 'page',
        pageUid: 'flow-page-1',
        pathname: '/admin/flow-page-1/view/detail',
        basePathname: '/admin',
      });
    });

    result.unmount();

    await waitFor(() => {
      expect(adminLayoutModel.currentLayoutRoute).toBeNull();
    });
  });

  it('should render flow pages through v2 FlowRoute in legacy admin route', async () => {
    render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/admin/flow-page-1/view/detail']}>
          <Routes>
            <Route
              path="/admin/:name/view/*"
              element={
                <CurrentPageUidProvider>
                  <AdminDynamicPage />
                </CurrentPageUidProvider>
              }
            />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    expect(await screen.findByTestId('flow-route')).toHaveAttribute('data-uid', 'flow-page-1');
    expect(screen.getByTestId('keep-alive')).toHaveAttribute('data-uid', 'flow-page-1');
    expect(screen.queryByTestId('remote-schema')).toBeNull();
  });

  it('should keep legacy pages rendered by RemoteSchemaComponent', () => {
    useAllAccessDesktopRoutesMock.mockReturnValue({
      allAccessRoutes: [{ schemaUid: 'legacy-page-1', type: NocoBaseDesktopRouteType.page }],
    });

    render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/admin/legacy-page-1']}>
          <Routes>
            <Route
              path="/admin/:name"
              element={
                <CurrentPageUidProvider>
                  <AdminDynamicPage />
                </CurrentPageUidProvider>
              }
            />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    expect(screen.getByTestId('remote-schema')).toHaveAttribute('data-uid', 'legacy-page-1');
    expect(screen.queryByTestId('flow-route')).toBeNull();
  });
});
