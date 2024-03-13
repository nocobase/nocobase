import { connect, mapProps, mapReadPretty } from '@formily/react';
import { DatePicker as AntdDatePicker } from 'antd';
import type {
  DatePickerProps as AntdDatePickerProps,
  RangePickerProps as AntdRangePickerProps,
} from 'antd/es/date-picker';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReadPretty } from './ReadPretty';
import { getDateRanges, mapDatePicker, mapRangePicker } from './util';

interface IDatePickerProps {
  utc?: boolean;
}

type ComposedDatePicker = React.FC<AntdDatePickerProps> & {
  ReadPretty?: React.FC<AntdDatePickerProps>;
  RangePicker?: React.FC<AntdRangePickerProps>;
};

const DatePickerContext = React.createContext<IDatePickerProps>({ utc: true });

export const useDatePickerContext = () => React.useContext(DatePickerContext);
export const DatePickerProvider = DatePickerContext.Provider;

const InternalDatePicker: ComposedDatePicker = connect(
  AntdDatePicker,
  mapProps(mapDatePicker()),
  mapReadPretty(ReadPretty.DatePicker),
);

const InternalRangePicker = connect(
  AntdDatePicker.RangePicker,
  mapProps(mapRangePicker()),
  mapReadPretty(ReadPretty.DateRangePicker),
);

export const DatePicker = (props) => {
  const { utc = true } = useDatePickerContext();
  const value = Array.isArray(props.value) ? props.value[0] : props.value;
  props = { utc, ...props };
  return <InternalDatePicker {...props} value={value} />;
};

DatePicker.ReadPretty = ReadPretty.DatePicker;

DatePicker.RangePicker = function RangePicker(props) {
  const { t } = useTranslation();
  const { utc = true } = useDatePickerContext();
  const rangesValue = getDateRanges();
  const presets = [
    { label: t('Today'), value: rangesValue.today },
    { label: t('Last week'), value: rangesValue.lastWeek },
    { label: t('This week'), value: rangesValue.thisWeek },
    { label: t('Next week'), value: rangesValue.nextWeek },
    { label: t('Last month'), value: rangesValue.lastMonth },
    { label: t('This month'), value: rangesValue.thisMonth },
    { label: t('Next month'), value: rangesValue.nextMonth },
    { label: t('Last quarter'), value: rangesValue.lastQuarter },
    { label: t('This quarter'), value: rangesValue.thisQuarter },
    { label: t('Next quarter'), value: rangesValue.nextQuarter },
    { label: t('Last year'), value: rangesValue.lastYear },
    { label: t('This year'), value: rangesValue.thisYear },
    { label: t('Next year'), value: rangesValue.nextYear },
    { label: t('Last 7 days'), value: rangesValue.last7Days },
    { label: t('Next 7 days'), value: rangesValue.next7Days },
    { label: t('Last 30 days'), value: rangesValue.last30Days },
    { label: t('Next 30 days'), value: rangesValue.next30Days },
    { label: t('Last 90 days'), value: rangesValue.last90Days },
    { label: t('Next 90 days'), value: rangesValue.next90Days },
  ];
  props = { utc, presets, ...props };
  return <InternalRangePicker {...props} />;
};

export default DatePicker;
