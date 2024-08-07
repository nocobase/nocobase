/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { useNotifyMailTranslation } from './hooks/useTranslation';
export const ChannelConfigForm = () => {
  const { t } = useNotifyMailTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          host: {
            'x-decorator': 'FormItem',
            type: 'boolean',
            title: '{{t("Host")}}',
            'x-component': 'Input',
            required: true,
          },
          port: {
            'x-decorator': 'FormItem',
            type: 'boolean',
            title: '{{t("Port")}}',
            'x-component': 'Input',
            required: true,
          },
          secure: {
            'x-decorator': 'FormItem',
            type: 'boolean',
            title: '{{t("Secure")}}',
            'x-component': 'Checkbox',
          },
          account: {
            'x-decorator': 'FormItem',
            type: 'boolean',
            title: '{{t("Account")}}',
            'x-component': 'Input',
            required: true,
          },
          password: {
            'x-decorator': 'FormItem',
            type: 'boolean',
            title: '{{t("Password")}}',
            'x-component': 'Input',
            required: true,
          },
        },
      }}
    />
  );
};
