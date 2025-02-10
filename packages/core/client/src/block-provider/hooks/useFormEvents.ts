/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEvent } from '../../event-flow';
import { useCollection } from '../../data-source/collection/CollectionProvider';

export function useFormEvents({ form }) {
  const { define, emit } = useEvent();
  const collection = useCollection();
  const fields = collection?.fields || [];
  const fieldsMap = fields.reduce((acc, field) => {
    acc[field.name] = field;
    return acc;
  }, {});

  const inter = {
    name: 'form',
    title: '表单',
    events: [
      {
        name: 'valueChange',
        title: '表单值改变',
        params: {
          values: {
            title: '表单值',
            type: 'object',
            properties: fieldsMap,
          },
        },
      },
    ],
    states: {
      values: {
        name: 'values',
        title: '表单值',
        type: 'object',
        properties: fieldsMap,
        value: form.values,
      },
    },
    actions: [
      {
        name: 'reset',
        title: '重置',
        description: '重置表单',
        fn: () => {
          form.reset();
        },
      },
      {
        name: 'setFieldState',
        title: '设置字段状态',
        description: '设置字段状态 ',
        params: {
          fieldName: {
            name: 'fieldName',
            title: '字段名',
            type: 'string',
            description: '字段名',
          },
          fieldState: {
            name: 'fieldState',
            title: '字段状态',
            type: 'object',
            description: '字段状态 https://core.formilyjs.org/zh-CN/api/models/form#setvalues',
            properties: {
              errors: {
                name: 'errors',
                type: 'array',
                title: '错误',
                description: '错误',
                items: {
                  type: 'string',
                },
              },
              warnings: {
                name: 'warnings',
                type: 'array',
                title: '警告',
                description: '警告',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
        fn: (params) => {
          console.log('设置字段状态', params);
          // form.setFieldState(params.fieldName, params.fieldState);
        },
      },
      {
        name: 'setValues',
        title: '设置表单值',
        description: '设置表单值',
        params: {
          name: {
            name: 'name',
            title: '字段名',
            type: 'string',
            description: '字段名',
          },
          value: {
            name: 'value',
            title: '字段值',
            type: 'string',
          },
        },
        fn: (params) => {
          console.log('设置表单值', params);
          form.setValues({
            ...form.values,
            [params.name]: params.value,
          });
        },
      },
    ],
  };

  form.subscribe(({ type, payload, ...args }) => {
    if (type === 'onFieldInputValueChange') {
      emit({
        event: {
          definition: inter.name,
          event: 'valueChange',
        },
        params: {
          fieldName: payload?.props?.name,
          fieldValue: payload?.inputValue,
          values: form.values, // 用全量值代替某个值的改变，不太好传递动态的值类型
        },
      });
    }
  });

  // TODO remove define

  define(inter);
}
