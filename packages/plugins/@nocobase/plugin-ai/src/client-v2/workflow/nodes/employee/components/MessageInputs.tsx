/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form } from 'antd';
import { WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';
import { useT } from '../../../../locale';

export function MessageInputs() {
  const t = useT();

  return (
    <>
      <Form.Item
        name={['config', 'message', 'system']}
        label={t('Background')}
        tooltip={t('Additional system prompt appended to the AI employee’s definition, used to refine instructions')}
      >
        <WorkflowVariableTextArea rows={10} />
      </Form.Item>
      <Form.Item
        name={['config', 'message', 'user']}
        label={t('Default user message')}
        tooltip={t('Enter the specific task description')}
      >
        <WorkflowVariableTextArea rows={10} />
      </Form.Item>
    </>
  );
}

export default MessageInputs;
