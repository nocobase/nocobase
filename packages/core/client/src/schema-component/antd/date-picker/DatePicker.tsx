import { connect, mapProps, mapReadPretty } from '@formily/react';
import { DatePicker as AntdDatePicker } from 'antd';
import type {
  DatePickerProps as AntdDatePickerProps,
  RangePickerProps as AntdRangePickerProps
} from 'antd/lib/date-picker';
import moment from 'moment';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  props = { utc, ...props };
  return <_DatePicker {...props} />;
};

DatePicker.RangePicker = (props) => {
  const { t } = useTranslation();
  const { utc = true } = useDatePickerContext();
  const ranges = {
    [t('Today')]: [moment(), moment()],
    [t('Last week')]: [moment().subtract(1, 'week').startOf('isoWeek'), moment().subtract(1, 'week').endOf('isoWeek')],
    [t('This week')]: [moment().startOf('isoWeek'), moment().endOf('isoWeek')],
    [t('Next week')]: [moment().add(1, 'week').startOf('isoWeek'), moment().add(1, 'week').endOf('isoWeek')],
    [t('Last month')]: [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
    [t('This month')]: [moment().startOf('month'), moment().endOf('month')],
    [t('Next month')]: [moment().add(1, 'month').startOf('month'), moment().add(1, 'month').endOf('month')],
    [t('Last year')]: [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')],
    [t('This year')]: [moment().startOf('year'), moment().endOf('year')],
    [t('Next year')]: [moment().add(1, 'year').startOf('year'), moment().add(1, 'year').endOf('year')],
    [t('Last 7 days')]: [moment().subtract(7, 'days'), moment()],
    [t('Next 7 days')]: [moment(), moment().add(7, 'days')],
    [t('Last 30 days')]: [moment().subtract(30, 'days'), moment()],
    [t('Next 30 days')]: [moment(), moment().add(30, 'days')],
    [t('Last 90 days')]: [moment().subtract(90, 'days'), moment()],
    [t('Next 90 days')]: [moment(), moment().add(90, 'days')],
  };
  props = { utc, ranges, ...props };
  return <_RangePicker {...props} />;
};

export default DatePicker;
