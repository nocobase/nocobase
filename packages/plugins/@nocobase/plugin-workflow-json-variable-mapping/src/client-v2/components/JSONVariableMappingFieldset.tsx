/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Popconfirm, Space } from 'antd';
import { JsonTextArea } from '@nocobase/client-v2';
import { WorkflowVariableSelect } from '@nocobase/plugin-workflow/client-v2';

import { useT } from '../locale';
import { parseJsonVariables } from '../utils/parseJsonVariables';

export function JSONVariableMappingFieldset() {
  const form = Form.useFormInstance();
  const t = useT();
  const variables = Form.useWatch(['config', 'variables'], form) ?? [];

  const handleParse = useCallback(() => {
    const example = form.getFieldValue(['config', 'example']);
    const parseArray = Boolean(form.getFieldValue(['config', 'parseArray']));
    form.setFieldValue(['config', 'variables'], parseJsonVariables(example, parseArray));
  }, [form]);

  const handleClear = useCallback(() => {
    form.setFieldValue(['config', 'variables'], []);
  }, [form]);

  return (
    <>
      <Form.Item name={['config', 'dataSource']} label={t('JSON data source')} rules={[{ required: true }]}>
        <WorkflowVariableSelect />
      </Form.Item>

      <Form.Item name={['config', 'example']} label={t('Input example')}>
        <JsonTextArea
          placeholder={t('Please input JSON example like { "key1": "item1", "key2": "item2" }')}
          autoSize={{ minRows: 5, maxRows: 10 }}
        />
      </Form.Item>

      <Form.Item
        name={['config', 'parseArray']}
        valuePropName="checked"
        extra={t(
          'If the JSON object contains array items, parse them. eg: { "arrayKey": [ "item1", "item2" ] will be parsed as "arrayKey", "arrayKey.0", "arrayKey.1", if set to false, only "arrayKey" will be parsed.',
        )}
      >
        <Checkbox>{t('Include array index in path')}</Checkbox>
      </Form.Item>

      <Form.Item extra={t('Please update other node references to the key after clicking the parse button.')}>
        <Space>
          <Button size="small" onClick={handleParse}>
            {t('Parse')}
          </Button>
          <Popconfirm
            title={t('Delete items')}
            description={t('Are you sure to clear below items?')}
            onConfirm={handleClear}
          >
            <Button size="small" disabled={variables.length === 0}>
              {t('Clear below items')}
            </Button>
          </Popconfirm>
        </Space>
      </Form.Item>

      <Form.List name={['config', 'variables']}>
        {(fields, { remove }) => (
          <>
            {fields.map((field) => (
              <Space key={field.key} align="baseline">
                <Form.Item name={[field.name, 'path']}>
                  <Input disabled placeholder={t('Key path')} />
                </Form.Item>
                <Form.Item name={[field.name, 'alias']}>
                  <Input placeholder={t('Alias')} />
                </Form.Item>
                <Form.Item>
                  <Button
                    aria-label={t('Delete')}
                    icon={<DeleteOutlined />}
                    size="small"
                    type="text"
                    onClick={() => remove(field.name)}
                  />
                </Form.Item>
              </Space>
            ))}
          </>
        )}
      </Form.List>
    </>
  );
}

export default JSONVariableMappingFieldset;
