/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { ContextSelectorItem } from './types';
import type { MetaTreeNode } from '../../flowContext';
import { parseValueToPath, buildContextSelectorItems, loadMetaTreeChildren } from './utils';

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

  const [treeOptions, setTreeOptions] = useState<ContextSelectorItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadedPathsRef = useRef<Set<string>>(new Set());
  const metaTreeRef = useRef(metaTree);

  const parseValueToPathFn = useMemo(() => {
    return customParseValueToPath || parseValueToPath;
  }, [customParseValueToPath]);

  const currentPath = useMemo(() => {
    return value ? parseValueToPathFn(value) : undefined;
  }, [value, parseValueToPathFn]);

  const buildContextSelectorItemFromSelectedOptions = useCallback(
    (selectedOptions: ContextSelectorItem[]): ContextSelectorItem | null => {
      if (!selectedOptions || selectedOptions.length === 0) return null;

      const lastOption = selectedOptions[selectedOptions.length - 1];
      if (!lastOption) return null;

      return {
        label: lastOption.label || lastOption.value,
        value: lastOption.value,
        isLeaf: lastOption.isLeaf,
        meta: lastOption.meta,
        children: lastOption.children,
        loading: lastOption.loading,
        paths: selectedOptions.map((option) => option.value),
      };
    },
    [],
  );

  const loadInitialOptions = useCallback(async () => {
    const currentMetaTree = metaTreeRef.current;

    if (!currentMetaTree) {
      setTreeOptions([]);
      return;
    }

    setLoading(true);
    try {
      let resolvedMetaTree: MetaTreeNode[];

      if (typeof currentMetaTree === 'function') {
        resolvedMetaTree = await currentMetaTree();
      } else {
        resolvedMetaTree = currentMetaTree;
      }

      if (!resolvedMetaTree || !Array.isArray(resolvedMetaTree)) {
        setTreeOptions([]);
        return;
      }

      const cascaderOptions = buildContextSelectorItems(resolvedMetaTree, []);
      setTreeOptions(cascaderOptions);
    } catch (error) {
      console.warn('Failed to load initial options:', error);
      setTreeOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const preloadPathOptions = useCallback(async (item: ContextSelectorItem[], path: string[]) => {
    let currentOptions = item;
    let currentPathKey = '';

    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      currentPathKey = currentPathKey ? `${currentPathKey}.${segment}` : segment;

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
          console.warn(`Failed to preload path ${currentPathKey}:`, error);
          break;
        }
      }
    }
  }, []);

  const handleLoadData = useCallback(async (selectedOptions: ContextSelectorItem[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];
    if (!targetOption || targetOption.isLeaf || targetOption.children) {
      return;
    }

    const pathKey = selectedOptions.map((opt) => opt.value).join('.');
    if (loadedPathsRef.current.has(pathKey)) {
      return;
    }

    // 设置加载状态
    targetOption.loading = true;
    try {
      const children = await loadMetaTreeChildren(targetOption.meta);
      const pathSegments = selectedOptions.map((opt) => opt.value);
      const childOptions = buildContextSelectorItems(children, pathSegments);

      targetOption.children = childOptions;
      targetOption.loading = false;
      loadedPathsRef.current.add(pathKey);
      setTreeOptions((prevOptions) => [...prevOptions]);
    } catch (error) {
      targetOption.loading = false;
      console.warn(`Failed to load data for ${pathKey}:`, error);
      setTreeOptions((prevOptions) => [...prevOptions]);
    }
  }, []);

  metaTreeRef.current = metaTree;

  useEffect(() => {
    if (metaTree && treeOptions.length === 0 && !loading) {
      loadInitialOptions();
    } else if (!metaTree && treeOptions.length > 0) {
      setTreeOptions([]);
    }
  }, [!!metaTree]);

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
