/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MetaTreeNode } from '@nocobase/flow-engine';

const ASSOCIATION_FIELD_INTERFACES = new Set(['m2o', 'o2o', 'oho', 'obo', 'o2m', 'm2m', 'linkTo']);

function isAssociationMetaNode(node: MetaTreeNode) {
  const options = (node as any)?.options || {};
  return Boolean(
    options.target ||
      options.targetCollection ||
      options.foreignKey ||
      options.through ||
      ASSOCIATION_FIELD_INTERFACES.has(String(node?.interface || '')),
  );
}

function limitNodeAssociationDepth(node: MetaTreeNode, associationDepth: number, maxAssociationDepth: number) {
  const isAssociation = isAssociationMetaNode(node);
  const nextAssociationDepth = associationDepth + (isAssociation ? 1 : 0);

  if (isAssociation && nextAssociationDepth > maxAssociationDepth) {
    return null;
  }

  const wrapChildren = (children: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>)) => {
    if (Array.isArray(children)) {
      return limitAssociationMetaTree(children, {
        associationDepth: nextAssociationDepth,
        maxAssociationDepth,
      });
    }

    return async () => {
      const loaded = await children();
      return limitAssociationMetaTree(Array.isArray(loaded) ? loaded : [], {
        associationDepth: nextAssociationDepth,
        maxAssociationDepth,
      });
    };
  };

  return {
    ...node,
    children: node.children ? wrapChildren(node.children as any) : undefined,
  } as MetaTreeNode;
}

export function limitAssociationMetaTree(
  nodes: MetaTreeNode[] | undefined,
  options: {
    associationDepth?: number;
    maxAssociationDepth?: number;
  } = {},
): MetaTreeNode[] {
  const { associationDepth = 0, maxAssociationDepth = 2 } = options;
  if (!Array.isArray(nodes)) return [];

  return nodes
    .map((node) => limitNodeAssociationDepth(node, associationDepth, maxAssociationDepth))
    .filter(Boolean) as MetaTreeNode[];
}
