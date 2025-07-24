/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useT } from '../locale';
import { WorkflowVariableJSON } from '@nocobase/plugin-workflow/client';

export const StructuredOutput: React.FC = () => {
  const t = useT();
  return (
    <SchemaComponent
      components={{ WorkflowVariableJSON }}
      schema={{
        type: 'void',
        properties: {
          structuredOutput: {
            type: 'object',
            properties: {
              schema: {
                title: 'JSON Schema',
                type: 'string',
                description: (
                  <>
                    {t('Syntax references')}:{' '}
                    <a href="https://json-schema.org" target="_blank" rel="noreferrer">
                      JSON Schema
                    </a>
                  </>
                ),
                'x-decorator': 'FormItem',
                'x-component': 'WorkflowVariableJSON',
                'x-component-props': {
                  json5: true,
                  autoSize: {
                    minRows: 10,
                  },
                },
              },
              name: {
                title: t('Name'),
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
              description: {
                title: t('Description'),
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input.TextArea',
              },
              strict: {
                title: 'Strict',
                type: 'boolean',
                'x-decorator': 'FormItem',
                'x-component': 'Checkbox',
              },
            },
          },
        },
      }}
    />
  );
};

export const StructuredOutputSettings: React.FC = () => {
  return (
    <SchemaComponent
      components={{ StructuredOutput }}
      schema={{
        type: 'void',
        properties: {
          structuredOutput: {
            type: 'void',
            'x-component': 'StructuredOutput',
          },
        },
      }}
    />
  );
};
