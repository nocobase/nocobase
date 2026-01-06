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
          region: {
            title: tval('AWS Region', { ns: namespace }),
            type: 'string',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'TextAreaWithGlobalScope',
            default: 'us-east-1',
          },
          accessKeyId: {
            title: tval('Access Key ID', { ns: namespace }),
            type: 'string',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'TextAreaWithGlobalScope',
          },
          secretAccessKey: {
            title: tval('Secret Access Key', { ns: namespace }),
            type: 'string',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'TextAreaWithGlobalScope',
          },
          sessionToken: {
            title: tval('Session Token', { ns: namespace }),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'TextAreaWithGlobalScope',
            description: tval('Optional. Required for temporary credentials.', { ns: namespace }),
          },
        },
      }}
    />
  );
};
