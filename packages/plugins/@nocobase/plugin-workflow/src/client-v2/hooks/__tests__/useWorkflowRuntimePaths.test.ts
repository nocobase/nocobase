/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const holder = vi.hoisted(() => ({
  runtime: 'legacy' as 'legacy' | 'modern',
  routeName: 'admin.settings.',
  routeRoot: '/admin/settings/',
}));

vi.mock('@nocobase/client-v2', () => ({
  getRouteRuntimeVersion: () => holder.runtime,
  useApp: () => ({
    pluginSettingsManager: {
      getRouteName: () => holder.routeName,
      getRoutePath: () => holder.routeRoot,
    },
  }),
}));

import {
  getWorkflowCanvasRuntimePath,
  getWorkflowExecutionRuntimePath,
  isWorkflowV2Runtime,
  useWorkflowRuntimePaths,
} from '../useWorkflowRuntimePaths';

describe('useWorkflowRuntimePaths', () => {
  it('maps legacy runtime to legacy workflow routes', () => {
    holder.runtime = 'legacy';
    holder.routeName = 'admin.settings.';
    holder.routeRoot = '/admin/settings/';

    expect(isWorkflowV2Runtime()).toBe(false);
    expect(getWorkflowCanvasRuntimePath(123)).toBe('/admin/settings/workflow/workflows/123');
    expect(getWorkflowExecutionRuntimePath(456)).toBe('/admin/settings/workflow/executions/456');
  });

  it('maps modern runtime to modern workflow routes', () => {
    holder.runtime = 'modern';
    holder.routeName = 'admin.settings.';
    holder.routeRoot = '/admin/settings/';

    expect(isWorkflowV2Runtime()).toBe(true);
    expect(getWorkflowCanvasRuntimePath(123)).toBe('/settings/workflow/workflows/123');
    expect(getWorkflowExecutionRuntimePath(456)).toBe('/settings/workflow/executions/456');
  });

  it('exposes memoized route helpers through the hook', () => {
    holder.runtime = 'modern';
    holder.routeName = 'admin.settings.';
    holder.routeRoot = '/admin/settings/';

    const { result } = renderHook(() => useWorkflowRuntimePaths());
    expect(result.current.isV2Runtime).toBe(true);
    expect(result.current.getWorkflowCanvasPath(123)).toBe('/settings/workflow/workflows/123');
    expect(result.current.getWorkflowExecutionPath(456)).toBe('/settings/workflow/executions/456');
  });

  it('derives scoped Settings detail routes from the current manager root', () => {
    holder.runtime = 'legacy';
    holder.routeName = 'settings.';
    holder.routeRoot = '/';

    const { result } = renderHook(() => useWorkflowRuntimePaths());
    expect(result.current.isV2Runtime).toBe(true);
    expect(result.current.getWorkflowCanvasPath(123)).toBe('/workflow/workflows/123');
    expect(result.current.getWorkflowExecutionPath(456)).toBe('/workflow/executions/456');
  });
});
