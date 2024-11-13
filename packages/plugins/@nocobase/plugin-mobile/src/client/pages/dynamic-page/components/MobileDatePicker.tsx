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
      ...rest
    } = props;
    const [visible, setVisible] = useState(false);
    const [selectedTime, setSelectedTime] = useState(['00', '00', '00']);

    // 性能优化：使用 useCallback 缓存函数
    const handleConfirm = useCallback(
      (value) => {
        setVisible(false);
        const selectedDateTime = new Date(value);
        onChange(selectedDateTime);
      },
      [selectedTime, showTime, onChange],
    );

    // 清空选择的日期和时间
    const handleClear = useCallback(() => {
      setSelectedTime(['00', '00', '00']);
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
            {...rest}
            popupStyle={{ display: 'none' }}
            style={{ pointerEvents: 'none', width: '100%' }}
          />
        </div>
        <DatePicker
          visible={visible}
          onClose={() => {
            setVisible(false);
          }}
          precision={showTime ? 'second' : picker === 'date' ? 'day' : picker}
          renderLabel={labelRenderer}
          min={new Date(1000, 0, 1)}
          max={new Date(9999, 11, 31)}
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

export { MobileDateTimePicker };
