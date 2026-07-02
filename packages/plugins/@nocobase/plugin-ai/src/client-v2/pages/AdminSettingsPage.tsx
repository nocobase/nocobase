/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Select, Spin } from 'antd';
import { useApp } from '@nocobase/client-v2';
import { useT } from '../locale';

type APIResponse = {
  data?: {
    data?: unknown;
  };
};

type ResourceAction = (params?: Record<string, unknown>) => Promise<unknown>;

type APIClientLike = {
  resource: (name: string) => Record<string, unknown>;
};

export type AdminSettingsValues = {
  storage?: string;
};

export type StorageOption = {
  label: string;
  value: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isResourceAction = (value: unknown): value is ResourceAction => typeof value === 'function';

const readData = (response: unknown): unknown => {
  if (!isRecord(response)) {
    return undefined;
  }
  return (response as APIResponse).data?.data;
};

const isAdminSettingsValues = (value: unknown): value is AdminSettingsValues =>
  isRecord(value) && (value.storage === undefined || typeof value.storage === 'string');

const isStorageOption = (value: unknown): value is StorageOption =>
  isRecord(value) && typeof value.label === 'string' && typeof value.value === 'string';

const callResourceAction = async (
  apiClient: APIClientLike,
  resourceName: string,
  actionName: string,
  params?: Record<string, unknown>,
): Promise<unknown> => {
  const resource = apiClient.resource(resourceName);
  const action = resource[actionName];
  if (!isResourceAction(action)) {
    throw new Error(`Missing resource action: ${resourceName}.${actionName}`);
  }
  return action(params);
};

export async function loadAdminSettings(apiClient: APIClientLike): Promise<AdminSettingsValues> {
  const response = await callResourceAction(apiClient, 'aiSettings', 'get');
  const data = readData(response);
  return isAdminSettingsValues(data) ? data : {};
}

export async function listStorageOptions(apiClient: APIClientLike): Promise<StorageOption[]> {
  const response = await callResourceAction(apiClient, 'aiSettings', 'listStorages');
  const data = readData(response);
  return Array.isArray(data) ? data.filter(isStorageOption) : [];
}

export async function saveAdminSettings(apiClient: APIClientLike, values: AdminSettingsValues) {
  await callResourceAction(apiClient, 'aiSettings', 'update', {
    values,
    filterByTk: 1,
  });
}

export const AdminSettingsPage: React.FC = () => {
  const app = useApp();
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<AdminSettingsValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storages, setStorages] = useState<StorageOption[]>([]);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setLoading(true);
      try {
        const [settings, storageOptions] = await Promise.all([
          loadAdminSettings(app.apiClient),
          listStorageOptions(app.apiClient),
        ]);
        if (ignore) {
          return;
        }
        form.setFieldsValue({
          storage: settings.storage ?? 'local',
        });
        setStorages(storageOptions);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load().catch((error: unknown) => {
      if (!ignore) {
        console.error(error);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [app.apiClient, form]);

  const handleFinish = async (values: AdminSettingsValues) => {
    setSaving(true);
    try {
      await saveAdminSettings(app.apiClient, values);
      message.success(t('Saved successfully'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="storage" label={t('Files storage')} initialValue="local">
            <Select options={storages} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              {t('Save')}
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default AdminSettingsPage;
