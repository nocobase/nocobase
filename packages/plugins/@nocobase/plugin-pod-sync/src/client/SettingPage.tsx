/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Alert, Card, Form, Modal, notification, Space, Typography, App } from 'antd';

import { SettingForm, SettingFormProps, SettingFormFieldType, useConsumemodeOptions } from './SettingForm';
import { SystemManagementProvider, useSystemManagementContext } from './SystemManagementProvider';
import { useT } from './locale';

const { Text } = Typography;

export const SettingTips = () => {
  const t = useT();
  return <Alert type="warning" style={{ marginBottom: '10px', whiteSpace: 'pre-line' }} message={t('Setting Tips')} />;
};

function useSettingFormProps(): SettingFormProps {
  const { data, setConfig } = useSystemManagementContext();
  const t = useT();
  const [form] = Form.useForm();
  const { modal } = App.useApp();

  useEffect(() => {
    form.setFieldsValue(data);
  }, [data, form]);

  const options = useConsumemodeOptions();

  const onFinish = async (values: SettingFormFieldType) => {
    const { consumeMode, disableMetaOp, workflowTaskDelay, useQueueForCreateWorkflow, stopAsyncTask } = values;
    const { label = '' } = options.find((option) => option.value === consumeMode) || {};

    modal.confirm({
      title: t('Are you sure you want to save the settings?'),
      content: (
        <Space direction="vertical">
          <Space>
            <Text>{`${t('Workflow consume mode')}`}</Text>
            <Text type="danger">{label}</Text>
          </Space>
          <Space>
            <Text>{`${t('Disable metadata operation')}`}</Text>
            <Text type="danger">{`${t(disableMetaOp ? 'enable' : 'disable')}`}</Text>
          </Space>
          <Space>
            <Text>{`${t('Use queue for create workflow')}`}</Text>
            <Text type="danger">{`${t(useQueueForCreateWorkflow ? 'enable' : 'disable')}`}</Text>
          </Space>
          <Space>
            <Text>{`${t('Workflow task delay')}`}</Text>
            <Text type="danger">{`${workflowTaskDelay}ms`}</Text>
          </Space>
          <Space>
            <Text>{`${t('Stop async task')}`}</Text>
            <Text type="danger">{`${t(stopAsyncTask ? 'enable' : 'disable')}`}</Text>
          </Space>
        </Space>
      ),
      async onOk() {
        await setConfig(values);
        notification.success({
          message: t('Save successfully!'),
        });
      },
      onCancel() {},
    });
  };

  return {
    initialValues: data,
    preserve: true,
    onFinish,
    form,
  };
}

const SettingPage = () => {
  const { loading } = useSystemManagementContext();
  const settingFormProps = useSettingFormProps();
  return (
    <Card loading={loading}>
      <SettingForm {...settingFormProps} />
    </Card>
  );
};

export default () => {
  return (
    <SystemManagementProvider>
      <SettingTips />
      <SettingPage />
    </SystemManagementProvider>
  );
};
