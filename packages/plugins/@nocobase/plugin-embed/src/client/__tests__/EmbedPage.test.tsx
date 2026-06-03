/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@nocobase/test/client';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const layoutModel = {
    props: {},
    clearLayoutRoute: vi.fn(),
    resolveLayoutRoute: vi.fn(() => ({
      type: 'page',
      pathname: '/embed/flow-page-1/view/detail',
      basePathname: '/embed',
      relativePath: 'flow-page-1/view/detail',
      pageUid: 'flow-page-1',
      viewStack: [],
    })),
    setProps: vi.fn((props) => {
      layoutModel.props = {
        ...layoutModel.props,
        ...props,
      };
    }),
    syncLayoutRoute: vi.fn(),
  };

  return {
    FlowRoute: vi.fn(({ pageUid }) => <div data-testid="flow-route" data-page-uid={pageUid} />),
    getEmbedLayoutModel: vi.fn(() => layoutModel),
    layoutModel,
    RemoteSchemaComponent: vi.fn(({ uid }) => <div data-testid="remote-schema" data-uid={uid} />),
    useAllAccessDesktopRoutes: vi.fn(),
    useFlowEngine: vi.fn(() => ({})),
  };
});

vi.mock('@nocobase/client', async () => {
  const ReactModule = await import('react');
  const { useParams } = await import('react-router-dom');

  const findRouteBySchemaUid = (uid: string, routes: any[] = []): any => {
    for (const route of routes) {
      if (route.schemaUid === uid) {
        return route;
      }
      const childRoute = findRouteBySchemaUid(uid, route.children || []);
      if (childRoute) {
        return childRoute;
      }
    }
  };

  return {
    AdminProvider: ({ children }) => <>{children}</>,
    CurrentPageUidContext: ReactModule.createContext(''),
    CurrentRouteProvider: ({ children }) => <>{children}</>,
    findRouteBySchemaUid,
    KeepAlive: ({ children, uid }) => children(uid),
    LayoutContent: () => null,
    NocoBaseDesktopRouteType: {
      flowPage: 'flowPage',
      page: 'page',
    },
    RemoteSchemaComponent: mocks.RemoteSchemaComponent,
    useAllAccessDesktopRoutes: mocks.useAllAccessDesktopRoutes,
    useCurrentPageUid: () => useParams().name,
    useCurrentUserContext: () => ({ loading: false, data: { data: { id: 1 } } }),
  };
});

vi.mock('@nocobase/client-v2', () => ({
  FlowRoute: mocks.FlowRoute,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    FlowModelRenderer: ({ model }) => <div data-testid="embed-layout-model">{model.props.children}</div>,
    useFlowEngine: mocks.useFlowEngine,
  };
});

vi.mock('../../client-v2/EmbedLayoutModel', () => ({
  EmbedLayoutModelV2: class EmbedLayoutModelV2 {},
  getEmbedLayoutModel: mocks.getEmbedLayoutModel,
}));

describe('EmbedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.layoutModel.props = {};
  });

  it('keeps legacy pages rendered by RemoteSchemaComponent', async () => {
    mocks.useAllAccessDesktopRoutes.mockReturnValue({
      allAccessRoutes: [{ schemaUid: 'legacy-page-1', type: 'page' }],
    });
    const { EmbedPage } = await import('../EmbedLayout');

    render(
      <MemoryRouter initialEntries={['/embed/legacy-page-1']}>
        <Routes>
          <Route path="/embed/:name" element={<EmbedPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('remote-schema')).toHaveAttribute('data-uid', 'legacy-page-1');
    expect(mocks.FlowRoute).not.toHaveBeenCalled();
  });

  it('renders flow pages through the v2 embed layout bridge', async () => {
    mocks.useAllAccessDesktopRoutes.mockReturnValue({
      allAccessRoutes: [{ schemaUid: 'flow-page-1', type: 'flowPage' }],
    });
    const { EmbedPage } = await import('../EmbedLayout');

    const { unmount } = render(
      <MemoryRouter initialEntries={['/embed/flow-page-1/view/detail']}>
        <Routes>
          <Route path="/embed/:name/view/*" element={<EmbedPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('flow-route')).toHaveAttribute('data-page-uid', 'flow-page-1');
    expect(mocks.getEmbedLayoutModel).toHaveBeenCalled();
    expect(mocks.layoutModel.setProps).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.objectContaining({
          routeName: 'embed',
          routePath: '/embed',
        }),
      }),
    );
    await waitFor(() => {
      expect(mocks.layoutModel.syncLayoutRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/embed/flow-page-1/view/detail',
          layoutBasePathname: '/embed',
        }),
      );
    });
    unmount();
    await waitFor(() => {
      expect(mocks.layoutModel.clearLayoutRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/embed/flow-page-1/view/detail',
        }),
      );
      expect(mocks.layoutModel.setProps).toHaveBeenCalledWith(
        expect.objectContaining({
          children: undefined,
        }),
      );
    });
  });
});
