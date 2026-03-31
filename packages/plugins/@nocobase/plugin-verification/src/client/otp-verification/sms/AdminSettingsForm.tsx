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
import { NAMESPACE } from '../../locale';
import { observer, useForm } from '@formily/react';
import PluginVerificationClient from '../..';

export const useAdminSettingsForm = (providerType: string) => {
  const plugin = usePlugin('verification') as PluginVerificationClient;
  const provider = plugin.smsOTPProviderManager.getProvider(providerType);
  return provider?.components?.AdminSettingsForm;
};

export const Settings = observer(
  () => {
    const form = useForm();
    const Component = useAdminSettingsForm(form.values.options?.provider);
    return Component ? <Component /> : null;
  },
  { displayName: 'SMSOTPVerificationSettings' },
);

export const AdminSettingsForm: React.FC = () => {
  return (
    <SchemaComponent
      components={{ Settings }}
      schema={{
        type: 'void',
        properties: {
          provider: {
            title: tval('Provider', { ns: NAMESPACE }),
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
                resource: 'smsOTPProviders',
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
