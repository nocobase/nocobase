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
import { namespace, useT } from '../../locale';
import { Collapse } from 'antd';
import { ModelSelect } from '../components/ModelSelect';

const Options: React.FC = () => {
  const t = useT();
  return (
    <div
      style={{
        marginBottom: 24,
      }}
    >
      <Collapse
        bordered={false}
        size="small"
        items={[
          {
            key: 'options',
            label: t('Options'),
            forceRender: true,
            children: (
              <SchemaComponent
                schema={{
                  type: 'void',
                  name: 'ollama',
                  properties: {
                    temperature: {
                      title: tval('Temperature', { ns: namespace }),
                      description: tval('Temperature description', { ns: namespace }),
                      type: 'number',
                      'x-decorator': 'FormItem',
                      'x-component': 'InputNumber',
                      default: 0.7,
                      'x-component-props': {
                        step: 0.1,
                        min: 0,
                        max: 2,
                      },
                    },
                    topP: {
                      title: tval('Top P', { ns: namespace }),
                      description: tval('Top P description', { ns: namespace }),
                      type: 'number',
                      'x-decorator': 'FormItem',
                      'x-component': 'InputNumber',
                      default: 1.0,
                      'x-component-props': {
                        step: 0.1,
                        min: 0,
                        max: 1,
                      },
                    },
                    topK: {
                      title: tval('Top K', { ns: namespace }),
                      description: tval('Top K description', { ns: namespace }),
                      type: 'number',
                      'x-decorator': 'FormItem',
                      'x-component': 'InputNumber',
                      default: 40,
                      'x-component-props': {
                        min: 0,
                      },
                    },
                    numPredict: {
                      title: tval('Max tokens', { ns: namespace }),
                      description: tval('Maximum number of tokens to generate', { ns: namespace }),
                      type: 'number',
                      'x-decorator': 'FormItem',
                      'x-component': 'InputNumber',
                      default: -1,
                      'x-component-props': {
                        min: -1,
                      },
                    },
                  },
                }}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export const ModelSettingsForm: React.FC = () => {
  return (
    <SchemaComponent
      components={{ Options, ModelSelect }}
      schema={{
        type: 'void',
        properties: {
          model: {
            title: tval('Model', { ns: namespace }),
            type: 'string',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'ModelSelect',
          },
          options: {
            type: 'void',
            'x-component': 'Options',
          },
        },
      }}
    />
  );
};
