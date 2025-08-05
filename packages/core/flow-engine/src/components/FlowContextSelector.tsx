/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button, Cascader } from 'antd';
import type { FlowContextSelectorProps, CascaderOption } from './variables/types';
import type { MetaTreeNode } from '../flowContext';
import {
  parseValueToPath,
  formatPathToValue,
  buildCascaderOptions,
  loadMetaTreeChildren,
  searchInLoadedNodes,
} from './variables/utils';

export const FlowContextSelector: React.FC<FlowContextSelectorProps> = ({
  value,
  onChange,
  children = <Button>Var</Button>,
  metaTree,
  showSearch = false,
  ...cascaderProps
}) => {
  // 级联选择器的选项数据
  const [options, setOptions] = useState<CascaderOption[]>([]);
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 已加载路径的缓存
  const loadedPathsRef = useRef<Set<string>>(new Set());
  // 双击检测相关状态
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickPathRef = useRef<string>('');
  const doubleClickDelay = 300; // 300ms内的第二次点击认为是双击

  // 解析当前值对应的路径
  const currentPath = useMemo(() => {
    return value ? parseValueToPath(value) : undefined;
  }, [value]);

  // 预加载指定路径的选项数据
  const preloadPathOptions = useCallback(async (cascaderOptions: CascaderOption[], path: string[]) => {
    let currentOptions = cascaderOptions;
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
          const childOptions = buildCascaderOptions(children);
          option.children = childOptions;
          option.loading = false;

          loadedPathsRef.current.add(currentPathKey);
          currentOptions = childOptions;
        } catch (error) {
          console.warn(`Failed to preload children for ${currentPathKey}:`, error);
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
        console.warn('metaTree is not a valid array:', resolvedMetaTree);
        setOptions([]);
        return;
      }

      // 构建级联选择器选项
      const cascaderOptions = buildCascaderOptions(resolvedMetaTree);
      setOptions(cascaderOptions);

      // 如果有当前值，预加载对应路径的选项
      if (currentPath && currentPath.length > 0) {
        await preloadPathOptions(cascaderOptions, currentPath);
      }
    } catch (error) {
      console.error('Failed to load metaTree:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [metaTree, currentPath, preloadPathOptions]);

  useEffect(() => {
    loadInitialOptions();
  }, [loadInitialOptions]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  // 动态加载子选项数据
  const handleLoadData = useCallback(
    async (selectedOptions: any[]) => {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      // 如果是叶子节点或已有子选项，直接返回
      if (!targetOption || targetOption.isLeaf || targetOption.children) {
        return;
      }

      const pathKey = selectedOptions.map((opt) => opt.value).join('.');
      // 如果已经加载过，直接返回
      if (loadedPathsRef.current.has(pathKey)) {
        return;
      }

      // 设置加载状态
      targetOption.loading = true;
      setOptions([...options]);

      try {
        // 加载子节点数据
        const children = await loadMetaTreeChildren(targetOption.meta);
        const childOptions = buildCascaderOptions(children);

        targetOption.children = childOptions;
        targetOption.loading = false;

        // 更新已加载路径缓存
        loadedPathsRef.current.add(pathKey);
        setOptions([...options]);
      } catch (error) {
        console.error(`Failed to load children for ${pathKey}:`, error);
        targetOption.loading = false;
        setOptions([...options]);
      }
    },
    [options],
  );

  // 处理选择变化事件
  const handleChange = useCallback(
    (selectedValues: (string | number)[], selectedOptions?: any[]) => {
      if (!selectedValues || selectedValues.length === 0) {
        onChange?.('');
        return;
      }

      // 将选择的路径转换为字符串数组
      const path = selectedValues.map(String);
      const pathString = path.join('.');

      // 获取最后选中的选项，判断是否为叶子节点
      const lastOption = selectedOptions?.[selectedOptions.length - 1];
      const isLeaf = lastOption?.isLeaf;

      if (isLeaf) {
        // 叶子节点：单击即可选中
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
        const formattedValue = formatPathToValue(path);
        onChange?.(formattedValue);
        return;
      }

      // 非叶子节点：需要双击才能选中
      const isSamePath = pathString === lastClickPathRef.current;

      if (clickTimerRef.current && isSamePath) {
        // 双击同一个非叶子节点，清除定时器并选中
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        lastClickPathRef.current = '';

        const formattedValue = formatPathToValue(path);
        onChange?.(formattedValue);
      } else {
        // 单击非叶子节点，清除之前的定时器并设置新的
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
        }

        lastClickPathRef.current = pathString;
        clickTimerRef.current = setTimeout(() => {
          clickTimerRef.current = null;
          lastClickPathRef.current = '';
          // 单击延迟后不执行任何操作（非叶子节点单击不选中）
        }, doubleClickDelay);
      }
    },
    [onChange, doubleClickDelay],
  );

  // 搜索过滤选项 - 只搜索已加载的节点
  const filterOption = useCallback(
    (inputValue: string, path: any[]) => {
      if (!inputValue.trim()) return true;

      // 搜索已加载的节点
      const searchResults = searchInLoadedNodes(options, inputValue);

      // 检查当前路径是否匹配搜索结果
      return searchResults.some((result) => {
        const resultPath = getOptionPath(result, options);
        // 检查路径是否匹配
        if (path.length > resultPath.length) return false;

        return path.every(
          (segment: any, index: number) => index < resultPath.length && resultPath[index] === segment.value,
        );
      });
    },
    [options],
  );

  // 获取选项在树中的完整路径
  const getOptionPath = (option: CascaderOption, allOptions: CascaderOption[]): string[] => {
    const path: string[] = [];
    const findPath = (opts: CascaderOption[], target: CascaderOption, currentPath: string[]): boolean => {
      for (const opt of opts) {
        const newPath = [...currentPath, opt.value];
        if (opt === target) {
          path.push(...newPath);
          return true;
        }
        if (opt.children && findPath(opt.children, target, newPath)) {
          return true;
        }
      }
      return false;
    };

    findPath(allOptions, option, []);
    return path;
  };

  // 当前选中的路径值
  const cascaderValue = currentPath;

  return (
    <Cascader
      {...cascaderProps}
      options={options}
      value={cascaderValue}
      onChange={handleChange}
      loadData={handleLoadData}
      showSearch={showSearch ? { filter: filterOption } : false}
      loading={loading}
      changeOnSelect={true}
      expandTrigger="click"
    >
      {children}
    </Cascader>
  );
};
