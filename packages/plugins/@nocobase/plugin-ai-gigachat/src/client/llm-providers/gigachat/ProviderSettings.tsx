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
import { tval } from '@nocobase/utils/client';
import { namespace } from '../../locale';

export const ProviderSettingsForm: React.FC = () => {
  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: {
          credentials: {
            title: tval('Authorization key', { ns: namespace }),
            type: 'string',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'TextAreaWithGlobalScope',
          },
          scope: {
            title: tval('Scope', { ns: namespace }),
            type: 'string',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            'x-component-props': {
              options: [
                {
                  label: 'GIGACHAT_API_PERS',
                  value: 'GIGACHAT_API_PERS',
                },
                {
                  label: 'GIGACHAT_API_B2B',
                  value: 'GIGACHAT_API_B2B',
                },
                {
                  label: 'GIGACHAT_API_CORP',
                  value: 'GIGACHAT_API_CORP',
                },
              ],
            },
          },
          baseURL: {
            title: tval('Base URL', { ns: namespace }),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'TextAreaWithGlobalScope',
          },
          authURL: {
            title: tval('Auth URL', { ns: namespace }),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'TextAreaWithGlobalScope',
          },
          enableSSL: {
            title: tval('Verify certificates', { ns: namespace }),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Checkbox',
            default: true,
          },
        },
      }}
    />
  );
};
