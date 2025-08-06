/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Input, Space } from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import { cx } from '@emotion/css';
import type { VariableInputProps, ContextSelectorItem } from './types';
import { FlowContextSelector } from '../FlowContextSelector';
import { VariableTag } from './VariableTag';
import { isVariableValue, parseValueToPath, buildContextSelectorItemFromPath } from './utils';
import { useVariableInput, useVariableConverters } from './hooks';
import { variableContainerStyle, variableTagContainerStyle } from './styles/variableInput.styles';

export const VariableInput: React.FC<VariableInputProps> = ({
  value,
  onChange,
  converters: propConverters,
  metaTree,
  ...restProps
}) => {
  // 使用自定义hooks
  const { inputRef, handleFocus, handleBlur } = useVariableInput(value);

  // 管理当前的 ContextSelectorItem 状态
  const [currentContextSelectorItem, setCurrentContextSelectorItem] = useState<ContextSelectorItem | null>(null);

  const baseConverters = useVariableConverters(typeof propConverters === 'function' ? undefined : propConverters, null);

  const currentConverters = useMemo(() => {
    if (typeof propConverters === 'function' && currentContextSelectorItem) {
      const dynamicConverters = propConverters(currentContextSelectorItem);
      return { ...baseConverters, ...dynamicConverters };
    }
    return baseConverters;
  }, [propConverters, currentContextSelectorItem, baseConverters]);

  // 创建适配函数，将 resolveValueFromPath 适配成 FlowContextSelector 需要的签名
  const formatPathToValueFn = useMemo(() => {
    if (!currentConverters.resolveValueFromPath) return undefined;

    return (path: string[]) => {
      const contextSelectorItem = buildContextSelectorItemFromPath(path, metaTree, []);
      if (contextSelectorItem) {
        return currentConverters.resolveValueFromPath(contextSelectorItem, path);
      }
      // 如果无法构建ContextSelectorItem，使用默认格式
      return `{{ ctx.${path.join('.')} }}`;
    };
  }, [currentConverters.resolveValueFromPath, metaTree]);

  // 初始计算或重新计算 currentContextSelectorItem（仅在必要时）
  useEffect(() => {
    if (!isVariableValue(value)) {
      setCurrentContextSelectorItem((prevItem) => (prevItem ? null : prevItem));
      return;
    }

    // 直接使用 parseValueToPath 避免依赖可能不稳定的函数引用
    const path = parseValueToPath(value);
    if (!path || path.length === 0) {
      setCurrentContextSelectorItem((prevItem) => (prevItem ? null : prevItem));
      return;
    }

    const contextSelectorItem = buildContextSelectorItemFromPath(path, metaTree, []);
    setCurrentContextSelectorItem((prevItem) => {
      // 只在真正改变时才更新状态
      if (!prevItem && !contextSelectorItem) return prevItem;
      if (!prevItem || !contextSelectorItem) return contextSelectorItem;
      if (prevItem.value === contextSelectorItem.value && prevItem.label === contextSelectorItem.label) {
        return prevItem;
      }
      return contextSelectorItem;
    });
  }, [value, metaTree]); // 移除 parseValueToPathFn 依赖

  // 根据路径和metaTree获取显示用的标题路径
  const getDisplayPath = useCallback(
    (path: string[]): string => {
      const buildPathTitles = (tree: any[], currentPath: string[], depth = 0): string[] => {
        if (depth >= currentPath.length || !tree) return [];

        const segment = currentPath[depth];
        const node = tree.find((n) => n.name === segment);

        if (!node) return [segment];

        const currentTitle = node.title || node.name;

        if (depth === currentPath.length - 1) {
          return [currentTitle];
        }

        if (Array.isArray(node.children)) {
          const childTitles = buildPathTitles(node.children, currentPath, depth + 1);
          return [currentTitle, ...childTitles];
        }

        return [currentTitle, ...currentPath.slice(depth + 1)];
      };

      if (!metaTree || typeof metaTree === 'function') {
        return path.join('/');
      }

      const titles = buildPathTitles(metaTree, path);
      return titles.join('/');
    },
    [metaTree],
  );

  // 创建输入组件
  const isValueVariable = isVariableValue(value);
  const InputComponent = useMemo(() => {
    const CustomComponent = currentConverters.renderInputComponent?.(currentContextSelectorItem);
    return CustomComponent || Input;
  }, [currentConverters, currentContextSelectorItem, isValueVariable]);

  // 事件处理器
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | any) => {
      const newValue = e?.target?.value !== undefined ? e.target.value : e;
      onChange?.(newValue);
    },
    [onChange],
  );

  const handleVariableSelect = useCallback(
    (variableValue: string, contextSelectorItem?: ContextSelectorItem) => {
      // 更新 currentContextSelectorItem 状态
      if (contextSelectorItem) {
        setCurrentContextSelectorItem(contextSelectorItem);
      }

      // 如果有 contextSelectorItem，优先使用它来转换值
      if (contextSelectorItem) {
        const path = parseValueToPath(variableValue);
        if (path) {
          // 动态计算 converters 来获取最新的转换函数
          let converters = baseConverters;
          if (typeof propConverters === 'function') {
            const dynamicConverters = propConverters(contextSelectorItem);
            converters = { ...baseConverters, ...dynamicConverters };
          }

          const finalValue = converters.resolveValueFromPath?.(contextSelectorItem, path) || variableValue;
          onChange?.(finalValue);
          return;
        }
      }

      // 后备逻辑：如果没有 contextSelectorItem，尝试自己构建
      const path = parseValueToPath(variableValue);
      if (path) {
        const fallbackContextSelectorItem = buildContextSelectorItemFromPath(path, metaTree, []);
        if (fallbackContextSelectorItem) {
          setCurrentContextSelectorItem(fallbackContextSelectorItem);

          // 动态计算 converters
          let converters = baseConverters;
          if (typeof propConverters === 'function') {
            const dynamicConverters = propConverters(fallbackContextSelectorItem);
            converters = { ...baseConverters, ...dynamicConverters };
          }

          const finalValue = converters.resolveValueFromPath?.(fallbackContextSelectorItem, path) || variableValue;
          onChange?.(finalValue);
          return;
        }
      }

      // 如果都无法构建ContextSelectorItem，直接使用原值
      onChange?.(variableValue);
    },
    [onChange, baseConverters, propConverters, metaTree],
  );

  const handleClear = useCallback(() => {
    setCurrentContextSelectorItem(null);
    onChange?.(null);
  }, [onChange]);

  // 输入组件props
  const inputProps = useMemo(() => {
    const { style, onFocus, onBlur, ...otherProps } = restProps;
    return {
      ...otherProps,
      value: value || '',
      onChange: handleInputChange,
      onFocus: (e: React.FocusEvent<HTMLInputElement>) => handleFocus(e, onFocus),
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => handleBlur(e, onBlur),
      ref: inputRef,
      style: { flex: 1 },
    };
  }, [value, handleInputChange, handleFocus, handleBlur, restProps, inputRef]);

  // 渲染变量值
  if (isVariableValue(value)) {
    const path = parseValueToPath(value);
    const displayValue = path ? getDisplayPath(path) : String(value);
    const disabled = inputProps.disabled;

    return (
      <Space.Compact style={{ display: 'flex', alignItems: 'center', ...restProps.style }}>
        <div className={cx('variable', variableContainerStyle(disabled))}>
          <div
            role="button"
            aria-label="variable-tag"
            style={variableTagContainerStyle(disabled)}
            className={cx('variable-input-container', { 'ant-input-disabled': disabled })}
          >
            <VariableTag value={displayValue} onClear={undefined} className="" style={{ margin: '4px 6px' }} />
          </div>
          {!disabled && (
            <span
              role="button"
              aria-label="close"
              className="clear-button"
              style={{ userSelect: 'none' }}
              onClick={handleClear}
            >
              <CloseCircleFilled />
            </span>
          )}
        </div>
        <FlowContextSelector
          metaTree={metaTree}
          value={value}
          onChange={handleVariableSelect}
          parseValueToPath={baseConverters.resolvePathFromValue}
          formatPathToValue={formatPathToValueFn}
        />
      </Space.Compact>
    );
  }

  // 渲染静态值
  return (
    <Space.Compact style={{ display: 'flex', alignItems: 'center', ...restProps.style }}>
      <InputComponent {...inputProps} />
      <FlowContextSelector
        metaTree={metaTree}
        onChange={handleVariableSelect}
        parseValueToPath={baseConverters.resolvePathFromValue}
        formatPathToValue={formatPathToValueFn}
      />
    </Space.Compact>
  );
};
