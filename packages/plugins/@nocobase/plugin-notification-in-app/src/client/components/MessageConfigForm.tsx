/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaComponent, css } from '@nocobase/client';
import { useLocalTranslation } from '../../locale';
import { UsersSelect } from './UsersSelect';
import { UsersAddition } from './UsersAddition';

const emailsClass = css`
  width: 100%;

  .ant-space-item:nth-child(2) {
    flex-grow: 1;
  }
`;
export const MessageConfigForm = ({ variableOptions }) => {
  const { t } = useLocalTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      components={{ UsersSelect, UsersAddition }}
      schema={{
        type: 'void',
        properties: {
          receivers: {
            type: 'array',
            title: `{{t("Receivers")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems',
            items: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                className: css`
                  width: 100%;
                  &.ant-space.ant-space-horizontal {
                    flex-wrap: nowrap;
                  }
                  > .ant-space-item:nth-child(2) {
                    flex-grow: 1;
                  }
                `,
              },
              properties: {
                sort: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.SortHandle',
                },
                input: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'UsersSelect',
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
            required: true,
            properties: {
              add: {
                type: 'void',
                title: `{{t("Add receiver")}}`,
                'x-component': 'UsersAddition',
              },
            },
          },
          senderName: {
            type: 'string',
            required: true,
            title: `{{t("Channel name")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'Variable.TextArea',
            'x-component-props': {
              scope: variableOptions,
              useTypedConstant: ['string'],
            },
          },
          title: {
            type: 'string',
            required: true,
            title: `{{t("Title")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'Variable.TextArea',
            'x-component-props': {
              scope: variableOptions,
              useTypedConstant: ['string'],
            },
          },
          content: {
            type: 'string',
            required: true,
            title: `{{t("Content")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'Variable.RawTextArea',
            'x-component-props': {
              scope: variableOptions,
              placeholder: 'Hi,',
              autoSize: {
                minRows: 10,
              },
            },
          },
          options: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                required: true,
                title: `{{t("Redirect URL")}}`,
                'x-decorator': 'FormItem',
                'x-component': 'Variable.TextArea',
                'x-component-props': {
                  scope: variableOptions,
                  useTypedConstant: ['string'],
                },
              },
            },
          },

          senderId: {
            type: 'string',
            default: crypto.randomUUID(),
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-hidden': true,
          },
        },
      }}
    />
  );
};
