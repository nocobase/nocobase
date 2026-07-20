/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ComponentType, ReactNode } from 'react';
import { getPickerFormat } from '@nocobase/utils/client';
import { get, has } from 'lodash';

export type FieldConfigureComponentType =
  | 'Input'
  | 'Input.TextArea'
  | 'InputNumber'
  | 'Checkbox'
  | 'Checkbox.Group'
  | 'ColorPicker'
  | 'DatePicker'
  | 'Radio.Group'
  | 'Select'
  | 'CollectionSelect'
  | 'RemoteSelect'
  | 'TargetKey'
  | 'SourceKey'
  | 'ExpiresRadio'
  | 'ArrayTable'
  | 'FieldValidation'
  | 'ForeignKey'
  | 'Input.JSON'
  | 'Markdown'
  | 'Percent'
  | 'RichText'
  | 'SourceCollection'
  | 'Space'
  | 'ThroughCollection'
  | 'TimePicker'
  | 'UnixTimestamp'
  | (string & {});

export const CollectionSelect = 'CollectionSelect';

export interface FieldConfigureRuntimeContext {
  createOnly?: boolean;
  editMainOnly?: boolean;
  createMainOnly?: boolean;
  disabledJSONB?: boolean;
  primaryKeyOnly?: boolean;
  showReverseFieldConfig?: boolean;
  [key: string]: unknown;
}

export interface FieldConfigureRuntimeState {
  componentProps?: Record<string, unknown>;
  dataSource?: unknown;
  disabled?: boolean;
  hidden?: boolean;
  hasValue?: boolean;
  value?: unknown;
}

export interface FieldConfigureEffectContext {
  changedName?: string;
  context: FieldConfigureRuntimeContext;
  getValue: (name: string) => unknown;
  setValue: (name: string, value: unknown) => void;
  values: Record<string, unknown>;
}

export interface FieldConfigureItem {
  name: string;
  title?: ReactNode;
  component?: FieldConfigureComponentType;
  Component?: ComponentType<any>;
  componentProps?: Record<string, unknown>;
  defaultValue?: unknown;
  description?: ReactNode;
  hidden?: boolean | string | ((context: FieldConfigureEffectContext) => boolean);
  disabled?: boolean | string | ((context: FieldConfigureEffectContext) => boolean);
  options?: Array<{ label: ReactNode; value: string | number | boolean }>;
  required?: boolean;
  dependencies?: string[];
  effect?: (context: FieldConfigureEffectContext) => void;
  schema?: Record<string, unknown>;
  layout?: {
    row?: string;
    column?: string;
    columnIndex?: number;
    span?: number;
  };
}

const commonConfigurePropertyNames = new Set(['name', 'uiSchema.title']);
const propertyLayoutComponents = new Set(['Grid', 'Grid.Row', 'Grid.Col', 'div']);

function getExpressionContext(context: FieldConfigureEffectContext) {
  return {
    ...context.context,
    ...context.values,
  };
}

