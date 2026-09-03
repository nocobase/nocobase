/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Checkbox, Form, Input, Space, Typography } from 'antd';
import { WorkflowVariableJsonTextArea } from '@nocobase/plugin-workflow/client-v2';
import { useT } from '../../../../locale';

export function StructuredOutput() {
  const t = useT();

  return (
    <>
      <Form.Item
        name={['config', 'structuredOutput', 'schema']}
        label={t('JSON Schema')}
        extra={
          <Space size={4}>
            <span>{t('Syntax references')}:</span>
            <Typography.Link href="https://json-schema.org" target="_blank" rel="noreferrer">
              JSON Schema
            </Typography.Link>
          </Space>
        }
      >
        <WorkflowVariableJsonTextArea json5 autoSize={{ minRows: 10 }} />
      </Form.Item>
      <Form.Item name={['config', 'structuredOutput', 'name']} label={t('Name')}>
        <Input />
      </Form.Item>
      <Form.Item name={['config', 'structuredOutput', 'description']} label={t('Description')}>
        <Input.TextArea />
      </Form.Item>
      <Form.Item name={['config', 'structuredOutput', 'strict']} valuePropName="checked">
        <Checkbox>{t('Strict')}</Checkbox>
      </Form.Item>
    </>
  );
}

export default StructuredOutput;
