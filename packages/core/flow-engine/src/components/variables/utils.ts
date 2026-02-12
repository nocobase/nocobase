/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MetaTreeNode } from '../../flowContext';
import type { ContextSelectorItem, Converters } from './types';
import { buildDateVariableExpression, isDateVariableExpression, isVariableExpression } from '../../utils';

export const parseValueToPath = (value: string): string[] | undefined => {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (isDateVariableExpression(trimmed)) {
    return ['date'];
  }
  const variableRegex = /^\{\{\s*ctx(?:\.(.+?))?\s*\}\}$/;
  const match = trimmed.match(variableRegex);

  if (!match) return undefined;

  const pathString = match[1];
  if (!pathString) return [];

  return pathString.split('.');
};

export const formatPathToValue = (item: MetaTreeNode): string => {
  const path = item?.paths || [];
  if (path.length === 0) return '{{ ctx }}';
  if (path[0] === 'date' && path.length === 1) {
    return buildDateVariableExpression({ kind: 'preset', preset: 'today' });
  }
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

      // 计算可搜索的纯文本标签
      const labelText =
        typeof node.label === 'string'
          ? node.label
          : typeof node.meta?.title === 'string'
            ? node.meta!.title
            : String(node.value);

      // 检查节点标签是否匹配搜索文本
      if (labelText.toLowerCase().includes(lowerSearchText)) {
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

export const buildContextSelectorItems = (metaTree: MetaTreeNode[]): ContextSelectorItem[] => {
  if (!metaTree || !Array.isArray(metaTree)) {
    console.warn('buildContextSelectorItems received invalid metaTree:', metaTree);
    return [];
  }

  const convertNode = (node: MetaTreeNode): ContextSelectorItem | null => {
    const hidden = !!(typeof node.hidden === 'function' ? node.hidden() : node.hidden);
    if (hidden) return null;
    const hasChildren = !!(
      node.children &&
      (typeof node.children === 'function' || (Array.isArray(node.children) && node.children.length > 0))
    );
    // 计算禁用状态：支持 boolean 或函数
    const disabled = !!(typeof node.disabled === 'function' ? node.disabled() : node.disabled);
    const option: ContextSelectorItem = {
      label: node.title || node.name,
      value: node.name,
      isLeaf: !hasChildren,
      meta: node,
      paths: node.paths,
      disabled,
    };

    if (Array.isArray(node.children) && node.children.length > 0) {
      option.children = node.children
        .map((child) => convertNode(child))
        .filter((item): item is ContextSelectorItem => item !== null);
    }

    return option;
  };

  return metaTree.map((node) => convertNode(node)).filter((item): item is ContextSelectorItem => item !== null);
};

/**
 * 预加载：根据路径逐级加载 ContextSelectorItem 的 children，保证打开时已展开对应层级。
 */
export const preloadContextSelectorPath = async (
  options: ContextSelectorItem[] | undefined,
  pathSegments: (string | number)[],
  triggerUpdate?: () => void,
) => {
  if (!options || !Array.isArray(options) || !pathSegments || pathSegments.length === 0) return;
  let list: ContextSelectorItem[] | undefined = options;
  for (let i = 0; i < pathSegments.length && list; i++) {
    const seg = String(pathSegments[i]);
    const opt = list.find((o) => String(o.value) === seg);
    if (!opt) break;
    const meta = opt.meta as MetaTreeNode | undefined;
    const hasLoaded = !!opt.children && Array.isArray(opt.children);
    if (i < pathSegments.length - 1 && !hasLoaded && meta && typeof meta.children === 'function') {
      opt.loading = true;
      try {
        const childNodes = await loadMetaTreeChildren(meta);
        meta.children = childNodes;
        const childOptions = buildContextSelectorItems(childNodes);
        opt.children = childOptions;
        opt.isLeaf = !childOptions || childOptions.length === 0;
        Promise.resolve()
          .then(() => triggerUpdate?.())
          .catch(() => {});
      } finally {
        opt.loading = false;
      }
    }
    list = Array.isArray(opt.children) ? opt.children : undefined;
  }
};

export const isVariableValue = (value: any): boolean => {
  if (!isVariableExpression(value)) return false;
  return !isDateVariableExpression(value);
};

export const createDefaultConverters = (): Converters => {
  return {
    resolvePathFromValue: (value: any) => {
      return parseValueToPath(value);
    },

    resolveValueFromPath: (item: MetaTreeNode) => {
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
      resolveValueFromPath: (item: MetaTreeNode) => {
        const ret = customResolveValueFromPath(item);
        return ret === undefined ? formatPathToValue(item) : ret;
      },
    };
  }

  return mergedConverters;
};