export function evaluateFieldConfigureExpression(value: unknown, context: FieldConfigureEffectContext) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value !== 'string') {
    return false;
  }

  const expression = value.replace(/^\s*\{\{\s*/, '').replace(/\s*\}\}\s*$/, '');
  const expressionContext = getExpressionContext(context);
  const evaluateToken = (token: string) => {
    const trimmed = token.trim().replace(/^\$/, '');
    if (!trimmed) {
      return false;
    }
    if (trimmed.startsWith('!')) {
      return !evaluateToken(trimmed.slice(1).trim());
    }
    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
    const callExpression = trimmed.match(/^([A-Za-z_$][\w$]*)\((.*)\)$/);
    if (callExpression) {
      const [, functionName, rawArgs] = callExpression;
      const fn = get(expressionContext, functionName);
      if (typeof fn !== 'function') {
        return false;
      }
      const args = rawArgs
        .split(',')
        .map((arg) => arg.trim())
        .filter(Boolean)
        .map((arg) => arg.replace(/^['"]|['"]$/g, ''));
      return !!fn(...args);
    }
    return !!get(expressionContext, trimmed);
  };

  return expression.split('||').some((orPart) => orPart.split('&&').every((andPart) => evaluateToken(andPart)));
}

function normalizeConfigureStateExpression(value: unknown) {
  if (typeof value === 'string') {
    return (context: FieldConfigureEffectContext) => evaluateFieldConfigureExpression(value, context);
  }
  return value as FieldConfigureItem['hidden'];
}

function normalizeConfigureHiddenExpression(schema: Record<string, any>) {
  if (schema?.['x-hidden'] !== undefined) {
    return normalizeConfigureStateExpression(schema['x-hidden']);
  }
  if (schema?.['x-visible'] !== undefined) {
    return (context: FieldConfigureEffectContext) => !evaluateFieldConfigureExpression(schema['x-visible'], context);
  }
  return undefined;
}

function collectConfigureLeafProperties(
  properties: Record<string, any>,
  prefix = '',
  layout?: FieldConfigureItem['layout'],
): Array<{ name: string; schema: any; layout?: FieldConfigureItem['layout'] }> {
  return Object.entries(properties || {}).flatMap(([key, schema]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    const childProperties = schema?.properties;
    const component = schema?.['x-component'];

    if (childProperties && component === 'Grid.Row') {
      const columns = Object.entries(childProperties).filter(
        ([, childSchema]) => (childSchema as Record<string, any>)?.['x-component'] === 'Grid.Col',
      );
      const span = columns.length > 0 ? Math.floor(24 / columns.length) : 24;

      return columns.flatMap(([columnKey, columnSchema], columnIndex) =>
        collectConfigureLeafProperties((columnSchema as Record<string, any>)?.properties || {}, prefix, {
          row: name,
          column: columnKey,
          columnIndex,
          span,
        }),
      );
    }

    if (childProperties && (!component || propertyLayoutComponents.has(component))) {
      return collectConfigureLeafProperties(childProperties, prefix, layout);
    }

    return [{ name, schema, layout }];
  });
}

function isConvertibleConfigureProperty(name: string, schema: Record<string, any>) {
  if (commonConfigurePropertyNames.has(name)) {
    return false;
  }
  return !!schema?.['x-component'] || schema?.default !== undefined || schema?.['x-hidden'] !== undefined;
}

export function configurePropertiesToItems(
  properties: Record<string, any> = {},
  options: { components?: Record<string, ComponentType<any>> } = {},
): FieldConfigureItem[] {
  return collectConfigureLeafProperties(properties)
    .filter(({ name, schema }) => isConvertibleConfigureProperty(name, schema))
    .map(({ name, schema, layout }) => {
      const component = schema?.['x-component'] as FieldConfigureComponentType | undefined;
      return {
        name,
        title: schema?.title || schema?.['x-content'],
        component,
        Component: component ? options.components?.[component] : undefined,
        componentProps: schema?.['x-component-props'],
        defaultValue: schema?.default,
        description: schema?.description,
        hidden: normalizeConfigureHiddenExpression(schema),
        disabled: normalizeConfigureStateExpression(schema?.['x-disabled']) as FieldConfigureItem['disabled'],
        options: Array.isArray(schema?.enum) ? schema.enum : undefined,
        required: schema?.required,
        schema,
        layout,
      };
    });
}

const DATE_FORMAT_OPTIONS = [
  { label: 'MMMM Do YYYY', value: 'MMMM Do YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'MM/DD/YY', value: 'MM/DD/YY' },
  { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: '{{t("Custom")}}', value: 'custom' },
];

const TIME_FORMAT_OPTIONS = [
  { label: '{{t("12 hour")}}', value: 'hh:mm:ss a' },
  { label: '{{t("24 hour")}}', value: 'HH:mm:ss' },
];

function getPicker(values: Record<string, unknown>) {
  return get(values, 'uiSchema.x-component-props.picker') || 'date';
}

function getShowTime(values: Record<string, unknown>) {
  return get(values, 'uiSchema.x-component-props.showTime');
}

export function getCoreFieldConfigureState(
  name: string,
  values: Record<string, unknown>,
  context: FieldConfigureRuntimeContext = {},
): FieldConfigureRuntimeState {
  if (name === 'unique' || name === 'primaryKey') {
    return {
      disabled: !context.createMainOnly || !!context.primaryKeyOnly,
    };
  }

  if (name === 'autoIncrement') {
    return {
      disabled: !context.createMainOnly,
    };
  }

  if (name.startsWith('reverseField.')) {
    return {
      disabled: !context.showReverseFieldConfig,
      hidden: !context.showReverseFieldConfig,
    };
  }

  if (name === 'autoCreateReverseField' && get(values, 'reverseField.key')) {
    return {
      disabled: true,
    };
  }

  if (name === 'uiSchema.x-component-props.dateFormat') {
    return {
      componentProps: {
        picker: getPicker(values),
      },
    };
  }

  if (name === 'uiSchema.x-component-props.showTime') {
    return {
      hidden: getPicker(values) !== 'date',
    };
  }

  if (name === 'uiSchema.x-component-props.timeFormat') {
    return {
      hidden: getPicker(values) !== 'date' || getShowTime(values) === false,
    };
  }

  if (name === 'defaultValue') {
    const shouldHide =
      !!get(values, 'primaryKey') ||
      !!get(values, 'unique') ||
      !!get(values, 'autoIncrement') ||
      !!get(values, 'defaultToCurrentTime');

    return {
      hidden: shouldHide,
      ...(shouldHide ? { value: null, hasValue: true } : null),
      componentProps: {
        gmt: get(values, 'uiSchema.x-component-props.gmt'),
        showTime: get(values, 'uiSchema.x-component-props.showTime'),
        dateFormat: get(values, 'uiSchema.x-component-props.dateFormat'),
        timeFormat: get(values, 'uiSchema.x-component-props.timeFormat'),
        picker: get(values, 'uiSchema.x-component-props.picker'),
        format: get(values, 'uiSchema.x-component-props.format'),
      },
      dataSource: get(values, 'uiSchema.enum'),
    };
  }

  if ((name === 'precision' || name === 'scale') && get(values, 'type') !== 'decimal') {
    return {
      hidden: true,
    };
  }

  return {};
}

export function runCoreFieldConfigureEffects(options: FieldConfigureEffectContext) {
  const { context, getValue, setValue, values } = options;
  const primaryKey = !!getValue('primaryKey');
  const unique = !!getValue('unique');

  if (context.createMainOnly && primaryKey && (!options.changedName || options.changedName === 'primaryKey')) {
    if (getValue('unique') !== false) {
      setValue('unique', false);
    }
    if (has(values, 'autoIncrement') && getValue('autoIncrement') !== true) {
      setValue('autoIncrement', true);
    }
  }

  if (context.createMainOnly && unique && primaryKey && options.changedName === 'unique') {
    setValue('primaryKey', false);
  }

  if (get(values, 'reverseField.key') && getValue('autoCreateReverseField') !== true) {
    setValue('autoCreateReverseField', true);
  }

  if (
    options.changedName === 'uiSchema.x-component-props.picker' ||
    ['primaryKey', 'unique', 'autoIncrement', 'defaultToCurrentTime'].includes(options.changedName || '')
  ) {
    if (
      getValue('defaultValue') != null &&
      (!!getValue('primaryKey') ||
        !!getValue('unique') ||
        !!getValue('autoIncrement') ||
        !!getValue('defaultToCurrentTime') ||
        options.changedName === 'uiSchema.x-component-props.picker')
    ) {
      setValue('defaultValue', null);
    }
  }

  const hasDateTimeConfigure =
    has(values, 'uiSchema.x-component-props.picker') ||
    has(values, 'uiSchema.x-component-props.dateFormat') ||
    has(values, 'uiSchema.x-component-props.showTime') ||
    has(values, 'uiSchema.x-component-props.timeFormat');

  if (!hasDateTimeConfigure) {
    return;
  }

  const picker = getPicker(values);
  if (
    options.changedName === 'uiSchema.x-component-props.picker' &&
    has(values, 'uiSchema.x-component-props.dateFormat') &&
    get(values, 'uiSchema.x-component-props.dateFormat') !== getPickerFormat(picker as string)
  ) {
    setValue('uiSchema.x-component-props.dateFormat', getPickerFormat(picker as string));
  }

  if (has(values, 'uiSchema.x-component-props.showTime') && picker !== 'date' && getShowTime(values) !== false) {
    setValue('uiSchema.x-component-props.showTime', false);
  }

  if (
    has(values, 'uiSchema.x-component-props.timeFormat') &&
    getShowTime(values) &&
    !get(values, 'uiSchema.x-component-props.timeFormat')
  ) {
    setValue('uiSchema.x-component-props.timeFormat', 'HH:mm:ss');
  }
}

export function indexConfigureItems(options: { autoIncrement?: boolean } = {}): FieldConfigureItem[] {
  const items: FieldConfigureItem[] = [
    {
      name: 'primaryKey',
      title: '{{t("Primary")}}',
      component: 'Checkbox',
    },
    {
      name: 'unique',
      title: '{{t("Unique")}}',
      component: 'Checkbox',
    },
  ];

  if (options.autoIncrement) {
    items.push({
      name: 'autoIncrement',
      title: '{{t("Auto increment")}}',
      component: 'Checkbox',
    });
  }

  return items;
}

export function dateTimeFormatConfigureItems(
  options: {
    includePicker?: boolean;
    hidden?: FieldConfigureItem['hidden'];
    showTimeDefault?: boolean;
  } = {},
): FieldConfigureItem[] {
  const items: FieldConfigureItem[] = [];

  if (options.includePicker !== false) {
    items.push({
      name: 'uiSchema.x-component-props.picker',
      title: '{{t("Picker")}}',
      component: 'Radio.Group',
      defaultValue: 'date',
      options: [
        { label: '{{t("Date")}}', value: 'date' },
        { label: '{{t("Month")}}', value: 'month' },
        { label: '{{t("Quarter")}}', value: 'quarter' },
        { label: '{{t("Year")}}', value: 'year' },
      ],
      hidden: options.hidden,
    });
  }

  items.push(
    {
      name: 'uiSchema.x-component-props.dateFormat',
      title: '{{t("Date format")}}',
      component: 'ExpiresRadio',
      defaultValue: 'YYYY-MM-DD',
      options: DATE_FORMAT_OPTIONS,
      componentProps: {
        defaultValue: 'dddd',
        formats: ['MMMM Do YYYY', 'YYYY-MM-DD', 'MM/DD/YY', 'YYYY/MM/DD', 'DD/MM/YYYY'],
      },
      hidden: options.hidden,
    },
    {
      name: 'uiSchema.x-component-props.showTime',
      title: '{{t("Show time")}}',
      component: 'Checkbox',
      defaultValue: options.showTimeDefault,
      hidden: options.hidden,
    },
    {
      name: 'uiSchema.x-component-props.timeFormat',
      title: '{{t("Time format")}}',
      component: 'Radio.Group',
      defaultValue: 'HH:mm:ss',
      options: TIME_FORMAT_OPTIONS,
      hidden: (context) => {
        if (typeof options.hidden === 'function' && options.hidden(context)) {
          return true;
        }
        if (typeof options.hidden === 'boolean') {
          return options.hidden;
        }
        return getShowTime(context.values) === false;
      },
    },
  );

  return items;
}

export function reverseFieldConfigureItems(): FieldConfigureItem[] {
  return [
    {
      name: 'autoCreateReverseField',
      title: '{{t("Create inverse field in the target collection")}}',
      component: 'Checkbox',
      defaultValue: false,
    },
    {
      name: 'reverseField.type',
      title: '{{t("Inverse relationship type")}}',
      component: 'Select',
      required: true,
      options: [
        { label: "{{t('HasOne')}}", value: 'hasOne' },
        { label: "{{t('HasMany')}}", value: 'hasMany' },
        { label: "{{t('BelongsTo')}}", value: 'belongsTo' },
        { label: "{{t('BelongsToMany')}}", value: 'belongsToMany' },
      ],
      hidden: ({ context, values }) => !context.showReverseFieldConfig && !get(values, 'autoCreateReverseField'),
      disabled: ({ context }) => !context.showReverseFieldConfig,
    },
    {
      name: 'reverseField.uiSchema.title',
      title: '{{t("Inverse field display name")}}',
      component: 'Input',
      required: true,
      hidden: ({ context, values }) => !context.showReverseFieldConfig && !get(values, 'autoCreateReverseField'),
      disabled: ({ context }) => !context.showReverseFieldConfig,
    },
    {
      name: 'reverseField.name',
      title: '{{t("Inverse field name")}}',
      component: 'Input',
      required: true,
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with a letter.')}}",
      hidden: ({ context, values }) => !context.showReverseFieldConfig && !get(values, 'autoCreateReverseField'),
      disabled: ({ context }) => !context.showReverseFieldConfig,
    },
  ];
}

export const reverseFieldConfigureItem = reverseFieldConfigureItems;

export function OptionsEditor(options: { name?: string; title?: ReactNode } = {}): FieldConfigureItem {
  return {
    name: options.name || 'uiSchema.enum',
    title: options.title || '{{t("Options")}}',
    component: 'ArrayTable',
  };
}
