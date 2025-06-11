/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useEffect } from 'react';
import { Button, Form, FormProps, InputNumber, Radio, Space, Switch } from 'antd';
import { withDynamicSchemaProps } from '@nocobase/client';

import { useT } from './locale';

export interface SettingFormFieldType {
  consumeMode: string;
  disableMetaOp: boolean;
  workflowTaskDelay: number;
  useQueueForCreateWorkflow: boolean;
  stopAsyncTask: boolean;
}

export type SettingFormProps = FormProps<SettingFormFieldType>;

export function useConsumemodeOptions() {
  const t = useT();
  return [
    { label: t('only task consume'), value: 'task' },
    { label: t('app & task all not consume'), value: 'none' },
    { label: t('only app consume'), value: 'app' },
    { label: t('app & task consume'), value: 'both' },
  ];
}

export const SettingForm: FC<SettingFormProps> = withDynamicSchemaProps((props) => {
  const t = useT();
  const options = useConsumemodeOptions();

  return (
    <Form autoComplete="off" layout="vertical" {...props}>
      <Form.Item<SettingFormFieldType>
        label={t('Workflow consume mode')}
        name="consumeMode"
        tooltip={t('Only effective for asynchronous workflow tasks')}
      >
        <Radio.Group>
          <Space direction="vertical">
            {options.map(({ label, value }) => (
              <Radio value={value} key={value}>
                {label}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Form.Item>
      <Form.Item<SettingFormFieldType> label={t('Workflow task delay')} name="workflowTaskDelay">
        <InputNumber addonAfter={`ms`} />
      </Form.Item>
      <Form.Item<SettingFormFieldType>
        label={t('Use queue for create workflow')}
        name="useQueueForCreateWorkflow"
        tooltip={t('Whether to use the queue to create the workflow')}
      >
        <Switch checkedChildren={t('On')} unCheckedChildren={t('Off')} />
      </Form.Item>
      <Form.Item<SettingFormFieldType> label={t('Disable metadata operation')} name="disableMetaOp">
        <Switch checkedChildren={t('On')} unCheckedChildren={t('Off')} />
      </Form.Item>
      <Form.Item<SettingFormFieldType> label={t('Stop async task')} name="stopAsyncTask">
        <Switch checkedChildren={t('On')} unCheckedChildren={t('Off')} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {t('Submit')}
        </Button>
      </Form.Item>
    </Form>
  );
});
