/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Pure graph walks for drag/clipboard impact analysis (ADR-0003, doc §9.6).
 *
 * Relocated verbatim from `src/client/NodeDragContext.tsx` — Formily-free,
 * hook-free — so both canvases' drag/clipboard Providers share one copy of the
 * tricky topology math while each keeps its own hook-ful Provider shell. v1
 * re-exports these; the v1 golden-baseline tests re-run unchanged against this
 * copy.
 */

/**
 * Walk the full downstream reachable set from `start`: the main chain plus
 * every branch subtree (via `branchChildrenMap: upstreamId → branch-head nodes`).
 */
export function collectDownstreams(
  start: any,
  branchChildrenMap: Map<number, any[]>,
  visited = new Set<number>(),
): Set<number> {
  const result = new Set<number>();
  const stack = start ? [start] : [];
  while (stack.length) {
    const head = stack.pop();
    for (let node = head; node; node = node.downstream) {
      if (!node || visited.has(node.id)) {
        break;
      }
      visited.add(node.id);
      result.add(node.id);
      const branches = branchChildrenMap.get(node.id) ?? [];
      branches.forEach((branch) => stack.push(branch));
    }
  }
  return result;
}

/**
 * Collect a branching node's own subtree: the node itself plus all of its
 * branch subtrees (but NOT its main-chain downstream). Used to know which nodes
 * move together when a branch node is dragged.
 */
export function collectBranchSubtree(root: any, branchChildrenMap: Map<number, any[]>): Set<number> {
  const result = new Set<number>();
  if (!root) {
    return result;
  }
  result.add(root.id);
  const branchHeads = branchChildrenMap.get(root.id) ?? [];
  branchHeads.forEach((branch) => {
    collectDownstreams(branch, branchChildrenMap, result);
  });
  return result;
}
