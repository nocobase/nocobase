/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent, usePlugin } from '@nocobase/client';
import { tval } from '@nocobase/utils/client';
import React from 'react';
import { observer, useForm } from '@formily/react';
import PluginAuthEmailClient from '../..';

export const useAdminSettingsForm = (providerType: string) => {
  const plugin = usePlugin('@moonship1011/plugin-auth-email') as any;
  const provider = plugin.emailOTPProviderManager?.getProvider?.(providerType);
  return provider?.components?.AdminSettingsForm;
};

export const Settings = observer(
  () => {
    const form = useForm();
    const Component = useAdminSettingsForm(form.values.options?.provider);
    return Component ? <Component /> : null;
  },
  { displayName: 'EmailOTPVerificationSettings' },
);

export const AdminSettingsForm: React.FC = () => {
  return (
    <SchemaComponent
      components={{ Settings }}
      schema={{
        type: 'void',
        properties: {
          codeLength: {
            title: tval('Code Length', { ns: 'auth-email' }),
            type: 'number',
            'x-decorator': 'FormItem',
            'x-component': 'InputNumber',
            default: 6,
            minimum: 4,
            maximum: 12,
          },
          codeType: {
            title: tval('Code Type', { ns: 'auth-email' }),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            default: 'numeric',
            enum: [
              { label: tval('Numeric', { ns: 'auth-email' }), value: 'numeric' },
              { label: tval('Alphabetic', { ns: 'auth-email' }), value: 'alpha' },
              { label: tval('Alphanumeric', { ns: 'auth-email' }), value: 'alphanumeric' },
            ],
          },
          expiresIn: {
            title: tval('Expires In (seconds)', { ns: 'auth-email' }),
            type: 'number',
            'x-decorator': 'FormItem',
            'x-component': 'InputNumber',
            default: 120,
            minimum: 60,
            maximum: 3600,
          },
          provider: {
            title: tval('Provider', { ns: 'auth-email' }),
            type: 'string',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'RemoteSelect',
            'x-component-props': {
              manual: false,
              fieldNames: {
                label: 'title',
                value: 'name',
              },
              service: {
                resource: 'emailOTPProviders',
              },
            },
          },
          settings: {
            type: 'object',
            'x-component': 'Settings',
          },
        },
      }}
    />
  );
};
