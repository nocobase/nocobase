/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useRef, useMemo } from 'react';
import { Button, Cascader } from 'antd';
import type { FlowContextSelectorProps } from './variables/types';
import { useVariableTreeData } from './variables/useVariableTreeData';
import { formatPathToValue } from './variables/utils';

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
  parseValueToPath: customParseValueToPath,
  formatPathToValue: customFormatPathToValue,
  open,
  ...cascaderProps
}) => {
  // 记录最后点击的路径，用于双击检测
  const lastSelectedRef = useRef<{ path: string; time: number } | null>(null);

  const { options, loading, currentPath, handleLoadData } = useVariableTreeData({
    metaTree,
    value,
    parseValueToPath: customParseValueToPath,
  });

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
    (selectedValues: (string | number)[], selectedOptions?: any[]) => {
      const lastOption = selectedOptions?.[selectedOptions.length - 1];
      if (!selectedValues || selectedValues.length === 0) {
        onChange?.('', lastOption);
        return;
      }

      const path = selectedValues.map(String);
      const pathString = path.join('.');
      const isLeaf = lastOption?.isLeaf;
      const now = Date.now();

      // 使用自定义格式化函数或默认函数
      let formattedValue: string;
      if (customFormatPathToValue) {
        formattedValue = customFormatPathToValue(lastOption);
        if (formattedValue === undefined) {
          formattedValue = formatPathToValue(lastOption);
        }
      } else {
        formattedValue = formatPathToValue(lastOption);
      }

      if (isLeaf) {
        onChange?.(formattedValue, lastOption);
        return;
      }

      // 非叶子节点：检查双击
      const lastSelected = lastSelectedRef.current;
      const isDoubleClick = lastSelected?.path === pathString && now - lastSelected.time < 300;

      if (isDoubleClick) {
        // 双击：选中非叶子节点
        onChange?.(formattedValue, lastOption);
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
    >
      {children || defaultChildren}
    </Cascader>
  );
};

export const FlowContextSelector = React.memo(FlowContextSelectorComponent);
