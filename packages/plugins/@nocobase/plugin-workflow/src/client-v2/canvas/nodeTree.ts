/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Pure node-tree helpers shared by the legacy and modern canvases (ADR-0003).
 *
 * Relocated verbatim from `src/client/utils.ts` — Formily-free, hook-free,
 * no `ctx` reads — so both canvases share one copy. v1 re-exports these from
 * here via the allowed `v1 → v2` import direction; the v1 golden-baseline tests
 * re-run unchanged against this copy.
 */

/**
 * Wire live `upstream`/`downstream` object refs onto each node from the flat
 * `flow_nodes` list (by `upstreamId`/`downstreamId`). Mutates in place.
 */
export function linkNodes(nodes): void {
  const nodesMap = new Map();
  nodes.forEach((item) => nodesMap.set(item.id, item));
  for (const node of nodesMap.values()) {
    if (node.upstreamId) {
      node.upstream = nodesMap.get(node.upstreamId);
    }

    if (node.downstreamId) {
      node.downstream = nodesMap.get(node.downstreamId);
    }
  }
}
