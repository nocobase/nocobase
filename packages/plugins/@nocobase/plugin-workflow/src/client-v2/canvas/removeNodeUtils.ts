/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Pure remove-node helpers shared by both canvases (ADR-0003, migration doc §9.6).
 * Formily-free, hook-free (only the `parse` template parser) — relocated from v1's
 * inline `RemoveButton.onRemove` / `useRemoveNodeSubmitAction` logic so the modern
 * canvas can apply the SAME delete-safety behaviour the legacy canvas has (the v2
 * remove flow previously skipped the variable-reference guard entirely). v1
 * re-imports these; the golden-baseline test pins the behaviour for both.
 */

import { parse } from '@nocobase/utils/client';

/**
 * Collect a branch subtree: every node reachable from `branchHead` following the
 * `downstream` chain, descending into each node's nested branches (children whose
 * `upstream` is that node and which carry a `branchIndex`). Keyed by node id.
 *
 * Verbatim port of v1's `findBranchNodes` (`client/RemoveNodeContext.tsx`). The
 * linked-list fields (`upstream`/`downstream`) are assumed already wired by
 * `linkNodes`.
 */
export function collectBranchNodes(nodes: any[], branchHead: any): Map<any, any> {
  const result = new Map<any, any>();
  for (let node = branchHead; node; node = node.downstream) {
    result.set(node.id, node);
    const subBranches = (nodes ?? []).filter((item) => item.upstream === node && item.branchIndex != null);
    for (const subBranch of subBranches) {
      const subBranchNodes = collectBranchNodes(nodes, subBranch);
      for (const [key, value] of subBranchNodes) {
        result.set(key, value);
      }
    }
  }
  return result;
}

/**
 * Does a node's config reference `targetKey`'s output? Mirrors v1's two inline
 * checks: always matches `$jobsMapByNodeKey.<targetKey>` (exact or `.<field>`),
 * and — when `includeScopes` is set (the branching-node delete path) — also
 * `$scopes.<targetKey>`.
 */
function referencesNodeKey(config: any, targetKey: string, includeScopes: boolean): boolean {
  let template: { parameters?: { key: string }[] };
  try {
    template = parse(config);
  } catch {
    return false;
  }
  const params = template?.parameters ?? [];
  return params.some(({ key }) => {
    if (typeof key !== 'string') {
      return false;
    }
    if (key === `$jobsMapByNodeKey.${targetKey}` || key.startsWith(`$jobsMapByNodeKey.${targetKey}.`)) {
      return true;
    }
    if (includeScopes && (key === `$scopes.${targetKey}` || key.startsWith(`$scopes.${targetKey}.`))) {
      return true;
    }
    return false;
  });
}

/**
 * Find the nodes (excluding the target itself) that reference `target`'s output —
 * the set v1 blocks deletion on ("The result of this node has been referenced by
 * other nodes …"). `candidates` is the pool to scan: for a **leaf** node delete
 * it's all other nodes (`$jobsMapByNodeKey` only, `includeScopes: false`); for a
 * **branching** node delete it's the related/downstream subtree
 * (`includeScopes: true`).
 */
export function findNodesReferencing(
  candidates: any[],
  target: { key: string },
  { includeScopes = false }: { includeScopes?: boolean } = {},
): any[] {
  return (candidates ?? []).filter((node) => {
    if (!node || node.key === target.key) {
      return false;
    }
    return referencesNodeKey(node.config, target.key, includeScopes);
  });
}
