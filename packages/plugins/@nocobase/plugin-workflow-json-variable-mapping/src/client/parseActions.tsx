/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import uniqBy from 'lodash/uniqBy';
import { uid } from '@formily/shared';
import { ArrayField } from '@formily/core';
import { useForm } from '@formily/react';

import { ARRAY_KEY_IN_PATH, ARRAY_KEY_IN_TITLE } from '../contants';

function transformArray(arr, prefix = '', paths = [], options = { parseArray: false, keys: [], key: '' }) {
  const { parseArray, keys, key } = options;

  if (parseArray) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    key !== ARRAY_KEY_IN_PATH &&
      paths.push({
        key: uid(),
        path: currentPath,
        name: key,
        paths: [...keys, key],
      });
    getObjPaths(arr, currentPath, paths, { ...options, parseArray, keys: [...keys, key] });
  } else {
    const currentPath = `${prefix ? prefix + (key === ARRAY_KEY_IN_PATH ? '' : '.') : ''}${
      key ? (key === ARRAY_KEY_IN_PATH ? ARRAY_KEY_IN_TITLE : key + ARRAY_KEY_IN_TITLE) : ''
    }`;
    key !== ARRAY_KEY_IN_PATH &&
      paths.push({
        key: uid(),
        path: `${prefix ? prefix + (key === ARRAY_KEY_IN_PATH ? '' : '.') : ''}${key ? key : ''}`,
        name: key,
        paths: [...keys, key],
      });
    // let objKeys = [];
    arr.forEach((item, index) => {
      const newKeys = [...keys];
      if (key) {
        newKeys.push(key);
      }
      if (key !== ARRAY_KEY_IN_PATH) {
        newKeys.push(ARRAY_KEY_IN_PATH);
      }

      if (Array.isArray(arr[index])) {
        transformArray(item, currentPath, paths, { ...options, key: ARRAY_KEY_IN_PATH, keys: newKeys });
      } else if (!Array.isArray(arr[index]) && typeof arr[index] === 'object' && arr[index] !== null) {
        // objKeys = uniq([...objKeys, ...Object.keys(arr[index])]);
        getObjPaths(arr[index], currentPath, paths, { ...options, keys: [...newKeys] });
      }
    });
  }

  return paths;
}
export function getObjPaths(obj, prefix = '', paths = [], options = { parseArray: false, keys: [] }) {
  const { parseArray, keys } = options;
  Object.keys(obj).forEach((key) => {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(obj[key])) {
      transformArray(obj[key], prefix, paths, { ...options, keys, key: key });
    } else if (!Array.isArray(obj[key]) && typeof obj[key] === 'object' && obj[key] !== null) {
      paths.push({
        key: uid(),
        path: currentPath,
        name: key,
        paths: [...keys, key],
      });
      getObjPaths(obj[key], currentPath, paths, { ...options, keys: [...keys, key] });
    } else {
      paths.push({
        key: uid(),
        path: currentPath,
        name: key,
        paths: [...keys, key],
      });
    }
  });

  return paths;
}
export const useParseJsonAction = () => {
  const form = useForm();
  return {
    async run() {
      try {
        let keyPaths = [];
        const value = form.values.example;
        if (Array.isArray(value)) {
          keyPaths = transformArray(value, '', [], {
            parseArray: form.values.parseArray,
            keys: [],
            key: ARRAY_KEY_IN_PATH,
          });
        } else if (typeof value === 'object' && value !== null) {
          keyPaths = getObjPaths(value, '', [], {
            parseArray: form.values.parseArray,
            keys: [],
          });
        }
        // const keyPaths = getAllPaths(form.values.example, '', [], { parseArray: form.values.parseArray, keys: [] });

        const bodyField = form.query('variables').take() as ArrayField;
        bodyField.onInput(uniqBy(keyPaths, 'path'));
        // setJSON(keyPaths);
        // form.setValues({
        //   body: bodyVar,
        // });
      } catch (e) {
        console.error(e);
      }
    },
  };
};
export const useClearItemsAction = () => {
  const form = useForm();
  return {
    async run() {
      const bodyField = form.query('variables').take() as ArrayField;
      bodyField.onInput([]);
    },
  };
};
