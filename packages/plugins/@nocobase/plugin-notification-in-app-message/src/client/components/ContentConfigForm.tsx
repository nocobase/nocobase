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
import { tval } from '@nocobase/utils/client';

export const ContentConfigForm = ({ variableOptions }) => {
  const { t } = useLocalTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'void',
        properties: {
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
                  delimiters: ['{{{', '}}}'],
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
                  delimiters: ['{{{', '}}}'],
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
