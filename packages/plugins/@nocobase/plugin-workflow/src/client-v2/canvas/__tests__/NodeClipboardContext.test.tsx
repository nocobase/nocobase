/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Proves the shared clipboard provider (ADR-0003 layer 2) is driven entirely by
 * its injected `useCanvasRuntime` hook — the seam that lets ONE provider serve
 * both canvases. The legacy canvas injects v1's runtime (its `FlowContext` +
 * `versionStats.executed`), the modern canvas the v2 one; here we inject a
 * controlled runtime and assert copy/paste reads from it (the `executed` guard,
 * the flow data, the `flow_nodes.duplicate` call). The pure paste-impact math is
 * covered separately by `nodeVariableUtils.characterization.test.ts`.
 */

import { render, act, waitFor } from '@testing-library/react';
import { App } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// Controlled flow-engine ctx (only `api` is read by the provider).
const holder = vi.hoisted(() => ({ duplicate: vi.fn(async () => ({})) }));
vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useFlowContext: () => ({ api: { resource: () => ({ duplicate: holder.duplicate }) } }),
  };
});
vi.mock('../../locale', () => ({ useT: () => (key: string) => key }));

import {
  NodeClipboardContextProvider,
  useNodeClipboardContext,
  type CanvasClipboardRuntime,
} from '../NodeClipboardContext';

type Clipboard = NonNullable<ReturnType<typeof useNodeClipboardContext>>;

function setup(runtime: CanvasClipboardRuntime) {
  const captured: { ctx: Clipboard } = { ctx: {} as Clipboard };
  function Capture() {
    const ctx = useNodeClipboardContext();
    if (ctx) {
      captured.ctx = ctx;
    }
    return null;
  }
  render(
    <App>
      <NodeClipboardContextProvider useCanvasRuntime={() => runtime}>
        <Capture />
      </NodeClipboardContextProvider>
    </App>,
  );
  return captured;
}

const NODE = { id: 1, key: 'n1', type: 'query', title: 'Query', config: {} };

describe('NodeClipboardContextProvider — injected runtime drives copy/paste', () => {
  it('copies a node when the injected runtime is not executed', () => {
    const captured = setup({ workflow: { id: 9 }, nodes: [NODE], refresh: vi.fn(), executed: false });
    act(() => captured.ctx.copyNode(NODE));
    expect(captured.ctx.clipboard?.sourceId).toBe(1);
  });

  it('refuses to copy when the injected runtime reports executed (read-only)', () => {
    // The legacy canvas derives `executed` from `versionStats.executed`; whatever the source, the provider honors the
    // injected boolean.
    const captured = setup({ workflow: { id: 9 }, nodes: [NODE], refresh: vi.fn(), executed: true });
    act(() => captured.ctx.copyNode(NODE));
    expect(captured.ctx.clipboard).toBeNull();
  });

  it('pastes via flow_nodes.duplicate using the injected workflow + refresh', async () => {
    const refresh = vi.fn();
    const captured = setup({ workflow: { id: 9 }, nodes: [NODE], refresh, executed: false });
    act(() => captured.ctx.copyNode(NODE));
    // A safe paste (no variable refs) duplicates immediately and refreshes.
    await act(async () => {
      await captured.ctx.pasteNode({ upstream: null, branchIndex: null });
    });
    await waitFor(() => {
      expect(holder.duplicate).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: 1 }));
      expect(refresh).toHaveBeenCalled();
    });
  });
});
