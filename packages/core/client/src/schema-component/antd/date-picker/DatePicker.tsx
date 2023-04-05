import { connect, mapProps, mapReadPretty } from '@formily/react';
import { DatePicker as AntdDatePicker } from 'antd';
import type {
  DatePickerProps as AntdDatePickerProps,
  RangePickerProps as AntdRangePickerProps
} from 'antd/lib/date-picker';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReadPretty } from './ReadPretty';
import { getDateRanges, mapDatePicker, mapRangePicker } from './util';

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
  const rangesValue = getDateRanges();
  const ranges = {
    [t('Today')]: rangesValue.today,
    [t('Last week')]: rangesValue.lastWeek,
    [t('This week')]: rangesValue.thisWeek,
    [t('Next week')]: rangesValue.nextWeek,
    [t('Last month')]: rangesValue.lastMonth,
    [t('This month')]: rangesValue.thisMonth,
    [t('Next month')]: rangesValue.nextMonth,
    [t('Last quarter')]: rangesValue.lastQuarter,
    [t('This quarter')]: rangesValue.thisQuarter,
    [t('Next quarter')]: rangesValue.nextQuarter,
    [t('Last year')]: rangesValue.lastYear,
    [t('This year')]: rangesValue.thisYear,
    [t('Next year')]: rangesValue.nextYear,
    [t('Last 7 days')]: rangesValue.last7Days,
    [t('Next 7 days')]: rangesValue.next7Days,
    [t('Last 30 days')]: rangesValue.last30Days,
    [t('Next 30 days')]: rangesValue.next30Days,
    [t('Last 90 days')]: rangesValue.last90Days,
    [t('Next 90 days')]: rangesValue.next90Days,
  };
  props = { utc, ranges, ...props };
  return <_RangePicker {...props} />;
};

export default DatePicker;
