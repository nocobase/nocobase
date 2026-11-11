/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapReadPretty, useField } from '@formily/react';
import React, { useEffect, useMemo } from 'react';
import { DatePicker } from '../date-picker';

const toValue = (value: any, accuracy) => {
  if (value) {
    return convertTimestampToDate(value, accuracy);
  }
  return null;
};

function convertTimestampToDate(timestamp, accuracy = 'second') {
  // 如果是秒级时间戳，乘以1000转换为毫秒
  const timeInMilliseconds = accuracy === 'second' ? timestamp * 1000 : timestamp;

  // 创建Date对象并转为UTC时间
  const date = new Date(timeInMilliseconds);

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return 'Invalid timestamp';
  }

  return date.toUTCString(); // 返回 UTC 格式的日期
}
interface UnixTimestampProps {
  value?: any;
  onChange?: (value: number) => void;
  accuracy?: 'millisecond' | 'second';
}

export const UnixTimestamp = connect(
  (props: UnixTimestampProps) => {
    const { value, onChange, accuracy } = props;
    const targetValue = useMemo(() => {
      if (typeof value === 'number') {
        const v = toValue(value, accuracy);
        return v;
      }
      return value;
    }, [value]);

    return (
      <DatePicker
        {...props}
        value={targetValue}
        onChange={(v: any) => {
          if (onChange) {
            onChange(v);
          }
        }}
      />
    );
  },
  mapReadPretty((props) => {
    const { value } = props;
    return <DatePicker.ReadPretty {...props} value={value} />;
  }),
);
