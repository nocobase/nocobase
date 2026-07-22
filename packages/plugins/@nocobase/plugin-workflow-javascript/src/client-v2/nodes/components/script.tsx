/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, ConfigProvider, Form, Input, InputNumber, Space, theme } from 'antd';
import { TypedVariableInput } from '@nocobase/client-v2';
import { useWorkflowVariableOptions } from '@nocobase/plugin-workflow/client-v2';
import { css } from '@emotion/css';
import React, { useMemo } from 'react';

import CodeEditor from '../../components/CodeEditor';
import { useT } from '../../locale';
import {
  SCRIPT_ARGUMENT_NAME_REGEXP,
  SCRIPT_ARGUMENT_VALUE_TYPES,
  SCRIPT_DEFAULT_CONFIG,
  type ScriptArgumentConfig,
} from '../shared';

function ScriptDescription() {
  const t = useT();

  return (
    <span>
      {t('Node.js features supported can be found in the documentaion: ')}
      <a href={t('https://docs.nocobase.com/handbook/workflow-javascript')} target="_blank" rel="noreferrer">
        {t('JavaScript node')}
      </a>
    </span>
  );
}

function validateArgumentName(
  name: string | undefined,
  index: number,
  args: ScriptArgumentConfig[],
  t: ReturnType<typeof useT>,
) {
  if (!name || !SCRIPT_ARGUMENT_NAME_REGEXP.test(name)) {
    return Promise.reject(new Error(t('Argument name is invalid')));
  }

  if (args.filter((item, itemIndex) => item?.name === name && itemIndex !== index).length > 0) {
    return Promise.reject(new Error(t('Argument name duplicated')));
  }

  return Promise.resolve();
}

export function ScriptFieldset() {
  const t = useT();
  const { token } = theme.useToken();
  const { componentDisabled } = ConfigProvider.useConfig();
  const form = Form.useFormInstance();
  const metaTree = useWorkflowVariableOptions();
  const argumentValueTypes = useMemo(() => SCRIPT_ARGUMENT_VALUE_TYPES, []);
  const disabled = Boolean(componentDisabled);
  const argumentRowClassName = useMemo(
    () => css`
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
      gap: ${token.marginSM}px;
    `,
    [token.marginSM],
  );

  return (
    <>
      <Form.Item label={t('Arguments')} extra={t('The arguments that will be used in script with same name.')}>
        <Form.List name={['config', 'arguments']}>
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ display: 'flex', width: '100%' }}>
              {fields.map((field) => (
                <div key={field.key} className={argumentRowClassName}>
                  <Form.Item
                    name={[field.name, 'name']}
                    rules={[
                      {
                        validator: async (_, value: string | undefined) => {
                          const args = (form.getFieldValue(['config', 'arguments']) ?? []) as ScriptArgumentConfig[];
                          await validateArgumentName(value, field.name, args, t);
                        },
                      },
                    ]}
                  >
                    <Input placeholder={t('Name')} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'value']}>
                    <TypedVariableInput
                      disabled={disabled}
                      metaTree={metaTree}
                      types={argumentValueTypes}
                      placeholder={t('Value')}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Button
                    aria-label={t('Delete')}
                    disabled={disabled}
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                    type="text"
                  />
                </div>
              ))}
              <Button disabled={disabled} icon={<PlusOutlined />} onClick={() => add({ value: '' })} type="dashed">
                {t('Add argument')}
              </Button>
            </Space>
          )}
        </Form.List>
      </Form.Item>

      <Form.Item
        label={t('Script content')}
        name={['config', 'content']}
        initialValue={SCRIPT_DEFAULT_CONFIG.content}
        extra={<ScriptDescription />}
      >
        <CodeEditor disabled={disabled} />
      </Form.Item>

      <Form.Item
        label={t('Timeout')}
        name={['config', 'timeout']}
        initialValue={SCRIPT_DEFAULT_CONFIG.timeout}
        extra={t('The maximum execution time of the script. 0 means no timeout.')}
      >
        <InputNumber min={0} precision={0} addonAfter={t('Milliseconds')} style={{ width: '50%' }} />
      </Form.Item>

      <Form.Item name={['config', 'continue']} valuePropName="checked" initialValue={SCRIPT_DEFAULT_CONFIG.continue}>
        <Checkbox>{t('Continue when exception thrown')}</Checkbox>
      </Form.Item>
    </>
  );
}

export default ScriptFieldset;
