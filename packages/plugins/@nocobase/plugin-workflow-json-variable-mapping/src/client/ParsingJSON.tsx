/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import uniqBy from 'lodash/uniqBy';
import { Button, Flex } from 'antd';
import { uid } from '@formily/shared';
import { ArrayField } from '@formily/core';
import { useForm } from '@formily/react';
import { Input as NInput, SchemaComponent } from '@nocobase/client';

import { lang, NAMESPACE } from '../locale';

function transformArray(arr, prefix = '', paths = [], options = { parseArray: false, keys: [], key: '' }) {
  const { parseArray, keys, key } = options;

  if (parseArray) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    key !== '_' &&
      paths.push({
        key: uid(),
        path: currentPath,
        name: key,
        paths: [...keys, key],
      });
    getObjPaths(arr, currentPath, paths, { ...options, parseArray, keys: [...keys, key] });
  } else {
    const currentPath = `${prefix ? prefix + '.' : ''}${key ? (key === '_' ? key : key + '._') : ''}`;
    key !== '_' &&
      paths.push({
        key: uid(),
        path: `${prefix ? prefix + '.' : ''}${key ? key : ''}`,
        name: key,
        paths: [...keys, key],
      });
    // let objKeys = [];
    arr.forEach((item, index) => {
      if (Array.isArray(arr[index])) {
        const newKeys = [...keys];
        if (key) {
          newKeys.push(key);
        }
        if (key !== '_') {
          newKeys.push('_');
        }

        transformArray(item, currentPath, paths, { ...options, key: '_', keys: newKeys });
      } else {
        if (typeof arr[index] === 'object' && arr[index] !== null) {
          // objKeys = uniq([...objKeys, ...Object.keys(arr[index])]);
          getObjPaths(arr[index], currentPath, paths, { ...options, keys: [...keys, key, '_'] });
        }
      }
    });
  }

  return paths;
}
export function getObjPaths(obj, prefix = '', paths = [], options = { parseArray: false, keys: [] }) {
  const { keys } = options;
  Object.keys(obj).forEach((key) => {
    // 构建当前路径
    // const currentPath = prefix ? (Array.isArray(obj) ? `${prefix}[${key}]` : `${prefix}.${key}`) : key;
    const currentPath = prefix ? `${prefix}.${key}` : key;

    // 当前路径的值是一个数组
    if (Array.isArray(obj[key])) {
      transformArray(obj[key], prefix, paths, { ...options, keys, key: key });
    } else if (!Array.isArray(obj[key]) && typeof obj[key] === 'object' && obj[key] !== null) {
      // 如果当前路径的值是一个对象，递归调用
      paths.push({
        key: uid(),
        path: currentPath,
        name: key,
        paths: [...keys, key],
      });
      getObjPaths(obj[key], currentPath, paths, { ...options, keys: [...keys, key] });
    } else {
      // 否则，将当前路径添加到结果数组中
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
const ParseJsonAction = () => {
  const form = useForm();
  return {
    async run() {
      try {
        let keyPaths = [];
        const value = form.values.json;
        if (Array.isArray(value)) {
          keyPaths = transformArray(value, '', [], {
            parseArray: form.values.parseArray,
            keys: [],
            key: '',
          });
        } else if (typeof value === 'object' && value !== null) {
          keyPaths = getObjPaths(value, '', [], {
            parseArray: form.values.parseArray,
            keys: [],
          });
        }

        const bodyField = form.query('body').take() as ArrayField;
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
const ClearItemsAction = () => {
  const form = useForm();
  return {
    async run() {
      const bodyField = form.query('body').take() as ArrayField;
      bodyField.onInput([]);
    },
  };
};
export const ParsingJson = () => {
  return (
    <SchemaComponent
      components={{ NInput, Flex, Button }}
      scope={{ ParseJsonAction, ClearItemsAction }}
      schema={{
        type: 'void',
        'x-component': 'div',
        properties: {
          json: {
            type: 'string',
            title: `{{t("Input example", { ns: "${NAMESPACE}" })}}`,
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              layout: 'vertical',
            },
            'x-component': 'NInput.JSON',
            'x-component-props': {
              placeholder: lang('Please input JSON example like { "key1": "item1", "key2": "item2" }'),
              autoSize: { minRows: 3 },
              style: { marginBottom: 6 },
            },
          },
          parseArray: {
            type: 'boolean',
            // title: lang('Parse array items'),
            description: lang(
              'If the JSON object contains array items, parse them. eg: { "arrayKey": [ "item1", "item2" ] will be parsed as "arrayKey", "arrayKey.0", "arrayKey.1", if set to false, only "arrayKey" will be parsed.',
            ),
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              // layout: 'horizontal',
            },
            default: false,
            'x-component': 'Checkbox',
            'x-component-props': {},
            'x-content': lang('Include array index in path'),
          },
          flex: {
            type: 'void',
            description: lang('Please update other node references to the key after clicking the parse button.'),
            'x-decorator': 'FormItem',
            'x-component': 'Flex',
            'x-component-props': {
              gap: 'small',
            },
            properties: {
              parseJsonAction: {
                type: 'void',
                title: `{{t('Parse', { ns: "${NAMESPACE}" })}}`,
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ ParseJsonAction }}',
                  size: 'small',
                },
              },
              clearItems: {
                type: 'void',
                title: `{{t('Clear below items', { ns: "${NAMESPACE}" })}}`,
                'x-component': 'Action',
                'x-component-props': {
                  useAction: '{{ ClearItemsAction }}',
                  size: 'small',
                  confirm: {
                    title: "{{t('Delete items')}}",
                    content: "{{t('Are you sure to clear below items?')}}",
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};
