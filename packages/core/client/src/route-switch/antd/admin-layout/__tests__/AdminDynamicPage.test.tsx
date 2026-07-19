/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { act, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { ADMIN_LAYOUT_MODEL_UID } from '@nocobase/client-v2';
import { CurrentPageUidProvider } from '../../../../application/CustomRouterContextProvider';
import { AdminDynamicPage } from '../AdminDynamicPage';
import { AdminLayoutModelV1 } from '../AdminLayoutModel';
import { NocoBaseDesktopRouteType } from '../route-types';

const { useAllAccessDesktopRoutesMock } = vi.hoisted(() => ({
  useAllAccessDesktopRoutesMock: vi.fn(),
}));

const { useRemoteCollectionManagerLoadingMock } = vi.hoisted(() => ({
  useRemoteCollectionManagerLoadingMock: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    FlowRoute: ({ pageUid }) => ReactModule.createElement('div', { 'data-testid': 'flow-route', 'data-uid': pageUid }),
  };
});

vi.mock('../../../../collection-manager/CollectionManagerProvider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../collection-manager/CollectionManagerProvider')>();
  return {
    ...actual,
    useRemoteCollectionManagerLoading: () => useRemoteCollectionManagerLoadingMock(),
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

const flushPromises = async (times = 3) => {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
};

const NavigateToPopup = () => {
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => navigate('/admin/flow-page-1/view/detail')}>
        open popup
      </button>
      <button type="button" onClick={() => navigate('/admin/flow-page-1')}>
        close popup
      </button>
    </>
  );
};

const AdminDynamicPageRoute = () => (
  <>
    <CurrentPageUidProvider>
      <AdminDynamicPage />
    </CurrentPageUidProvider>
    <NavigateToPopup />
  </>
);

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
    useRemoteCollectionManagerLoadingMock.mockReturnValue(false);
  });

  afterEach(() => {
    useAllAccessDesktopRoutesMock.mockReset();
    useRemoteCollectionManagerLoadingMock.mockReset();
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

  it('should not deactivate the current page when opening a popup route in legacy admin route', async () => {
    render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/admin/flow-page-1']}>
          <Routes>
            <Route path="/admin/:name" element={<AdminDynamicPageRoute />} />
            <Route path="/admin/:name/view/*" element={<AdminDynamicPageRoute />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(adminLayoutModel.currentLayoutRoute).toMatchObject({
        type: 'page',
        pageUid: 'flow-page-1',
        pathname: '/admin/flow-page-1',
      });
    });

    const routeModel = engine.createModel({
      uid: 'flow-page-1',
      use: 'FlowModel',
    });
    const activateSpy = vi.fn();
    const deactivateSpy = vi.fn();
    routeModel.dispatchEvent = vi.fn(async (_eventName: string, args: any) => {
      args.activateRef.current = activateSpy;
      args.deactivateRef.current = deactivateSpy;
      args.onOpen?.();
      return [];
    });
    adminLayoutModel.registerRoutePage('flow-page-1', { active: true });

    adminLayoutModel.syncLayoutRoute({
      name: 'admin.page',
      pathname: '/admin/flow-page-1',
      params: { name: 'flow-page-1' },
      layoutRouteName: 'admin',
      layoutBasePathname: '/admin',
    });
    await flushPromises();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'open popup' }));
    });
    await waitFor(() => {
      expect(adminLayoutModel.currentLayoutRoute).toMatchObject({
        pathname: '/admin/flow-page-1/view/detail',
      });
    });
    await flushPromises();

    expect(deactivateSpy).not.toHaveBeenCalled();
    expect(activateSpy).not.toHaveBeenCalled();

    deactivateSpy.mockClear();
    activateSpy.mockClear();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'close popup' }));
    });
    await waitFor(() => {
      expect(adminLayoutModel.currentLayoutRoute).toMatchObject({
        pathname: '/admin/flow-page-1',
      });
    });
    await flushPromises();

    expect(deactivateSpy).not.toHaveBeenCalled();
    expect(activateSpy).not.toHaveBeenCalled();
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

  it('should render page menu routes through v2 FlowRoute in legacy admin route', async () => {
    useAllAccessDesktopRoutesMock.mockReturnValue({
      allAccessRoutes: [
        {
          schemaUid: 'custom-page',
          type: 'customPage',
          options: {
            pageMenuModelClass: 'DemoPageMenuModel',
          },
        },
      ],
    });

    render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/admin/custom-page/section/recent']}>
          <Routes>
            <Route
              path="/admin/:name/*"
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

    expect(await screen.findByTestId('flow-route')).toHaveAttribute('data-uid', 'custom-page');
    expect(screen.queryByTestId('remote-schema')).toBeNull();
  });

  it('should wait for collection metadata before rendering flow pages in legacy admin route', () => {
    useRemoteCollectionManagerLoadingMock.mockReturnValue(true);

    const { container } = render(
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

    expect(screen.getByTestId('keep-alive')).toHaveAttribute('data-uid', 'flow-page-1');
    expect(container.querySelector('.ant-spin')).toBeTruthy();
    expect(screen.queryByTestId('flow-route')).toBeNull();
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
