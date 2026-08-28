/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert, Form, Space } from 'antd';
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';

import { useT } from '../../locale';

export function ResponseMessageFieldset() {
  const t = useT();

  return (
    <>
      <Form.Item name={['config', 'message']} label={t('Message content')} extra={t('Supports variables in template.')}>
        <WorkflowVariableInput />
      </Form.Item>
      <Space direction="vertical">
        <Alert
          type="success"
          showIcon
          description={t(
            'If the workflow ends normally, the response message will return a success status by default.',
          )}
        />
        <Alert
          type="error"
          showIcon
          description={t(
            'If you want to return a failure status, please add an "End Process" node downstream to terminate the workflow.',
          )}
        />
      </Space>
    </>
  );
}
