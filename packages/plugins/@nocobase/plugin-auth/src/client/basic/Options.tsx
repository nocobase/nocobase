/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useAuthTranslation } from '../locale';
import { Alert } from 'antd';

export const Options = () => {
  const { t } = useAuthTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      components={{ Alert }}
      schema={{
        type: 'object',
        properties: {
          public: {
            type: 'object',
            properties: {
              allowSignUp: {
                'x-decorator': 'FormItem',
                type: 'boolean',
                title: '{{t("Allow to sign up")}}',
                'x-component': 'Checkbox',
                default: true,
              },
            },
          },
          notice: {
            type: 'void',
            'x-component': 'Alert',
            'x-component-props': {
              showIcon: true,
              message: '{{t("The authentication allows users to sign in via username or email.")}}',
            },
          },
        },
      }}
    />
  );
};
