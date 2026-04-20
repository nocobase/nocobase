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
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { FlowRoute } from '../FlowPage';

const { hookState } = vi.hoisted(() => {
  return {
    hookState: {
      currentRoute: { title: 'Route A' },
      active: true,
      isMobileLayout: true,
      refresh: vi.fn(),
    },
  };
});

vi.mock('../../route-switch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../route-switch')>();
  return {
    ...actual,
    useCurrentRoute: () => hookState.currentRoute,
    useKeepAlive: () => ({ active: hookState.active }),
    useMobileLayout: () => ({ isMobileLayout: hookState.isMobileLayout }),
    useAllAccessDesktopRoutes: () => ({ refresh: hookState.refresh }),
  };
});

describe('FlowRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState.currentRoute = { title: 'Route A' };
    hookState.active = true;
    hookState.isMobileLayout = true;
    hookState.refresh = vi.fn();
  });

  it('should bridge page lifecycle to admin-layout-model', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('route', {
      value: {
        params: { name: 'test-page' },
        pathname: '/admin/test-page',
      },
    });

    const adminLayoutModel = engine.createModel({
      uid: 'admin-layout-model',
      use: 'FlowModel',
    }) as any;
    adminLayoutModel.registerRoutePage = vi.fn();
    adminLayoutModel.updateRoutePage = vi.fn();
    adminLayoutModel.unregisterRoutePage = vi.fn();

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
          currentRoute: hookState.currentRoute,
          refreshDesktopRoutes: hookState.refresh,
          layoutContentElement: expect.any(HTMLDivElement),
        }),
      );
    });

    await waitFor(() => {
      expect(adminLayoutModel.updateRoutePage).toHaveBeenCalledWith('test-page', { active: true });
      expect(adminLayoutModel.updateRoutePage).toHaveBeenCalledWith(
        'test-page',
        expect.objectContaining({
          currentRoute: hookState.currentRoute,
          refreshDesktopRoutes: hookState.refresh,
          layoutContentElement: expect.any(HTMLDivElement),
        }),
      );
    });

    hookState.active = false;
    hookState.currentRoute = { title: 'Route B' };
    hookState.refresh = vi.fn();

    rerender(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/flow/test-page']}>
          <Routes>
            <Route path="/flow/:name" element={<FlowRoute />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(adminLayoutModel.updateRoutePage).toHaveBeenCalledWith('test-page', { active: false });
      expect(adminLayoutModel.updateRoutePage).toHaveBeenCalledWith(
        'test-page',
        expect.objectContaining({
          currentRoute: hookState.currentRoute,
          refreshDesktopRoutes: hookState.refresh,
          layoutContentElement: expect.any(HTMLDivElement),
        }),
      );
    });

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
