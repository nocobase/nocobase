/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type FieldFilterOperator<TMeta = unknown> = {
  label: string;
  value: string;
  selected?: boolean;
  noValue?: boolean;
  schema?: Record<string, unknown>;
  onlyFilterAction?: boolean;
  visible?: (meta: TMeta) => boolean;
  [key: string]: unknown;
};

export const string: FieldFilterOperator[] = [
  { label: '{{t("contains")}}', value: '$includes', selected: true },
  { label: '{{t("does not contain")}}', value: '$notIncludes' },
  { label: '{{t("is")}}', value: '$eq' },
  { label: '{{t("is not")}}', value: '$ne' },
  { label: '{{t("is empty")}}', value: '$empty', noValue: true },
  { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
];

export const array: FieldFilterOperator[] = [
  {
    label: '{{t("is")}}',
    value: '$match',
    selected: true,
    schema: {
      'x-component': 'Select',
      'x-component-props': { mode: 'tags' },
    },
  },
  {
    label: '{{t("is not")}}',
    value: '$notMatch',
    schema: {
      'x-component': 'Select',
      'x-component-props': { mode: 'tags' },
    },
  },
  {
    label: '{{t("is any of")}}',
    value: '$anyOf',
    schema: {
      'x-component': 'Select',
      'x-component-props': { mode: 'tags' },
    },
  },
  {
    label: '{{t("is none of")}}',
    value: '$noneOf',
    schema: {
      'x-component': 'Select',
      'x-component-props': { mode: 'tags' },
    },
  },
  { label: '{{t("is empty")}}', value: '$empty', noValue: true },
  { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
];

export const object: FieldFilterOperator[] = [
  { label: '{{t("is")}}', value: '$eq', selected: true },
  { label: '{{t("is not")}}', value: '$ne' },
];

export const datetime: FieldFilterOperator[] = [
  {
    label: "{{ t('is') }}",
    value: '$dateOn',
    selected: true,
    schema: {
      'x-component': 'DateFilterDynamicComponent',
      'x-component-props': {
        isRange: false,
      },
    },
    onlyFilterAction: true,
  },
  {
    label: "{{ t('is not') }}",
    value: '$dateNotOn',
    schema: {
      'x-component': 'DateFilterDynamicComponent',
      'x-component-props': {
        isRange: false,
      },
    },
    onlyFilterAction: true,
  },
  {
    label: "{{ t('is before') }}",
    value: '$dateBefore',
    schema: {
      'x-component': 'DateFilterDynamicComponent',
      'x-component-props': {
        isRange: false,
      },
    },
    onlyFilterAction: true,
  },
  {
    label: "{{ t('is after') }}",
    value: '$dateAfter',
    schema: {
      'x-component': 'DateFilterDynamicComponent',
      'x-component-props': {
        isRange: false,
      },
    },
    onlyFilterAction: true,
  },
  {
    label: "{{ t('is on or after') }}",
    value: '$dateNotBefore',
    schema: {
      'x-component': 'DateFilterDynamicComponent',
      'x-component-props': {
        isRange: false,
      },
    },
    onlyFilterAction: true,
  },
  {
    label: "{{ t('is on or before') }}",
    value: '$dateNotAfter',
    schema: {
      'x-component': 'DateFilterDynamicComponent',
      'x-component-props': {
        isRange: false,
      },
    },
    onlyFilterAction: true,
  },
  {
    label: "{{ t('is between') }}",
    value: '$dateBetween',
    schema: {
      'x-component': 'DateFilterDynamicComponent',
      'x-component-props': {
        isRange: true,
      },
    },
  },
  { label: "{{ t('is empty') }}", value: '$empty', noValue: true },
  { label: "{{ t('is not empty') }}", value: '$notEmpty', noValue: true },
];

export const number: FieldFilterOperator[] = [
  { label: '{{t("=")}}', value: '$eq', selected: true },
  { label: '{{t("≠")}}', value: '$ne' },
  { label: '{{t(">")}}', value: '$gt' },
  { label: '{{t("≥")}}', value: '$gte' },
  { label: '{{t("<")}}', value: '$lt' },
  { label: '{{t("≤")}}', value: '$lte' },
  { label: '{{t("is empty")}}', value: '$empty', noValue: true },
  { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
];

export const id: FieldFilterOperator[] = [
  { label: '{{t("is")}}', value: '$eq', selected: true },
  { label: '{{t("is not")}}', value: '$ne' },
  { label: '{{t("exists")}}', value: '$exists', noValue: true },
  { label: '{{t("not exists")}}', value: '$notExists', noValue: true },
];

export const enumType: FieldFilterOperator[] = [
  {
    label: '{{t("is")}}',
    value: '$eq',
    selected: true,
    schema: { 'x-component': 'Select', 'x-component-props': { mode: null } },
  },
  {
    label: '{{t("is not")}}',
    value: '$ne',
    schema: { 'x-component': 'Select', 'x-component-props': { mode: null } },
  },
  {
    label: '{{t("is any of")}}',
    value: '$in',
    schema: {
      'x-component': 'Select',
      'x-component-props': { mode: 'tags' },
    },
  },
  {
    label: '{{t("is none of")}}',
    value: '$notIn',
    schema: {
      'x-component': 'Select',
      'x-component-props': { mode: 'tags' },
    },
  },
  { label: '{{t("is empty")}}', value: '$empty', noValue: true },
  { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
];

export const time: FieldFilterOperator[] = [
  { label: '{{t("is")}}', value: '$eq', selected: true },
  { label: '{{t("is not")}}', value: '$neq' },
  { label: '{{t("is empty")}}', value: '$empty', noValue: true },
  { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
];

export const boolean: FieldFilterOperator[] = [
  {
    label: '{{t("Yes")}}',
    value: '$isTruly',
    selected: true,
    noValue: true,
    schema: {
      'x-component': 'Select',
      'x-component-props': {
        multiple: false,
        options: [
          {
            label: '{{t("Yes")}}',
            value: true,
          },
          {
            label: '{{t("No")}}',
            value: false,
          },
        ],
      },
    },
  },
  {
    label: '{{t("No")}}',
    value: '$isFalsy',
    noValue: true,
    schema: {
      'x-component': 'Select',
      'x-component-props': {
        multiple: false,
        options: [
          {
            label: '{{t("Yes")}}',
            value: true,
          },
          {
            label: '{{t("No")}}',
            value: false,
          },
        ],
      },
    },
  },
  { label: "{{ t('is empty') }}", value: '$empty', noValue: true },
  { label: "{{ t('is not empty') }}", value: '$notEmpty', noValue: true },
];

export const tableoid: FieldFilterOperator[] = [
  {
    label: '{{t("is any of")}}',
    value: '$childIn',
    schema: {
      'x-component': 'CollectionSelect',
      'x-component-props': { mode: 'tags' },
    },
  },
  {
    label: '{{t("is none of")}}',
    value: '$childNotIn',
    schema: {
      'x-component': 'CollectionSelect',
      'x-component-props': { mode: 'tags' },
    },
  },
];

export const collection: FieldFilterOperator[] = [
  {
    label: '{{t("is")}}',
    value: '$eq',
    selected: true,
    schema: { 'x-component': 'DataSourceCollectionCascader' },
  },
  {
    label: '{{t("is not")}}',
    value: '$ne',
    schema: { 'x-component': 'DataSourceCollectionCascader' },
  },
  {
    label: '{{t("is any of")}}',
    value: '$in',
    schema: {
      'x-component': 'DataSourceCollectionCascader',
      'x-component-props': { mode: 'tags' },
    },
  },
  {
    label: '{{t("is none of")}}',
    value: '$notIn',
    schema: {
      'x-component': 'DataSourceCollectionCascader',
      'x-component-props': { mode: 'tags' },
    },
  },
  { label: '{{t("is empty")}}', value: '$empty', noValue: true },
  { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
];

export const bigField: FieldFilterOperator[] = [
  {
    label: '{{t("contains")}}',
    value: '$includes',
    selected: true,
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  {
    label: '{{t("does not contain")}}',
    value: '$notIncludes',
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  {
    label: '{{t("is")}}',
    value: '$eq',
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  {
    label: '{{t("is not")}}',
    value: '$ne',
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  {
    label: '{{t("is empty")}}',
    value: '$empty',
    noValue: true,
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  {
    label: '{{t("is not empty")}}',
    value: '$notEmpty',
    noValue: true,
    schema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
];
