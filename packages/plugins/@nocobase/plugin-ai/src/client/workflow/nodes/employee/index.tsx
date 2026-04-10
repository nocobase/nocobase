/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Instruction, WorkflowVariableRawTextArea } from '@nocobase/plugin-workflow/client';
import { UserOutlined } from '@ant-design/icons';
import { Configuration } from './configuration';
import { tExpr } from '@nocobase/flow-engine';
import { namespace } from '../../../locale';

export class AIEmployeeInstruction extends Instruction {
  title = tExpr('AI employee', {
    ns: namespace,
  });
  type = 'ai-employee';
  group = 'ai';
  // @ts-ignore
  icon = (<UserOutlined />);
  fieldset = {
    configuration: {
      type: 'void',
      'x-component': 'Configuration',
      'x-component-props': {
        aiEmployee: {
          username: 'atlas',
        },
      },
    },
  };
  components = {
    Configuration,
    WorkflowVariableRawTextArea,
  };

  isAvailable({ engine, workflow }) {
    return !engine.isWorkflowSync(workflow);
  }
}
