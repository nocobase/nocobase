/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button, DatePickerView, Popup, Picker } from 'antd-mobile';
import { mapDatePicker, DatePicker } from '@nocobase/client';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { useTranslation } from 'react-i18next';

// 提升性能：将固定数组移出组件，避免每次渲染时重新创建
const hours = Array.from({ length: 24 }, (_, i) => ({
  label: i.toString().padStart(2, '0'),
  value: i.toString().padStart(2, '0'),
}));

const minutes = Array.from({ length: 60 }, (_, i) => ({
  label: i.toString().padStart(2, '0'),
  value: i.toString().padStart(2, '0'),
}));

const seconds = Array.from({ length: 60 }, (_, i) => ({
  label: i.toString().padStart(2, '0'),
  value: i.toString().padStart(2, '0'),
}));

const MobileDateTimePicker = connect(
  (props) => {
    const { t } = useTranslation();
    const { value, onChange, dateFormat = 'YYYY-MM-DD', timeFormat = 'HH:mm', showTime = false, ...rest } = props;
    const [visible, setVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value || new Date());
    const [selectedTime, setSelectedTime] = useState(['00', '00', '00']);

    // 性能优化：使用 useCallback 缓存函数
    const handleConfirm = useCallback(() => {
      setVisible(false);
      const selectedDateTime = new Date(selectedDate);
      if (showTime) {
        selectedDateTime.setHours(Number(selectedTime[0]));
        selectedDateTime.setMinutes(Number(selectedTime[1]));
        selectedDateTime.setSeconds(Number(selectedTime[2]));
      }
      onChange(selectedDateTime);
    }, [selectedDate, selectedTime, showTime, onChange]);

    // 清空选择的日期和时间
    const handleClear = useCallback(() => {
      setSelectedTime(['00', '00', '00']);
      setVisible(false);
      onChange(null);
    }, [onChange]);

    return (
      <>
        <div contentEditable="false" onClick={() => setVisible(true)}>
          <DatePicker
            onClick={() => setVisible(true)}
            value={value}
            {...rest}
            popupStyle={{ display: 'none' }}
            style={{ pointerEvents: 'none', width: '100%' }}
          />
        </div>

        <Popup visible={visible} onMaskClick={() => setVisible(false)} destroyOnClose bodyStyle={{ padding: '16px' }}>
          <DatePickerView
            {...rest}
            value={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            min={new Date(1000, 0, 1)}
            max={new Date(9999, 11, 31)}
          />
          {showTime && (
            <Picker columns={[hours, minutes, seconds]} value={selectedTime} onConfirm={(val) => setSelectedTime(val)}>
              {(items, { open }) => (
                <Button onClick={open} style={{ width: '100%', marginTop: '16px' }}>
                  {t('Select time')}
                </Button>
              )}
            </Picker>
          )}
          <Button block color="primary" onClick={handleConfirm} style={{ marginTop: '16px' }}>
            {t('Confirm')}
          </Button>
          <Button block color="default" onClick={handleClear} style={{ marginTop: '8px' }}>
            {t('Clear')}
          </Button>
        </Popup>
      </>
    );
  },
  mapProps(mapDatePicker()),
  mapReadPretty(DatePicker.ReadPretty),
);

export { MobileDateTimePicker };
