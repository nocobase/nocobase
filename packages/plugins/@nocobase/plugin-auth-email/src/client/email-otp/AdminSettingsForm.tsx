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
import { useAuthTranslation } from '../locale';

export const useAdminSettingsForm = (providerType: string) => {
  const plugin = usePlugin('@nocobase/plugin-auth-email') as any;
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
  const { t } = useAuthTranslation();
  return (
    <SchemaComponent
      components={{ Settings }}
      scope={{ t }}
      schema={{
        type: 'void',
        properties: {
          codeLength: {
            title: '{{t("Code Length")}}',
            type: 'number',
            'x-decorator': 'FormItem',
            'x-component': 'InputNumber',
            default: 6,
            minimum: 4,
            maximum: 12,
          },
          codeType: {
            title: '{{t("Code Type")}}',
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            default: 'numeric',
            enum: [
              { label: '{{t("Numeric")}}', value: 'numeric' },
              { label: '{{t("Alphabetic")}}', value: 'alpha' },
              { label: '{{t("Alphanumeric")}}', value: 'alphanumeric' },
            ],
          },
          expiresIn: {
            title: '{{t("Expires In (seconds)")}}',
            type: 'number',
            'x-decorator': 'FormItem',
            'x-component': 'InputNumber',
            default: 120,
            minimum: 60,
            maximum: 3600,
          },
          resendInterval: {
            title: '{{t("Resend Interval (seconds)")}}',
            type: 'number',
            'x-decorator': 'FormItem',
            'x-component': 'InputNumber',
            default: 60,
            minimum: 10,
            maximum: 600,
          },
          provider: {
            title: '{{t("Provider")}}',
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
