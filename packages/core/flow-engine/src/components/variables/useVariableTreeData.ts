/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ContextSelectorItem } from './types';
import type { MetaTreeNode } from '../../flowContext';
import { parseValueToPath, buildContextSelectorItems, loadMetaTreeChildren, searchInLoadedNodes } from './utils';

export interface UseVariableTreeDataOptions {
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
  value?: string;
  parseValueToPath?: (value: string) => string[] | undefined;
}

export interface UseVariableTreeDataResult {
  options: ContextSelectorItem[];
  loading: boolean;
  currentPath?: string[];
  loadInitialOptions: () => Promise<void>;
  handleLoadData: (selectedOptions: ContextSelectorItem[]) => Promise<void>;
  preloadPathOptions: (item: ContextSelectorItem[], path: string[]) => Promise<void>;
  buildContextSelectorItemFromSelectedOptions: (selectedOptions: ContextSelectorItem[]) => ContextSelectorItem | null;
  loadedPathsRef: React.MutableRefObject<Set<string>>;
}

export const useVariableTreeData = (options: UseVariableTreeDataOptions): UseVariableTreeDataResult => {
  const { metaTree, value, parseValueToPath: customParseValueToPath } = options;

  // 级联选择器的选项数据
  const [treeOptions, setTreeOptions] = useState<ContextSelectorItem[]>([]);
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 已加载路径的缓存
  const loadedPathsRef = useRef<Set<string>>(new Set());

  // 使用自定义函数或默认函数
  const parseValueToPathFn = customParseValueToPath || parseValueToPath;

  // 解析当前值对应的路径
  const currentPath = useMemo(() => {
    return value ? parseValueToPathFn(value) : undefined;
  }, [value, parseValueToPathFn]);

  // 从选中的选项构建 ContextSelectorItem
  const buildContextSelectorItemFromSelectedOptions = useCallback(
    (selectedOptions: ContextSelectorItem[]): ContextSelectorItem | null => {
      if (!selectedOptions || selectedOptions.length === 0) return null;

      const lastOption = selectedOptions[selectedOptions.length - 1];
      if (!lastOption) return null;

      // 构建完整路径
      const fullPath = selectedOptions.map((option) => option.value);

      return {
        label: lastOption.label || lastOption.value,
        value: lastOption.value,
        isLeaf: lastOption.isLeaf,
        meta: lastOption.meta,
        children: lastOption.children,
        loading: lastOption.loading,
        fullPath: fullPath,
      };
    },
    [],
  );

  // 预加载指定路径的选项数据
  const preloadPathOptions = useCallback(async (item: ContextSelectorItem[], path: string[]) => {
    let currentOptions = item;
    let currentPathKey = '';

    // 逐级加载路径对应的子选项
    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      currentPathKey = currentPathKey ? `${currentPathKey}.${segment}` : segment;

      // 如果已经加载过，直接跳过
      if (loadedPathsRef.current.has(currentPathKey)) {
        const option = currentOptions.find((opt) => opt.value === segment);
        if (option?.children) {
          currentOptions = option.children;
          continue;
        }
      }

      const option = currentOptions.find((opt) => opt.value === segment);
      if (option && option.meta && !option.isLeaf) {
        try {
          const children = await loadMetaTreeChildren(option.meta);
          const currentSegmentPath = currentPathKey.split('.');
          const childOptions = buildContextSelectorItems(children, currentSegmentPath);
          option.children = childOptions;
          option.loading = false;

          loadedPathsRef.current.add(currentPathKey);
          currentOptions = childOptions;
        } catch (error) {
          break;
        }
      }
    }
  }, []);

  // 加载初始选项数据
  const loadInitialOptions = useCallback(async () => {
    if (!metaTree) return;

    setLoading(true);
    try {
      let resolvedMetaTree: MetaTreeNode[];

      // 处理函数形式的 metaTree
      if (typeof metaTree === 'function') {
        resolvedMetaTree = await metaTree();
      } else {
        resolvedMetaTree = metaTree;
      }

      // 验证 metaTree 数据
      if (!resolvedMetaTree || !Array.isArray(resolvedMetaTree)) {
        setTreeOptions([]);
        return;
      }

      // 构建级联选择器选项
      const cascaderOptions = buildContextSelectorItems(resolvedMetaTree, []);
      setTreeOptions(cascaderOptions);

      // 如果有当前值，预加载对应路径的选项
      if (currentPath && currentPath.length > 0) {
        await preloadPathOptions(cascaderOptions, currentPath);
      }
    } catch (error) {
      setTreeOptions([]);
    } finally {
      setLoading(false);
    }
  }, [metaTree, currentPath, preloadPathOptions]);

  // 动态加载子选项数据
  const handleLoadData = useCallback(async (selectedOptions: ContextSelectorItem[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];
    // 如果是叶子节点或已有子选项，直接返回
    if (!targetOption || targetOption.isLeaf || targetOption.children) {
      return;
    }

    const pathKey = selectedOptions.map((opt) => opt.value).join('.');
    // 如果已经加载过，直接返回
    if (loadedPathsRef.current.has(pathKey)) {
      // 即使缓存命中，也检查是否真的有children数据
      if (!targetOption.children || targetOption.children.length === 0) {
        // 缓存命中但没有实际数据，重新加载
        loadedPathsRef.current.delete(pathKey);
      } else {
        return;
      }
    }

    // 设置加载状态
    targetOption.loading = true;
    setTreeOptions((prev) => [...prev]);

    try {
      // 加载子节点数据
      const children = await loadMetaTreeChildren(targetOption.meta);
      const pathSegments = selectedOptions.map((opt) => opt.value);
      const childOptions = buildContextSelectorItems(children, pathSegments);

      targetOption.children = childOptions;
      targetOption.loading = false;

      // 更新已加载路径缓存
      loadedPathsRef.current.add(pathKey);
      setTreeOptions((prev) => [...prev]);
    } catch (error) {
      targetOption.loading = false;
      setTreeOptions((prev) => [...prev]);
    }
  }, []);

  useEffect(() => {
    loadInitialOptions();
  }, [loadInitialOptions]);

  return {
    options: treeOptions,
    loading,
    currentPath,
    loadInitialOptions,
    handleLoadData,
    preloadPathOptions,
    buildContextSelectorItemFromSelectedOptions,
    loadedPathsRef,
  };
};
