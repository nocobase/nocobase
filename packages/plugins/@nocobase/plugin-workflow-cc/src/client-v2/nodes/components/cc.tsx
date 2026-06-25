/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { WorkflowVariableInput, useNodeContext } from '@nocobase/plugin-workflow/client-v2';
import { Form, theme } from 'antd';
import React from 'react';

import FlowModelConfigInput from '../../components/FlowModelConfigInput';
import { useT } from '../../locale';
import RecipientsInput from './RecipientsInput';

function labelWithColon(label: string) {
  return `${label}:`;
}

export function CCFieldset() {
  const t = useT();
  const node = useNodeContext();
  const { token } = theme.useToken();
  const fieldsetStyle = {
    paddingBottom: token.marginXXL,
  };

  return (
    <div className="nb-workflow-cc-node-fieldset" style={fieldsetStyle}>
      <Form.Item
        name={['config', 'users']}
        label={labelWithColon(t('Recipients'))}
        required
        rules={[
          {
            validator: async (_rule, value) => {
              if (Array.isArray(value) && value.filter(Boolean).length > 0) {
                return;
              }
              throw new Error(t('The field value is required'));
            },
          },
        ]}
      >
        <RecipientsInput />
      </Form.Item>
      <Form.Item name={['config', 'ccUid']} label={labelWithColon(t('User interface'))}>
        <FlowModelConfigInput configKey="ccUid" kind="interface" legacyConfigKey="ccDetail" />
      </Form.Item>
      <Form.Item name={['config', 'taskCardUid']} label={labelWithColon(t('Task card'))}>
        <FlowModelConfigInput configKey="taskCardUid" kind="taskCard" />
      </Form.Item>
      <Form.Item
        label={labelWithColon(t('Task title'))}
        extra={t(
          'Title of each CC item in tasks center. Could use variables in string template. Default to node title.',
        )}
      >
        <Form.Item name={['config', 'title']} initialValue={node?.title} noStyle>
          <WorkflowVariableInput />
        </Form.Item>
      </Form.Item>
    </div>
  );
}

export default CCFieldset;
