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

// 被测组件
import { FlowRoute } from '../FlowPage';
import { RouteModel } from '../models';

// mock 路由相关 hooks
vi.mock('../../route-switch', () => ({
  useCurrentRoute: () => ({ name: 'testRoute' }),
  useKeepAlive: () => ({ active: true }),
  useMobileLayout: () => ({ isMobileLayout: true }),
  useAllAccessDesktopRoutes: () => ({ refresh: vi.fn() }),
}));

describe('FlowRoute', () => {
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
});
