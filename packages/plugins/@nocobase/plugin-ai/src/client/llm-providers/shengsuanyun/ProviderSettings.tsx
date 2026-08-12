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
import { namespace, useT } from '../../locale';

const API_KEY_URL = 'https://www.shengsuanyun.com/?from=CH_PEMWBPGH';

export const ProviderSettingsForm: React.FC = () => {
  const t = useT();

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
            'x-decorator-props': {
              colon: false,
              label: (
                <span>
                  {t('API Key')}:{' '}
                  <a href={API_KEY_URL} target="_blank" rel="noopener noreferrer">
                    {t('Get API Key')}
                  </a>
                </span>
              ),
            },
            'x-component': 'TextAreaWithGlobalScope',
          },
        },
      }}
    />
  );
};
