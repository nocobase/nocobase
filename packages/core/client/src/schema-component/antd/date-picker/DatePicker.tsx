import { connect, mapProps, mapReadPretty } from '@formily/react';
import { DatePicker as AntdDatePicker } from 'antd';
import type {
  DatePickerProps as AntdDatePickerProps,
  RangePickerProps as AntdRangePickerProps
} from 'antd/lib/date-picker';
import React from 'react';
import { ReadPretty } from './ReadPretty';
import { mapDatePicker, mapRangePicker } from './util';

interface IDatePickerProps {
  utc?: boolean;
}

type ComposedDatePicker = React.FC<AntdDatePickerProps> & {
  RangePicker?: React.FC<AntdRangePickerProps>;
};

const DatePickerContext = React.createContext<IDatePickerProps>({ utc: true });

export const useDatePickerContext = () => React.useContext(DatePickerContext);
export const DatePickerProvider = DatePickerContext.Provider;

const _DatePicker: ComposedDatePicker = connect(
  AntdDatePicker,
  mapProps(mapDatePicker()),
  mapReadPretty(ReadPretty.DatePicker),
);

const _RangePicker = connect(
  AntdDatePicker.RangePicker,
  mapProps(mapRangePicker()),
  mapReadPretty(ReadPretty.DateRangePicker),
);

export const DatePicker = (props) => {
  const { utc = true } = useDatePickerContext();
  props = { ...props, utc };
  return <_DatePicker {...props} />;
};

DatePicker.RangePicker = (props) => {
  const { utc = true } = useDatePickerContext();
  props = { ...props, utc };
  return <_RangePicker {...props} />;
};

export default DatePicker;
