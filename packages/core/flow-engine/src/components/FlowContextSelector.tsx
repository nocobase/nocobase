/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useRef, useMemo, useState } from 'react';
import { Button, Cascader } from 'antd';
import type { ContextSelectorItem, FlowContextSelectorProps } from './variables/types';
import { buildContextSelectorItems, formatPathToValue, parseValueToPath } from './variables/utils';
import { useResolvedMetaTree } from './variables/useResolvedMetaTree';

const defaultButtonStyle = {
  fontStyle: 'italic' as const,
  fontFamily: 'New York, Times New Roman, Times, serif',
};

const FlowContextSelectorComponent: React.FC<FlowContextSelectorProps> = ({
  value,
  onChange,
  children,
  metaTree,
  showSearch = false,
  parseValueToPath: customParseValueToPath = parseValueToPath,
  formatPathToValue: customFormatPathToValue,
  open,
  ...cascaderProps
}) => {
  // 记录最后点击的路径，用于双击检测
  const lastSelectedRef = useRef<{ path: string; time: number } | null>(null);

  const { resolvedMetaTree, loading } = useResolvedMetaTree(metaTree);

  // 用于强制重新渲染的状态
  const [updateFlag, setUpdateFlag] = useState(0);
  const triggerUpdate = useCallback(() => setUpdateFlag((prev) => prev + 1), []);

  // 构建选项
  const options = useMemo(() => {
    return buildContextSelectorItems(resolvedMetaTree);
  }, [resolvedMetaTree, updateFlag]);

  // 处理异步加载子节点
  const handleLoadData = useCallback(
    async (selectedOptions: ContextSelectorItem[]) => {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      if (!targetOption || targetOption.children || targetOption.isLeaf) {
        return;
      }

      const targetMetaNode = targetOption.meta;
      if (!targetMetaNode || !targetMetaNode.children || typeof targetMetaNode.children !== 'function') {
        return;
      }

      try {
        const childNodes = await targetMetaNode.children();
        targetMetaNode.children = childNodes;
        triggerUpdate();
      } catch (error) {
        console.error('Failed to load children:', error);
      }
    },
    [triggerUpdate],
  );

  const currentPath = useMemo(() => {
    return customParseValueToPath(value);
  }, [value]);

  // 默认按钮组件
  const defaultChildren = useMemo(() => {
    const hasSelected = currentPath && currentPath.length > 0;
    return (
      <Button type={hasSelected ? 'primary' : 'default'} style={defaultButtonStyle}>
        x
      </Button>
    );
  }, [currentPath]);

  // 处理选择变化事件
  const handleChange = useCallback(
    (selectedValues: (string | number)[], selectedOptions?: ContextSelectorItem[]) => {
      const lastOption = selectedOptions?.[selectedOptions.length - 1];
      if (!selectedValues || selectedValues.length === 0) {
        onChange?.('', lastOption?.meta);
        return;
      }

      const path = selectedValues.map(String);
      const pathString = path.join('.');
      const isLeaf = lastOption?.isLeaf;
      const now = Date.now();

      // 使用自定义格式化函数或默认函数
      let formattedValue: string;
      if (customFormatPathToValue) {
        formattedValue = customFormatPathToValue(lastOption?.meta);
        if (formattedValue === undefined) {
          formattedValue = formatPathToValue(lastOption?.meta);
        }
      } else {
        formattedValue = formatPathToValue(lastOption?.meta);
      }

      if (isLeaf) {
        onChange?.(formattedValue, lastOption?.meta);
        return;
      }

      // 非叶子节点：检查双击
      const lastSelected = lastSelectedRef.current;
      const isDoubleClick = lastSelected?.path === pathString && now - lastSelected.time < 300;

      if (isDoubleClick) {
        // 双击：选中非叶子节点
        onChange?.(formattedValue, lastOption?.meta);
        lastSelectedRef.current = null;
      } else {
        // 单击：记录状态，仅展开
        lastSelectedRef.current = { path: pathString, time: now };
      }
    },
    [onChange, customFormatPathToValue],
  );

  // 当前选中的路径值
  const cascaderValue = currentPath;

  return (
    <Cascader
      {...cascaderProps}
      options={options}
      value={cascaderValue}
      onChange={handleChange}
      loadData={handleLoadData}
      loading={loading}
      changeOnSelect={true}
      expandTrigger="click"
      open={open}
      showSearch={children === null}
    >
      {children === null ? null : children || defaultChildren}
    </Cascader>
  );
};

export const FlowContextSelector = React.memo(FlowContextSelectorComponent);
