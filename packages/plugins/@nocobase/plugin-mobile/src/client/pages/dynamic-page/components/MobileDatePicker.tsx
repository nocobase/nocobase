/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Button, DatePickerView, Popup, Space, Picker } from 'antd-mobile';
import { format } from 'date-fns';

const MobileDateTimePicker = (props) => {
  const { value, onChange, dateFormat = 'yyyy-MM-dd', timeFormat = 'HH:mm', showTime = true, ...rest } = props;
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

  const handleConfirm = () => {
    const selectedDateTime = new Date(selectedDate);
    if (showTime) {
      selectedDateTime.setHours(Number(selectedTime[0]));
      selectedDateTime.setMinutes(Number(selectedTime[1]));
    }
    onChange(selectedDateTime);
    setVisible(false);
  };

  return (
    <>
      <Space align="center">
        <Button onClick={() => setVisible(true)}>选择日期{showTime ? '和时间' : ''}</Button>
        <div>
          {value
            ? `${format(new Date(value), dateFormat)}${showTime ? ` ${format(new Date(value), timeFormat)}` : ''}`
            : '未选择'}
        </div>
      </Space>
      <Popup visible={visible} onMaskClick={() => setVisible(false)} destroyOnClose bodyStyle={{ padding: '16px' }}>
        <DatePickerView {...rest} value={selectedDate} onChange={(date) => setSelectedDate(date)} />
        {showTime && (
          <Picker columns={[hours, minutes]} value={selectedTime} onConfirm={(val: any) => setSelectedTime(val)}>
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
};

export { MobileDateTimePicker };
