/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowModelContext } from '@nocobase/flow-engine';
import { dayjs } from '@nocobase/utils/client';
import { DatePicker } from 'antd';
import { DatePicker as AntdMobileDatePicker } from 'antd-mobile';
import React from 'react';
import { useCallback, useState } from 'react';

export const MobileDatePicker = (props) => {
  const {
    value,
    onChange,
    dateFormat = 'YYYY-MM-DD',
    timeFormat = 'HH:mm',
    showTime = false,
    picker,
    disabled,
    dateOnly,
    utc,
    minDate: min,
    maxDate: max,
    ...rest
  } = props;
  const [visible, setVisible] = useState(false);
  const ctx = useFlowModelContext();
  const t = ctx.t;
  const handleConfirm = useCallback(
    (value) => {
      setVisible(false);
      onChange(dayjs(value));
    },
    [onChange],
  );

  // 清空选择的日期和时间
  const handleClear = useCallback(() => {
    setVisible(false);
    onChange(null);
  }, [onChange]);

  const labelRenderer = useCallback((type: string, data: number) => {
    switch (type) {
      case 'year':
        return data;
      case 'quarter':
        return data;
      default:
        return data;
    }
  }, []);
  // Convert dayjs min/max to native Date for Antd Mobile Picker
  const minDate = min ? (min as any).toDate() : new Date(1950, 0, 1);
  const maxDate = max ? (max as any).toDate() : new Date(2050, 11, 31);

  return (
    <>
      <div onClick={() => !disabled && setVisible(true)}>
        <DatePicker
          onClick={() => setVisible(true)}
          value={value}
          picker={picker}
          disabled={disabled}
          {...rest}
          popupStyle={{ display: 'none' }}
          style={{ pointerEvents: 'none', width: '100%' }}
        />
      </div>
      <AntdMobileDatePicker
        {...rest}
        cancelText={t('Cancel')}
        confirmText={t('Confirm')}
        visible={visible}
        title={<a onClick={handleClear}>{t('Clear')}</a>}
        onClose={() => {
          setVisible(false);
        }}
        precision={showTime && picker === 'date' ? getPrecision(timeFormat) : picker === 'date' ? 'day' : picker}
        renderLabel={labelRenderer}
        min={minDate}
        max={maxDate}
        onConfirm={(val) => {
          handleConfirm(val);
        }}
      />
    </>
  );
};

function getPrecision(timeFormat: string): 'hour' | 'minute' | 'second' {
  const lowerFormat = timeFormat.toLowerCase();

  if (/\bss?\b/.test(lowerFormat)) {
    return 'second';
  } else if (/\bmm?\b/.test(lowerFormat)) {
    return 'minute';
  } else if (/\bhh?\b/.test(lowerFormat)) {
    return 'hour';
  } else {
    throw new Error('Invalid time format');
  }
}
