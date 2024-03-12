import { connect, mapReadPretty } from '@formily/react';
import { DatePicker } from 'antd';
import React, { useMemo } from 'react';
import { ReadPretty } from '../input-number/ReadPretty';
import dayjs from 'dayjs';

const toValue = (value: any, format) => {
  if (value) {
    return timestampToDate(value, format);
  }
  return null;
};

function timestampToDate(timestamp, format) {
  // 使用 Day.js 将时间戳转换为日期对象
  const date = dayjs(timestamp);

  return date;
}
export const UnixTimestamp = connect(
  (props) => {
    const { value, onChange, format } = props;
    const v = useMemo(() => toValue(value, format), [value]);
    return (
      <DatePicker
        {...props}
        value={v}
        onChange={(v: any, dateString) => {
          if (onChange) {
            onChange(new Date(dateString).getTime());
          }
        }}
      />
    );
  },
  mapReadPretty((props) => {
    return <ReadPretty {...props} />;
  }),
);
