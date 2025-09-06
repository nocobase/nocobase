/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useT } from '../../locale';
import { SchemaComponent } from '@nocobase/client';
import { Switch } from '@formily/antd-v5';

export const KnowledgeBaseSettings: React.FC = () => {
  const t = useT();
  return (
    <SchemaComponent
      components={{ Switch }}
      schema={{
        type: 'void',
        properties: {
          enableKnowledgeBase: {
            type: 'boolean',
            title: '{{t("Enable Knowledge Base")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Switch',
          },
          knowledgeBasePrompt: {
            type: 'string',
            title: '{{t("Knowledge Base Prompt")}}',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              autoSize: {
                minRows: 5,
              },
            },
            'x-reactions': [
              {
                dependencies: ['enableKnowledgeBase'],
                fulfill: {
                  state: {
                    disabled: '{{$deps[0] === false}}',
                  },
                },
              },
            ],
          },
          knowledgeBase: {
            type: 'object',
            properties: {
              knowledgeBaseIds: {
                type: 'array',
                title: '{{t("Knowledge Base")}}',
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'RemoteSelect',
                'x-component-props': {
                  mode: 'multiple',
                  manual: false,
                  fieldNames: {
                    label: 'name',
                    value: 'id',
                  },
                  service: {
                    resource: 'aiKnowledgeBase',
                    action: 'list',
                    params: {
                      fields: ['id', 'name'],
                      filter: {
                        enabled: true,
                      },
                    },
                  },
                },
                'x-reactions': [
                  {
                    dependencies: ['enableKnowledgeBase'],
                    fulfill: {
                      state: {
                        disabled: '{{$deps[0] === false}}',
                      },
                    },
                  },
                ],
              },
              topK: {
                type: 'number',
                title: '{{t("Top K")}}',
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {
                  min: 1,
                  max: 100,
                },
                'x-reactions': [
                  {
                    dependencies: ['enableKnowledgeBase'],
                    fulfill: {
                      state: {
                        disabled: '{{$deps[0] === false}}',
                      },
                    },
                  },
                ],
              },
              score: {
                type: 'number',
                title: '{{t("Score")}}',
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {
                  min: 0,
                  max: 1,
                  step: 0.1,
                },
                'x-reactions': [
                  {
                    dependencies: ['enableKnowledgeBase'],
                    fulfill: {
                      state: {
                        disabled: '{{$deps[0] === false}}',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      }}
    />
  );
};
