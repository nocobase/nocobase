/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v1 side of the shared remove-node context (ADR-0003 layer 2). The provider lives
 * in client-v2; v1 keeps a thin wrapper injecting its own runtime (v1
 * `useAPIClient` / `FlowContext` / instruction registry). These pins assert:
 *   1. the v1 hook re-export is the same instance the shared provider feeds, and
 *   2. the legacy runtime is wired correctly (api + flow data + a `getInstruction`
 *      that resolves through the v1 plugin registry).
 *
 * The shared provider is mocked to capture the injected runtime, isolating the v1
 * wiring from `@nocobase/client`. The provider's own safety-check behaviour is
 * covered by `client-v2/canvas/__tests__/RemoveNodeContext.test.tsx`.
 */

import { render, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  api: { resource: vi.fn() },
  flow: { nodes: [{ key: 'n1' }] as any, refresh: vi.fn() },
  instructions: new Map<string, any>([['condition', { branching: false }]]),
}));

// v1 deps — mock so the wrapper import stays light (no real @nocobase/client).
vi.mock('@nocobase/client', () => ({
  useAPIClient: () => holder.api,
  usePlugin: () => ({ instructions: holder.instructions }),
}));
vi.mock('../FlowContext', () => ({ useFlowContext: () => holder.flow }));
// The v1 wrapper imports the plugin default (`from '.'`) only as a usePlugin token.
vi.mock('..', () => ({ default: class PluginWorkflowClient {} }));

// Capture the runtime the wrapper injects + the shared hook identity.
const sharedHook = vi.hoisted(() => () => null);
const captured = vi.hoisted(() => ({ useCanvasRuntime: null as null | (() => any) }));
vi.mock('../../client-v2/canvas/RemoveNodeContext', () => ({
  RemoveNodeContextProvider: (props: any) => {
    captured.useCanvasRuntime = props.useCanvasRuntime;
    return props.children ?? null;
  },
  useRemoveNodeContext: sharedHook,
}));

import { RemoveNodeContextProvider, useRemoveNodeContext } from '../RemoveNodeContext';

function resolveInjectedRuntime() {
  render(<RemoveNodeContextProvider>{null}</RemoveNodeContextProvider>);
  const useRuntime = captured.useCanvasRuntime;
  if (!useRuntime) {
    throw new Error('wrapper did not inject a useCanvasRuntime');
  }
  return renderHook(() => useRuntime()).result.current;
}

describe('v1 RemoveNodeContextProvider — injects the legacy canvas runtime', () => {
  it('re-exports the shared `useRemoveNodeContext` (one hook, not a v1 copy)', () => {
    expect(useRemoveNodeContext).toBe(sharedHook);
  });

  it('forwards v1 api + flow data, and resolves instructions through the v1 registry', () => {
    const runtime = resolveInjectedRuntime();
    expect(runtime.api).toBe(holder.api);
    expect(runtime.nodes).toBe(holder.flow.nodes);
    expect(runtime.refresh).toBe(holder.flow.refresh);
    // getInstruction must hit the v1 plugin's `instructions` registry.
    expect(runtime.getInstruction('condition')).toEqual({ branching: false });
    expect(runtime.getInstruction('missing')).toBeUndefined();
  });
});
