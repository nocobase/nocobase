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
import { Alert, Typography } from 'antd';
import { namespace, useT } from '../../locale';

const { Text } = Typography;

export const ProviderSettingsForm: React.FC = () => {
  const t = useT();

  return (
    <>
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 16 }}
        message={t('MiniMax endpoint configuration')}
        description={
          <div>
            <div>{t('The MiniMax provider uses the OpenAI-compatible API.')}</div>
            <div>
              {t('Global Base URL')}: <Text code>https://api.minimax.io/v1</Text>
            </div>
            <div>
              {t('China Base URL')}: <Text code>https://api.minimaxi.com/v1</Text>
            </div>
            <div style={{ marginTop: 8 }}>
              {t(
                'For the Anthropic-compatible API, create an Anthropic service, use the matching Base URL below, and add MiniMax-M3 and MiniMax-M2.7 with Manual input.',
              )}
            </div>
            <div>
              {t('Global Anthropic Base URL')}: <Text code>https://api.minimax.io/anthropic</Text>
            </div>
            <div>
              {t('China Anthropic Base URL')}: <Text code>https://api.minimaxi.com/anthropic</Text>
            </div>
          </div>
        }
      />
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
          },
        }}
      />
    </>
  );
};
