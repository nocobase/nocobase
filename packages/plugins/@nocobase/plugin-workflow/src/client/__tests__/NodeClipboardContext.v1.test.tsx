/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v1 side of the shared clipboard context (ADR-0003 layer 2). The provider lives
 * in client-v2; v1 keeps a thin wrapper that injects its OWN canvas runtime — v1's
 * `FlowContext` plus `versionStats.executed` (a BigInt) coerced to the `executed`
 * boolean. This pins the two things the v1 wrapper is responsible for:
 *   1. the legacy runtime is wired into the shared provider (so v1 and v2 share one
 *      implementation), and
 *   2. the v1-specific `versionStats.executed` BigInt is correctly reduced to the
 *      boolean the provider's read-only guard expects.
 *
 * The shared provider is mocked to capture the injected `useCanvasRuntime`, so this
 * test isolates the v1 wiring without dragging in the full provider or
 * `@nocobase/client`. The shared provider's own behaviour is covered by
 * `client-v2/canvas/__tests__/NodeClipboardContext.test.tsx`.
 */

import { render, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Controlled v1 runtime sources.
const holder = vi.hoisted(() => ({
  flow: { workflow: undefined as any, nodes: undefined as any, refresh: undefined as any },
  executed: 0n as bigint,
}));

// v1 FlowContext (light — bare createContext) → return our controlled value.
vi.mock('../FlowContext', () => ({
  useFlowContext: () => holder.flow,
}));

// v1 hooks barrel pulls `@nocobase/client`-importing siblings; mock it to the one hook the wrapper uses, returning the
// BigInt executed count (v1's real shape).
vi.mock('../hooks', () => ({
  useWorkflowExecuted: () => holder.executed,
}));

// Capture the runtime hook the wrapper injects into the shared provider.
const sharedHook = vi.hoisted(() => () => null);
const captured = vi.hoisted(() => ({ useCanvasRuntime: null as null | (() => any) }));
vi.mock('../../client-v2/canvas/NodeClipboardContext', () => ({
  NodeClipboardContextProvider: (props: any) => {
    captured.useCanvasRuntime = props.useCanvasRuntime;
    return props.children ?? null;
  },
  useNodeClipboardContext: sharedHook,
}));

import { NodeClipboardContextProvider, useNodeClipboardContext } from '../NodeClipboardContext';

/** Render the wrapper (which injects its runtime hook into the mocked provider),
 *  then run that hook inside a hook host so the mocked v1 hooks are valid. */
function resolveInjectedRuntime() {
  render(<NodeClipboardContextProvider>{null}</NodeClipboardContextProvider>);
  const useRuntime = captured.useCanvasRuntime;
  if (!useRuntime) {
    throw new Error('wrapper did not inject a useCanvasRuntime');
  }
  return renderHook(() => useRuntime()).result.current;
}

describe('v1 NodeClipboardContextProvider — injects the legacy canvas runtime', () => {
  it('re-exports the shared `useNodeClipboardContext` (one hook, not a v1 copy)', () => {
    // v1 consumers read through the same hook the shared provider feeds — if the re-export created a separate
    // hook/context, copy/paste state would silently not propagate.
    expect(useNodeClipboardContext).toBe(sharedHook);
  });

  it('forwards v1 FlowContext flow data into the shared provider', () => {
    const refresh = vi.fn();
    holder.flow = { workflow: { id: 7 }, nodes: [{ key: 'n1' }], refresh };
    holder.executed = 0n;

    const runtime = resolveInjectedRuntime();
    expect(runtime.workflow).toEqual({ id: 7 });
    expect(runtime.nodes).toEqual([{ key: 'n1' }]);
    expect(runtime.refresh).toBe(refresh);
  });

  it('coerces a zero versionStats.executed BigInt to executed=false (editable)', () => {
    holder.flow = { workflow: { id: 7 }, nodes: [], refresh: vi.fn() };
    holder.executed = 0n;

    expect(resolveInjectedRuntime().executed).toBe(false);
  });

  it('coerces a non-zero versionStats.executed BigInt to executed=true (read-only)', () => {
    // The real-world case behind "an executed workflow hides the node ... menu": versionStats.executed is a BigInt
    // count; any non-zero value means executed.
    holder.flow = { workflow: { id: 7 }, nodes: [], refresh: vi.fn() };
    holder.executed = 3n;

    expect(resolveInjectedRuntime().executed).toBe(true);
  });
});
