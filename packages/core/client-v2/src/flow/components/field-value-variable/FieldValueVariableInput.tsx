/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  isRunJSValue,
  isVariableExpression,
  parseCtxDateExpressionConfig,
  parseValueToPath,
  serializeCtxDateExpressionConfig,
  tExpr,
  VariableInput,
  type CtxDateExpressionConfig,
  type CtxDatePreset,
  type MetaTreeNode,
  type VariableInputProps,
} from '@nocobase/flow-engine';
import { dayjs } from '@nocobase/utils/client';
import type { Dayjs } from 'dayjs';
import React from 'react';
import { DateVariableEditor, getDefaultDateVariableFormat } from './DateVariableEditor';
import { normalizeDateVariableExactValue, type DateVariableComponentProps } from './dateValue';

const DATE_PRESET_NODES: Array<{ name: CtxDatePreset; title: string }> = [
  { name: 'now', title: 'Now' },
  { name: 'today', title: 'Today' },
  { name: 'yesterday', title: 'Yesterday' },
  { name: 'tomorrow', title: 'Tomorrow' },
  { name: 'thisWeek', title: 'This Week' },
  { name: 'lastWeek', title: 'Last Week' },
  { name: 'nextWeek', title: 'Next Week' },
  { name: 'thisMonth', title: 'This Month' },
  { name: 'lastMonth', title: 'Last Month' },
  { name: 'nextMonth', title: 'Next Month' },
  { name: 'thisQuarter', title: 'This Quarter' },
  { name: 'lastQuarter', title: 'Last Quarter' },
  { name: 'nextQuarter', title: 'Next Quarter' },
  { name: 'thisYear', title: 'This Year' },
  { name: 'lastYear', title: 'Last Year' },
  { name: 'nextYear', title: 'Next Year' },
];

type ValueEditorComponent = React.ComponentType<{
  value?: unknown;
  onChange?: (value: unknown) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}>;

const DATE_VARIABLE_CONFIG_MARK = Symbol('field-value-date-variable-config');

type DateVariableEditConfig = CtxDateExpressionConfig & {
  [DATE_VARIABLE_CONFIG_MARK]: 'editable' | 'restored';
};

export type FieldValueVariableInputProps = Omit<
  VariableInputProps,
  'value' | 'onChange' | 'metaTree' | 'converters'
> & {
  value?: unknown;
  onChange: (value: unknown) => void;
  baseMetaTree: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
  constantComponent: ValueEditorComponent;
  nullComponent: ValueEditorComponent;
  runJSComponent: ValueEditorComponent;
  isDateLikeField: boolean;
  dateComponentProps: DateVariableComponentProps;
  allowRunJS?: boolean;
  converters?: VariableInputProps['converters'];
};

function createDateVariableEditConfig(
  config: CtxDateExpressionConfig,
  source: DateVariableEditConfig[typeof DATE_VARIABLE_CONFIG_MARK] = 'editable',
): DateVariableEditConfig {
  return { ...config, [DATE_VARIABLE_CONFIG_MARK]: source } as DateVariableEditConfig;
}

function isDateVariableEditConfig(value: unknown): value is DateVariableEditConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const source = (value as Partial<DateVariableEditConfig>)[DATE_VARIABLE_CONFIG_MARK];
  return source === 'editable' || source === 'restored';
}

function getDateNodeName(config: CtxDateExpressionConfig): string {
  if (config.kind === 'exact') return 'exact';
  if (config.kind === 'relative') return config.direction;
  return config.preset;
}

function isDayjsValue(value: unknown): value is Dayjs {
  return dayjs.isDayjs(value);
}

