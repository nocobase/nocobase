/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { APIClientContext } from '../../../../api-client/context';
import { RoutesRequestProvider } from '../../../../route-switch/antd/admin-layout/route-runtime';
import { useNocoBaseRoutes } from '../Menu';

describe('useNocoBaseRoutes', () => {
  const createWrapper = () => {
    const engine = new FlowEngine();
    const routes = [{ id: 1, schemaUid: 'schema-1' }];
    const routeRepository = {
      listAccessible: vi.fn(() => routes),
      subscribe: vi.fn(() => () => undefined),
      refreshAccessible: vi.fn().mockResolvedValue([]),
      createRoute: vi.fn().mockResolvedValue({ data: { data: { id: 1 } } }),
      updateRoute: vi.fn().mockResolvedValue({ data: { data: true } }),
      deleteRoute: vi.fn().mockResolvedValue({ data: { data: true } }),
      moveRoute: vi.fn().mockResolvedValue({ data: { data: true } }),
    };
    const resource = {
      create: vi.fn().mockResolvedValue({ data: { data: { id: 2 } } }),
      update: vi.fn().mockResolvedValue({ data: { data: true } }),
      destroy: vi.fn().mockResolvedValue({ data: { data: true } }),
      move: vi.fn().mockResolvedValue({ data: { data: true } }),
    };
    const api = {
      resource: vi.fn(() => resource),
    };

    engine.context.defineProperty('routeRepository', {
      value: routeRepository,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <APIClientContext.Provider value={api as any}>
        <FlowEngineProvider engine={engine}>
          <RoutesRequestProvider>{children}</RoutesRequestProvider>
        </FlowEngineProvider>
      </APIClientContext.Provider>
    );

    return { wrapper, routeRepository, resource, api };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use route repository for desktop routes', async () => {
    const { wrapper, routeRepository, resource } = createWrapper();
    const { result } = renderHook(() => useNocoBaseRoutes('desktopRoutes'), { wrapper });

    await act(async () => {
      await result.current.createRoute({ title: 'Desktop menu' } as any);
    });

    expect(routeRepository.createRoute).toHaveBeenCalledWith(
      { title: 'Desktop menu' },
      {
        refreshAfterMutation: true,
      },
    );
    expect(resource.create).not.toHaveBeenCalled();
  });

  it('should bypass route repository for mobile routes', async () => {
    const { wrapper, routeRepository, resource, api } = createWrapper();
    const { result } = renderHook(() => useNocoBaseRoutes('mobileRoutes'), { wrapper });

    await act(async () => {
      await result.current.updateRoute(2, { title: 'Mobile menu' } as any);
      await result.current.deleteRoute(2);
      await result.current.moveRoute({
        sourceId: 2,
        targetId: 3,
        method: 'insertAfter',
      });
    });

    expect(routeRepository.updateRoute).not.toHaveBeenCalled();
    expect(routeRepository.deleteRoute).not.toHaveBeenCalled();
    expect(routeRepository.moveRoute).not.toHaveBeenCalled();
    expect(api.resource).toHaveBeenCalledWith('mobileRoutes');
    expect(resource.update).toHaveBeenCalledWith({
      filterByTk: 2,
      values: { title: 'Mobile menu' },
    });
    expect(resource.destroy).toHaveBeenCalledWith({
      filterByTk: 2,
    });
    expect(resource.move).toHaveBeenCalledWith({
      sourceId: 2,
      targetId: 3,
      targetScope: undefined,
      sortField: undefined,
      sticky: undefined,
      method: 'insertAfter',
    });
  });
});
