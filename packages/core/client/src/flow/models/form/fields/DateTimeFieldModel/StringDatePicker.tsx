/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React from 'react';

function str2moment(value?: string, format?: string): Dayjs | null {
  if (!value) return null;
  const d = format ? dayjs(value, format) : dayjs(value);
  return d.isValid() ? d : null;
}

function dayjs2str(value?: Dayjs | null, format?: string, picker?, dateOnly?): string | undefined {
  if (!value) return undefined;
  if (dateOnly) {
    return dayjs(value).startOf(picker).format('YYYY-MM-DD');
  }
  return value.format(format);
}

export const StringDatePicker: React.FC<{
  value?: string;
  onChange?: (val?: string) => void;
  format?: string;
  showTime?: boolean;
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year';
  [key: string]: any;
}> = ({ value, onChange, format, showTime, picker = 'date', dateOnly, ...rest }) => {
  const internalValue = str2moment(value, format);

  return (
    <DatePicker
      {...rest}
      value={internalValue}
      onChange={(val) => {
        onChange?.(dayjs2str(val, format, picker, dateOnly));
      }}
      format={format}
      showTime={showTime}
      picker={picker}
    />
  );
};
