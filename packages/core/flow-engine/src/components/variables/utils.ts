/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Input } from 'antd';
import type { MetaTreeNode } from '../../flowContext';
import type { ContextSelectorItem, Converters } from './types';

export const parseValueToPath = (value: string): string[] | undefined => {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  const variableRegex = /^\{\{\s*ctx(?:\.(.+?))?\s*\}\}$/;
  const match = trimmed.match(variableRegex);

  if (!match) return undefined;

  const pathString = match[1];
  if (!pathString) return [];

  return pathString.split('.');
};

export const formatPathToValue = (item: ContextSelectorItem): string => {
  const path = item?.fullPath || [];
  if (path.length === 0) return '{{ ctx }}';
  return `{{ ctx.${path.join('.')} }}`;
};

export const loadMetaTreeChildren = async (metaNode: MetaTreeNode): Promise<MetaTreeNode[]> => {
  if (!metaNode?.children) return [];

  if (typeof metaNode.children === 'function') {
    try {
      return await metaNode.children();
    } catch (error) {
      console.warn(`Failed to load children for ${metaNode.name}:`, error);
      return [];
    }
  }

  return metaNode.children;
};

// 在已加载的级联选项中搜索，支持模糊匹配
export const searchInLoadedNodes = (
  options: ContextSelectorItem[],
  searchText: string,
  parentPaths: string[] = [],
): ContextSelectorItem[] => {
  if (!searchText || !searchText.trim()) return [];

  const lowerSearchText = searchText.toLowerCase().trim();
  const results: ContextSelectorItem[] = [];

  // 递归搜索已加载的节点
  const searchRecursive = (nodes: ContextSelectorItem[], currentPath: string[] = []) => {
    for (const node of nodes) {
      const nodePath = [...currentPath, node.value];

      // 检查节点标签是否匹配搜索文本
      if (node.label.toLowerCase().includes(lowerSearchText)) {
        results.push(node);
      }

      // 只搜索已加载的子节点（存在children属性表示已加载）
      if (node.children && Array.isArray(node.children)) {
        searchRecursive(node.children, nodePath);
      }
    }
  };

  searchRecursive(options, []);
  return results;
};

export const buildContextSelectorItems = (
  metaTree: MetaTreeNode[],
  parentPaths: string[] = [],
): ContextSelectorItem[] => {
  if (!metaTree || !Array.isArray(metaTree)) {
    console.warn('buildContextSelectorItems received invalid metaTree:', metaTree);
    return [];
  }

  const convertNode = (node: MetaTreeNode, currentPath: string[]): ContextSelectorItem => {
    const hasChildren = node.children;
    const fullPath = [...currentPath, node.name];
    const option: ContextSelectorItem = {
      label: node.title || node.name,
      value: node.name,
      isLeaf: !hasChildren,
      meta: node,
      fullPath: fullPath,
    };

    if (hasChildren && Array.isArray(node.children)) {
      option.children = node.children.map((child) => convertNode(child, fullPath));
    }

    return option;
  };

  return metaTree.map((node) => convertNode(node, parentPaths));
};

export const isVariableValue = (value: any): boolean => {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  const variableRegex = /^\{\{\s*ctx(?:\..+?)?\s*\}\}$/;
  return variableRegex.test(trimmed);
};

export const createDefaultConverters = (): Converters => {
  return {
    resolvePathFromValue: (value: any) => {
      return parseValueToPath(value);
    },

    resolveValueFromPath: (item: ContextSelectorItem) => {
      return formatPathToValue(item);
    },
  };
};

export const createFinalConverters = (propConverters?: Converters): Converters => {
  const defaultConverters = createDefaultConverters();
  const mergedConverters = propConverters ? { ...defaultConverters, ...propConverters } : defaultConverters;

  // 如果用户自定义了 resolveValueFromPath，需要包装一下以保持后备逻辑
  if (propConverters?.resolveValueFromPath) {
    const customResolveValueFromPath = propConverters.resolveValueFromPath;
    return {
      ...mergedConverters,
      resolveValueFromPath: (item: ContextSelectorItem) => {
        const ret = customResolveValueFromPath(item);
        return ret === undefined ? formatPathToValue(item) : ret;
      },
    };
  }

  return mergedConverters;
};

// 根据ContextSelectorItem的fullPath和metaTree构建完整的标题路径
export const buildFullTagTitle = async (
  contextSelectorItem: ContextSelectorItem,
  metaTree?: MetaTreeNode[],
): Promise<string> => {
  if (!contextSelectorItem?.fullPath || contextSelectorItem.fullPath.length === 0) {
    return contextSelectorItem?.label || '';
  }

  if (!metaTree) {
    return contextSelectorItem.fullPath.join('/');
  }

  // 递归查找路径中每个节点的 title
  const titlePath: string[] = [];
  let currentNodes: MetaTreeNode[] = metaTree;

  for (const segment of contextSelectorItem.fullPath) {
    const node = currentNodes.find((n) => n.name === segment);
    if (!node) {
      // 如果找不到节点，使用原始名称
      titlePath.push(segment);
      break;
    }

    // 使用 title 或 name
    titlePath.push(node.title || node.name);

    if (typeof node.children === 'function') {
      node.children = await node.children();
    }

    // 准备下一级节点
    if (Array.isArray(node.children)) {
      currentNodes = node.children;
    } else {
      break;
    }
  }

  return titlePath.join('/');
};

// 根据路径从metaTree中构建对应的ContextSelectorItem
export const buildContextSelectorItemFromPath = (
  path: string[],
  metaTree: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>) | undefined,
  parentPaths: string[] = [],
): ContextSelectorItem | null => {
  // 如果没有路径或metaTree，返回null
  if (!path || path.length === 0 || !metaTree) return null;

  const fullPath = [...parentPaths, ...path];

  // 如果metaTree是函数，现在无法同步获取，返回基本信息
  if (typeof metaTree === 'function') {
    return {
      label: path[path.length - 1], // 使用最后一个路径段作为label
      value: path[path.length - 1],
      isLeaf: true,
      meta: {
        name: path[path.length - 1],
        title: path[path.length - 1],
        type: 'string',
      },
      fullPath: fullPath,
    };
  }

  // 递归查找路径对应的节点
  let currentNodes: MetaTreeNode[] = metaTree;
  let targetMeta: MetaTreeNode | null = null;

  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    const node = currentNodes.find((n) => n.name === segment);
    if (!node) {
      // 如果找不到节点，返回基本信息
      return {
        label: segment,
        value: segment,
        isLeaf: true,
        meta: {
          name: segment,
          title: segment,
          type: 'string',
        },
        fullPath: [...parentPaths, ...path.slice(0, i + 1)],
      };
    }

    targetMeta = node;

    // 如果还有下一级路径，且当前节点有子节点
    if (i < path.length - 1) {
      if (Array.isArray(node.children)) {
        currentNodes = node.children;
      } else {
        // 异步子节点，无法继续查找
        break;
      }
    }
  }

  if (!targetMeta) return null;

  // 构建ContextSelectorItem
  return {
    label: targetMeta.title || targetMeta.name,
    value: targetMeta.name,
    isLeaf: !targetMeta.children || (Array.isArray(targetMeta.children) && targetMeta.children.length === 0),
    meta: targetMeta,
    fullPath: fullPath,
  };
};
