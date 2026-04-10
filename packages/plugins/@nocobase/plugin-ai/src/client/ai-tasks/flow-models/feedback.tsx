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
import { FlowModel, tExpr } from '@nocobase/flow-engine';
import { StructuredOutput } from '../components/structured-output';
import { namespace } from '../../locale';
import { Switch } from 'antd';
import { UsersSelect } from '../components/users-select';

export class AIEmployeeTaskFeedbackModel extends FlowModel {
  public render() {
    return (
      <SchemaComponent
        components={{ StructuredOutput, UsersSelect, Switch }}
        schema={{
          type: 'void',
          properties: {
            output: {
              type: 'void',
              'x-component': StructuredOutput,
            },
            requiresApproval: {
              title: tExpr('Requires approval', { ns: namespace }),
              type: 'boolean',
              default: false,
              'x-decorator': 'FormItem',
              'x-decorator-props': {
                tooltip: tExpr('Whether user approval is required before the task outputs the final result', {
                  ns: namespace,
                }),
              },
              'x-component': Switch,
            },
            assignees: {
              type: 'array',
              title: tExpr('Assignees', { ns: namespace }),
              'x-decorator': 'FormItem',
              'x-decorator-props': {
                tooltip: tExpr('Users who can approve the final output result of the task', { ns: namespace }),
              },
              'x-component': UsersSelect,
              'x-component-props': {
                multiple: true,
              },
              'x-reactions': {
                dependencies: ['requiresApproval'],
                fulfill: {
                  state: {
                    disabled: '{{$deps[0] !== true}}',
                    required: '{{$deps[0] === true}}',
                  },
                },
              },
              default: [],
            },
          },
        }}
      />
    );
  }
}
