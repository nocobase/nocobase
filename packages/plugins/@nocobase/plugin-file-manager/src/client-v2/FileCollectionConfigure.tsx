/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import type { CollectionTemplateConfigureItemProps } from '@nocobase/plugin-data-source-manager/client-v2';
import { useRequest } from 'ahooks';
import { Form, Select } from 'antd';
import React, { useMemo } from 'react';
import { useT } from './locale';

type StorageRecord = {
  name: string;
  title?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeStorageRecords(response: unknown): StorageRecord[] {
  const body = isRecord(response) ? response.data : undefined;
  const payload = isRecord(body) ? body.data : undefined;
  const records = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.data)
      ? payload.data
      : [];

  return records
    .filter(
      (record): record is Record<string, unknown> & { name: string } =>
        isRecord(record) && typeof record.name === 'string',
    )
    .map((record) => ({
      name: record.name,
      title: typeof record.title === 'string' ? record.title : undefined,
    }))
    .filter((record) => !!record.name);
}

export function FileCollectionStorageConfigureItem({ item }: CollectionTemplateConfigureItemProps) {
  const t = useT();
  const ctx = useFlowContext();
  const storageRequest = useRequest(async () => {
    const response = await ctx.api.resource('storages').list({
      paginate: false,
      sort: ['id'],
      appends: [],
    });
    return normalizeStorageRecords(response);
  });
  const options = useMemo(
    () =>
      (storageRequest.data || []).map((storage) => ({
        label: storage.title || storage.name,
        value: storage.name,
      })),
    [storageRequest.data],
  );

  return (
    <Form.Item
      name={item.name || 'storage'}
      label={t('File storage')}
      extra={t('Default storage will be used when not selected')}
      getValueFromEvent={(value: string | undefined) => value ?? null}
    >
      <Select
        aria-label={t('File storage')}
        allowClear
        showSearch
        optionFilterProp="label"
        loading={storageRequest.loading}
        options={options}
      />
    </Form.Item>
  );
}
