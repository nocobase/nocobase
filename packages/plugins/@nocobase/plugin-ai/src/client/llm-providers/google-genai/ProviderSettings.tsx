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
          apiKey: {
            title: tval('API key', { ns: namespace }),
            type: 'string',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'TextAreaWithGlobalScope',
          },
        },
      }}
    />
  );
};
