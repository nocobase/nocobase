/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Button, DatePickerView, Popup, Space, Picker } from 'antd-mobile';
import { mapDatePicker, DatePicker } from '@nocobase/client';
import { connect, mapProps, mapReadPretty } from '@formily/react';

const MobileDateTimePicker = connect(
  (props) => {
    const { value, onChange, dateFormat = 'YYYY-MM-DD', timeFormat = 'HH:mm', showTime = true, ...rest } = props;
    const [visible, setVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value || new Date());
    const [selectedTime, setSelectedTime] = useState(['12', '00']);
    // 时间选择数据
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

    const handleConfirm = () => {
      const selectedDateTime = new Date(selectedDate);
      if (showTime) {
        selectedDateTime.setHours(Number(selectedTime[0]));
        selectedDateTime.setMinutes(Number(selectedTime[1]));
        selectedDateTime.setSeconds(Number(selectedTime[2]));
      }
      onChange(selectedDateTime);
      setVisible(false);
    };
    return (
      <>
        <Space align="center">
          <DatePicker
            onClick={() => setVisible(true)}
            value={value}
            {...rest}
            popupStyle={{ display: 'none' }}
            style={{ width: '100%' }}
          />
        </Space>
        <Popup visible={visible} onMaskClick={() => setVisible(false)} destroyOnClose bodyStyle={{ padding: '16px' }}>
          <DatePickerView {...rest} value={selectedDate} onChange={(date) => setSelectedDate(date)} />
          {showTime && (
            <Picker
              columns={[hours, minutes, seconds]}
              value={selectedTime}
              onConfirm={(val: any) => setSelectedTime(val)}
            >
              {(items, { open }) => (
                <Button onClick={open} style={{ width: '100%', marginTop: '16px' }}>
                  选择时间
                </Button>
              )}
            </Picker>
          )}
          <Button block color="primary" onClick={handleConfirm} style={{ marginTop: '16px' }}>
            确认
          </Button>
        </Popup>
      </>
    );
  },
  mapProps(mapDatePicker()),
  mapReadPretty(DatePicker.ReadPretty),
);

export { MobileDateTimePicker };
