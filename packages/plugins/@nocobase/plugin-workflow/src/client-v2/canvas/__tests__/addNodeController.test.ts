/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { createNodeAndMaybeReparent, resolveAddNodeDecision } from '../addNodeController';

describe('resolveAddNodeDecision', () => {
  const translateTitle = (title: string) => title;

  it('returns modern-preset for loader-based nodes and carries downstream presence', () => {
    const instruction = {
      type: 'condition',
      title: 'Condition',
      createDefaultConfig: () => ({ rejectOnFalse: true }),
      PresetFieldsetLoader: async () => ({ default: () => null }),
    } as any;

    const decision = resolveAddNodeDecision({
      type: 'condition',
      anchor: { upstream: { id: 1 }, branchIndex: 0 },
      runtime: {
        workflow: { id: 1 },
        nodes: [{ id: 2, upstreamId: 1, branchIndex: 0 }],
        getInstruction: () => instruction,
        translateTitle,
      },
    });

    expect(decision).toMatchObject({
      kind: 'modern-preset',
      instruction,
      hasDownstream: true,
    });
  });

  it('returns branch-fallback for branching nodes without preset loaders', () => {
    const instruction = {
      type: 'multi-conditions',
      title: 'Multi conditions',
      createDefaultConfig: () => ({ conditions: [{ uid: '1' }] }),
      branching: [{ label: 'First condition', value: 1 }],
    } as any;

    const decision = resolveAddNodeDecision({
      type: 'multi-conditions',
      anchor: { upstream: { id: 1 }, branchIndex: 0 },
      runtime: {
        workflow: { id: 1 },
        nodes: [{ id: 2, upstreamId: 1, branchIndex: 0 }],
        getInstruction: () => instruction,
        translateTitle,
      },
    });

    expect(decision).toMatchObject({
      kind: 'branch-fallback',
      instruction,
      draft: {
        type: 'multi-conditions',
        upstreamId: 1,
        branchIndex: 0,
        title: 'Multi conditions',
      },
    });
  });

  it('keeps branch-fallback for multi-conditions so the UI can open the downstream-placement dialog first', () => {
    const instruction = {
      type: 'multi-conditions',
      title: 'Multi conditions',
      createDefaultConfig: () => ({ conditions: [{ uid: '1' }], continueOnNoMatch: false }),
      branching: [
        { label: 'First condition', value: 1 },
        { label: 'Otherwise', value: 0 },
      ],
    } as any;

    const decision = resolveAddNodeDecision({
      type: 'multi-conditions',
      anchor: { upstream: { id: 10 }, branchIndex: null },
      runtime: {
        workflow: { id: 1 },
        nodes: [{ id: 11, upstreamId: 10, branchIndex: null }],
        getInstruction: () => instruction,
        translateTitle,
      },
    });

    expect(decision.kind).toBe('branch-fallback');
  });

  it('returns blocked when runtime availability says no', () => {
    const instruction = {
      type: 'async-node',
      title: 'Async node',
      createDefaultConfig: () => ({}),
    } as any;

    const decision = resolveAddNodeDecision({
      type: 'async-node',
      anchor: { upstream: { id: 1 }, branchIndex: 0, branchContext: { syncOnly: true } },
      runtime: {
        workflow: { id: 1 },
        nodes: [],
        getInstruction: () => instruction,
        getInstructionAvailable: () => 'This branch does not support asynchronous nodes.',
        translateTitle,
      },
    });

    expect(decision).toEqual({
      kind: 'blocked',
      message: 'This branch does not support asynchronous nodes.',
      instruction,
    });
  });
});

describe('createNodeAndMaybeReparent', () => {
  it('re-parents downstream only when downstreamBranchIndex is numeric', async () => {
    const create = vi.fn().mockResolvedValue({ data: { data: { id: 10, downstreamId: 20 } } });
    const update = vi.fn().mockResolvedValue({});
    const refresh = vi.fn();
    const api = {
      resource: (name: string) => {
        if (name === 'workflows.nodes') {
          return { create };
        }
        if (name === 'flow_nodes') {
          return { update };
        }
        throw new Error(`unexpected resource ${name}`);
      },
    };

    await createNodeAndMaybeReparent({
      workflowId: 1,
      api,
      refresh,
      values: { type: 'condition' },
      downstreamBranchIndex: 0,
    });

    expect(create).toHaveBeenCalledWith({ values: { type: 'condition' } });
    expect(update).toHaveBeenCalledWith({
      filterByTk: 20,
      values: {
        branchIndex: 0,
        upstream: { id: 10, downstreamId: null },
      },
      updateAssociationValues: ['upstream'],
    });
    expect(refresh).toHaveBeenCalled();
  });
});
