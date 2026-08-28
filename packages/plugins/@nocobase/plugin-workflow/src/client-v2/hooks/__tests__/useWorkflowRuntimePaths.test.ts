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
}));

vi.mock('@nocobase/client-v2', () => ({
  getRouteRuntimeVersion: () => holder.runtime,
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

    expect(isWorkflowV2Runtime()).toBe(false);
    expect(getWorkflowCanvasRuntimePath(123)).toBe('/admin/settings/workflow/workflows/123');
    expect(getWorkflowExecutionRuntimePath(456)).toBe('/admin/settings/workflow/executions/456');
  });

  it('maps modern runtime to modern workflow routes', () => {
    holder.runtime = 'modern';

    expect(isWorkflowV2Runtime()).toBe(true);
    expect(getWorkflowCanvasRuntimePath(123)).toBe('/admin/workflow/workflows/123');
    expect(getWorkflowExecutionRuntimePath(456)).toBe('/admin/workflow/executions/456');
  });

  it('exposes memoized route helpers through the hook', () => {
    holder.runtime = 'modern';

    const { result } = renderHook(() => useWorkflowRuntimePaths());
    expect(result.current.isV2Runtime).toBe(true);
    expect(result.current.getWorkflowCanvasPath(123)).toBe('/admin/workflow/workflows/123');
    expect(result.current.getWorkflowExecutionPath(456)).toBe('/admin/workflow/executions/456');
  });
});
