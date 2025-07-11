/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { tval } from '@nocobase/utils/client';
import { Variable } from '../../schema-component/antd/variable/Variable';

export const openLinkAction = {
  title: tval('Edit link'),
  uiSchema: {
    url: {
      title: tval('URL'),
      'x-decorator': 'FormItem',
      'x-component': Variable.TextArea,
      description: tval('Do not concatenate search params in the URL'),
    },
    params: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: tval('Search parameters'),
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
                  placeholder: tval('Name'),
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': Variable.TextArea,
                'x-component-props': {
                  placeholder: tval('Value'),
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
          title: tval('Add parameter'),
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    openInNewWindow: {
      type: 'boolean',
      'x-content': tval('Open in new window'),
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
  handler(ctx, params) {
    ctx.modal.confirm({
      title: `TODO`,
      content: JSON.stringify(params, null, 2),
    });
  },
};
