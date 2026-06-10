/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v1 side of the shared drag context (ADR-0003 layer 2). The provider lives in
 * client-v2; v1 keeps a thin wrapper that injects its OWN canvas runtime — v1's
 * `useAPIClient`, the two v1 translators (`lang` plain-key + `useCompile`
 * template), the v1 instruction registry, and `versionStats.executed` (a BigInt)
 * coerced to the `executed` boolean. This pins what the wrapper is responsible for:
 *   1. it re-exports the shared hook (one context, not a v1 copy), and
 *   2. the legacy runtime is wired into the shared provider — api / lang / compile
 *      / getInstruction each forwarded, and the BigInt executed reduced to boolean.
 *
 * The shared provider is mocked to capture the injected `useCanvasRuntime`, so this
 * isolates the v1 wiring from the full provider and `@nocobase/client`. The shared
 * provider's own drag behaviour is covered in client-v2 (and by the pure
 * `dropImpact` characterization tests).
 */

import { render, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Controlled v1 runtime sources.
const holder = vi.hoisted(() => ({
  api: { resource: vi.fn() },
  instructions: new Map<string, any>([['query', { type: 'query', title: '{{t("Query")}}' }]]),
  executed: 0n as bigint,
}));

// v1 deps — mocked so the wrapper import stays light (no real @nocobase/client).
vi.mock('@nocobase/client', () => ({
  useAPIClient: () => holder.api,
  // `useCompile` returns a compiler; here identity is enough to assert wiring.
  useCompile: () => (source: string) => `compiled:${source}`,
  usePlugin: () => ({ instructions: holder.instructions }),
}));
// `lang` (plain-key translator) — tag the output so we can assert it's the one wired.
vi.mock('../locale', () => ({ lang: (key: string) => `lang:${key}` }));
// v1 hooks barrel pulls @nocobase/client-importing siblings; mock to the one hook the wrapper uses, returning the
// BigInt executed count (v1's real shape).
vi.mock('../hooks', () => ({ useWorkflowExecuted: () => holder.executed }));
// The wrapper imports the plugin default (`from '.'`) only as a usePlugin token.
vi.mock('..', () => ({ default: class PluginWorkflowClient {} }));

// Capture the runtime hook the wrapper injects + the shared hook identity.
const sharedHook = vi.hoisted(() => () => null);
const captured = vi.hoisted(() => ({ useCanvasRuntime: null as null | (() => any) }));
vi.mock('../../client-v2/canvas/NodeDragContext', () => ({
  NodeDragContextProvider: (props: any) => {
    captured.useCanvasRuntime = props.useCanvasRuntime;
    return props.children ?? null;
  },
  useNodeDragContext: sharedHook,
}));

import { NodeDragContextProvider, useNodeDragContext } from '../NodeDragContext';

/** Render the wrapper (which injects its runtime hook into the mocked provider),
 *  then run that hook inside a hook host so the mocked v1 hooks are valid. */
function resolveInjectedRuntime() {
  render(<NodeDragContextProvider>{null}</NodeDragContextProvider>);
  const useRuntime = captured.useCanvasRuntime;
  if (!useRuntime) {
    throw new Error('wrapper did not inject a useCanvasRuntime');
  }
  return renderHook(() => useRuntime()).result.current;
}

describe('v1 NodeDragContextProvider — injects the legacy canvas runtime', () => {
  it('re-exports the shared `useNodeDragContext` (one hook, not a v1 copy)', () => {
    expect(useNodeDragContext).toBe(sharedHook);
  });

  it('forwards v1 api, and resolves instructions through the v1 registry', () => {
    holder.executed = 0n;
    const runtime = resolveInjectedRuntime();
    expect(runtime.api).toBe(holder.api);
    expect(runtime.getInstruction('query')).toEqual({ type: 'query', title: '{{t("Query")}}' });
    expect(runtime.getInstruction('missing')).toBeUndefined();
  });

  it('wires the two distinct translators: lang (plain) and compile (template)', () => {
    const runtime = resolveInjectedRuntime();
    // lang resolves plain keys; compile expands titles — they must be the v1 functions, not collapsed into one.
    expect(runtime.lang('Confirm move')).toBe('lang:Confirm move');
    expect(runtime.compile('{{t("Query")}}')).toBe('compiled:{{t("Query")}}');
  });

  it('coerces a zero versionStats.executed BigInt to executed=false (editable)', () => {
    holder.executed = 0n;
    expect(resolveInjectedRuntime().executed).toBe(false);
  });

  it('coerces a non-zero versionStats.executed BigInt to executed=true (read-only)', () => {
    holder.executed = 3n;
    expect(resolveInjectedRuntime().executed).toBe(true);
  });
});
