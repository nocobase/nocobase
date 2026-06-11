/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Checkbox, ColorPicker, DatePicker, Input, InputNumber, Radio, Select, TimePicker } from 'antd';
import React from 'react';
import type { FilterOperator, FilterOption } from '../../../flow/components/filter/useFilterOptions';
import { PasswordInput } from '../PasswordInput';
import { DateFilterDynamicComponent } from './DateFilterDynamicComponent';

type ComponentRegistryApp = {
  getComponent?: (name: string) => React.ComponentType<any> | undefined;
};

export interface FilterValueInputProps {
  /** The currently selected leaf field option from the field picker. */
  field?: FilterOption;
  /** The currently selected operator (full object, not just `.value`). */
  operator?: FilterOperator;
  /** Current value. Shape depends on operator/field. */
  value: any;
  /** Notify the parent when the user edits the value. */
  onChange: (value: any) => void;
  /** Translator used by sub-renderers. */
  t?: (key: string) => string;
  /** Optional placeholder for the fallback `Input`. */
  placeholder?: string;
  /** Optional v2 app registry used to resolve plugin-provided operator components. */
  app?: ComponentRegistryApp;
}

const identity = (s: string) => s;

type EffectiveSchema = {
  'x-component'?: string | React.ComponentType<any>;
  'x-component-props'?: Record<string, any>;
  enum?: Array<{ value: any; label: string }> | any[];
};

const baseStyle = { minWidth: 200 } as const;
const fallbackInputComponents = new Set(['Input', 'Input.URL', 'NanoIDInput']);

/** Resolve operator-level schema → field uiSchema → fallback Input. */
const resolveSchema = (field?: FilterOption, operator?: FilterOperator): EffectiveSchema => {
  if (operator?.schema?.['x-component']) {
    return operator.schema as EffectiveSchema;
  }
  const fieldSchema = field?.schema as EffectiveSchema | undefined;
  if (fieldSchema?.['x-component']) {
    return fieldSchema;
  }
  return { 'x-component': 'Input' };
};

/**
 * Interface-aware value renderer for filter rows. Returns `null` for `noValue` operators (`$empty`, `$notEmpty`). Otherwise dispatches the effective `x-component` (operator schema > field uiSchema > Input) to a small registry of antd controls.
 */
export const FilterValueInput: React.FC<FilterValueInputProps> = (props) => {
  const { field, operator, value, onChange, t = identity, placeholder, app } = props;

  if (operator?.noValue) {
    return null;
  }

  const schema = resolveSchema(field, operator);
  const componentName = schema['x-component'];
  const componentProps = schema['x-component-props'] || {};
  const enumOptions = (schema as any).enum || (field?.schema as any)?.enum;
  const customComponentProps = {
    value,
    onChange,
    ...componentProps,
    style: { ...baseStyle, ...(componentProps.style || {}) },
  };

  switch (componentName) {
    case 'DateFilterDynamicComponent':
      return <DateFilterDynamicComponent value={value} onChange={onChange} isRange={!!componentProps.isRange} t={t} />;

    case 'DatePicker':
    case 'UnixTimestamp':
      return (
        <DatePicker
          value={value}
          onChange={onChange}
          {...componentProps}
          style={{ ...baseStyle, ...(componentProps.style || {}) }}
        />
      );

    case 'TimePicker':
      return (
        <TimePicker
          value={value}
          onChange={onChange}
          {...componentProps}
          style={{ ...baseStyle, ...(componentProps.style || {}) }}
        />
      );

    case 'InputNumber':
    case 'Percent':
      return (
        <InputNumber
          value={value}
          onChange={(next) => onChange(next ?? undefined)}
          {...componentProps}
          style={{ ...baseStyle, ...(componentProps.style || {}) }}
        />
      );

    case 'ColorPicker':
      return <ColorPicker value={value} onChange={(_color, hex) => onChange(hex)} {...componentProps} />;

    case 'Checkbox':
      return <Checkbox checked={!!value} onChange={(e) => onChange(e.target.checked)} {...componentProps} />;

    case 'Checkbox.Group': {
      const options = Array.isArray(componentProps.options) ? componentProps.options : enumOptions;
      return (
        <Checkbox.Group
          value={value}
          onChange={onChange}
          options={options as any}
          {...componentProps}
          style={{ ...baseStyle, ...(componentProps.style || {}) }}
        />
      );
    }

    case 'Radio.Group': {
      const options = Array.isArray(componentProps.options) ? componentProps.options : enumOptions;
      return (
        <Radio.Group
          value={value}
          onChange={(e) => onChange(e.target.value)}
          options={options as any}
          {...componentProps}
          style={{ ...baseStyle, ...(componentProps.style || {}) }}
        />
      );
    }

    case 'Select': {
      const { mode, options, multiple } = componentProps;
      const resolvedMode = mode === 'tags' || mode === 'multiple' ? mode : multiple ? 'multiple' : undefined;
      const inlineOptions = Array.isArray(options) ? options : enumOptions;
      const resolvedOptions = Array.isArray(inlineOptions)
        ? inlineOptions.map((option: any) => ({
            ...option,
            label: typeof option.label === 'string' ? t(option.label) : option.label,
          }))
        : undefined;
      return (
        <Select
          value={value}
          onChange={onChange}
          mode={resolvedMode}
          options={resolvedOptions}
          allowClear
          {...componentProps}
          style={{ ...baseStyle, ...(componentProps.style || {}) }}
        />
      );
    }

    case 'Password':
      return (
        <PasswordInput
          value={value}
          onChange={(e: any) => onChange(e?.target?.value ?? e)}
          {...componentProps}
          style={{ ...baseStyle, ...(componentProps.style || {}) }}
        />
      );

    case 'Input.TextArea':
    case 'Input.JSON':
    case 'Markdown':
    case 'RichText':
      return (
        <Input.TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...componentProps}
          style={{ ...baseStyle, ...(componentProps.style || {}) }}
        />
      );

    case 'Input':
    case 'Input.URL':
    case 'NanoIDInput':
    default:
      if (typeof componentName === 'function') {
        const Component = componentName;
        return <Component {...customComponentProps} />;
      }

      if (typeof componentName === 'string' && !fallbackInputComponents.has(componentName)) {
        const Component = app?.getComponent?.(componentName);
        if (Component) {
          return <Component {...customComponentProps} />;
        }
      }

      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          {...componentProps}
          style={{ ...baseStyle, ...(componentProps.style || {}) }}
        />
      );
  }
};

export default FilterValueInput;
