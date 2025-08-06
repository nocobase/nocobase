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
import { isVariableValue, parseValueToPath, buildContextSelectorItemFromPath } from './utils';
import { useVariableInput, useVariableConverters } from './hooks';

export const VariableInput: React.FC<VariableInputProps> = ({
  value,
  onChange,
  converters: propConverters,
  metaTree,
  showValueComponent = true,
  ...restProps
}) => {
  const { inputRef, handleFocus, handleBlur } = useVariableInput(value);
  const [currentContextSelectorItem, setCurrentContextSelectorItem] = useState<ContextSelectorItem | null>(null);
  const baseConverters = useVariableConverters(typeof propConverters === 'function' ? undefined : propConverters, null);

  const currentConverters = useMemo(() => {
    if (typeof propConverters === 'function' && currentContextSelectorItem) {
      const dynamicConverters = propConverters(currentContextSelectorItem);
      return { ...baseConverters, ...dynamicConverters };
    }
    return baseConverters;
  }, [propConverters, currentContextSelectorItem, baseConverters]);

  const formatPathToValueFn = useMemo(() => {
    if (!currentConverters.resolveValueFromPath) return undefined;

    return (selectorItem: ContextSelectorItem) => {
      const path = selectorItem.fullPath;
      const ret = currentConverters.resolveValueFromPath(selectorItem);
      return ret === undefined ? `{{ ctx.${path.join('.')} }}` : ret;
    };
  }, [currentConverters, metaTree]);

  const ValueComponent = useMemo(() => {
    if (currentContextSelectorItem == null && isVariableValue(value)) {
      console.log('[VariableInput] Choosing VariableTag - value:', value, 'isVariable:', true);
      return VariableTag;
    }
    const CustomComponent = currentConverters.renderInputComponent?.(currentContextSelectorItem);
    console.log('[VariableInput] CustomComponent:', CustomComponent, 'currentConverters:', currentConverters);
    const finalComponent = CustomComponent || (isVariableValue(value) ? VariableTag : Input);
    console.log(
      '[VariableInput] Choosing component:',
      finalComponent === Input ? 'Input' : finalComponent === VariableTag ? 'VariableTag' : 'Custom',
      'value:',
      value,
      'isVariable:',
      isVariableValue(value),
      'contextItem:',
      currentContextSelectorItem,
    );
    return finalComponent;
  }, [currentConverters, currentContextSelectorItem, value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | any) => {
      console.log('[VariableInput] handleInputChange called:', e?.target?.value || e);
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

          const finalValue = converters.resolveValueFromPath?.(contextSelectorItem) || variableValue;
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

          const finalValue = converters.resolveValueFromPath?.(fallbackContextSelectorItem) || variableValue;
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
      onFocus: (e: React.FocusEvent<HTMLInputElement>) => handleFocus(e, onFocus),
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => handleBlur(e, onBlur),
      // ref: inputRef,
      // style: { flex: 1 },
    };
    console.log('[VariableInput] inputProps:', {
      value: props.value,
      hasOnChange: !!props.onChange,
      // hasRef: !!props.ref,
      onChange: props.onChange,
    });
    return props;
  }, [value, handleInputChange, handleFocus, handleBlur, restProps, inputRef, handleClear]);

  return (
    <Space.Compact style={{ display: 'flex', alignItems: 'flex-start', ...restProps.style }}>
      {showValueComponent && <ValueComponent {...inputProps} />}
      <FlowContextSelector
        metaTree={metaTree}
        value={value}
        onChange={handleVariableSelect}
        parseValueToPath={baseConverters.resolvePathFromValue}
        formatPathToValue={formatPathToValueFn}
        {...(!showValueComponent && { children: null })}
      />
    </Space.Compact>
  );
};
