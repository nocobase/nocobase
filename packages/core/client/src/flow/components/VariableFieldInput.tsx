/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo } from 'react';
import { connect } from '@formily/react';
import { VariableValue } from './VariableValue';
import { MetaTreeNode } from '@nocobase/flow-engine';

interface VariableFieldInputProps {
  /** 当前值 */
  value?: any;
  /** 值改变回调 */
  onChange?: (value: any) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义变量元数据树，支持函数形式 */
  propertyMetaTree?: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
}

/**
 * 变量字段输入组件
 *
 * 将 VariableValue 表单组件和 VariableSelector 组合，
 * 提供既可以输入常规值，也可以选择变量的复合输入界面。
 * VariableValue 内部支持自动组件切换。
 */
export const VariableFieldInput = connect((props: VariableFieldInputProps) => {
  const { value, onChange, disabled = false, propertyMetaTree } = props;

  // 判断当前值是否为变量格式
  const isVariableValue = useMemo(() => {
    return typeof value === 'string' && /^\{\{\s*ctx\./.test(value);
  }, [value]);

  // 计算 VariableSelector 的当前值（移到前面）
  const cascaderValue = useMemo(() => {
    if (!value) {
      return [''];
    }

    if (isVariableValue) {
      // 提取变量路径
      const match = value.match(/^\{\{\s*ctx\.([^}]+?)\s*\}\}$/);
      if (match) {
        const path = match[1].trim().split('.');
        return path;
      }
    } else if (value) {
      // 非空的常规值
      return ['constant'];
    }

    return [''];
  }, [value, isVariableValue]);

  // 处理 VariableValue 的变化
  const handleVariableValueChange = useCallback(
    (newValue: any) => {
      console.log('handleVariableValueChange called with:', newValue);
      console.log('onChange function exists:', !!onChange);
      onChange?.(newValue);
    },
    [onChange],
  );

  // 处理 VariableSelector 的变化
  const handleVariableChange = useCallback(
    (next: string[], optionPath: any[], isDoubleClick?: boolean) => {
      console.log('handleVariableChange called:', { next, optionPath, isDoubleClick });

      if (next[0] === '') {
        // 选择了 null
        console.log('Setting null value');
        handleVariableValueChange('');
        return;
      }

      if (next[0] === 'constant') {
        // 选择了 constant，切换为常规值模式
        // 如果当前是变量值，则清空；否则保持当前值
        console.log('Setting constant mode, isVariableValue:', isVariableValue);
        if (isVariableValue) {
          handleVariableValueChange('');
        }
        return;
      }

      // 选择了变量
      const lastOption = optionPath[optionPath.length - 1];
      console.log('Variable selected, lastOption:', lastOption);

      // 判断是否为叶子节点：明确标记为叶子节点 或者 没有子节点 或者 子节点数组为空
      const isLeafNode =
        lastOption?.isLeaf === true ||
        !lastOption?.children ||
        (Array.isArray(lastOption?.children) && lastOption.children.length === 0);

      console.log(
        'isLeafNode:',
        isLeafNode,
        'lastOption.isLeaf:',
        lastOption?.isLeaf,
        'lastOption.children:',
        lastOption?.children,
      );

      // 如果是叶子节点，或者是双击选择的非叶子节点，都创建变量
      if (isLeafNode || (isDoubleClick && !isLeafNode)) {
        const newVariable = `{{ ctx.${next.join('.')} }}`;
        console.log('Creating variable:', newVariable);
        console.log('Calling onChange directly with variable:', newVariable);
        onChange?.(newVariable);
      } else if (!isLeafNode && !isDoubleClick) {
        console.log('Non-leaf node clicked (not double-click), not creating variable');
      } else {
        console.log('Not creating variable for unknown reason');
      }
    },
    [isVariableValue, handleVariableValueChange, onChange],
  );

  return (
    <VariableValue
      value={value}
      onChange={handleVariableValueChange}
      disabled={disabled}
      variableChange={handleVariableChange}
      variableValue={cascaderValue}
      propertyMetaTree={propertyMetaTree}
    />
  );
});
