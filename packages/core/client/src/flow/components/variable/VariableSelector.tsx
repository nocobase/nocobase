/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Cascader, Empty, Input, Spin } from 'antd';
import type { CascaderProps } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MetaTreeNode } from '@nocobase/flow-engine';

interface VariableSelectorProps {
  metaTree: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
  value?: any;
  onChange?: (value: any) => void;
}

interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  isLeaf?: boolean;
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({ metaTree, value, onChange }) => {
  const [options, setOptions] = useState<CascaderOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedValue, setSelectedValue] = useState<string[]>([]);

  // 转换 MetaTreeNode 到 CascaderOption
  const convertToOptions = useCallback(async (nodes: MetaTreeNode[]): Promise<CascaderOption[]> => {
    const result: CascaderOption[] = [];

    for (const node of nodes) {
      const option: CascaderOption = {
        value: node.name,
        label: node.title || node.name,
      };

      if (node.children) {
        if (typeof node.children === 'function') {
          // 异步子节点，标记为非叶子节点
          option.isLeaf = false;
        } else {
          // 同步子节点，直接转换
          option.children = await convertToOptions(node.children);
          option.isLeaf = option.children.length === 0;
        }
      } else {
        option.isLeaf = true;
      }

      result.push(option);
    }

    return result;
  }, []);

  // 初始化选项，包含固定的 Null 和 Constant
  const initializeOptions = useCallback(async () => {
    setLoading(true);
    try {
      let treeNodes: MetaTreeNode[] = [];

      if (typeof metaTree === 'function') {
        treeNodes = await metaTree();
      } else {
        treeNodes = metaTree;
      }

      const convertedOptions = await convertToOptions(treeNodes);

      // 添加固定的 Null 和 Constant 选项
      const fixedOptions: CascaderOption[] = [
        { value: 'null', label: 'Null', isLeaf: true },
        { value: 'constant', label: 'Constant', isLeaf: true },
        ...convertedOptions,
      ];

      setOptions(fixedOptions);
    } catch (error) {
      console.error('Failed to load metaTree:', error);
      setOptions([
        { value: 'null', label: 'Null', isLeaf: true },
        { value: 'constant', label: 'Constant', isLeaf: true },
      ]);
    } finally {
      setLoading(false);
    }
  }, [metaTree, convertToOptions]);

  // 异步加载子选项
  const loadData = useCallback(
    async (selectedOptions: CascaderOption[]) => {
      const targetOption = selectedOptions[selectedOptions.length - 1];

      if (!targetOption || targetOption.isLeaf) {
        return;
      }

      setLoading(true);
      try {
        // 根据选择路径找到对应的 MetaTreeNode
        let currentNodes: MetaTreeNode[] = typeof metaTree === 'function' ? await metaTree() : metaTree;

        for (let i = 0; i < selectedOptions.length; i++) {
          const option = selectedOptions[i];
          const node = currentNodes.find((n) => n.name === option.value);

          if (!node || !node.children) {
            return;
          }

          if (typeof node.children === 'function') {
            currentNodes = await node.children();
          } else {
            currentNodes = node.children;
          }
        }

        const childrenOptions = await convertToOptions(currentNodes);
        targetOption.children = childrenOptions;
        targetOption.isLeaf = childrenOptions.length === 0;

        setOptions([...options]);
      } catch (error) {
        console.error('Failed to load children:', error);
        targetOption.children = [];
        targetOption.isLeaf = true;
      } finally {
        setLoading(false);
      }
    },
    [metaTree, convertToOptions, options],
  );

  // 解析当前值并设置选中状态
  useEffect(() => {
    if (value && typeof value === 'string') {
      const variablePattern = /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/;
      const match = value.match(variablePattern);

      if (match) {
        const path = match[1];
        const pathArray = path.split('.');
        setSelectedValue(pathArray);
      } else {
        setSelectedValue([]);
      }
    } else {
      setSelectedValue([]);
    }
  }, [value]);

  // 初始化
  useEffect(() => {
    initializeOptions();
  }, [initializeOptions]);

  // 处理选择变化
  const handleChange = useCallback(
    (selectedValues: string[]) => {
      setSelectedValue(selectedValues);

      if (!selectedValues || selectedValues.length === 0) {
        onChange?.(null);
        return;
      }

      const firstValue = selectedValues[0];

      // 处理固定选项
      if (firstValue === 'null') {
        onChange?.(null);
        return;
      }

      if (firstValue === 'constant') {
        onChange?.('');
        return;
      }

      // 处理变量选择
      const variablePath = selectedValues.join('.');
      const variableValue = `{{ ctx.${variablePath} }}`;
      onChange?.(variableValue);
    },
    [onChange],
  );

  // 过滤选项（基于搜索）
  const filteredOptions = useMemo(() => {
    if (!search) {
      return options;
    }

    const filterOptions = (opts: CascaderOption[]): CascaderOption[] => {
      return opts.reduce<CascaderOption[]>((acc, option) => {
        if (option.label.toLowerCase().includes(search.toLowerCase())) {
          acc.push(option);
        } else if (option.children) {
          const filteredChildren = filterOptions(option.children);
          if (filteredChildren.length > 0) {
            acc.push({
              ...option,
              children: filteredChildren,
            });
          }
        }
        return acc;
      }, []);
    };

    return filterOptions(options);
  }, [options, search]);

  // 自定义下拉渲染，包含搜索功能
  const dropdownRender: CascaderProps['dropdownRender'] = (menus) => (
    <div>
      <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
        <Input.Search placeholder="Search" onChange={(e) => setSearch(e.target.value)} allowClear />
      </div>
      {loading && (
        <div style={{ padding: '10px', textAlign: 'center' }}>
          <Spin />
        </div>
      )}
      {/* 简化条件判断，始终显示 menus，让 Cascader 自己处理空状态 */}
      {search && filteredOptions.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '10px' }} />
      ) : (
        menus
      )}
    </div>
  );

  return (
    <Cascader
      options={search ? filteredOptions : options} // 只在搜索时使用过滤选项
      value={selectedValue}
      onChange={handleChange}
      loadData={loadData}
      dropdownRender={dropdownRender}
      changeOnSelect={false}
      showSearch={false} // 使用自定义搜索
      style={{ minWidth: '100px' }}
      expandTrigger="hover" // 明确设置 hover 触发展开
    >
      <Button>×</Button>
    </Cascader>
  );
};
