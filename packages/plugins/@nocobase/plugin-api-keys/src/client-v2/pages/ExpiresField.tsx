/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useBoolean } from 'ahooks';
import { DatePicker, Select, Space } from 'antd';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import React from 'react';
import { useT } from '../locale';

dayjs.extend(isSameOrBefore);

export type ExpiresOption = { label: string; value: string };

const TOMORROW = () => dayjs().add(1, 'days');

/**
 * Convert a future `dayjs` date into the `Xd` shape persisted by the apiKeys
 * collection. Mirrors the v1 ExpiresSelect: zero out seconds/milliseconds on
 * both ends and report the day difference.
 */
export function diffToExpiresIn(target: dayjs.Dayjs, now: dayjs.Dayjs = dayjs()): string {
  const targetNorm = target.millisecond(0).second(0);
  const nowNorm = now.millisecond(0).second(0);
  return `${targetNorm.diff(nowNorm, 'd')}d`;
}

export function formatExpiresReadOnly(record: { expiresIn?: string; createdAt?: string }, neverLabel: string): string {
  if (record.expiresIn === 'never') return neverLabel;
  const days = parseInt(String(record.expiresIn ?? '').replace('d', ''), 10) || 0;
  if (!record.createdAt) return '';
  return dayjs(record.createdAt).add(days, 'days').format('YYYY-MM-DD HH:mm:ss');
}

export function ExpiresEditor(props: { value?: string; onChange?: (next: string) => void; options: ExpiresOption[] }) {
  const { value, onChange, options } = props;
  const [isCustom, { toggle: toggleShowDatePicker, setFalse }] = useBoolean(false);

  const onSelectChange = (v: string) => {
    if (v === 'custom') {
      onChange?.('1d');
      toggleShowDatePicker();
      return;
    }
    setFalse();
    onChange?.(v);
  };

  const onDatePickerChange = (next: dayjs.Dayjs | null) => {
    if (!next) return;
    onChange?.(diffToExpiresIn(next));
  };

  return (
    <Space style={{ width: '100%' }} styles={{ item: { flex: 1 } }}>
      <Select
        style={{ width: '100%' }}
        options={options}
        value={isCustom ? 'custom' : value}
        onChange={onSelectChange}
      />
      {isCustom ? (
        <DatePicker
          style={{ width: '100%' }}
          disabledDate={(date) => date.isSameOrBefore(dayjs())}
          defaultValue={TOMORROW()}
          onChange={onDatePickerChange}
          allowClear={false}
        />
      ) : null}
    </Space>
  );
}

export function useExpiresOptions(): ExpiresOption[] {
  const t = useT();
  return [
    { label: t('1 Day'), value: '1d' },
    { label: t('7 Days'), value: '7d' },
    { label: t('30 Days'), value: '30d' },
    { label: t('90 Days'), value: '90d' },
    { label: t('Custom'), value: 'custom' },
    { label: t('Never'), value: 'never' },
  ];
}
