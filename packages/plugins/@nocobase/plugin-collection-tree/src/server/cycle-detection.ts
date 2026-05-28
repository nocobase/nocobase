/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type TreeNodeKey = string | number;

export const TREE_COLLECTION_NAMESPACE = '@nocobase/plugin-collection-tree';
export const CANNOT_SET_SELF_AS_PARENT = 'Cannot set itself as the parent node';
export const CANNOT_SET_DESCENDANT_AS_PARENT = 'Cannot set a descendant node as the parent node';
export const TREE_CYCLE_DETECTED = 'Cycle detected in {{collectionName}}: {{cyclePath}}';

export interface TreeTranslationContext {
  t?: (
    key: string,
    options?: {
      ns?: string | string[];
      collectionName?: string;
      cyclePath?: string;
    },
  ) => string;
}

export function translateTreeError(message: string, context?: TreeTranslationContext) {
  return context?.t?.(message, { ns: TREE_COLLECTION_NAMESPACE }) || message;
}

export function findCyclePath(path: TreeNodeKey[], nodeKey: TreeNodeKey): TreeNodeKey[] | null {
  const nodeKeyString = String(nodeKey);
  const cycleStartIndex = path.findIndex((pathNodeKey) => String(pathNodeKey) === nodeKeyString);

  if (cycleStartIndex === -1) {
    return null;
  }

  return [...path.slice(cycleStartIndex), nodeKey];
}

export function formatTreeCycleError(
  collectionName: string,
  cyclePath: TreeNodeKey[],
  context?: TreeTranslationContext,
) {
  const cyclePathText = cyclePath.join(' -> ');
  return (
    context?.t?.(TREE_CYCLE_DETECTED, {
      ns: TREE_COLLECTION_NAMESPACE,
      collectionName,
      cyclePath: cyclePathText,
    }) || `Cycle detected in ${collectionName}: ${cyclePathText}`
  );
}
