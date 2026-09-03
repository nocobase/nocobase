/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Golden baseline for the remove-node safety logic, characterizing v1's behaviour
 * BEFORE the modern canvas is aligned to it. v1 splits this across two inline
 * spots — the leaf-delete guard in `RemoveButton.onRemove` (`$jobsMapByNodeKey`
 * only) and the branching-delete guard in `useRemoveNodeSubmitAction`
 * (`$jobsMapByNodeKey` + `$scopes`, over the kept-branch + downstream subtree).
 * These pins lock that behaviour into the relocated pure helpers so the v2
 * alignment (and the later shared-context migration) can be proven to preserve it.
 *
 * Run green now against the extracted helpers; re-run unchanged after v1 imports
 * them back from client-v2.
 */

import { describe, expect, it } from 'vitest';
import { collectBranchNodes, findNodesReferencing } from '../../client-v2/canvas/removeNodeUtils';
import { linkNodes } from '../utils';

// Build a linked node graph (ids + upstreamId/downstreamId/branchIndex), then `linkNodes` wires the
// `upstream`/`downstream`/object refs the helpers walk.
function makeGraph(defs: any[]) {
  const nodes = defs.map((d) => ({ branchIndex: null, upstreamId: null, downstreamId: null, config: {}, ...d }));
  linkNodes(nodes);
  return nodes;
}

describe('findNodesReferencing — leaf delete guard ($jobsMapByNodeKey only)', () => {
  it('finds other nodes referencing the target node result', () => {
    const nodes = makeGraph([
      { id: 1, key: 'query', config: {} },
      { id: 2, key: 'calc', title: 'Calc', config: { x: '{{$jobsMapByNodeKey.query.data.id}}' } },
      { id: 3, key: 'cond', title: 'Cond', config: { y: '{{$jobsMapByNodeKey.query}}' } },
      { id: 4, key: 'other', config: { z: 'no refs' } },
    ]);
    const target = nodes.find((n) => n.key === 'query');
    const using = findNodesReferencing(nodes, target);
    expect(using.map((n) => n.key).sort()).toEqual(['calc', 'cond']);
  });

  it('excludes the target itself even if its config self-references', () => {
    const nodes = makeGraph([
      { id: 1, key: 'query', config: { self: '{{$jobsMapByNodeKey.query.x}}' } },
      { id: 2, key: 'calc', config: {} },
    ]);
    const target = nodes.find((n) => n.key === 'query');
    expect(findNodesReferencing(nodes, target)).toEqual([]);
  });

  it('does NOT match $scopes references on the leaf path (includeScopes defaults false)', () => {
    const nodes = makeGraph([
      { id: 1, key: 'loop', config: {} },
      { id: 2, key: 'inner', config: { v: '{{$scopes.loop.item}}' } },
    ]);
    const target = nodes.find((n) => n.key === 'loop');
    expect(findNodesReferencing(nodes, target)).toEqual([]);
  });

  it('does not match a different node whose key is a prefix (no false positive)', () => {
    const nodes = makeGraph([
      { id: 1, key: 'node', config: {} },
      { id: 2, key: 'ref', config: { a: '{{$jobsMapByNodeKey.node10.x}}' } },
    ]);
    const target = nodes.find((n) => n.key === 'node');
    expect(findNodesReferencing(nodes, target)).toEqual([]);
  });
});

describe('findNodesReferencing — branching delete guard (includeScopes)', () => {
  it('matches both $jobsMapByNodeKey and $scopes references for the target', () => {
    const nodes = makeGraph([
      { id: 1, key: 'loop', config: {} },
      { id: 2, key: 'a', title: 'A', config: { v: '{{$scopes.loop.item}}' } },
      { id: 3, key: 'b', title: 'B', config: { v: '{{$jobsMapByNodeKey.loop.result}}' } },
      { id: 4, key: 'c', config: {} },
    ]);
    const target = nodes.find((n) => n.key === 'loop');
    const using = findNodesReferencing(nodes, target, { includeScopes: true });
    expect(using.map((n) => n.key).sort()).toEqual(['a', 'b']);
  });
});

describe('collectBranchNodes — branch subtree collection (v1 findBranchNodes)', () => {
  it('collects a linear downstream chain from the branch head', () => {
    const nodes = makeGraph([
      { id: 10, key: 'h', upstreamId: null, downstreamId: 11 },
      { id: 11, key: 'm', upstreamId: 10, downstreamId: 12 },
      { id: 12, key: 't', upstreamId: 11, downstreamId: null },
    ]);
    const head = nodes.find((n) => n.id === 10);
    const collected = collectBranchNodes(nodes, head);
    expect([...collected.keys()].sort((a, b) => a - b)).toEqual([10, 11, 12]);
  });

  it('descends into nested branches under a node in the chain', () => {
    // head(1) → next(2); node 2 opens a branch whose head is 20 → 21.
    const nodes = makeGraph([
      { id: 1, key: 'head', upstreamId: null, downstreamId: 2 },
      { id: 2, key: 'branching', upstreamId: 1, downstreamId: null },
      { id: 20, key: 'bh', upstreamId: 2, branchIndex: 0, downstreamId: 21 },
      { id: 21, key: 'bt', upstreamId: 20, branchIndex: 0, downstreamId: null },
    ]);
    const head = nodes.find((n) => n.id === 1);
    const collected = collectBranchNodes(nodes, head);
    expect([...collected.keys()].sort((a, b) => a - b)).toEqual([1, 2, 20, 21]);
  });

  it('returns just the head for a single isolated node', () => {
    const nodes = makeGraph([{ id: 5, key: 'solo', upstreamId: null, downstreamId: null }]);
    const head = nodes.find((n) => n.id === 5);
    expect([...collectBranchNodes(nodes, head).keys()]).toEqual([5]);
  });
});