function createInitialDateConfig(
  nodeName: string,
  isDateLikeField: boolean,
  componentProps: DateVariableComponentProps,
): DateVariableEditConfig | undefined {
  let config: CtxDateExpressionConfig | undefined;

  if (nodeName === 'exact') {
    const normalized = normalizeDateVariableExactValue(dayjs(), componentProps);
    const value = isDayjsValue(normalized) ? normalized.format('YYYY-MM-DD') : String(normalized || '');
    config = { kind: 'exact', value };
  } else if (nodeName === 'past' || nodeName === 'next') {
    config = { kind: 'relative', direction: nodeName, amount: 1, unit: 'day' };
  } else if (
    DATE_PRESET_NODES.some((item) => item.name === nodeName) &&
    !(nodeName === 'now' && componentProps.exactNormalizeMode === 'date')
  ) {
    config = { kind: 'preset', preset: nodeName as CtxDatePreset };
  }

  if (!config) return undefined;
  const initialConfig = isDateLikeField ? config : { ...config, format: getDefaultDateVariableFormat(config) };
  return createDateVariableEditConfig(initialConfig);
}

function normalizeDateConfigForStore(
  config: CtxDateExpressionConfig,
  componentProps: DateVariableComponentProps,
  omitFormat: boolean,
): CtxDateExpressionConfig {
  const rawFormat = typeof config.format === 'string' ? config.format : '';
  const normalizedConfig = omitFormat
    ? { ...config, format: undefined }
    : { ...config, format: rawFormat.trim() ? rawFormat : getDefaultDateVariableFormat(config) };
  if (normalizedConfig.kind !== 'exact') return normalizedConfig;
  const normalized = normalizeDateVariableExactValue(normalizedConfig.value, componentProps);
  if (Array.isArray(normalized)) {
    return { ...normalizedConfig, value: [String(normalized[0]), String(normalized[1])] };
  }
  return { ...normalizedConfig, value: String(normalized || '') };
}

