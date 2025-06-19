/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isPlainObject } from '@nocobase/utils/client';
import { castArray } from 'lodash';

export interface FieldNames {
  label?: string;
  value?: string;
  color?: string;
  options?: string;
}

export const defaultFieldNames: FieldNames = {
  label: 'label',
  value: 'value',
  color: 'color',
  options: 'children',
};

interface Option {
  label: string;
  value: string;
  icon?: any;
}

function flatData(data: any[], fieldNames: FieldNames): any[] {
  const newArr: any[] = [];
  if (!Array.isArray(data)) return newArr;
  for (let i = 0; i < data.length; i++) {
    const children = data[i][fieldNames.options];
    if (Array.isArray(children)) {
      newArr.push(...flatData(children, fieldNames));
    }
    newArr.push({ ...data[i] });
  }
  return newArr;
}

function findOptions(options: any[], fieldNames: FieldNames, arrValues: any[]): Option[] {
  if (!options) return [];
  const current: Option[] = [];
  for (const value of arrValues) {
    const option = options.find((v) => v[fieldNames.value] == value) || {
      value,
      label: value ? value.toString() : value,
    };
    current.push(option);
  }
  return current;
}

export function getCurrentOptions(values: any | any[], dataSource: any[], fieldNames: FieldNames): Option[] {
  const result = flatData(dataSource, fieldNames);
  const arrValues = castArray(values).map((val) => (isPlainObject(val) ? val[fieldNames.value] : val)) as any[];

  return findOptions(result, fieldNames, arrValues);
}
