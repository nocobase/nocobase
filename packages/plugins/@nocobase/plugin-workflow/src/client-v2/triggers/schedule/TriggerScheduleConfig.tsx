/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, DatePicker, Form } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useCurrentWorkflowContext } from '../../canvas/contexts';
import { TriggerCollectionRecordSelect } from '../../components/collection';
import { useT } from '../../locale';
import { ScheduleModeExecuteFields } from './ScheduleModes';
import { SCHEDULE_MODE } from './constants';

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
        <TriggerCollectionRecordSelect />
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
