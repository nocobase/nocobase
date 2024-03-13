import { connect, mapReadPretty } from '@formily/react';
import React, { useMemo } from 'react';
import { DatePicker } from '../date-picker';
import dayjs from 'dayjs';

const toValue = (value: any, accuracy) => {
  if (value) {
    return timestampToDate(value, accuracy);
  }
  return null;
};

function timestampToDate(timestamp, accuracy = 'millisecond') {
  if (accuracy === 'second') {
    timestamp *= 1000; // 如果精确度是秒级，则将时间戳乘以1000转换为毫秒级
  }
  return dayjs(timestamp);
}

function getTimestamp(date, accuracy = 'millisecond') {
  if (accuracy === 'second') {
    return dayjs(date).unix();
  } else {
    return dayjs(date).valueOf(); // 默认返回毫秒级时间戳
  }
}

export const UnixTimestamp = connect(
  (props) => {
    const { value, onChange, accuracy } = props;
    const v = useMemo(() => toValue(value, accuracy), [value]);
    return (
      <DatePicker
        {...props}
        value={v}
        onChange={(v: any) => {
          if (onChange) {
            onChange(getTimestamp(v, accuracy));
          }
        }}
      />
    );
  },
  mapReadPretty((props) => {
    const { value, accuracy } = props;
    const v = useMemo(() => toValue(value, accuracy), [value]);
    return <DatePicker.ReadPretty {...props} value={v} />;
  }),
);
