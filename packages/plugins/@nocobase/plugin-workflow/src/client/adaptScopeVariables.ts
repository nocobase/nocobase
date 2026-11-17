/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MetaTreeNode } from '@nocobase/flow-engine';
import {
  defaultFieldNames,
  type UseVariableOptions,
  type VariableOption,
} from '../client-v2/canvas/collectionFieldOptions';

function isMetaTreeNode(option: VariableOption | MetaTreeNode): option is MetaTreeNode {
  return typeof option.name === 'string' && Array.isArray(option.paths);
}

// Migrated scope providers return MetaTreeNode, while v1 selectors still expect VariableOption and loadChildren.
export function adaptScopeVariables(
  options: (VariableOption | MetaTreeNode)[],
  fieldNames: UseVariableOptions['fieldNames'] = defaultFieldNames,
): VariableOption[] {
  const names = { ...defaultFieldNames, ...fieldNames };
  return options.flatMap((node) => {
    if (!isMetaTreeNode(node)) {
      return [node];
    }
    if (typeof node.hidden === 'function' ? node.hidden() : node.hidden) {
      return [];
    }

    const { children, ...meta } = node;
    const option: VariableOption = {
      ...meta,
      key: node.name,
      [names.value]: node.name,
      [names.label]: node.title ?? node.name,
      disabled: typeof node.disabled === 'function' ? node.disabled() : node.disabled,
      isLeaf: true,
    };

    if (Array.isArray(children)) {
      option[names.children] = adaptScopeVariables(children, names);
      option.isLeaf = option[names.children].length === 0;
    } else if (typeof children === 'function') {
      option.isLeaf = false;
      option.loadChildren = async (target: VariableOption) => {
        const loaded = adaptScopeVariables(await children(), names);
        target[names.children] = loaded;
        target.isLeaf = loaded.length === 0;
        delete target.loadChildren;
      };
    }

    return [option];
  });
}
