/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const string = [
  { label: '{{t("contains")}}', value: '$includes', selected: true },
  { label: '{{t("does not contain")}}', value: '$notIncludes' },
  { label: '{{t("is")}}', value: '$eq' },
  { label: '{{t("is not")}}', value: '$ne' },
  { label: '{{t("is empty")}}', value: '$empty', noValue: true },
  { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
];

export const array = [
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

export const object = [
  { label: '{{t("is")}}', value: '$eq', selected: true },
  { label: '{{t("is not")}}', value: '$ne' },
];

export const datetime = [
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
    onlyFilterAction: true, //schema 仅在Filter.Action生效，筛选表单中不生效
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

export const number = [
  { label: '{{t("=")}}', value: '$eq', selected: true },
  { label: '{{t("≠")}}', value: '$ne' },
  { label: '{{t(">")}}', value: '$gt' },
  { label: '{{t("≥")}}', value: '$gte' },
  { label: '{{t("<")}}', value: '$lt' },
  { label: '{{t("≤")}}', value: '$lte' },
  { label: '{{t("is empty")}}', value: '$empty', noValue: true },
  { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
];

export const id = [
  { label: '{{t("is")}}', value: '$eq', selected: true },
  { label: '{{t("is not")}}', value: '$ne' },
  { label: '{{t("exists")}}', value: '$exists', noValue: true },
  { label: '{{t("not exists")}}', value: '$notExists', noValue: true },
];

export const enumType = [
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

export const time = [
  { label: '{{t("is")}}', value: '$eq', selected: true },
  { label: '{{t("is not")}}', value: '$neq' },
  { label: '{{t("is empty")}}', value: '$empty', noValue: true },
  { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
];

export const boolean = [
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

export const tableoid = [
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

export const collection = [
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

export const bigField = [
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
