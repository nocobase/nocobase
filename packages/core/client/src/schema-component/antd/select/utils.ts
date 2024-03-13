import { isPlainObject } from '@nocobase/utils/client';
import { castArray } from 'lodash';

export interface FieldNames {
  label: string;
  value: string;
  color: string;
  options: string;
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

export function getCurrentOptions(values: string | string[], dataSource: any[], fieldNames: FieldNames): Option[] {
  const result = flatData(dataSource, fieldNames);
  const arrValues = castArray(values)
    .filter((item) => item != null)
    .map((val) => (isPlainObject(val) ? val[fieldNames.value] : val)) as string[];

  function findOptions(options: any[]): Option[] {
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

  return findOptions(result);
}
