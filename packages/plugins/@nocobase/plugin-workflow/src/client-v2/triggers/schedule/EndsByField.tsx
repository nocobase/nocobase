/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useWorkflowTranslation } from '../../locale';
import { OnField, type ScheduleOnFieldValue } from './OnField';

type EndsByValue = string | Date | ScheduleOnFieldValue | null;

export function EndsByField({
  collection,
  value,
  onChange,
}: {
  collection?: string;
  value?: EndsByValue;
  onChange?: (value: EndsByValue) => void;
}) {
  const { t } = useWorkflowTranslation();
  const type = value != null ? (typeof value === 'object' && !(value instanceof Date) ? 'field' : 'date') : null;
  const emitChange = (nextValue: EndsByValue) => onChange?.(nextValue);
  return (
    <fieldset
      className={css`
        display: flex;
        gap: 0.5em;
      `}
    >
      <Select
        value={type}
        onChange={(nextType) => {
          emitChange(nextType ? (nextType === 'field' ? {} : new Date()) : null);
        }}
        className="auto-width"
      >
        <Select.Option value={null}>{t('No end')}</Select.Option>
        <Select.Option value={'field'}>{t('By field')}</Select.Option>
        <Select.Option value={'date'}>{t('By custom date')}</Select.Option>
      </Select>
      {type === 'field' ? (
        <OnField collection={collection} value={value as ScheduleOnFieldValue} onChange={onChange} />
      ) : null}
      {type === 'date' ? (
        <DatePicker
          showTime
          value={dayjs(value as string | Date)}
          onChange={(v) => {
            emitChange(v ? v.toDate() : null);
          }}
        />
      ) : null}
    </fieldset>
  );
}

export default EndsByField;
