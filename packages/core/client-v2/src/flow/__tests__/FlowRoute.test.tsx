/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, waitFor } from '@testing-library/react';
import { FlowEngine, FlowEngineProvider, type FlowModel } from '@nocobase/flow-engine';
import FlowRoute from '../components/FlowRoute';

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
          active: false,
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

  it('should replace to legacy page when current route is page', async () => {
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

      await waitFor(() => {
        expect(replace).toHaveBeenCalledWith('/admin/test-page/tabs/tab-1?from=direct#dialog');
      });
      expect(adminLayoutModel.registerRoutePage).not.toHaveBeenCalled();
      expect(adminLayoutModel.updateRoutePage).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('should not redirect when route does not exist', async () => {
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
