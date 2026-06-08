/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * client-v2 copy of the drop-impact pure-walk baseline (ADR-0003, doc §9.8).
 * Same cases as the v1 characterization test against the relocated source,
 * proving the move caused zero drift. Shared by both canvases' drag/clipboard
 * Providers.
 */

import { describe, expect, it } from 'vitest';
import { collectDownstreams, collectBranchSubtree } from '../dropImpact';

// condition node (1) with two branches, then node 2.
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
  const branchChildrenMap = new Map<number, any[]>([[1, [n10, n20]]]);
  return { n1, n2, n10, n11, n20, branchChildrenMap };
}

describe('collectDownstreams (client-v2)', () => {
  it('walks the main chain and recurses into every branch subtree', () => {
    const { n1, branchChildrenMap } = makeGraph();
    expect([...collectDownstreams(n1, branchChildrenMap)].sort((a, b) => a - b)).toEqual([1, 2, 10, 11, 20]);
  });

  it('null start → empty; mid-branch start walks only that branch', () => {
    const { n10, branchChildrenMap } = makeGraph();
    expect(collectDownstreams(null, branchChildrenMap).size).toBe(0);
    expect([...collectDownstreams(n10, branchChildrenMap)].sort((a, b) => a - b)).toEqual([10, 11]);
  });
});

describe('collectBranchSubtree (client-v2)', () => {
  it('collects root + branch subtrees, excluding the main downstream', () => {
    const { n1, branchChildrenMap } = makeGraph();
    expect([...collectBranchSubtree(n1, branchChildrenMap)].sort((a, b) => a - b)).toEqual([1, 10, 11, 20]);
  });

  it('a node with no branches yields just itself; null root → empty', () => {
    const { n11, branchChildrenMap } = makeGraph();
    expect([...collectBranchSubtree(n11, branchChildrenMap)]).toEqual([11]);
    expect(collectBranchSubtree(null, branchChildrenMap).size).toBe(0);
  });
});
