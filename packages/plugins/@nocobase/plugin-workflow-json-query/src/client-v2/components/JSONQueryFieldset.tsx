/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space } from 'antd';
import {
  RadioWithTooltip,
  renderEngineReference,
  WorkflowVariableInput,
  WorkflowTypedVariableInput,
  type RadioWithTooltipOption,
} from '@nocobase/plugin-workflow/client-v2';

import { useT } from '../locale';

type JSONQueryEngine = {
  value: string;
  label: string;
  link: string;
};

const engines: JSONQueryEngine[] = [
  {
    value: 'jmespath',
    label: 'JMESPath',
    link: 'https://jmespath.org/',
  },
  {
    value: 'jsonpathplus',
    label: 'JSON Path Plus',
    link: 'https://jsonpath-plus.github.io/JSONPath/docs/ts/',
  },
  {
    value: 'jsonata',
    label: 'JSONata',
    link: 'https://jsonata.org/',
  },
];

const engineOptions: RadioWithTooltipOption[] = engines.map(({ value, label }) => ({ value, label }));

function renderJSONQueryEngineReference(engine: string | undefined, t: (text: string) => string) {
  const item = engines.find((option) => option.value === engine);

  if (!item) {
    return null;
  }

  return (
    renderEngineReference(item.value, t) ?? (
      <>
        {t('Syntax references')}:&nbsp;
        <a href={item.link} target="_blank" rel="noreferrer">
          {item.label}
        </a>
      </>
    )
  );
}

export function JSONQueryFieldset() {
  const t = useT();
  const form = Form.useFormInstance();
  const engine = Form.useWatch(['config', 'engine']) ?? 'jmespath';

  useEffect(() => {
    if (typeof form.getFieldValue(['config', 'engine']) === 'undefined') {
      form.setFieldValue(['config', 'engine'], 'jmespath');
    }
  }, [form]);

  return (
    <>
      <Form.Item name={['config', 'engine']} label={t('Query engine')} rules={[{ required: true }]}>
        <RadioWithTooltip options={engineOptions} />
      </Form.Item>

      <Form.Item name={['config', 'source']} label={t('Data source')} rules={[{ required: true }]}>
        <WorkflowTypedVariableInput types={[]} />
      </Form.Item>

      <Form.Item
        name={['config', 'expression']}
        label={t('Query expression')}
        rules={[{ required: true }]}
        extra={renderJSONQueryEngineReference(engine, t)}
      >
        <WorkflowVariableInput />
      </Form.Item>

      <Form.Item
        label={t('Properties mapping')}
        extra={t(
          'If the type of query result is object or array of object, could map the properties which to be accessed in subsequent nodes.',
        )}
      >
        <Form.List name={['config', 'model']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} align="baseline">
                  <Form.Item name={[field.name, 'path']} rules={[{ required: true }]}>
                    <Input placeholder={t('Property key')} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'alias']}>
                    <Input placeholder={t('Alias')} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'label']} rules={[{ required: true }]}>
                    <Input placeholder={t('Display label')} />
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
              <Form.Item>
                <Button icon={<PlusOutlined />} size="small" type="dashed" onClick={() => add({})}>
                  {t('Add property')}
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form.Item>
    </>
  );
}

export default JSONQueryFieldset;
