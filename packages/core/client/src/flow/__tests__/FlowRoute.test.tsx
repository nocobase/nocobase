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
import { FlowRoute } from '../FlowPage';

type MockAdminLayoutModel = FlowModel & {
  registerRoutePage: ReturnType<typeof vi.fn>;
  updateRoutePage: ReturnType<typeof vi.fn>;
  unregisterRoutePage: ReturnType<typeof vi.fn>;
};

const { hookState } = vi.hoisted(() => {
  return {
    hookState: {
      isMobileLayout: true,
      refresh: vi.fn(),
    },
  };
});

vi.mock('../../route-switch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../route-switch')>();
  return {
    ...actual,
    useMobileLayout: () => ({ isMobileLayout: hookState.isMobileLayout }),
  };
});

describe('FlowRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState.isMobileLayout = true;
    hookState.refresh = vi.fn();
  });

  it('should bridge page lifecycle to admin-layout-model', async () => {
    const engine = new FlowEngine();
    const routeRepository = {
      refreshAccessible: hookState.refresh,
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
});
