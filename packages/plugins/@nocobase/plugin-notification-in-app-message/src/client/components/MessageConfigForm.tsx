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
import { useLocalTranslation, NAMESPACE } from '../../locale';
import { UsersSelect } from './UsersSelect';
import { UsersAddition } from './UsersAddition';
import { tval } from '@nocobase/utils/client';

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
            description: tval(
              'When select receivers from node result, only support ID of user (or IDs array of users). Others will not match any user.',
              { ns: NAMESPACE },
            ),
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
          title: {
            type: 'string',
            required: true,
            title: `{{t("Message title")}}`,
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
            title: `{{t("Message content")}}`,
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
                required: false,
                title: `{{t("Details page for desktop")}}`,
                'x-decorator': 'FormItem',
                'x-component': 'Variable.TextArea',
                'x-component-props': {
                  scope: variableOptions,
                  useTypedConstant: ['string'],
                },
                description: tval(
                  'Support two types of links: internal links and external links. If using an internal link, the link starts with "/", for example, "/admin". If using an external link, the link starts with "http", for example, "https://example.com".',
                ),
              },
              mobileUrl: {
                type: 'string',
                required: false,
                title: `{{t("Details page for mobile")}}`,
                'x-decorator': 'FormItem',
                'x-component': 'Variable.TextArea',
                'x-component-props': {
                  scope: variableOptions,
                  useTypedConstant: ['string'],
                },
                description: tval(
                  'Support two types of links: internal links and external links. If using an internal link, the link starts with "/", for example, "/m". If using an external link, the link starts with "http", for example, "https://example.com".',
                ),
              },
            },
          },
        },
      }}
    />
  );
};
