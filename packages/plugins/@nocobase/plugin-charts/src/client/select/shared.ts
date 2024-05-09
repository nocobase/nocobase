/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';

export const defaultFieldNames = {
  label: 'label',
  value: 'value',
  color: 'color',
  options: 'children',
};

export const getCurrentOptions = (values, dataSource, fieldNames) => {
  function flatData(data) {
    const newArr = [];
    for (let i = 0; i < data.length; i++) {
      const children = data[i][fieldNames.options];
      if (Array.isArray(children)) {
        newArr.push(...flatData(children));
      }
      newArr.push({ ...data[i] });
    }
    return newArr;
  }
  const result = flatData(dataSource);
  values = lodash
    .castArray(values)
    .filter((item) => item != null)
    .map((val) => (typeof val === 'object' ? val[fieldNames.value] : val));
  const findOptions = (options: any[]) => {
    if (!options) return [];
    const current = [];
    for (const value of values) {
      const option = options.find((v) => v[fieldNames.value] === value) || { value: value, label: value };
      current.push(option);
    }
    return current;
  };
  return findOptions(result);
};
