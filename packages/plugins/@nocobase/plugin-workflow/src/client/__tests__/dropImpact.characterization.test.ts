/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * GOLDEN BASELINE (characterization) for the drag drop-impact pure graph walks
 * (`collectDownstreams`, `collectBranchSubtree`) currently living inside
 * `NodeDragContext`. Per migration doc §9.6, these pure calculations are
 * extracted to client-v2 and shared by both canvases' drag Providers; the DOM
 * side effects stay per-canvas. This file pins their behavior before extraction
 * and re-runs green against the relocated copy.
 *
 * (They were just made `export` — a behavior-neutral visibility change — so the
 * baseline can reach them; the extraction reuses the same exports.)
 *
 * Deleted with v1 at retirement; the client-v2 copy lives on.
 */

import { describe, expect, it } from 'vitest';
import { collectDownstreams, collectBranchSubtree } from '../NodeDragContext';

// Fixture: a condition node (1) with two branches, followed by node 2.
//   1 ─┬─ branch(idx1): 10 → 11
//      └─ branch(idx0): 20
//   1 → 2 (main downstream)
function makeGraph() {
  const n1: any = { id: 1, branchIndex: null, upstreamId: null };
  const n2: any = { id: 2, branchIndex: null, upstreamId: null };
  const n10: any = { id: 10, branchIndex: 1, upstreamId: 1 };
  const n11: any = { id: 11, branchIndex: null, upstreamId: null };
  const n20: any = { id: 20, branchIndex: 0, upstreamId: 1 };

  n1.downstream = n2;
  n10.downstream = n11;
  // branchChildrenMap: upstreamId → branch-head nodes
  const branchChildrenMap = new Map<number, any[]>([[1, [n10, n20]]]);
  return { n1, n2, n10, n11, n20, branchChildrenMap };
}

describe('collectDownstreams — golden baseline (v1)', () => {
  it('walks the main chain and recurses into every branch subtree', () => {
    const { n1, branchChildrenMap } = makeGraph();
    const ids = collectDownstreams(n1, branchChildrenMap);
    // root + its main downstream + both branch heads + the nested branch child.
    expect([...ids].sort((a, b) => a - b)).toEqual([1, 2, 10, 11, 20]);
  });

  it('returns an empty set for a null start', () => {
    const { branchChildrenMap } = makeGraph();
    expect(collectDownstreams(null, branchChildrenMap).size).toBe(0);
  });

  it('starting mid-branch walks only that branch downstream', () => {
    const { n10, branchChildrenMap } = makeGraph();
    expect([...collectDownstreams(n10, branchChildrenMap)].sort((a, b) => a - b)).toEqual([10, 11]);
  });
});

describe('collectBranchSubtree — golden baseline (v1)', () => {
  it('collects the root plus all of its branch subtrees, excluding the main downstream', () => {
    const { n1, branchChildrenMap } = makeGraph();
    const ids = collectBranchSubtree(n1, branchChildrenMap);
    // root(1) + branch heads(10,20) + nested(11); NOT the main-chain node 2.
    expect([...ids].sort((a, b) => a - b)).toEqual([1, 10, 11, 20]);
  });

  it('a node with no branches yields just itself', () => {
    const { n11, branchChildrenMap } = makeGraph();
    expect([...collectBranchSubtree(n11, branchChildrenMap)]).toEqual([11]);
  });

  it('returns an empty set for a null root', () => {
    const { branchChildrenMap } = makeGraph();
    expect(collectBranchSubtree(null, branchChildrenMap).size).toBe(0);
  });
});
