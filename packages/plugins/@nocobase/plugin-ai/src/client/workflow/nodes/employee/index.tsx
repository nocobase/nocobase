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
import { Card, Avatar } from 'antd';
const { Meta } = Card;

const AIEmployee = () => {
  return (
    <Card variant="borderless">
      <Meta
        avatar={<Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=8" />}
        title="LinguaBridge"
        description="Translates customer messages, emails, and documents in real-time across multiple languages."
      />
    </Card>
  );
};

export class AIEmployeeInstruction extends Instruction {
  title = 'AI employee';
  type = 'ai-employee';
  group = 'ai';
  // @ts-ignore
  icon = (<UserOutlined />);
  fieldset = {
    employee: {
      type: 'string',
      title: 'AI Employee',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'AIEmployee',
    },
    message: {
      type: 'string',
      title: 'Message',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableRawTextArea',
      'x-component-props': {
        autoSize: {
          minRows: 5,
        },
      },
    },
    colleague: {
      type: 'string',
      title: 'Collaborating human colleague',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
    },
    manual: {
      type: 'boolean',
      title: 'Require human colleague confirmation to continue',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  };
  components = {
    AIEmployee,
    WorkflowVariableRawTextArea,
  };

  isAvailable({ engine, workflow }) {
    return !engine.isWorkflowSync(workflow);
  }
}
