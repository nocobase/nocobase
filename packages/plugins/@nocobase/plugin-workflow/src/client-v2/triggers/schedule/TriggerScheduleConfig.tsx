/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect } from '@nocobase/client-v2';
import { Alert, DatePicker, Form } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useFlowContext } from '@nocobase/flow-engine';
import { useCurrentWorkflowContext } from '../../canvas/contexts';
import { useT } from '../../locale';
import { ScheduleModeExecuteFields } from './ScheduleModes';
import { SCHEDULE_MODE } from './constants';
import { parseCollectionName } from './collectionUtils';

function ScheduleExecuteDatePicker({
  value,
  onChange,
  placeholder,
}: {
  value?: string | Date;
  onChange?: (value?: Date | null) => void;
  placeholder?: string;
}) {
  return (
    <DatePicker
      showTime
      value={value ? dayjs(value) : null}
      placeholder={placeholder}
      style={{ width: '100%' }}
      onChange={(nextValue) => onChange?.(nextValue ? nextValue.toDate() : null)}
    />
  );
}

function TriggerRecordSelect({ value, onChange }: { value?: unknown; onChange?: (value?: unknown) => void }) {
  const ctx = useFlowContext();
  const workflow = useCurrentWorkflowContext();
  const t = useT();
  const [dataSourceKey, collectionName] = parseCollectionName(workflow?.config?.collection) as [string, string];
  const dataSource = dataSourceKey ? ctx.dataSourceManager?.getDataSource?.(dataSourceKey) : null;
  const collection = dataSource?.collectionManager?.getCollection?.(collectionName);

  if (!dataSource) {
    return (
      <Alert
        type="warning"
        showIcon
        message={t('Data source "{{dataSourceName}}" not found.', { dataSourceName: dataSourceKey })}
      />
    );
  }

  if (!collection) {
    return (
      <Alert type="warning" showIcon message={t('Collection "{{collectionName}}" not found.', { collectionName })} />
    );
  }

  const filterTargetKey = collection?.filterTargetKey;
  const labelKey = collection?.titleCollectionField?.name || filterTargetKey;

  if (!filterTargetKey) {
    return null;
  }

  return (
    <RemoteSelect
      value={value}
      onChange={onChange}
      request={async () => {
        const response = await ctx.api
          .resource(collectionName, null, { 'x-data-source': dataSourceKey })
          .list({ pageSize: 50 });
        return response?.data?.data ?? [];
      }}
      mapOptions={(item) => {
        const rawLabel = item?.[labelKey] ?? item?.[filterTargetKey];
        return {
          label: typeof rawLabel === 'string' ? t(rawLabel) : rawLabel ?? t('Untitled'),
          value: item?.[filterTargetKey],
        };
      }}
      cacheKey={`workflow:schedule-trigger-records:${dataSourceKey}:${collectionName}`}
    />
  );
}

export function TriggerScheduleConfig() {
  const workflow = useCurrentWorkflowContext();
  const t = useT();
  const mode = workflow?.config?.mode;

  if (mode === SCHEDULE_MODE.DATE_FIELD) {
    const field = ScheduleModeExecuteFields[SCHEDULE_MODE.DATE_FIELD].data;
    return (
      <Form.Item
        name="data"
        label={t(field.title)}
        extra={field.description ? t(field.description) : undefined}
        rules={field.required ? [{ required: true }] : undefined}
      >
        <TriggerRecordSelect />
      </Form.Item>
    );
  }

  const field = ScheduleModeExecuteFields[SCHEDULE_MODE.STATIC].date;
  return (
    <Form.Item
      name="date"
      label={t(field.title)}
      initialValue={new Date()}
      rules={field.required ? [{ required: true }] : undefined}
    >
      <ScheduleExecuteDatePicker placeholder={field.placeholder ? t(field.placeholder) : undefined} />
    </Form.Item>
  );
}

export default TriggerScheduleConfig;
