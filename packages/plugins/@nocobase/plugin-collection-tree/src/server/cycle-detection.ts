/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type TreeNodeKey = string | number;

export function findCyclePath(path: TreeNodeKey[], nodeKey: TreeNodeKey): TreeNodeKey[] | null {
  const nodeKeyString = String(nodeKey);
  const cycleStartIndex = path.findIndex((pathNodeKey) => String(pathNodeKey) === nodeKeyString);

  if (cycleStartIndex === -1) {
    return null;
  }

  return [...path.slice(cycleStartIndex), nodeKey];
}

export function formatTreeCycleError(collectionName: string, cyclePath: TreeNodeKey[]) {
  return `Cycle detected in ${collectionName}: ${cyclePath.join(' -> ')}`;
}
