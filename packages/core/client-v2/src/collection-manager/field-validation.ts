/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cloneDeep } from 'lodash';
import type { ReactNode } from 'react';

export interface FieldValidationConfigureParam {
  key: string;
  label: ReactNode;
  componentType?: 'checkbox' | 'datePicker' | 'inputNumber' | 'multipleSelect' | 'radio' | 'singleSelect' | 'text';
  defaultValue?: unknown;
  options?: Array<{ label: ReactNode; value: string | number | boolean }>;
  required?: boolean;
}

export interface FieldValidationConfigureItem {
  key: string;
  label: ReactNode;
  hasValue?: boolean;
  params?: FieldValidationConfigureParam[];
  paramsType?: string;
}

export type FieldValidationConfigureInput = FieldValidationConfigureItem | string;

const requiredValidationItem: FieldValidationConfigureItem = {
  key: 'required',
  label: 'Required',
  hasValue: false,
  params: [],
};

export function RangeValidationItems(valueKind: 'date' | 'number'): FieldValidationConfigureItem[] {
  const componentType = valueKind === 'date' ? 'datePicker' : 'inputNumber';
  const valueKey = valueKind === 'date' ? 'date' : 'limit';

  return [
    {
      key: 'greater',
      label: 'Greater than',
      hasValue: true,
      params: [{ key: valueKey, label: valueKind === 'date' ? 'Date' : 'Limit', componentType, required: true }],
    },
    {
      key: 'less',
      label: 'Less than',
      hasValue: true,
      params: [{ key: valueKey, label: valueKind === 'date' ? 'Date' : 'Limit', componentType, required: true }],
    },
    {
      key: 'max',
      label: valueKind === 'date' ? 'Max value' : 'Max value',
      hasValue: true,
      params: [{ key: valueKey, label: valueKind === 'date' ? 'Date' : 'Limit', componentType, required: true }],
    },
    {
      key: 'min',
      label: valueKind === 'date' ? 'Min value' : 'Min value',
      hasValue: true,
      params: [{ key: valueKey, label: valueKind === 'date' ? 'Date' : 'Limit', componentType, required: true }],
    },
  ];
}

export class FieldValidationConfigureRegistry {
  protected items = new Map<string, FieldValidationConfigureItem>();
  protected groups = new Map<string, FieldValidationConfigureInput[]>();

  register(item: FieldValidationConfigureItem) {
    this.items.set(item.key, cloneDeep(item));
  }

  registerMany(items: FieldValidationConfigureItem[] = []) {
    items.forEach((item) => this.register(item));
  }

  registerGroup(name: string, items: FieldValidationConfigureInput[] = []) {
    this.groups.set(name, items);
  }

  addToGroup(name: string, items: FieldValidationConfigureInput[] = []) {
    this.groups.set(name, [...(this.groups.get(name) || []), ...items]);
  }

  get(name: string) {
    return cloneDeep(this.items.get(name));
  }

  getGroup(name: string) {
    return (this.groups.get(name) || [])
      .map((item) => (typeof item === 'string' ? this.get(item) : cloneDeep(item)))
      .filter(Boolean) as FieldValidationConfigureItem[];
  }
}

export const fieldValidationConfigureRegistry = new FieldValidationConfigureRegistry();

export function registerFieldValidationConfigure(item: FieldValidationConfigureItem) {
  fieldValidationConfigureRegistry.register(item);
}

export function registerFieldValidationConfigureGroup(name: string, items: FieldValidationConfigureInput[] = []) {
  fieldValidationConfigureRegistry.registerGroup(name, items);
}

export function addFieldValidationConfiguresToGroup(name: string, items: FieldValidationConfigureInput[] = []) {
  fieldValidationConfigureRegistry.addToGroup(name, items);
}

fieldValidationConfigureRegistry.registerMany([
  requiredValidationItem,
  {
    key: 'pattern',
    label: 'Pattern',
    hasValue: true,
    params: [{ key: 'regex', label: 'Regular Expression', componentType: 'text', required: true }],
  },
  { key: 'email', label: 'Email', hasValue: false, params: [], paramsType: 'object' },
  { key: 'uuid', label: 'UUID', hasValue: false, params: [], paramsType: 'object' },
  {
    key: 'length',
    label: 'Length',
    hasValue: true,
    params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
  },
  { key: 'uri', label: 'URI', hasValue: false, params: [], paramsType: 'object' },
  {
    key: 'multiple',
    label: 'Multiple of',
    hasValue: true,
    params: [{ key: 'base', label: 'Base', componentType: 'inputNumber', required: true }],
  },
  { key: 'integer', label: 'Integer', hasValue: false, params: [] },
  {
    key: 'precision',
    label: 'Precision',
    hasValue: true,
    params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
  },
  { key: 'unsafe', label: 'Unsafe integer', hasValue: false, params: [] },
  {
    key: 'timestamp',
    label: 'Timestamp',
    hasValue: true,
    params: [
      {
        key: 'type',
        label: 'Type',
        componentType: 'singleSelect',
        options: [
          { label: 'JavaScript', value: 'javascript' },
          { label: 'Unix', value: 'unix' },
        ],
        defaultValue: 'javascript',
      },
    ],
  },
]);

fieldValidationConfigureRegistry.registerGroup('string', [
  'required',
  {
    key: 'max',
    label: 'Max length',
    hasValue: true,
    params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
  },
  {
    key: 'min',
    label: 'Min length',
    hasValue: true,
    params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
  },
  'pattern',
  'email',
  'uuid',
  'length',
  'uri',
]);
fieldValidationConfigureRegistry.registerGroup('number', [
  'required',
  ...RangeValidationItems('number'),
  'multiple',
  'integer',
  'precision',
  'unsafe',
]);
fieldValidationConfigureRegistry.registerGroup('date', ['required', ...RangeValidationItems('date'), 'timestamp']);
fieldValidationConfigureRegistry.registerGroup('object', ['required']);
