/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v1 baseline for the two canvas contexts (ADR-0003 layer 2), written BEFORE the
 * merge so it characterizes the legacy shape, then re-runs unchanged after
 * `client/FlowContext` becomes a re-export of the client-v2 definition. Pins:
 *   - the editor-canvas value `{ workflow, nodes, refresh }` round-trips;
 *   - the execution-canvas value `{ workflow, nodes, execution, viewJob,
 *     setViewJob }` round-trips (the fields v2 had not modeled);
 *   - `CurrentWorkflowContext` carries the bare `workflow` value (v1's split).
 * Defaults (no provider) match v1's `{}` so unguarded `.field` reads stay safe.
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FlowContext, useFlowContext, CurrentWorkflowContext, useCurrentWorkflowContext } from '../FlowContext';
// The original definitions in client-v2 (the re-export source).
import {
  FlowContext as SharedFlowContext,
  CurrentWorkflowContext as SharedCurrentWorkflowContext,
} from '../../client-v2/canvas/contexts';

describe('v1 FlowContext — re-exports the shared client-v2 instances', () => {
  it('are the very same context objects as client-v2 (not second instances)', () => {
    // If the re-export accidentally created a new context, v1 providers and v2 consumers (e.g. the shared Node card)
    // would silently miss each other.
    expect(FlowContext).toBe(SharedFlowContext);
    expect(CurrentWorkflowContext).toBe(SharedCurrentWorkflowContext);
  });
});

describe('v1 FlowContext / CurrentWorkflowContext — baseline shape', () => {
  it('defaults to an empty object when no provider (v1 `{}` default)', () => {
    expect(renderHook(() => useFlowContext()).result.current).toEqual({});
    expect(renderHook(() => useCurrentWorkflowContext()).result.current).toEqual({});
  });

  it('round-trips the editor-canvas value `{ workflow, nodes, refresh }`', () => {
    const refresh = vi.fn();
    const value = { workflow: { id: 1, type: 'collection' }, nodes: [{ key: 'n1' }], refresh };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
    );
    expect(renderHook(() => useFlowContext(), { wrapper }).result.current).toBe(value);
  });

  it('round-trips the execution-canvas value `{ workflow, nodes, execution, viewJob, setViewJob }`', () => {
    const setViewJob = vi.fn();
    const value = {
      workflow: { id: 1, type: 'collection' },
      nodes: [{ key: 'n1' }],
      execution: { id: 9, status: 1 },
      viewJob: { id: 3 },
      setViewJob,
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
    );
    const ctx = renderHook(() => useFlowContext(), { wrapper }).result.current;
    expect(ctx.execution).toEqual({ id: 9, status: 1 });
    expect(ctx.viewJob).toEqual({ id: 3 });
    expect(ctx.setViewJob).toBe(setViewJob);
  });

  it('CurrentWorkflowContext carries the bare workflow value (v1 split)', () => {
    const workflow = { id: 7, type: 'schedule', config: { cron: '* * * * *' } };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CurrentWorkflowContext.Provider value={workflow}>{children}</CurrentWorkflowContext.Provider>
    );
    expect(renderHook(() => useCurrentWorkflowContext(), { wrapper }).result.current).toBe(workflow);
  });
});
