/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { actionsSchema } from './actions';

export const rulesSchema = {
  type: 'void',
  properties: {
    rules: {
      type: 'array',
      'x-component': 'ArrayCollapse',
      'x-decorator': 'FormItem',
      'x-component-props': {
        accordion: true,
        titleRender: (item: any, index: number) => {
          return `规则 ${index + 1}`;
        },
        showEmpty: false,
      },
      items: {
        type: 'object',
        'x-component': 'ArrayCollapse.CollapsePanel',
        properties: {
          conditionsTitle: {
            'x-component': 'h4',
            'x-content': '{{ t("Condition") }}',
          },
          condition: {
            'x-component': 'ConditionSelect',
            'x-component-props': {
              className: css`
                position: relative;
                width: 100%;
                margin-left: 12px;
              `,
            },
            'x-reactions': {
              dependencies: ['...event'],
              fulfill: {
                state: {
                  'componentProps.event': '{{$deps[0]}}',
                },
              },
            },
          },
          actionsTitle: {
            'x-component': 'h4',
            'x-content': '{{ t("动作") }}',
          },
          actionsBlock: actionsSchema,
          remove: {
            type: 'void',
            'x-component': 'ArrayCollapse.Remove',
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: '{{ t("添加规则") }}',
          'x-component': 'ArrayCollapse.Addition',
          // 'x-reactions': {
          //   dependencies: ['rules'],
          //   fulfill: {
          //     state: {
          //       disabled: '{{$deps[0].length >= 3}}',
          //     },
          //   },
          // },
        },
      },
    },
  },
};
