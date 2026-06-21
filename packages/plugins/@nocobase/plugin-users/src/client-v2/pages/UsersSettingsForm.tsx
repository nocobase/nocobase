/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Button, Checkbox, Form, Space, Spin } from 'antd';
import React, { useEffect } from 'react';
import { useT } from '../locale';

interface UsersSettingsValues {
  enableEditProfile?: boolean;
  enableChangePassword?: boolean;
}

interface SettingsPayload {
  data?: UsersSettingsValues;
}

function toSettingsPayload(responseData: unknown): SettingsPayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  return responseData as SettingsPayload;
}

export default function UsersSettingsForm() {
  const ctx = useFlowContext();
  const t = useT();
  const [form] = Form.useForm<UsersSettingsValues>();

  const service = useRequest(async () => {
    const response = await ctx.api.resource('users').getSystemSettings();
    return toSettingsPayload(response?.data).data ?? {};
  });

  const submitService = useRequest(
    async (values: UsersSettingsValues) => {
      await ctx.api.resource('users').updateSystemSettings({ values });
    },
    {
      manual: true,
      onSuccess() {
        ctx.message.success(t('Saved successfully'));
        window.location.reload();
      },
    },
  );

  useEffect(() => {
    if (!service.data) {
      return;
    }
    form.setFieldsValue({
      enableChangePassword: service.data.enableChangePassword !== false,
      enableEditProfile: service.data.enableEditProfile !== false,
    });
  }, [form, service.data]);

  if (service.loading) {
    return <Spin />;
  }

  return (
    <Form<UsersSettingsValues>
      form={form}
      layout="vertical"
      onFinish={(values) => {
        submitService.run(values);
      }}
    >
      <Space direction="vertical">
        <Form.Item name="enableEditProfile" valuePropName="checked">
          <Checkbox>{t('Allow edit profile')}</Checkbox>
        </Form.Item>
        <Form.Item name="enableChangePassword" valuePropName="checked">
          <Checkbox>{t('Allow change password')}</Checkbox>
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={submitService.loading}>
          {t('Save')}
        </Button>
      </Space>
    </Form>
  );
}
