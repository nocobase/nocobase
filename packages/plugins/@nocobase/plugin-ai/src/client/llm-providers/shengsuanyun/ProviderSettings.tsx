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
import { tExpr } from '@nocobase/flow-engine';
import { namespace } from '../../locale';

export const ProviderSettingsForm: React.FC = () => {
  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: {
          apiKey: {
            title: tExpr('API Key', { ns: namespace }),
            type: 'string',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'TextAreaWithGlobalScope',
          },
          xTitle: {
            title: tExpr('X-Title', { ns: namespace }),
            description: tExpr('Sent as the "X-Title" request header.', { ns: namespace }),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
        },
      }}
    />
  );
};
