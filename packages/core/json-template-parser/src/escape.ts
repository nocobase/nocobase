/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isArray, isObject, isString, mapKeys, mapValues } from 'lodash';
const escapes = [
  { key: '$', name: 'dollar' },
  { key: '@', name: 'at' },
];
export const escapeSpecialChars = (str: string) => {
  return str.replace(/[$@]/g, (match) => {
    const escape = escapes.find((item) => item.key === match);
    return `nocobase_${escape?.name}_`;
  });
};

export const revertEscapeSpecialChars = (str: string) => {
  return str.replace(/nocobase_(dollar|at)_/g, (match, name) => {
    const escape = escapes.find((item) => item.name === name);
    return escape?.key || '';
  });
};

export function escape(input) {
  if (isArray(input)) {
    const result = [];
    Object.keys(input).forEach((key) => {
      result[escape(key)] = escape(input[key]);
    });
    return result;

    // check keys number of object to skip the object like new Date()
  } else if (isObject(input) && Object.keys(input).length > 0) {
    return mapKeys(mapValues(input, escape), (value, key) => escape(key));
  } else if (isString(input)) {
    return escapeSpecialChars(input);
  }
  return input;
}

export function revertEscape(input) {
  if (isArray(input)) {
    const result = [];
    Object.keys(input).forEach((key) => {
      result[revertEscape(key)] = revertEscape(input[key]);
    });
    return result;

    // check keys number of object to skip the object like new Date()
  } else if (isObject(input) && Object.keys(input).length > 0) {
    return mapKeys(mapValues(input, revertEscape), (value, key) => revertEscape(key));
  } else if (isString(input)) {
    return revertEscapeSpecialChars(input);
  }
  return input;
}
