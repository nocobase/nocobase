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
import type { VariableInputProps, ContextSelectorItem } from './types';
import { FlowContextSelector } from '../FlowContextSelector';
import { VariableTag } from './VariableTag';
import { isVariableValue } from './utils';
import { createFinalConverters, buildContextSelectorItemFromPath } from './utils';

const compactStyle = {
  display: 'flex' as const,
  alignItems: 'flex-start' as const,
};

const VariableInputComponent: React.FC<VariableInputProps> = ({
  value,
  onChange,
  converters: propConverters,
  metaTree,
  showValueComponent = true,
  ...restProps
}) => {
  const [currentContextSelectorItem, setCurrentContextSelectorItem] = useState<ContextSelectorItem | null>(null);
  const { resolveValueFromPath, resolvePathFromValue } = useMemo(() => {
    return createFinalConverters(propConverters);
  }, [propConverters]);

  // 当value存在但contextSelectorItem为null时，尝试从value重建contextSelectorItem
  const resolvedContextSelectorItem = useMemo(() => {
    if (currentContextSelectorItem) {
      return currentContextSelectorItem;
    }

    if (isVariableValue(value) && Array.isArray(metaTree)) {
      const path = resolvePathFromValue?.(value);
      if (path) {
        return buildContextSelectorItemFromPath(path, metaTree);
      }
    }

    return null;
  }, [currentContextSelectorItem, value, metaTree, resolvePathFromValue]);

  const ValueComponent = useMemo(() => {
    if (resolvedContextSelectorItem == null && isVariableValue(value)) {
      return VariableTag;
    }
    const CustomComponent = resolvedContextSelectorItem?.meta?.render;
    const finalComponent = CustomComponent || (isVariableValue(value) ? VariableTag : Input);
    return finalComponent;
  }, [resolvedContextSelectorItem, value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | any) => {
      const newValue = e?.target?.value !== undefined ? e.target.value : e;
      onChange?.(newValue);
    },
    [onChange],
  );

  const handleVariableSelect = useCallback(
    (variableValue: string, contextSelectorItem?: ContextSelectorItem) => {
      setCurrentContextSelectorItem(contextSelectorItem);
      const finalValue = resolveValueFromPath?.(contextSelectorItem) || variableValue;
      onChange?.(finalValue);
    },
    [onChange, resolveValueFromPath],
  );

  const { disabled } = restProps;

  const handleClear = useCallback(() => {
    if (disabled) {
      return;
    }
    setCurrentContextSelectorItem(null);
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

    // 只有 VariableTag 才接收特殊的自定义属性
    if (ValueComponent === VariableTag) {
      return {
        ...baseProps,
        onClear: handleClear,
        contextSelectorItem: resolvedContextSelectorItem,
        metaTree,
        style: stableProps.style,
      };
    }

    return {
      ...baseProps,
      ...stableProps.otherProps,
    };
  }, [
    value,
    handleInputChange,
    disabled,
    handleClear,
    resolvedContextSelectorItem,
    metaTree,
    ValueComponent,
    stableProps,
  ]);

  const finalStyle = useMemo(
    () => ({
      ...compactStyle,
      ...restProps.style,
    }),
    [restProps.style],
  );

  return (
    <Space.Compact style={finalStyle}>
      {showValueComponent && <ValueComponent {...inputProps} />}
      <FlowContextSelector
        metaTree={metaTree}
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
