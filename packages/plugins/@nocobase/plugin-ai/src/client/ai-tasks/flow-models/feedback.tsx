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
import { AssigneesSelect } from '../components/AssigneesSelect';

export class AIEmployeeTaskFeedbackModel extends FlowModel {
  public render() {
    return (
      <SchemaComponent
        components={{ StructuredOutput, AssigneesSelect, Switch }}
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
              'x-component': Switch,
            },
            assignees: {
              type: 'array',
              title: tExpr('Assignees', { ns: namespace }),
              'x-decorator': 'FormItem',
              'x-component': AssigneesSelect,
              'x-component-props': {
                multiple: true,
              },
              default: [],
            },
          },
        }}
      />
    );
  }
}
