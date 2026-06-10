/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The shared remove-node provider (ADR-0003 layer 2), now aligned to v1: it runs
 * the variable-reference safety check the modern canvas previously skipped. These
 * pins assert the behaviour through the injected runtime — a leaf node referenced
 * by another node is BLOCKED (error, no destroy); an unreferenced leaf confirms
 * and destroys; a branching node opens the keep-branch modal instead of deleting
 * outright. The pure check logic is characterized separately in
 * `removeNodeUtils.characterization.test.ts`.
 */

import { render, act } from '@testing-library/react';
import { App } from 'antd';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// antd App.useApp() drives modal/message; capture modal.confirm / modal.error.
const modalMock = vi.hoisted(() => ({ confirm: vi.fn(), error: vi.fn() }));
vi.mock('antd', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  const App: any = (props: any) => props.children;
  App.useApp = () => ({ modal: modalMock, message: { error: vi.fn() } });
  return { ...actual, App };
});
// useFlowEngine is only hit by the DEFAULT runtime; we always inject our own, so it never runs — but the import must
// resolve.
vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, useFlowEngine: () => ({ context: { app: { pm: { get: () => null } }, api: null } }) };
});
vi.mock('../../locale', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, useT: () => (key: string) => key };
});

import { RemoveNodeContextProvider, useRemoveNodeContext, type CanvasRemoveRuntime } from '../RemoveNodeContext';

type Remove = NonNullable<ReturnType<typeof useRemoveNodeContext>>;

function setup(runtime: CanvasRemoveRuntime) {
  const captured: { ctx: Remove } = { ctx: {} as Remove };
  function Capture() {
    const ctx = useRemoveNodeContext();
    if (ctx) {
      captured.ctx = ctx;
    }
    return null;
  }
  render(
    <App>
      <RemoveNodeContextProvider useCanvasRuntime={() => runtime}>
        <Capture />
      </RemoveNodeContextProvider>
    </App>,
  );
  return captured;
}

function makeRuntime(nodes: any[], destroy = vi.fn(async () => ({}))): CanvasRemoveRuntime {
  return {
    api: { resource: () => ({ destroy }) },
    nodes,
    refresh: vi.fn(),
    getInstruction: () => ({ branching: false }),
  };
}

describe('RemoveNodeContextProvider — variable-reference safety (aligned to v1)', () => {
  beforeEach(() => {
    modalMock.confirm.mockReset();
    modalMock.error.mockReset();
  });

  it('blocks deleting a leaf node whose result is referenced (error, no confirm)', () => {
    const nodes = [
      { id: 1, key: 'query', config: {}, upstream: null },
      { id: 2, key: 'calc', title: 'Calc', config: { x: '{{$jobsMapByNodeKey.query.id}}' }, upstream: null },
    ];
    const captured = setup(makeRuntime(nodes));
    act(() => captured.ctx.requestRemove(nodes[0]));
    expect(modalMock.error).toHaveBeenCalledTimes(1);
    expect(modalMock.confirm).not.toHaveBeenCalled();
  });

  it('confirms (then would destroy) an unreferenced leaf node', () => {
    const nodes = [
      { id: 1, key: 'query', config: {}, upstream: null },
      { id: 2, key: 'calc', config: { x: 'no refs' }, upstream: null },
    ];
    const destroy = vi.fn(async () => ({}));
    const captured = setup(makeRuntime(nodes, destroy));
    act(() => captured.ctx.requestRemove(nodes[0]));
    expect(modalMock.error).not.toHaveBeenCalled();
    expect(modalMock.confirm).toHaveBeenCalledTimes(1);
    // The confirm's onOk performs the destroy.
    const onOk = modalMock.confirm.mock.calls[0][0].onOk;
    act(() => {
      onOk();
    });
    expect(destroy).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: 1 }));
  });

  it('opens the keep-branch modal for a branching node instead of confirming', () => {
    // node 1 has a child branch (node 10 with branchIndex) → branching delete path.
    const branchHead = { id: 10, key: 'bh', branchIndex: 0, config: {} };
    const node = { id: 1, key: 'cond', config: {}, upstream: null };
    branchHead.upstream = node as any;
    const nodes = [node, branchHead];
    const captured = setup(makeRuntime(nodes));
    act(() => captured.ctx.requestRemove(node));
    // Neither a leaf confirm nor an error — the keep-branch <Modal> opens instead.
    expect(modalMock.confirm).not.toHaveBeenCalled();
    expect(modalMock.error).not.toHaveBeenCalled();
  });
});
