/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { Variable } from '../../schema-component/antd/variable/Variable';

export const openLinkAction = {
  title: '编辑链接',
  uiSchema: {
    url: {
      title: 'URL',
      'x-decorator': 'FormItem',
      'x-component': Variable.TextArea,
      description: 'Do not concatenate search params in the URL',
    },
    params: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: `Search parameters`,
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            'x-component-props': {
              style: {
                flexWrap: 'nowrap',
                maxWidth: '100%',
              },
              className: css`
                & > .ant-space-item:first-child,
                & > .ant-space-item:last-child {
                  flex-shrink: 0;
                }
              `,
            },
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Name")}}`,
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': Variable.TextArea,
                'x-component-props': {
                  placeholder: `{{t("Value")}}`,
                  useTypedConstant: true,
                  changeOnSelect: true,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: 'Add parameter',
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    openInNewWindow: {
      type: 'boolean',
      'x-content': 'Open in new window',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
  handler(ctx, params) {
    ctx.globals.modal.confirm({
      title: `TODO`,
      content: JSON.stringify(params, null, 2),
    });
  },
};
