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

export const regionCode = [{ label: '{{t("is")}}', value: '$regionCodeEq' }];

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
    label: '{{t("contains")}}',
    value: '$anyOf',
    schema: {
      'x-component': 'Select',
      'x-component-props': { mode: 'tags' },
    },
  },
  {
    label: '{{t("does not contain")}}',
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
  { label: "{{ t('is') }}", value: '$dateOn', selected: true },
  { label: "{{ t('is not') }}", value: '$dateNotOn' },
  { label: "{{ t('is before') }}", value: '$dateBefore' },
  { label: "{{ t('is after') }}", value: '$dateAfter' },
  { label: "{{ t('is on or after') }}", value: '$dateNotBefore' },
  { label: "{{ t('is on or before') }}", value: '$dateNotAfter' },
  { label: "{{ t('is between') }}", value: '$dateBetween', schema: { 'x-component': 'DatePicker.RangePicker' } },
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
    schema: { 'x-component': 'Select' },
  },
  {
    label: '{{t("is not")}}',
    value: '$ne',
    schema: { 'x-component': 'Select' },
  },
  {
    label: '{{t("contains")}}',
    value: '$in',
    schema: {
      'x-component': 'Select',
      'x-component-props': { mode: 'tags' },
    },
  },
  {
    label: '{{t("does not contain")}}',
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
  { label: '{{t("Yes")}}', value: '$isTruly', selected: true, noValue: true },
  { label: '{{t("No")}}', value: '$isFalsy', noValue: true },
];

export const tableoid = [
  {
    label: '{{t("contains")}}',
    value: '$childIn',
    schema: {
      'x-component': 'CollectionSelect',
      'x-component-props': { mode: 'tags' },
    },
  },
  {
    label: '{{t("does not contain")}}',
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
    schema: { 'x-component': 'CollectionSelect' },
  },
  {
    label: '{{t("is not")}}',
    value: '$ne',
    schema: { 'x-component': 'CollectionSelect' },
  },
  {
    label: '{{t("contains")}}',
    value: '$in',
    schema: {
      'x-component': 'CollectionSelect',
      'x-component-props': { mode: 'tags' },
    },
  },
  {
    label: '{{t("does not contain")}}',
    value: '$notIn',
    schema: {
      'x-component': 'CollectionSelect',
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
