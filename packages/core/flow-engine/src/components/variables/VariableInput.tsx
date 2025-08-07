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

export const VariableInput: React.FC<VariableInputProps> = ({
  value,
  onChange,
  converters: propConverters,
  metaTree,
  showValueComponent = true,
  ...restProps
}) => {
  const [currentContextSelectorItem, setCurrentContextSelectorItem] = useState<ContextSelectorItem | null>(null);
  const { renderInputComponent, resolveValueFromPath, resolvePathFromValue } = useMemo(() => {
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
    const CustomComponent = renderInputComponent?.(resolvedContextSelectorItem);
    const finalComponent = CustomComponent || (isVariableValue(value) ? VariableTag : Input);
    return finalComponent;
  }, [renderInputComponent, resolvedContextSelectorItem, value]);

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

  const handleClear = useCallback(() => {
    if (restProps.disabled) {
      return;
    }
    setCurrentContextSelectorItem(null);
    onChange?.(null);
  }, [onChange, restProps.disabled]);

  const inputProps = useMemo(() => {
    const { style, onFocus, onBlur, disabled, ...otherProps } = restProps;
    const props = {
      ...otherProps,
      value: value || '',
      onClear: handleClear,
      onChange: handleInputChange,
      contextSelectorItem: resolvedContextSelectorItem,
    };
    return props;
  }, [value, handleInputChange, restProps, handleClear, resolvedContextSelectorItem]);

  return (
    <Space.Compact style={{ display: 'flex', alignItems: 'flex-start', ...restProps.style }}>
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
