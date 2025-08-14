/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useCallback, useState } from 'react';
import { Input, Space } from 'antd';
import type { VariableInputProps } from './types';
import { FlowContextSelector } from '../FlowContextSelector';
import { VariableTag } from './VariableTag';
import { isVariableValue } from './utils';
import { createFinalConverters } from './utils';
import { MetaTreeNode } from '../../flowContext';
import { useRequest } from 'ahooks';

const compactStyle = {
  display: 'flex' as const,
  alignItems: 'flex-start' as const,
};

/**
 * 根据路径数组在metaTree中查找对应的MetaTreeNode
 * @param metaTree MetaTreeNode数组
 * @param targetPath 目标路径数组，例如 ["user", "profile"]
 * @returns 找到的MetaTreeNode或null
 */
const findMetaTreeNodeByPath = (metaTree: MetaTreeNode[], targetPath: string[]): MetaTreeNode | null => {
  if (!targetPath || targetPath.length === 0) {
    return null;
  }

  // 递归搜索函数
  const searchInNodes = (nodes: MetaTreeNode[], path: string[]): MetaTreeNode | null => {
    for (const node of nodes) {
      // 检查当前节点的paths是否匹配目标路径
      if (node.paths && arraysEqual(node.paths, path)) {
        return node;
      }

      // 如果当前节点的路径是目标路径的前缀，则继续在子节点中搜索
      if (node.paths && isPathPrefix(node.paths, path) && node.children) {
        // 同步子节点：直接搜索
        if (Array.isArray(node.children)) {
          const found = searchInNodes(node.children, path);
          if (found) return found;
        }
        // 异步子节点：暂时跳过，因为这是一个同步函数
        // 在实际使用中，如果遇到异步子节点，可能需要在组件层面处理
      }
    }
    return null;
  };

  return searchInNodes(metaTree, targetPath);
};

/**
 * 检查两个数组是否相等
 */
const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

/**
 * 检查pathA是否是pathB的前缀
 * 例如 ["user"] 是 ["user", "profile"] 的前缀
 */
const isPathPrefix = (pathA: string[], pathB: string[]): boolean => {
  if (pathA.length >= pathB.length) return false;
  return pathA.every((val, index) => val === pathB[index]);
};

const VariableInputComponent: React.FC<VariableInputProps> = ({
  value,
  onChange,
  converters: propConverters,
  metaTree,
  showValueComponent = true,
  ...restProps
}) => {
  const [currentMetaTreeNode, setCurrentMetaTreeNode] = useState<MetaTreeNode | null>(null);
  const { resolveValueFromPath, resolvePathFromValue, renderInputComponent } = useMemo(() => {
    return createFinalConverters(propConverters);
  }, [propConverters]);
  const { data: resolvedMetaTree, loading } = useRequest(
    async () => {
      if (typeof metaTree === 'function') {
        return await metaTree();
      }
      return metaTree;
    },
    { refreshDeps: [metaTree] },
  );

  const resolvedMetaTreeNode = useMemo(() => {
    if (currentMetaTreeNode) {
      return currentMetaTreeNode;
    }

    if (isVariableValue(value) && Array.isArray(resolvedMetaTree)) {
      const path = resolvePathFromValue?.(value);
      if (path) {
        return findMetaTreeNodeByPath(resolvedMetaTree, path);
      }
    }

    return null;
  }, [currentMetaTreeNode, value, resolvedMetaTree, resolvePathFromValue]);

  const ValueComponent = useMemo(() => {
    const Component = renderInputComponent?.(resolvedMetaTreeNode);
    const CustomComponent = resolvedMetaTreeNode?.render;
    const finalComponent = Component || CustomComponent || (isVariableValue(value) ? VariableTag : Input);
    return finalComponent;
  }, [renderInputComponent, resolvedMetaTreeNode, value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | any) => {
      const newValue = e?.target?.value !== undefined ? e.target.value : e;
      onChange?.(newValue);
    },
    [onChange],
  );

  const handleVariableSelect = useCallback(
    (variableValue: string, metaTreeNode?: MetaTreeNode) => {
      setCurrentMetaTreeNode(metaTreeNode);
      const finalValue = resolveValueFromPath?.(metaTreeNode) || variableValue;
      onChange?.(finalValue, metaTreeNode);
    },
    [onChange, resolveValueFromPath],
  );

  const { disabled } = restProps;

  const handleClear = useCallback(() => {
    if (disabled) {
      return;
    }
    setCurrentMetaTreeNode(null);
    onChange?.(null);
  }, [onChange, disabled]);

  const stableProps = useMemo(() => {
    const { style, onFocus, onBlur, disabled, ...otherProps } = restProps;
    return { style, onFocus, onBlur, otherProps };
  }, [restProps.style, restProps.onFocus, restProps.onBlur, restProps.disabled]);

  const inputProps = useMemo(() => {
    const baseProps = {
      value: value || '',
      onChange: handleInputChange,
      disabled,
    };

    if (ValueComponent === VariableTag) {
      return {
        ...baseProps,
        onClear: handleClear,
        metaTreeNode: resolvedMetaTreeNode,
        metaTree,
        style: stableProps.style,
      };
    }

    return {
      ...baseProps,
      ...stableProps.otherProps,
    };
  }, [value, handleInputChange, disabled, handleClear, resolvedMetaTreeNode, metaTree, ValueComponent, stableProps]);

  const finalStyle = useMemo(
    () => ({
      ...compactStyle,
      ...restProps.style,
    }),
    [restProps.style],
  );

  if (loading) {
    return null;
  }

  return (
    <Space.Compact style={finalStyle}>
      {showValueComponent && <ValueComponent style={{ width: '100%' }} {...inputProps} />}
      <FlowContextSelector
        metaTree={resolvedMetaTree}
        value={value}
        onChange={handleVariableSelect}
        parseValueToPath={resolvePathFromValue}
        formatPathToValue={resolveValueFromPath}
        {...(!showValueComponent && { children: null })}
      />
    </Space.Compact>
  );
};

export const VariableInput = React.memo(VariableInputComponent);
