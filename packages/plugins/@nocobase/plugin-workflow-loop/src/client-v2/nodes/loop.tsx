/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { RollbackOutlined } from '@ant-design/icons';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { Instruction, useWorkflowVariableOptions, type UseVariableOptions } from '@nocobase/plugin-workflow/client-v2';
import { loadMetaTreeChildren } from '@nocobase/flow-engine';
import { tExpr, useT } from '../locale';

type LoopNodeLike = {
  id: string | number;
  key: string;
  title?: string;
  config?: {
    target?: unknown;
  };
};

type LoopScopeNode = MetaTreeNode & {
  interface?: string;
};

const LOOP_SCOPE_ROOT = '$scopes';

const LOOP_DEFAULT_CONDITION = {
  checkpoint: 0 as const,
  continueOnFalse: false,
  calculation: {
    group: {
      type: 'and',
      calculations: [],
    },
  },
};

function createDefaultLoopCondition() {
  return {
    checkpoint: LOOP_DEFAULT_CONDITION.checkpoint,
    continueOnFalse: LOOP_DEFAULT_CONDITION.continueOnFalse,
    calculation: {
      group: {
        type: LOOP_DEFAULT_CONDITION.calculation.group.type,
        calculations: [],
      },
    },
  };
}

function parseVariablePath(value: unknown): string[] | null {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.trim().match(/^\{\{\s*([^{}]+?)\s*\}\}$/);
  if (!match?.[1]) {
    return null;
  }

  return match[1]
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function cloneMetaTreeNodeWithRebasedPaths(node: MetaTreeNode, fromRoot: string[], toRoot: string[]): LoopScopeNode {
  const suffix = Array.isArray(node.paths) ? node.paths.slice(fromRoot.length) : [String(node.name ?? '')];
  const nextNode: LoopScopeNode = {
    ...node,
    paths: [...toRoot, ...suffix],
  };

  if (Array.isArray(node.children)) {
    nextNode.children = node.children.map((child) => cloneMetaTreeNodeWithRebasedPaths(child, fromRoot, toRoot));
  } else if (typeof node.children === 'function') {
    nextNode.children = async () => {
      const loaded = await node.children();
      return loaded.map((child) => cloneMetaTreeNodeWithRebasedPaths(child, fromRoot, toRoot));
    };
  }

  return nextNode;
}

function findMetaTreeNodeSync(nodes: MetaTreeNode[] | undefined, path: string[]): MetaTreeNode | null {
  let currentNodes = nodes;
  let currentNode: MetaTreeNode | null = null;

  for (const segment of path) {
    if (!Array.isArray(currentNodes)) {
      return null;
    }

    currentNode = currentNodes.find((node) => String(node.name) === segment) ?? null;
    if (!currentNode) {
      return null;
    }

    currentNodes = Array.isArray(currentNode.children) ? currentNode.children : undefined;
  }

  return currentNode;
}

async function findMetaTreeNodeAsync(nodes: MetaTreeNode[] | undefined, path: string[]): Promise<MetaTreeNode | null> {
  let currentNodes = nodes;
  let currentNode: MetaTreeNode | null = null;

  for (const segment of path) {
    if (!Array.isArray(currentNodes)) {
      return null;
    }

    currentNode = currentNodes.find((node) => String(node.name) === segment) ?? null;
    if (!currentNode) {
      return null;
    }

    currentNodes = await loadMetaTreeChildren(currentNode);
  }

  return currentNode;
}

function buildLoopItemNode(
  node: LoopNodeLike,
  workflowMetaTree: MetaTreeNode[],
  t: ReturnType<typeof useT>,
): LoopScopeNode {
  const targetPath = parseVariablePath(node.config?.target);
  const targetNode = targetPath ? findMetaTreeNodeSync(workflowMetaTree, targetPath) : null;

  const itemNode: LoopScopeNode = {
    name: 'item',
    title: t('Loop target'),
    type: targetNode?.type ?? '',
    interface: targetNode?.interface,
    paths: ['item'],
  };

  if (!targetPath) {
    return itemNode;
  }

  if (Array.isArray(targetNode?.children)) {
    itemNode.children = targetNode.children.map((child) =>
      cloneMetaTreeNodeWithRebasedPaths(child, targetPath, ['item']),
    );
    return itemNode;
  }

  itemNode.children = async () => {
    const resolved = await findMetaTreeNodeAsync(workflowMetaTree, targetPath);
    const children = resolved ? await loadMetaTreeChildren(resolved) : [];
    return children.map((child) => cloneMetaTreeNodeWithRebasedPaths(child, targetPath, ['item']));
  };

  return itemNode;
}

export function useLoopScopeVariables(node: LoopNodeLike, options: UseVariableOptions = {}): MetaTreeNode[] | null {
  const t = useT();
  const workflowMetaTree = useWorkflowVariableOptions({ ...options, includeScopes: false });

  if (node.config?.target == null) {
    return null;
  }

  return [
    buildLoopItemNode(node, workflowMetaTree, t),
    { name: 'index', title: t('Loop index (starts from 0)'), type: 'number', paths: ['index'] },
    { name: 'sequence', title: t('Loop sequence (starts from 1)'), type: 'number', paths: ['sequence'] },
    { name: 'length', title: t('Loop length'), type: 'number', paths: ['length'] },
  ];
}

export { createDefaultLoopCondition, LOOP_DEFAULT_CONDITION, LOOP_SCOPE_ROOT };

export default class LoopInstruction extends Instruction {
  type = 'loop';
  title = tExpr('Loop');
  group = 'control';
  description = tExpr(
    'By using a loop node, you can perform the same operation on multiple sets of data. The source of these sets can be either multiple records from a query node or multiple associated records of a single record. Loop node can also be used for iterating a certain number of times or for looping through each character in a string. However, excessive looping may cause performance issues, so use with caution.',
  );
  icon = (<RollbackOutlined />);
  branching = true;

  FieldsetLoader = () => import('./components/loop').then((module) => ({ default: module.LoopFieldset }));
  ComponentLoader = () => import('./components/loop').then((module) => ({ default: module.LoopCanvasComponent }));

  createDefaultConfig() {
    return {
      target: 1,
      condition: false,
      exit: 0,
    };
  }

  useScopeVariables = useLoopScopeVariables;
}
