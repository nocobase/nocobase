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
import type { CascaderOption, Converters } from './types';
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
export const searchInLoadedNodes = (options: CascaderOption[], searchText: string): CascaderOption[] => {
  if (!searchText || !searchText.trim()) return [];

  const lowerSearchText = searchText.toLowerCase().trim();
  const results: CascaderOption[] = [];

  // 递归搜索已加载的节点
  const searchRecursive = (nodes: CascaderOption[], currentPath: string[] = []) => {
    for (const node of nodes) {
      const nodePath = [...currentPath, node.value];

      // 检查节点标签是否匹配搜索文本
      if (node.label.toLowerCase().includes(lowerSearchText)) {
        // 创建带路径信息的结果节点
        const resultNode: CascaderOption = {
          ...node,
          // 添加完整路径信息用于显示
          fullPath: nodePath,
        };
        results.push(resultNode);
      }

      // 只搜索已加载的子节点（存在children属性表示已加载）
      if (node.children && Array.isArray(node.children)) {
        searchRecursive(node.children, nodePath);
      }
    }
  };

  searchRecursive(options);
  return results;
};

export const buildCascaderOptions = (metaTree: MetaTreeNode[]): CascaderOption[] => {
  if (!metaTree || !Array.isArray(metaTree)) {
    console.warn('buildCascaderOptions received invalid metaTree:', metaTree);
    return [];
  }

  const convertNode = (node: MetaTreeNode): CascaderOption => {
    if (!node || typeof node.name !== 'string' || node.name === '') {
      console.warn('Invalid MetaTreeNode:', node);
      return {
        label: 'Invalid Node',
        value: 'invalid',
        isLeaf: true,
        meta: node,
      };
    }

    const hasChildren = node.children && (Array.isArray(node.children) ? node.children.length > 0 : true);

    const option: CascaderOption = {
      label: node.title || node.name,
      value: node.name,
      isLeaf: !hasChildren,
      meta: node,
    };

    if (hasChildren && Array.isArray(node.children)) {
      option.children = node.children.map(convertNode);
    }

    return option;
  };

  return metaTree.map(convertNode);
};

export const isVariableValue = (value: any): boolean => {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  const variableRegex = /^\{\{\s*ctx(?:\..+?)?\s*\}\}$/;
  return variableRegex.test(trimmed);
};

// 基于 meta 信息检测组件类型的工具函数
export const detectComponentTypeFromMeta = (meta: MetaTreeNode | null): string | null => {
  if (!meta) return null;

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

  return null;
};

// 基于字段名的回退检测（用于向后兼容）
export const detectComponentTypeFromFieldName = (fieldName: string): string | null => {
  const lowerFieldName = fieldName.toLowerCase();

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

// 从变量路径检测组件类型提示（用于VariableInput组件）
export const detectComponentTypeFromVariablePath = (path: string[]): string | null => {
  if (!path || path.length === 0) return null;

  const fieldName = path[path.length - 1].toLowerCase();

  if (fieldName.includes('rating') || fieldName.includes('rate') || fieldName.includes('score')) {
    return 'rate';
  } else if (fieldName.includes('enable') || fieldName.includes('switch') || fieldName.includes('toggle')) {
    return 'switch';
  } else if (fieldName.includes('count') || fieldName.includes('number') || fieldName.includes('amount')) {
    return 'number';
  } else if (fieldName.includes('date') || fieldName.includes('time')) {
    return 'date';
  } else if (fieldName.includes('theme') || fieldName.includes('select') || fieldName.includes('option')) {
    return 'select';
  }

  return null;
};

export const createDefaultConverters = (): Converters => {
  return {
    renderInputComponent: (meta: MetaTreeNode | null) => {
      // 默认情况下，静态值始终使用 Input 组件
      // 变量值始终由 VariableInput 组件中的 VariableTag 处理
      return (props: any) => React.createElement(Input, props);
    },

    resolvePathFromValue: (value: any) => {
      return parseValueToPath(value);
    },

    resolveValueFromPath: (meta: MetaTreeNode, path: string[]) => {
      return formatPathToValue(path);
    },
  };
};
