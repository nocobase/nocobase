/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { tExpr } from '@nocobase/flow-engine';
import { SchemaComponent } from '@nocobase/client';
import { WorkflowVariableRawTextArea } from '@nocobase/plugin-workflow/client';
import { namespace } from '../../../../locale';

export const MessageInputs: React.FC<{ aiEmployeesMap: any }> = ({ aiEmployeesMap }) => {
  return (
    <SchemaComponent
      components={{ WorkflowVariableRawTextArea }}
      schema={{
        type: 'void',
        properties: {
          message: {
            type: 'object',
            properties: {
              system: {
                title: tExpr('Background', { ns: namespace }),
                type: 'string',
                'x-decorator': 'FormItem',
                'x-decorator-props': {
                  tooltip: tExpr(
                    'Additional system prompt appended to the AI employee’s definition, used to refine instructions',
                    { ns: namespace },
                  ),
                },
                'x-component': WorkflowVariableRawTextArea,
                'x-component-props': {
                  rows: '10',
                },
              },
              user: {
                title: tExpr('Default user message', { ns: namespace }),
                type: 'string',
                'x-decorator': 'FormItem',
                'x-decorator-props': {
                  tooltip: tExpr('Enter the specific task description', { ns: namespace }),
                },
                'x-component': WorkflowVariableRawTextArea,
                'x-component-props': {
                  rows: '10',
                },
              },
            },
          },
        },
      }}
    />
  );
};
