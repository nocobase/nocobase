/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Space } from 'antd';

import {
  Instruction,
  RadioWithTooltip,
  WorkflowVariableInput,
  WorkflowVariableTextArea,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE } from '../locale';

export default class extends Instruction {
  title = `{{t("Response message", { ns: "${NAMESPACE}" })}}`;
  type = 'response-message';
  group = 'extended';
  description = `{{t("Add response message, will be send to client when process of request ends.", { ns: "${NAMESPACE}" })}}`;
  icon = (<InfoCircleOutlined />);
  fieldset = {
    message: {
      type: 'string',
      title: `{{t("Message content", { ns: "${NAMESPACE}" })}}`,
      description: `{{t('Supports variables in template.', { ns: "${NAMESPACE}", name: '{{name}}' })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableTextArea',
    },
    info: {
      type: 'void',
      'x-component': 'Space',
      'x-component-props': {
        direction: 'vertical',
      },
      properties: {
        success: {
          type: 'void',
          'x-component': 'Alert',
          'x-component-props': {
            type: 'success',
            showIcon: true,
            description: `{{t('If the workflow ends normally, the response message will return a success status by default.', { ns: "${NAMESPACE}" })}}`,
          },
        },
        failure: {
          type: 'void',
          'x-component': 'Alert',
          'x-component-props': {
            type: 'error',
            showIcon: true,
            description: `{{t('If you want to return a failure status, please add an "End Process" node downstream to terminate the workflow.', { ns: "${NAMESPACE}" })}}`,
          },
        },
      },
    },
  };
  scope = {};
  components = {
    RadioWithTooltip,
    WorkflowVariableTextArea,
    WorkflowVariableInput,
    Alert,
    Space,
  };
  isAvailable({ workflow, upstream, branchIndex }) {
    return (
      workflow.type === 'request-interception' || (['action', 'custom-action'].includes(workflow.type) && workflow.sync)
    );
  }
}
