/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DatePicker } from '@formily/antd-v5';
import dayjs from 'dayjs';
import React from 'react';
import { DateTimeFilterFormFieldModel } from './DateTimeFilterFormFieldModel';

const DatePickerCom = (props) => {
  const { value, format = 'YYYY-MM-DD HH:mm:ss', showTime, picker = 'date', onChange, ...rest } = props;
  const parsedValue = value ? dayjs(value) : null;
  return (
    <DatePicker
      {...rest}
      value={parsedValue}
      format={format}
      picker={picker}
      showTime={showTime}
      onChange={(val: any) => {
        const outputFormat = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
        if (showTime) {
          onChange(dayjs(val, format).format(outputFormat));
        } else {
          onChange(dayjs(val, format).startOf(picker).format(outputFormat));
        }
      }}
    />
  );
};

export class DateTimeNoTzFilterFormFieldModel extends DateTimeFilterFormFieldModel {
  static readonly supportedFieldInterfaces = ['datetimeNoTz'];
  get component() {
    return [DatePickerCom, {}];
  }
}
