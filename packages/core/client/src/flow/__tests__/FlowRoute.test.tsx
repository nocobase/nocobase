/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, waitFor } from '@testing-library/react';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { resolveViewParamsToViewList } from '../resolveViewParamsToViewList';
import { getViewDiffAndUpdateHidden } from '../getViewDiffAndUpdateHidden';
import { getOpenViewStepParams } from '../flows/openViewFlow';

// 被测组件
import { FlowRoute } from '../FlowPage';
import { RouteModel } from '../models/base/RouteModel';

// mock 路由相关 hooks
vi.mock('../../route-switch', () => ({
  useCurrentRoute: () => ({ name: 'testRoute' }),
  useKeepAlive: () => ({ active: true }),
  useMobileLayout: () => ({ isMobileLayout: true }),
  useAllAccessDesktopRoutes: () => ({ refresh: vi.fn() }),
}));

vi.mock('../resolveViewParamsToViewList', () => ({
  resolveViewParamsToViewList: vi.fn(),
  updateViewListHidden: vi.fn(),
}));

vi.mock('../getViewDiffAndUpdateHidden', () => ({
  getViewDiffAndUpdateHidden: vi.fn(),
  getKey: vi.fn(),
}));

vi.mock('../flows/openViewFlow', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    getOpenViewStepParams: vi.fn(),
  };
});

const mockResolveViewParamsToViewList = vi.mocked(resolveViewParamsToViewList);
const mockGetViewDiffAndUpdateHidden = vi.mocked(getViewDiffAndUpdateHidden);
const mockGetOpenViewStepParams = vi.mocked(getOpenViewStepParams);

describe('FlowRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveViewParamsToViewList.mockReturnValue([]);
    mockGetViewDiffAndUpdateHidden.mockReturnValue({ viewsToClose: [], viewsToOpen: [] });
    mockGetOpenViewStepParams.mockReturnValue({} as any);
  });
  it('should define isMobileLayout on model context', async () => {
    // 使用真实的 FlowEngine 与 FlowModel，不再 mock
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    // 仅设置路由参数 name，避免依赖其它路由字段（如 pathname）
    engine.context.defineProperty('route', { value: { params: { name: 'test' } } });

    render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={['/flow/test']}>
          <Routes>
            <Route path="/flow/:name" element={<FlowRoute />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      const model = engine.getModel('test');
      expect(model.context.isMobileLayout).toBe(true);
    });
  });

  it('cleans up with removeModelWithSubModels for open views', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    const routeName = 'test-route';
    engine.context.defineProperty('route', {
      value: {
        params: { name: routeName },
        pathname: '/admin/test-view',
      },
    });

    const removeSpy = vi.spyOn(engine, 'removeModelWithSubModels');

    mockResolveViewParamsToViewList.mockImplementation((_engine, viewParams) => {
      return viewParams.map((params, index) => ({
        params,
        modelUid: params.viewUid,
        model: { dispatchEvent: vi.fn(() => Promise.resolve()) } as any,
        hidden: { value: false },
        index,
      }));
    });
    mockGetViewDiffAndUpdateHidden.mockImplementation((_prev, current) => ({
      viewsToClose: [],
      viewsToOpen: current,
    }));
    mockGetOpenViewStepParams.mockReturnValue({} as any);

    const { unmount } = render(
      <FlowEngineProvider engine={engine}>
        <MemoryRouter initialEntries={[`/flow/${routeName}`]}>
          <Routes>
            <Route path="/flow/:name" element={<FlowRoute />} />
          </Routes>
        </MemoryRouter>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(mockResolveViewParamsToViewList).toHaveBeenCalled();
    });

    unmount();

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledTimes(1);
    });

    const viewParams = mockResolveViewParamsToViewList.mock.calls[0][1];
    expect(removeSpy).toHaveBeenCalledWith(viewParams[0].viewUid);
  });
});
