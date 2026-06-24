/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Form, Space, Typography } from 'antd';
import { WorkflowVariableJsonTextArea } from '@nocobase/plugin-workflow/client-v2';
import { useT } from '../../../../locale';

export function StructuredOutput() {
  const t = useT();
  const defaultSchema = useMemo(
    () =>
      JSON.stringify(
        {
          type: 'object',
          properties: {
            result: {
              title: t('Response result'),
              type: 'string',
              description: 'The text message sent to the user',
            },
          },
        },
        null,
        2,
      ),
    [t],
  );

  return (
    <Form.Item
      name={['config', 'structuredOutput', 'schema']}
      label={t('Structured output')}
      tooltip={t('Define the data structure of the final output of the node')}
      initialValue={defaultSchema}
      rules={[{ required: true }]}
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
  );
}

export default StructuredOutput;
