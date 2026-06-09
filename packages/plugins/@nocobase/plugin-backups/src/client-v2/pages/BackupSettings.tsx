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
import { App, Button, Card, Checkbox, Form, Input, InputNumber, Select, Space, Switch } from 'antd';
import React, { useMemo, useState } from 'react';
import { useT } from '../locale';

type BackupSettingsValues = {
  scheduled?: boolean;
  cron?: string;
  keep?: number;
  storageId?: string | number;
  enableFilesBackup?: boolean;
  encryptionPassword?: string;
};

type BackupSettingsRecord = BackupSettingsValues & {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
};

type StorageRecord = {
  id: string | number;
  title?: string;
  name?: string;
  type?: string;
};

type ResourceResponse<T> = {
  data?: T;
};

const DEFAULT_FORM_VALUES: BackupSettingsValues = {
  scheduled: false,
  cron: '0 0 * * *',
  keep: 1,
  enableFilesBackup: false,
};

const BackupSettings = () => {
  const ctx = useFlowContext();
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<BackupSettingsValues>();
  const [submitting, setSubmitting] = useState(false);
  const scheduled = Form.useWatch('scheduled', form);

  const settingsRequest = useRequest<BackupSettingsRecord | undefined, []>(
    async () => {
      const response = await ctx.api.request<ResourceResponse<BackupSettingsRecord>>({
        url: 'backupSettings:get/1',
      });

      return response.data?.data;
    },
    {
      onSuccess: (values) => {
        form.setFieldsValue({
          ...DEFAULT_FORM_VALUES,
          ...values,
        });
      },
    },
  );

  const storagesRequest = useRequest<StorageRecord[], []>(async () => {
    const response = await ctx.api.request<ResourceResponse<StorageRecord[]>>({
      url: 'storages:list',
    });
    const storages = response.data?.data ?? [];

    return storages.filter((storage) => storage.type !== 'local');
  });

  const storageOptions = useMemo(
    () =>
      (storagesRequest.data ?? []).map((storage) => ({
        label: storage.title ?? storage.name ?? String(storage.id),
        value: storage.id,
      })),
    [storagesRequest.data],
  );

  const handleSubmit = async () => {
    const formValues = await form.validateFields();
    const values = {
      ...settingsRequest.data,
      ...formValues,
    };

    setSubmitting(true);
    try {
      await ctx.api.request({
        url: 'backupSettings:update/1',
        method: 'post',
        data: values,
      });
      settingsRequest.mutate(values);
      message.success(t('Saved successfully'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <Form<BackupSettingsValues>
        form={form}
        layout="vertical"
        initialValues={DEFAULT_FORM_VALUES}
        disabled={settingsRequest.loading}
      >
        <Form.Item label={t('Automatic backup')}>
          <Space direction="vertical">
            <Form.Item name="scheduled" valuePropName="checked" noStyle>
              <Checkbox>{t('Run automatic backup on the cron schedule')}</Checkbox>
            </Form.Item>
            <Form.Item
              name="cron"
              rules={[{ required: !!scheduled, message: t('The field value is required') }]}
              noStyle
            >
              <Input disabled={!scheduled} placeholder="0 0 * * *" />
            </Form.Item>
          </Space>
        </Form.Item>

        <Form.Item
          name="keep"
          label={t('Maximum number of backups')}
          tooltip={t('The maximum number of backups to keep, older backups are automatically deleted.')}
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <InputNumber min={1} />
        </Form.Item>

        <Form.Item name="storageId" label={t('Sync backups to cloud storage')}>
          <Select
            allowClear
            loading={storagesRequest.loading}
            options={storageOptions}
            onDropdownVisibleChange={(open) => {
              if (open) {
                storagesRequest.refresh();
              }
            }}
          />
        </Form.Item>

        <Form.Item name="enableFilesBackup" label={t('Backup local storage files')} valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item
          name="encryptionPassword"
          label={t('Restore password')}
          tooltip={t('If a restore password is set, it must be entered when restoring the backup.')}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            {t('Submit')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BackupSettings;
