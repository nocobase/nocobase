/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Button, Checkbox, Flex, Form, Input } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';
import { Trans } from 'react-i18next';
import { NAMESPACE, useT } from '../locale';
import { SqlDataSourceSelect } from './SqlDataSourceSelect';
import { SqlEditor } from './SqlEditor';
import { UnsafeInjectionWarning } from './UnsafeInjectionWarning';

function SQLDescription() {
  return (
    <Trans ns={NAMESPACE}>
      {'SQL query result could be used through '}
      <a href="https://docs-cn.nocobase.com/handbook/workflow-json-query" target="_blank" rel="noreferrer">
        {'JSON query node'}
      </a>
      {'.'}
    </Trans>
  );
}

function SQLParametersField() {
  const t = useT();
  const form = Form.useFormInstance();
  const watchedUnsafeInjection = Form.useWatch(['config', 'unsafeInjection'], form);
  const unsafeInjection = watchedUnsafeInjection ?? form.getFieldValue(['config', 'unsafeInjection']);

  if (unsafeInjection) {
    return null;
  }

  return (
    <Form.Item
      label={t('Parameters')}
      extra={t('SQL parameters. Use :name as placeholders in SQL and provide values here.')}
    >
      <Form.List name={['config', 'variables']}>
        {(fields, { add, remove }) => (
          <Flex vertical gap="small">
            {fields.map((field) => (
              <Flex key={field.key} gap="small" align="baseline">
                <Form.Item
                  name={[field.name, 'name']}
                  rules={[{ required: true, message: t('Name') }]}
                  validateTrigger={['onBlur', 'onSubmit']}
                  style={{ flex: '1 1 0' }}
                >
                  <Input placeholder={t('Name')} />
                </Form.Item>
                <Form.Item
                  name={[field.name, 'value']}
                  rules={[{ required: true, message: t('Value') }]}
                  validateTrigger={['onBlur', 'onSubmit']}
                  style={{ flex: '2 1 0' }}
                >
                  <WorkflowVariableInput placeholder={t('Value')} style={{ width: '100%' }} />
                </Form.Item>
                <Button
                  type="text"
                  icon={<MinusCircleOutlined />}
                  aria-label={t('Remove parameter')}
                  onClick={() => remove(field.name)}
                />
              </Flex>
            ))}
            <Button block type="dashed" icon={<PlusOutlined />} onClick={() => add()}>
              {t('Add parameter')}
            </Button>
          </Flex>
        )}
      </Form.List>
    </Form.Item>
  );
}

export function SQLFieldset() {
  const t = useT();
  const form = Form.useFormInstance();
  const watchedUnsafeInjection = Form.useWatch(['config', 'unsafeInjection'], form);
  const unsafeInjection = watchedUnsafeInjection ?? form.getFieldValue(['config', 'unsafeInjection']);

  useEffect(() => {
    if (typeof form.getFieldValue(['config', 'dataSource']) === 'undefined') {
      form.setFieldValue(['config', 'dataSource'], 'main');
    }
  }, [form]);

  return (
    <>
      <Form.Item
        name={['config', 'dataSource']}
        label={t('Data source')}
        extra={t('Select a data source to execute SQL.')}
        rules={[{ required: true, message: t('Data source') }]}
      >
        <SqlDataSourceSelect />
      </Form.Item>

      <Form.Item noStyle shouldUpdate>
        {() => <UnsafeInjectionWarning />}
      </Form.Item>

      <Form.Item name={['config', 'sql']} label="SQL" extra={<SQLDescription />} rules={[{ required: true }]}>
        <SqlEditor unsafeInjection={unsafeInjection} />
      </Form.Item>

      <SQLParametersField />

      <Form.Item name={['config', 'withMeta']} valuePropName="checked">
        <Checkbox>{t('Include meta information of this query in result')}</Checkbox>
      </Form.Item>
    </>
  );
}

export default SQLFieldset;
