/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useCallback } from 'react';
import { DatePicker } from 'antd-mobile';
import { mapDatePicker, DatePicker as NBDatePicker } from '@nocobase/client';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { useTranslation } from 'react-i18next';

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

const MobileDateTimePicker = connect(
  (props) => {
    const { t } = useTranslation();
    const {
      value,
      onChange,
      dateFormat = 'YYYY-MM-DD',
      timeFormat = 'HH:mm',
      showTime = false,
      picker,
      ...others
    } = props;
    const [visible, setVisible] = useState(false);

    // 性能优化：使用 useCallback 缓存函数
    const handleConfirm = useCallback(
      (value) => {
        setVisible(false);
        const selectedDateTime = new Date(value);
        onChange(selectedDateTime);
      },
      [showTime, onChange],
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
    return (
      <>
        <div contentEditable="false" onClick={() => setVisible(true)}>
          <NBDatePicker
            onClick={() => setVisible(true)}
            value={value}
            picker={picker}
            {...others}
            popupStyle={{ display: 'none' }}
            style={{ pointerEvents: 'none', width: '100%' }}
          />
        </div>
        <DatePicker
          {...others}
          cancelText={t('Cancel')}
          confirmText={t('Confirm')}
          visible={visible}
          title={<a onClick={handleClear}>{t('Clear')}</a>}
          onClose={() => {
            setVisible(false);
          }}
          precision={showTime ? getPrecision(timeFormat) : picker === 'date' ? 'day' : picker}
          renderLabel={labelRenderer}
          min={others.min || new Date(1000, 0, 1)}
          max={others.max || new Date(9999, 11, 31)}
          onConfirm={(val) => {
            handleConfirm(val);
          }}
        />
      </>
    );
  },
  mapProps(mapDatePicker()),
  mapReadPretty(NBDatePicker.ReadPretty),
);

const MobileRangePicker = (props) => {
  const [startDate, setStartDate] = useState(props.value?.[0]);
  const [endDate, setEndDate] = useState(props.value?.[1]);
  const { t } = useTranslation();

  const handleStartDateChange = (value) => {
    const selectedDateTime = new Date(value);
    props.onChange([selectedDateTime, props.value?.[1]]);
    setStartDate(selectedDateTime);
    if (endDate && value > endDate) {
      setEndDate(null); // 重置结束日期
    }
  };

  const handleEndDateChange = (value) => {
    const selectedDateTime = new Date(value);
    props.onChange([props.value?.[0], selectedDateTime]);
    setEndDate(selectedDateTime);
  };
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}
    >
      <div style={{ flex: 1, marginRight: '8px' }}>
        <MobileDateTimePicker
          {...props}
          value={startDate}
          max={endDate}
          onChange={handleStartDateChange}
          style={{ width: '100%' }}
          placeholder={t('Start date')}
        />
      </div>
      <span
        style={{
          margin: '0px',
          fontSize: '16px',
          color: '#333',
        }}
      >
        ~
      </span>
      <div style={{ flex: 1, marginLeft: '8px' }}>
        <MobileDateTimePicker
          {...props}
          value={endDate}
          min={startDate}
          onChange={handleEndDateChange}
          style={{ width: '100%' }}
          placeholder={t('End date')}
        />
      </div>
    </div>
  );
};

export { MobileDateTimePicker, MobileRangePicker };