export const FieldValueVariableInput: React.FC<FieldValueVariableInputProps> = ({
  value,
  onChange,
  baseMetaTree,
  constantComponent: ConstantComponent,
  nullComponent: NullComponent,
  runJSComponent: RunJSComponent,
  isDateLikeField,
  dateComponentProps,
  allowRunJS = true,
  converters,
  clearValue = '',
  disabled = false,
  ...variableInputProps
}) => {
  const DateEditor = React.useMemo<ValueEditorComponent>(() => {
    const Component: ValueEditorComponent = (props) => (
      <DateVariableEditor
        value={isDateVariableEditConfig(props.value) ? props.value : undefined}
        onChange={(nextConfig) => props.onChange?.(createDateVariableEditConfig(nextConfig))}
        isDateLikeField={isDateLikeField}
        dateComponentProps={dateComponentProps}
        style={props.style}
        disabled={props.disabled}
      />
    );
    return Component;
  }, [dateComponentProps, isDateLikeField]);

  const parsedDateConfig = parseCtxDateExpressionConfig(value);
  const restoreLegacyNowForPureDate =
    dateComponentProps.exactNormalizeMode === 'date' &&
    parsedDateConfig?.kind === 'preset' &&
    parsedDateConfig.preset === 'now';

  const metaTree = React.useMemo<() => Promise<MetaTreeNode[]>>(() => {
    return async () => {
      const base = typeof baseMetaTree === 'function' ? await baseMetaTree() : baseMetaTree;
      const presetNodes =
        dateComponentProps.exactNormalizeMode === 'date' && !restoreLegacyNowForPureDate
          ? DATE_PRESET_NODES.filter((item) => item.name !== 'now')
          : DATE_PRESET_NODES;
      const dateChildren: MetaTreeNode[] = [
        {
          title: tExpr('Exact day'),
          name: 'exact',
          type: 'date',
          paths: ['date', 'exact'],
          render: (props) => <DateEditor {...props} />,
        },
        {
          title: tExpr('Past'),
          name: 'past',
          type: 'date',
          paths: ['date', 'past'],
          render: (props) => <DateEditor {...props} />,
        },
        {
          title: tExpr('Next'),
          name: 'next',
          type: 'date',
          paths: ['date', 'next'],
          render: (props) => <DateEditor {...props} />,
        },
        ...presetNodes.map<MetaTreeNode>(({ name, title }) => ({
          title: tExpr(title),
          name,
          type: 'date',
          paths: ['date', name],
          ...(name === 'now' && dateComponentProps.exactNormalizeMode === 'date'
            ? { disabled: true, selectable: false }
            : {}),
          render: (props) => <DateEditor {...props} />,
        })),
      ];

      const specialNodes: MetaTreeNode[] = [
        {
          title: tExpr('Constant'),
          name: 'constant',
          type: 'string',
          paths: ['constant'],
          render: (props) => <ConstantComponent {...props} />,
        },
        {
          title: tExpr('Null'),
          name: 'null',
          type: 'object',
          paths: ['null'],
          render: (props) => <NullComponent {...props} />,
        },
        {
          title: tExpr('Date'),
          name: 'date',
          type: 'date',
          paths: ['date'],
          selectable: false,
          children: dateChildren,
        },
        ...(allowRunJS
          ? [
              {
                title: tExpr('RunJS'),
                name: 'runjs',
                type: 'object',
                paths: ['runjs'],
                render: (props) => <RunJSComponent {...props} />,
              } satisfies MetaTreeNode,
            ]
          : []),
      ];
      return [...specialNodes, ...(Array.isArray(base) ? base : [])];
    };
  }, [
    ConstantComponent,
    DateEditor,
    NullComponent,
    RunJSComponent,
    allowRunJS,
    baseMetaTree,
    dateComponentProps.exactNormalizeMode,
    restoreLegacyNowForPureDate,
  ]);

  const displayValue = parsedDateConfig ? createDateVariableEditConfig(parsedDateConfig, 'restored') : value;

  const handleChange = React.useCallback(
    (nextValue: unknown) => {
      if (disabled) return;
      if (!isDateVariableEditConfig(nextValue)) {
        onChange(nextValue);
        return;
      }
      if (nextValue[DATE_VARIABLE_CONFIG_MARK] === 'restored') return;
      const normalized = normalizeDateConfigForStore(nextValue, dateComponentProps, isDateLikeField);
      onChange(serializeCtxDateExpressionConfig(normalized) || '');
    },
    [dateComponentProps, disabled, isDateLikeField, onChange],
  );

  return (
    <VariableInput
      {...variableInputProps}
      value={displayValue}
      onChange={handleChange}
      metaTree={metaTree}
      clearValue={clearValue}
      disabled={disabled}
      converters={{
        renderInputComponent: (meta) => {
          const external = converters?.renderInputComponent?.(meta ?? null);
          if (external) return external;
          const firstPath = meta?.paths?.[0];
          if (firstPath === 'constant') return ConstantComponent;
          if (firstPath === 'null') return NullComponent;
          if (firstPath === 'date') return DateEditor;
          if (allowRunJS && firstPath === 'runjs') return RunJSComponent;
          return null;
        },
        resolveValueFromPath: (item) => {
          const external = converters?.resolveValueFromPath?.(item);
          if (external !== undefined) return external;
          const firstPath = item?.paths?.[0];
          if (firstPath === 'constant') return '';
          if (firstPath === 'null') return null;
          if (firstPath === 'date') {
            return createInitialDateConfig(item.paths[1], isDateLikeField, dateComponentProps);
          }
          if (allowRunJS && firstPath === 'runjs') return { code: '', version: 'v2' };
          return undefined;
        },
        resolvePathFromValue: (currentValue) => {
          const external = converters?.resolvePathFromValue?.(currentValue);
          if (external !== undefined) return external;
          if (currentValue === null) return ['null'];
          if (allowRunJS && isRunJSValue(currentValue)) return ['runjs'];
          if (isDateVariableEditConfig(currentValue)) return ['date', getDateNodeName(currentValue)];
          return typeof currentValue === 'string' && isVariableExpression(currentValue)
            ? parseValueToPath(currentValue)
            : ['constant'];
        },
      }}
    />
  );
};
