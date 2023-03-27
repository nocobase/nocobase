import { connect, mapProps, mapReadPretty } from '@formily/react';
import { DatePicker as AntdDatePicker } from 'antd';
import type {
  DatePickerProps as AntdDatePickerProps,
  RangePickerProps as AntdRangePickerProps
} from 'antd/lib/date-picker';
import React from 'react';
import { ReadPretty } from './ReadPretty';
import { mapDatePicker, mapRangePicker } from './util';

type ComposedDatePicker = React.FC<AntdDatePickerProps> & {
  RangePicker?: React.FC<AntdRangePickerProps>;
};

export const DatePicker: ComposedDatePicker = connect(
  AntdDatePicker,
  mapProps(mapDatePicker()),
  mapReadPretty(ReadPretty.DatePicker),
);

DatePicker.RangePicker = connect(
  AntdDatePicker.RangePicker,
  mapProps(mapRangePicker()),
  mapReadPretty(ReadPretty.DateRangePicker),
);

export default DatePicker;
