/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const actionParamsSchema = {
  type: 'void',
  properties: {
    params: {
      type: 'array',
      'x-component': 'ArrayItems',
      items: {
        type: 'object',
        'x-decorator': 'Space.Compact',
        'x-decorator-props': {
          style: {
            marginBottom: 8,
          },
        },
        properties: {
          key: {
            type: 'string',
            'x-component': 'ActionParamSelect',
            'x-reactions': {
              dependencies: ['...action'],
              fulfill: {
                schema: {
                  'x-component-props': {
                    action: '{{$deps[0]}}',
                  },
                },
              },
            },
          },
          value: { type: 'string', 'x-component': 'Input' },
          removeBtn: {
            type: 'void',
            'x-component': 'ArrayItems.Remove',
            'x-component-props': { type: 'default', style: { paddingRight: 6 } },
          },
        },
      },
      properties: {
        addBtn: {
          type: 'void',
          'x-component': 'ArrayItems.Addition',
          title: '{{ t("添加参数") }}',
          'x-component-props': { block: false, type: 'link' },
        },
      },
    },
  },
};

export const actionsSchema = {
  type: 'void',
  properties: {
    actions: {
      type: 'array',
      'x-component': 'ArrayItems',
      items: {
        type: 'object',
        'x-component': 'Space',
        'x-component-props': {
          align: 'start',
          style: {
            marginBottom: 8,
          },
        },
        properties: {
          action: {
            type: 'string',
            'x-component': 'ActionSelect',
            'x-reactions': {
              effects: ['onFieldValueChange'],
              fulfill: {
                run: 'emptyParams($self,$target)',
              },
            },
          },
          paramsBlock: actionParamsSchema,
          removeBtn: {
            type: 'void',
            'x-component': 'ArrayItems.Remove',
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          'x-component': 'ArrayItems.Addition',
          title: '{{ t("添加动作") }}',
          'x-component-props': { block: false, type: 'link' },
        },
      },
    },
  },
  // 'x-component': ActionsField,
};
