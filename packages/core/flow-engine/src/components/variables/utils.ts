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
import { VariableTag } from './VariableTag';

export const parseValueToPath = (value: string): string[] | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  const variableRegex = /^\{\{\s*ctx(?:\.(.+?))?\s*\}\}$/;
  const match = trimmed.match(variableRegex);

  if (!match) return null;

  const pathString = match[1];
  if (!pathString) return [];

  return pathString.split('.');
};

export const formatPathToValue = (path: string[]): string => {
  if (path.length === 0) return '{{ ctx }}';
  return `{{ ctx.${path.join('.')} }}`;
};

export const loadMetaTreeChildren = async (metaNode: MetaTreeNode): Promise<MetaTreeNode[]> => {
  if (!metaNode.children) return [];

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
        // 创建带路径信息的结果节点
        const resultNode: ContextSelectorItem = {
          ...node,
          // 添加完整路径信息用于显示
          fullPath: [...parentPaths, ...nodePath],
        };
        results.push(resultNode);
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
    // 处理无效节点
    if (!node || typeof node !== 'object' || !node.name) {
      console.warn('buildContextSelectorItems received invalid node:', node);
      const invalidPath = [...currentPath, 'invalid'];
      return {
        label: 'Invalid Node',
        value: 'invalid',
        isLeaf: true,
        meta: null,
        fullPath: invalidPath,
      };
    }

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

// 通用组件类型检测函数
export const detectComponentType = (meta?: MetaTreeNode | null, fieldName?: string, path?: string[]): string | null => {
  // 1. 优先使用 meta 信息
  if (meta) {
    // 优先使用 interface 字段
    if (meta.interface) {
      switch (meta.interface) {
        case 'rate':
        case 'rating':
          return 'rate';
        case 'switch':
        case 'boolean':
          return 'switch';
        case 'select':
        case 'radioGroup':
        case 'checkboxGroup':
          return 'select';
        case 'date':
        case 'datetime':
        case 'time':
          return 'date';
        case 'number':
        case 'integer':
        case 'float':
          return 'number';
        default:
          return null;
      }
    }

    // 回退到基于类型的检测
    if (meta.type) {
      switch (meta.type) {
        case 'boolean':
          return 'switch';
        case 'number':
        case 'integer':
          return 'number';
        case 'date':
          return 'date';
        default:
          return null;
      }
    }
  }

  // 2. 从路径中提取字段名
  const targetFieldName = fieldName || (path && path.length > 0 ? path[path.length - 1] : null);
  if (!targetFieldName) return null;

  // 3. 基于字段名的检测
  const lowerFieldName = targetFieldName.toLowerCase();

  if (lowerFieldName.includes('rating') || lowerFieldName.includes('rate') || lowerFieldName.includes('score')) {
    return 'rate';
  } else if (
    lowerFieldName.includes('enable') ||
    lowerFieldName.includes('switch') ||
    lowerFieldName.includes('toggle')
  ) {
    return 'switch';
  } else if (
    lowerFieldName.includes('count') ||
    lowerFieldName.includes('number') ||
    lowerFieldName.includes('amount')
  ) {
    return 'number';
  } else if (lowerFieldName.includes('date') || lowerFieldName.includes('time')) {
    return 'date';
  } else if (
    lowerFieldName.includes('theme') ||
    lowerFieldName.includes('select') ||
    lowerFieldName.includes('option')
  ) {
    return 'select';
  }

  return null;
};

export const createDefaultConverters = (): Converters => {
  return {
    renderInputComponent: (contextSelectorItem: ContextSelectorItem | null) => {
      // 默认情况下，静态值始终使用 Input 组件
      // 变量值始终由 VariableInput 组件中的 VariableTag 处理
      return (props: any) => React.createElement(Input, props);
    },

    resolvePathFromValue: (value: any) => {
      return parseValueToPath(value);
    },

    resolveValueFromPath: (contextSelectorItem: ContextSelectorItem, path: string[]) => {
      return formatPathToValue(path);
    },
  };
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

  for (const segment of path) {
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
        fullPath: [...parentPaths, ...path.slice(0, path.indexOf(segment) + 1)],
      };
    }

    targetMeta = node;

    // 如果还有下一级路径，且当前节点有子节点
    if (path.indexOf(segment) < path.length - 1) {
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
