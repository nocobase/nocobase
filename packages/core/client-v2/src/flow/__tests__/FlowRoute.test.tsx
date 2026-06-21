/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { FlowContextProvider, FlowEngine, FlowEngineProvider, type FlowModel } from '@nocobase/flow-engine';
import FlowRoute from '../components/FlowRoute';
import { RouteRepository } from '../../RouteRepository';

type MockAdminLayoutModel = FlowModel & {
  registerRoutePage: ReturnType<typeof vi.fn>;
  updateRoutePage: ReturnType<typeof vi.fn>;
  unregisterRoutePage: ReturnType<typeof vi.fn>;
};

const { hookState } = vi.hoisted(() => {
  return {
    hookState: {
      refresh: vi.fn(),
    },
  };
});

describe('FlowRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState.refresh = vi.fn();
    // Fixtures mount the modern client under the `v2` segment; tell the
    // runtime-prefix helper so v2-runtime detection matches.
    (globalThis.window as any).__nocobase_modern_client_prefix__ = 'v2';
  });

  afterEach(() => {
    delete (globalThis.window as any).__nocobase_modern_client_prefix__;
  });

  it('should bridge page lifecycle to admin-layout-model', async () => {
    const engine = new FlowEngine();
    const routeRepository = {
      refreshAccessible: hookState.refresh,
      isAccessibleLoaded: () => true,
      ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
      getRouteBySchemaUid: vi.fn(() => ({ type: 'flowPage', schemaUid: 'test-page' })),
    };
    engine.context.defineProperty('route', {
      value: {
        params: { name: 'test-page' },
        pathname: '/admin/test-page',
      },
    });
    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });

    const adminLayoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({
        uid: 'admin-layout-model',
        use: 'FlowModel',
      }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    const { rerender, unmount } = render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/flow/test-page']}>
          <Routes>
            <Route path="/flow/:name" element={<FlowRoute />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(adminLayoutModel.registerRoutePage).toHaveBeenCalledWith(
        'test-page',
        expect.objectContaining({
          active: true,
          refreshDesktopRoutes: expect.any(Function),
          layoutContentElement: expect.any(HTMLDivElement),
        }),
      );
    });

    await adminLayoutModel.registerRoutePage.mock.calls[0][1].refreshDesktopRoutes();
    expect(hookState.refresh).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(adminLayoutModel.updateRoutePage).toHaveBeenCalledWith(
        'test-page',
        expect.objectContaining({
          refreshDesktopRoutes: expect.any(Function),
          layoutContentElement: expect.any(HTMLDivElement),
        }),
      );
    });

    rerender(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/flow/test-page']}>
          <Routes>
            <Route path="/flow/:name" element={<FlowRoute />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    unmount();
    expect(adminLayoutModel.unregisterRoutePage).toHaveBeenCalledWith('test-page');
  });

  it('should sync explicit active state to layout route page', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: hookState.refresh,
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
        getRouteBySchemaUid: vi.fn(() => ({ type: 'flowPage', schemaUid: 'test-page' })),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });

    const adminLayoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({
        uid: 'admin-layout-model',
        use: 'FlowModel',
      }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    const result = render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/flow/test-page']}>
          <Routes>
            <Route path="/flow/:name" element={<FlowRoute active={false} />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(adminLayoutModel.registerRoutePage).toHaveBeenCalledWith(
        'test-page',
        expect.objectContaining({
          active: false,
        }),
      );
    });

    result.rerender(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/flow/test-page']}>
          <Routes>
            <Route path="/flow/:name" element={<FlowRoute active={true} />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(adminLayoutModel.updateRoutePage).toHaveBeenCalledWith(
        'test-page',
        expect.objectContaining({
          active: true,
        }),
      );
    });
  });

  it('should bridge page lifecycle with explicit pageUid', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: hookState.refresh,
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
        getRouteBySchemaUid: vi.fn(() => ({ type: 'flowPage', schemaUid: 'test-page' })),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });

    const adminLayoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({
        uid: 'admin-layout-model',
        use: 'FlowModel',
      }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/flow']}>
          <Routes>
            <Route path="/flow" element={<FlowRoute pageUid="test-page" />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(adminLayoutModel.registerRoutePage).toHaveBeenCalledWith('test-page', expect.any(Object));
    });
  });

  it('should derive layout model from current layout context when rendered from schema', async () => {
    const engine = new FlowEngine();
    const routeRepository = {
      refreshAccessible: hookState.refresh,
      isAccessibleLoaded: () => true,
      ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
      getRouteBySchemaUid: vi.fn(() => ({ type: 'flowPage', schemaUid: 'test-page' })),
    };
    engine.context.defineProperty('route', {
      value: {
        params: { name: 'test-page' },
        pathname: '/embed/test-page',
      },
    });
    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });
    const routeModel = engine.createModel({
      uid: 'route-model',
      use: 'FlowModel',
    });
    routeModel.context.defineProperty('layout', {
      value: {
        routeName: 'embed',
        routePath: '/embed',
        rootRouteName: 'embed',
        uid: 'embed-layout-model',
        layoutModelClass: 'EmbedLayoutModelV2',
        rootPageModelClass: 'RootPageModel',
        childPageModelClass: 'ChildPageModel',
        authCheck: true,
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });

    const embedLayoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({
        uid: 'embed-layout-model',
        use: 'FlowModel',
      }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <FlowContextProvider context={routeModel.context}>
          <MemoryRouter initialEntries={['/embed/test-page']}>
            <Routes>
              <Route path="/embed/:name" element={<FlowRoute />} />
            </Routes>
          </MemoryRouter>
        </FlowContextProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(embedLayoutModel.registerRoutePage).toHaveBeenCalledWith(
        'test-page',
        expect.objectContaining({
          active: true,
          refreshDesktopRoutes: expect.any(Function),
          layoutContentElement: expect.any(HTMLDivElement),
        }),
      );
    });
  });

  it('should ensure accessible routes for the current layout before bridging', async () => {
    const engine = new FlowEngine();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            type: 'flowPage',
            schemaUid: 'mobile-page',
          },
        ],
      },
    });
    const routeRepository = new RouteRepository({
      api: {
        request,
        resource: vi.fn(),
      },
    } as never);
    routeRepository.setRoutes([], 'admin-layout-model');
    const deactivateLayout = routeRepository.activateLayout({
      uid: 'mobile-layout-model',
    });
    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });
    const routeModel = engine.createModel({
      uid: 'mobile-route-model',
      use: 'FlowModel',
    });
    routeModel.context.defineProperty('layout', {
      value: {
        routeName: 'mobile',
        routePath: '/mobile',
        rootRouteName: 'mobile',
        uid: 'mobile-layout-model',
        layoutModelClass: 'MobileLayoutModel',
        rootPageModelClass: 'MobileRootPageModel',
        childPageModelClass: 'MobileChildPageModel',
        authCheck: true,
      },
    });

    const mobileLayoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({
        uid: 'mobile-layout-model',
        use: 'FlowModel',
      }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <FlowContextProvider context={routeModel.context}>
          <MemoryRouter initialEntries={['/mobile/mobile-page']}>
            <Routes>
              <Route path="/mobile/:name" element={<FlowRoute />} />
            </Routes>
          </MemoryRouter>
        </FlowContextProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({
        url: '/desktopRoutes:listAccessible',
        params: {
          tree: true,
          sort: 'sort',
          layout: 'mobile-layout-model',
        },
      });
      expect(mobileLayoutModel.registerRoutePage).toHaveBeenCalledWith('mobile-page', expect.any(Object));
    });
    deactivateLayout();
  });

  it('should fail fast when admin-layout-model is missing', () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('route', {
      value: {
        params: { name: 'test-page' },
        pathname: '/admin/test-page',
      },
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: hookState.refresh,
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
        getRouteBySchemaUid: vi.fn(() => ({ type: 'flowPage', schemaUid: 'test-page' })),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      expect(() => {
        render(
          <FlowEngineProvider engine={engine}>
            <MemoryRouter initialEntries={['/flow/test-page']}>
              <Routes>
                <Route path="/flow/:name" element={<FlowRoute />} />
              </Routes>
            </MemoryRouter>
          </FlowEngineProvider>,
        );
      }).toThrowError(/admin-layout-model/);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('should wait accessible routes before bridging page lifecycle', async () => {
    const engine = new FlowEngine();
    let resolveAccessible!: () => void;
    const ensureAccessibleLoaded = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAccessible = resolve;
        }),
    );
    const routeRepository = {
      refreshAccessible: hookState.refresh,
      isAccessibleLoaded: () => false,
      ensureAccessibleLoaded,
      getRouteBySchemaUid: vi.fn(() => ({ type: 'flowPage', schemaUid: 'test-page' })),
    };
    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });

    const adminLayoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({ uid: 'admin-layout-model', use: 'FlowModel' }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/flow/test-page']}>
          <Routes>
            <Route path="/flow/:name" element={<FlowRoute />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    expect(ensureAccessibleLoaded).toHaveBeenCalledTimes(1);
    expect(adminLayoutModel.registerRoutePage).not.toHaveBeenCalled();

    resolveAccessible();

    await waitFor(() => {
      expect(adminLayoutModel.registerRoutePage).toHaveBeenCalled();
    });
  });

  it('should not rerun accessible guard when layout reference changes but fields stay the same', async () => {
    const engine = new FlowEngine();
    const ensureAccessibleLoaded = vi.fn().mockResolvedValue([]);
    const getRouteBySchemaUid = vi.fn(() => ({ type: 'flowPage', schemaUid: 'test-page' }));
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: hookState.refresh,
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded,
        getRouteBySchemaUid,
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });

    const layoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({ uid: 'legacy-admin-layout-model', use: 'FlowModel' }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );
    let layoutReadCount = 0;
    const stableLayout = {
      uid: 'admin-layout-model',
      routeName: 'admin',
      routePath: '/admin',
      authCheck: true,
    };
    Object.defineProperty(layoutModel, 'layout', {
      get: () => {
        layoutReadCount += 1;
        return layoutReadCount <= 2 ? { ...stableLayout } : stableLayout;
      },
    });

    const element = (
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/flow/test-page']}>
          <Routes>
            <Route path="/flow/:name" element={<FlowRoute getLayoutModel={() => layoutModel as any} />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>
    );
    const { rerender } = render(element);

    await waitFor(() => {
      expect(layoutModel.registerRoutePage).toHaveBeenCalledWith('test-page', expect.any(Object));
    });
    expect(ensureAccessibleLoaded).not.toHaveBeenCalled();
    expect(getRouteBySchemaUid).toHaveBeenCalledTimes(1);

    rerender(element);

    await waitFor(() => {
      expect(layoutModel.updateRoutePage).toHaveBeenCalled();
    });
    expect(ensureAccessibleLoaded).not.toHaveBeenCalled();
    expect(getRouteBySchemaUid).toHaveBeenCalledTimes(1);
  });

  it('should show 404 when current route is a legacy page in v2 runtime', async () => {
    const originalLocation = window.location;
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/v2/admin/test-page/tab/tab-1',
        search: '?from=direct',
        hash: '#dialog',
        replace,
      },
    });

    try {
      const engine = new FlowEngine();
      engine.context.defineProperty('routeRepository', {
        value: {
          refreshAccessible: hookState.refresh,
          isAccessibleLoaded: () => true,
          ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
          getRouteBySchemaUid: vi.fn(() => ({ type: 'page', schemaUid: 'test-page' })),
        },
      });
      engine.context.defineProperty('app', {
        value: {
          getPublicPath: () => '/v2/',
          router: {
            getBasename: () => '/v2',
          },
        },
      });

      const adminLayoutModel: MockAdminLayoutModel = Object.assign(
        engine.createModel({ uid: 'admin-layout-model', use: 'FlowModel' }),
        {
          registerRoutePage: vi.fn(),
          updateRoutePage: vi.fn(),
          unregisterRoutePage: vi.fn(),
        },
      );

      render(
        <FlowEngineProvider engine={engine}>
          <MemoryRouter initialEntries={['/flow/test-page']}>
            <Routes>
              <Route path="/flow/:name" element={<FlowRoute />} />
            </Routes>
          </MemoryRouter>
        </FlowEngineProvider>,
      );

      expect(await screen.findByText('404')).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
      expect(adminLayoutModel.registerRoutePage).not.toHaveBeenCalled();
      expect(adminLayoutModel.updateRoutePage).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('should render not found for legacy page when behavior is notFound', async () => {
    const originalLocation = window.location;
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/v2/embed/test-page',
        replace,
      },
    });

    try {
      const engine = new FlowEngine();
      engine.context.defineProperty('routeRepository', {
        value: {
          refreshAccessible: hookState.refresh,
          isAccessibleLoaded: () => true,
          ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
          getRouteBySchemaUid: vi.fn(() => ({ type: 'page', schemaUid: 'test-page' })),
        },
      });
      engine.context.defineProperty('app', {
        value: {
          getPublicPath: () => '/v2/',
          router: {
            getBasename: () => '/v2',
          },
        },
      });

      const adminLayoutModel: MockAdminLayoutModel = Object.assign(
        engine.createModel({ uid: 'admin-layout-model', use: 'FlowModel' }),
        {
          registerRoutePage: vi.fn(),
          updateRoutePage: vi.fn(),
          unregisterRoutePage: vi.fn(),
        },
      );

      const result = render(
        <FlowEngineProvider engine={engine}>
          <MemoryRouter initialEntries={['/embed/test-page']}>
            <Routes>
              <Route path="/embed/:name" element={<FlowRoute legacyPageBehavior="notFound" />} />
            </Routes>
          </MemoryRouter>
        </FlowEngineProvider>,
      );

      await result.findByText('404');
      expect(replace).not.toHaveBeenCalled();
      expect(adminLayoutModel.registerRoutePage).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('should bridge existing FlowModel when behavior is notFound and routeRepository has no route', async () => {
    const engine = new FlowEngine();
    engine.setModelRepository({
      findOne: vi.fn().mockResolvedValue({
        uid: 'public-form-1',
        use: 'FlowModel',
      }),
      save: vi.fn(),
      destroy: vi.fn(),
    } as any);
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: hookState.refresh,
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
        getRouteBySchemaUid: vi.fn(() => undefined),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });
    const routeModel = engine.createModel({
      uid: 'public-form-route-model',
      use: 'FlowModel',
    });
    routeModel.context.defineProperty('layout', {
      value: {
        routeName: 'public-forms',
        routePath: '/public-forms',
        rootRouteName: 'public-forms',
        uid: 'public-form-layout-model',
        layoutModelClass: 'PublicFormLayoutModel',
        rootPageModelClass: 'PublicFormPageModel',
        childPageModelClass: 'ChildPageModel',
        authCheck: false,
      },
    });

    const layoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({ uid: 'public-form-layout-model', use: 'FlowModel' }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <FlowContextProvider context={routeModel.context}>
          <MemoryRouter initialEntries={['/public-forms/public-form-1']}>
            <Routes>
              <Route
                path="/public-forms/:name"
                element={<FlowRoute legacyPageBehavior="notFound" getLayoutModel={() => layoutModel} />}
              />
            </Routes>
          </MemoryRouter>
        </FlowContextProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(layoutModel.registerRoutePage).toHaveBeenCalledWith('public-form-1', expect.any(Object));
    });
    expect(screen.queryByText('404')).not.toBeInTheDocument();
  });

  it('should use getLayoutModel layout authCheck when FlowContext has no layout', async () => {
    const engine = new FlowEngine();
    engine.setModelRepository({
      findOne: vi.fn().mockResolvedValue({
        uid: 'public-form-1',
        use: 'FlowModel',
      }),
      save: vi.fn(),
      destroy: vi.fn(),
    } as any);
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: hookState.refresh,
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
        getRouteBySchemaUid: vi.fn(() => undefined),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });

    const layoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({ uid: 'public-form-layout-model', use: 'FlowModel' }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );
    Object.defineProperty(layoutModel, 'layout', {
      value: {
        routeName: 'public-forms',
        routePath: '/public-forms',
        rootRouteName: 'public-forms',
        uid: 'public-form-layout-model',
        layoutModelClass: 'PublicFormLayoutModel',
        rootPageModelClass: 'PublicFormPageModel',
        childPageModelClass: 'ChildPageModel',
        authCheck: false,
      },
    });

    render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/public-forms/public-form-1']}>
          <Routes>
            <Route
              path="/public-forms/:name"
              element={<FlowRoute legacyPageBehavior="notFound" getLayoutModel={() => layoutModel as any} />}
            />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(layoutModel.registerRoutePage).toHaveBeenCalledWith('public-form-1', expect.any(Object));
    });
    expect(screen.queryByText('404')).not.toBeInTheDocument();
  });

  it('should render not found when admin route is not accessible', async () => {
    const engine = new FlowEngine();
    engine.setModelRepository({
      findOne: vi.fn().mockResolvedValue({
        uid: 'admin-denied-page',
        use: 'FlowModel',
      }),
      save: vi.fn(),
      destroy: vi.fn(),
    } as any);
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: hookState.refresh,
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
        getRouteBySchemaUid: vi.fn(() => undefined),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });

    const adminLayoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({ uid: 'admin-layout-model', use: 'FlowModel' }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/admin/admin-denied-page']}>
          <Routes>
            <Route path="/admin/:name" element={<FlowRoute />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(adminLayoutModel.registerRoutePage).not.toHaveBeenCalled();
  });

  it('should not use flowModels:findOne to bridge a missing route for protected layouts', async () => {
    const engine = new FlowEngine();
    const findOne = vi.fn().mockResolvedValue({
      uid: 'mobile-denied-page',
      use: 'FlowModel',
    });
    engine.setModelRepository({
      findOne,
      save: vi.fn(),
      destroy: vi.fn(),
    } as any);
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: hookState.refresh,
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
        getRouteBySchemaUid: vi.fn(() => undefined),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });
    const routeModel = engine.createModel({
      uid: 'mobile-route-model',
      use: 'FlowModel',
    });
    routeModel.context.defineProperty('layout', {
      value: {
        routeName: 'mobile',
        routePath: '/mobile',
        rootRouteName: 'mobile',
        uid: 'mobile-layout-model',
        layoutModelClass: 'MobileLayoutModel',
        rootPageModelClass: 'MobileRootPageModel',
        childPageModelClass: 'MobileChildPageModel',
        authCheck: true,
      },
    });

    const layoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({ uid: 'mobile-layout-model', use: 'FlowModel' }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <FlowContextProvider context={routeModel.context}>
          <MemoryRouter initialEntries={['/mobile/mobile-denied-page']}>
            <Routes>
              <Route
                path="/mobile/:name"
                element={<FlowRoute legacyPageBehavior="notFound" getLayoutModel={() => layoutModel} />}
              />
            </Routes>
          </MemoryRouter>
        </FlowContextProvider>
      </FlowEngineProvider>,
    );

    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(findOne).not.toHaveBeenCalled();
    expect(layoutModel.registerRoutePage).not.toHaveBeenCalled();
  });

  it('should not load a known page uid when a protected custom layout has no accessible route', async () => {
    const engine = new FlowEngine();
    const findOne = vi.fn().mockResolvedValue({
      uid: 'known-denied-custom-page',
      use: 'FlowModel',
    });
    engine.setModelRepository({
      findOne,
      save: vi.fn(),
      destroy: vi.fn(),
    } as any);
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: hookState.refresh,
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
        getRouteBySchemaUid: vi.fn(() => undefined),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });
    const routeModel = engine.createModel({
      uid: 'custom-layout-route-model',
      use: 'FlowModel',
    });
    routeModel.context.defineProperty('layout', {
      value: {
        routeName: 'admin2',
        routePath: '/admin2',
        rootRouteName: 'admin2',
        uid: 'custom-protected-layout-model',
        layoutModelClass: 'AdminLayoutModel',
        rootPageModelClass: 'RootPageModel',
        childPageModelClass: 'ChildPageModel',
        authCheck: true,
      },
    });

    const layoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({ uid: 'custom-protected-layout-model', use: 'FlowModel' }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <FlowContextProvider context={routeModel.context}>
          <MemoryRouter initialEntries={['/admin2/known-denied-custom-page']}>
            <Routes>
              <Route
                path="/admin2/:name"
                element={<FlowRoute legacyPageBehavior="notFound" getLayoutModel={() => layoutModel} />}
              />
            </Routes>
          </MemoryRouter>
        </FlowContextProvider>
      </FlowEngineProvider>,
    );

    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(findOne).not.toHaveBeenCalled();
    expect(layoutModel.registerRoutePage).not.toHaveBeenCalled();
  });

  it('should check model existence without occupying the route model uid', async () => {
    const engine = new FlowEngine();
    const findOne = vi.fn().mockResolvedValue({
      uid: 'public-form-1',
    });
    const request = vi.fn().mockResolvedValue({
      data: {
        data: {
          uid: 'public-form-1',
        },
      },
    });
    engine.setModelRepository({
      findOne,
      save: vi.fn(),
      destroy: vi.fn(),
    } as any);
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: hookState.refresh,
        isAccessibleLoaded: () => true,
        ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
        getRouteBySchemaUid: vi.fn(() => undefined),
      },
    });
    engine.context.defineProperty('app', {
      value: {
        apiClient: {
          request,
        },
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });
    const routeModel = engine.createModel({
      uid: 'public-form-route-model',
      use: 'FlowModel',
    });
    routeModel.context.defineProperty('layout', {
      value: {
        routeName: 'public-forms',
        routePath: '/public-forms',
        rootRouteName: 'public-forms',
        uid: 'public-form-layout-model',
        layoutModelClass: 'PublicFormLayoutModel',
        rootPageModelClass: 'PublicFormPageModel',
        childPageModelClass: 'ChildPageModel',
        authCheck: false,
      },
    });

    const layoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({ uid: 'public-form-layout-model', use: 'FlowModel' }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <FlowContextProvider context={routeModel.context}>
          <MemoryRouter initialEntries={['/public-forms/public-form-1']}>
            <Routes>
              <Route path="/public-forms/:name" element={<FlowRoute legacyPageBehavior="notFound" />} />
            </Routes>
          </MemoryRouter>
        </FlowContextProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(layoutModel.registerRoutePage).toHaveBeenCalledWith('public-form-1', expect.any(Object));
    });
    expect(findOne).toHaveBeenCalledWith({ uid: 'public-form-1' });
    expect(request).not.toHaveBeenCalled();
    expect(engine.getModel('public-form-1')).toBeUndefined();
  });

  it('should not skip accessible route loading just because layout authCheck is false', async () => {
    const engine = new FlowEngine();
    const ensureAccessibleLoaded = vi.fn().mockRejectedValue(new Error('cannot load accessible routes'));
    const getRouteBySchemaUid = vi.fn();
    engine.setModelRepository({
      findOne: vi.fn().mockResolvedValue({
        uid: 'public-form-1',
        use: 'FlowModel',
      }),
      save: vi.fn(),
      destroy: vi.fn(),
    } as any);
    engine.context.defineProperty('routeRepository', {
      value: {
        refreshAccessible: hookState.refresh,
        isAccessibleLoaded: () => false,
        ensureAccessibleLoaded,
        getRouteBySchemaUid,
      },
    });
    engine.context.defineProperty('app', {
      value: {
        getPublicPath: () => '/v2/',
        router: {
          getBasename: () => '/v2',
        },
      },
    });
    const routeModel = engine.createModel({
      uid: 'public-form-route-model',
      use: 'FlowModel',
    });
    routeModel.context.defineProperty('layout', {
      value: {
        routeName: 'public-forms',
        routePath: '/public-forms',
        rootRouteName: 'public-forms',
        uid: 'public-form-layout-model',
        layoutModelClass: 'PublicFormLayoutModel',
        rootPageModelClass: 'PublicFormPageModel',
        childPageModelClass: 'ChildPageModel',
        authCheck: false,
      },
    });

    const layoutModel: MockAdminLayoutModel = Object.assign(
      engine.createModel({ uid: 'public-form-layout-model', use: 'FlowModel' }),
      {
        registerRoutePage: vi.fn(),
        updateRoutePage: vi.fn(),
        unregisterRoutePage: vi.fn(),
      },
    );

    render(
      <FlowEngineProvider engine={engine}>
        <FlowContextProvider context={routeModel.context}>
          <MemoryRouter initialEntries={['/public-forms/public-form-1']}>
            <Routes>
              <Route path="/public-forms/:name" element={<FlowRoute legacyPageBehavior="notFound" />} />
            </Routes>
          </MemoryRouter>
        </FlowContextProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(layoutModel.registerRoutePage).toHaveBeenCalledWith('public-form-1', expect.any(Object));
    });
    expect(ensureAccessibleLoaded).toHaveBeenCalledTimes(1);
    expect(getRouteBySchemaUid).not.toHaveBeenCalled();
  });

  it('should bridge legacy page when behavior is bridge', async () => {
    const originalLocation = window.location;
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/v2/admin/test-page',
        replace,
      },
    });

    try {
      const engine = new FlowEngine();
      engine.context.defineProperty('routeRepository', {
        value: {
          refreshAccessible: hookState.refresh,
          isAccessibleLoaded: () => true,
          ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
          getRouteBySchemaUid: vi.fn(() => ({ type: 'page', schemaUid: 'test-page' })),
        },
      });
      engine.context.defineProperty('app', {
        value: {
          getPublicPath: () => '/v2/',
          router: {
            getBasename: () => '/v2',
          },
        },
      });

      const adminLayoutModel: MockAdminLayoutModel = Object.assign(
        engine.createModel({ uid: 'admin-layout-model', use: 'FlowModel' }),
        {
          registerRoutePage: vi.fn(),
          updateRoutePage: vi.fn(),
          unregisterRoutePage: vi.fn(),
        },
      );

      render(
        <FlowEngineProvider engine={engine}>
          <MemoryRouter initialEntries={['/flow/test-page']}>
            <Routes>
              <Route path="/flow/:name" element={<FlowRoute legacyPageBehavior="bridge" />} />
            </Routes>
          </MemoryRouter>
        </FlowEngineProvider>,
      );

      await waitFor(() => {
        expect(adminLayoutModel.registerRoutePage).toHaveBeenCalled();
      });
      expect(replace).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('should render not found without redirecting when admin route does not exist', async () => {
    const originalLocation = window.location;
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        replace,
      },
    });

    try {
      const engine = new FlowEngine();
      engine.context.defineProperty('routeRepository', {
        value: {
          refreshAccessible: hookState.refresh,
          isAccessibleLoaded: () => true,
          ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
          getRouteBySchemaUid: vi.fn(() => undefined),
        },
      });
      engine.context.defineProperty('app', {
        value: {
          getPublicPath: () => '/v2/',
          router: {
            getBasename: () => '/v2',
          },
        },
      });

      const adminLayoutModel: MockAdminLayoutModel = Object.assign(
        engine.createModel({ uid: 'admin-layout-model', use: 'FlowModel' }),
        {
          registerRoutePage: vi.fn(),
          updateRoutePage: vi.fn(),
          unregisterRoutePage: vi.fn(),
        },
      );

      render(
        <FlowEngineProvider engine={engine}>
          <MemoryRouter initialEntries={['/flow/test-page']}>
            <Routes>
              <Route path="/flow/:name" element={<FlowRoute />} />
            </Routes>
          </MemoryRouter>
        </FlowEngineProvider>,
      );

      expect(await screen.findByText('404')).toBeInTheDocument();
      expect(adminLayoutModel.registerRoutePage).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('should keep sub app page inside spa when basename does not include /v2/', async () => {
    const originalLocation = window.location;
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/apps/demo/admin/test-page',
        search: '?from=sub-app',
        hash: '#panel',
        replace,
      },
    });

    try {
      const engine = new FlowEngine();
      engine.context.defineProperty('routeRepository', {
        value: {
          refreshAccessible: hookState.refresh,
          isAccessibleLoaded: () => true,
          ensureAccessibleLoaded: vi.fn().mockResolvedValue([]),
          getRouteBySchemaUid: vi.fn(() => ({ type: 'page', schemaUid: 'test-page' })),
        },
      });
      engine.context.defineProperty('app', {
        value: {
          getPublicPath: () => '/apps/demo/',
          router: {
            getBasename: () => '/apps/demo',
          },
        },
      });

      const adminLayoutModel: MockAdminLayoutModel = Object.assign(
        engine.createModel({ uid: 'admin-layout-model', use: 'FlowModel' }),
        {
          registerRoutePage: vi.fn(),
          updateRoutePage: vi.fn(),
          unregisterRoutePage: vi.fn(),
        },
      );

      render(
        <FlowEngineProvider engine={engine}>
          <MemoryRouter initialEntries={['/flow/test-page']}>
            <Routes>
              <Route path="/flow/:name" element={<FlowRoute />} />
            </Routes>
          </MemoryRouter>
        </FlowEngineProvider>,
      );

      await waitFor(() => {
        expect(adminLayoutModel.registerRoutePage).toHaveBeenCalled();
      });
      expect(replace).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('should not redirect or loop when ensureAccessibleLoaded rejects', async () => {
    const originalLocation = window.location;
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        replace,
      },
    });

    try {
      const engine = new FlowEngine();
      const ensureAccessibleLoaded = vi.fn().mockRejectedValue(new Error('load failed'));
      engine.context.defineProperty('routeRepository', {
        value: {
          refreshAccessible: hookState.refresh,
          isAccessibleLoaded: () => false,
          ensureAccessibleLoaded,
          getRouteBySchemaUid: vi.fn(),
        },
      });
      engine.context.defineProperty('app', {
        value: {
          getPublicPath: () => '/v2/',
          router: {
            getBasename: () => '/v2',
          },
        },
      });

      const adminLayoutModel: MockAdminLayoutModel = Object.assign(
        engine.createModel({ uid: 'admin-layout-model', use: 'FlowModel' }),
        {
          registerRoutePage: vi.fn(),
          updateRoutePage: vi.fn(),
          unregisterRoutePage: vi.fn(),
        },
      );

      render(
        <FlowEngineProvider engine={engine}>
          <MemoryRouter initialEntries={['/flow/test-page']}>
            <Routes>
              <Route path="/flow/:name" element={<FlowRoute />} />
            </Routes>
          </MemoryRouter>
        </FlowEngineProvider>,
      );

      await waitFor(() => {
        expect(adminLayoutModel.registerRoutePage).toHaveBeenCalled();
      });
      expect(ensureAccessibleLoaded).toHaveBeenCalledTimes(1);
      expect(replace).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });
});
