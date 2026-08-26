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
import { WorkflowVariableJSON } from '@nocobase/plugin-workflow/client';
import { tExpr } from '@nocobase/flow-engine';
import { namespace, useT } from '../../../../locale';

export const StructuredOutput: React.FC = () => {
  const t = useT();
  const DEFAULT_SCHEMA = {
    type: 'object',
    properties: {
      result: {
        title: t('Response result', { ns: namespace }),
        type: 'string',
        description: 'The text message sent to the user',
      },
    },
  };
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
                title: tExpr('Structured output', {
                  ns: namespace,
                }),
                type: 'string',
                default: JSON.stringify(DEFAULT_SCHEMA, null, 2),
                required: true,
                description: (
                  <>
                    {t('Syntax references')}:{' '}
                    <a href="https://json-schema.org" target="_blank" rel="noreferrer">
                      JSON Schema
                    </a>
                  </>
                ),
                'x-decorator': 'FormItem',
                'x-decorator-props': {
                  tooltip: tExpr('Define the data structure of the final output of the node', { ns: namespace }),
                },
                'x-component': 'WorkflowVariableJSON',
                'x-component-props': {
                  json5: true,
                  autoSize: {
                    minRows: 10,
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};
