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
import { useNotifyMailTranslation } from './hooks/useTranslation';
const emailsClass = css`
  width: 100%;

  .ant-space-item:nth-child(2) {
    flex-grow: 1;
  }
`;
export const MessageConfigForm = ({ variableOptions }) => {
  const { t } = useNotifyMailTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'void',
        properties: {
          to: {
            type: 'array',
            required: true,
            title: `{{t("To")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems',
            items: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                className: emailsClass,
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
                  'x-component': 'Variable.Input',
                  'x-component-props': {
                    scope: variableOptions,
                    useTypedConstant: ['string'],
                    placeholder: `{{t("Email address")}}`,
                  },
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: `{{t("Add email address")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          cc: {
            type: 'array',
            title: `{{t("CC")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems',
            items: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                className: emailsClass,
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
                  'x-component': 'Variable.Input',
                  'x-component-props': {
                    scope: variableOptions,
                    useTypedConstant: ['string'],
                    placeholder: `{{t("Email address")}}`,
                  },
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: `{{t("Add email address")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          bcc: {
            type: 'array',
            title: `{{t("BCC")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems',
            items: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                className: emailsClass,
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
                  'x-component': 'Variable.Input',
                  'x-component-props': {
                    scope: variableOptions,
                    useTypedConstant: ['string'],
                    placeholder: `{{t("Email address")}}`,
                  },
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: `{{t("Add email address")}}`,
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          subject: {
            type: 'string',
            required: true,
            title: `{{t("Subject")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'Variable.TextArea',
            'x-component-props': {
              scope: variableOptions,
            },
          },
          contentType: {
            type: 'string',
            title: `{{t("Content type")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
            enum: [
              { label: 'HTML', value: 'html' },
              { label: `{{t("Plain text")}}`, value: 'text' },
            ],
            default: 'html',
          },
          html: {
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
            'x-reactions': [
              {
                dependencies: ['contentType'],
                fulfill: {
                  state: {
                    visible: '{{$deps[0] === "html"}}',
                  },
                },
              },
            ],
          },
          text: {
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
            'x-reactions': [
              {
                dependencies: ['contentType'],
                fulfill: {
                  state: {
                    visible: '{{$deps[0] === "text"}}',
                  },
                },
              },
            ],
          },
        },
      }}
    />
  );
};
