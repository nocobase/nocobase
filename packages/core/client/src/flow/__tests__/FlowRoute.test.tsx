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

// 被测组件
import { FlowRoute } from '../FlowPage';

// 收集 model 上下文 defineProperty 定义的属性
const ctxProps: Record<string, any> = {};

// mock flow engine
vi.mock('@nocobase/flow-engine', () => {
  return {
    useFlowEngine: () => ({
      createModel: vi.fn().mockImplementation((options) => {
        return {
          options,
          context: {
            defineProperty: (key: string, descriptor: PropertyDescriptor) => {
              Object.defineProperty(ctxProps, key, descriptor);
            },
          },
          dispatchEvent: vi.fn(),
        };
      }),
    }),
  };
});

// mock 路由相关 hooks
vi.mock('../../route-switch', () => ({
  useCurrentRoute: () => ({ name: 'testRoute' }),
  useKeepAlive: () => ({ active: true }),
  useMobileLayout: () => ({ isMobileLayout: true }),
}));

describe('FlowRoute', () => {
  it('should define isMobileLayout on model context', async () => {
    render(
      <MemoryRouter initialEntries={['/flow/test']}>
        <Routes>
          <Route path="/flow/:name" element={<FlowRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      // 通过 getter 读取
      expect(ctxProps.isMobileLayout).toBe(true);
    });
  });
});
