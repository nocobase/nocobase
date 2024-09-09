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

const emailsClass = css`
  width: 100%;

  .ant-space-item:nth-child(2) {
    flex-grow: 1;
  }
`;
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
            title: `{{t("Title")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'Variable.Input',
            'x-component-props': {
              scope: variableOptions,
              useTypedConstant: ['string'],
            },
          },
          url: {
            type: 'string',
            required: true,
            title: `{{t("Redirect URL")}}`,
            'x-decorator': 'FormItem',
            'x-component': 'Variable.Input',
            'x-component-props': {
              scope: variableOptions,
              placeholder: 'https://example.com',
              useTypedConstant: ['string'],
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
