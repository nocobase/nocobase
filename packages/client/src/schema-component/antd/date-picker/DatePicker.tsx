import { formatMomentValue, momentable, usePrefixCls } from '@formily/antd/esm/__builtins__';
import { connect, mapProps, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import { isArr } from '@formily/shared';
import { DatePicker as AntdDatePicker } from 'antd';
import type {
  DatePickerProps as AntdDatePickerProps,
  RangePickerProps as AntdRangePickerProps,
} from 'antd/lib/date-picker';
import cls from 'classnames';
import moment from 'moment';
import React from 'react';
import { usePlaceholder } from '../hooks';

type DatePickerProps<PickerProps> = Exclude<PickerProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string | string[]) => void;
};

type ComposedDatePicker = React.FC<AntdDatePickerProps> & {
  RangePicker?: React.FC<AntdRangePickerProps>;
};

const mapDateFormat = function () {
  const getDefaultFormat = (props: DatePickerProps<AntdDatePickerProps>) => {
    if (props['picker'] === 'month') {
      return 'YYYY-MM';
    } else if (props['picker'] === 'quarter') {
      return 'YYYY-\\QQ';
    } else if (props['picker'] === 'year') {
      return 'YYYY';
    } else if (props['picker'] === 'week') {
      return 'YYYY-wo';
    }
    return props['showTime'] ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
  };
  return (props: any) => {
    const field = useField();
    const fieldSchema = useFieldSchema();
    const format = props['format'] || getDefaultFormat(props);
    const onChange = props.onChange;
    return {
      ...props,
      format: format,
      value: momentable(props.value, format === 'YYYY-wo' ? 'YYYY-w' : format),
      onChange: (value: moment.Moment | moment.Moment[]) => {
        if (onChange) {
          onChange(formatMomentValue(value, format));
        }
      },
    };
  };
};

const DatePickerDisplay: React.FC<AntdDatePickerProps> = (props: any) => {
  if (!props.value) {
    return <div></div>;
  }
  const placeholder = usePlaceholder();
  const prefixCls = usePrefixCls('description-date-picker', props);
  const getDefaultFormat = () => {
    const { dateFormat, showTime, timeFormat } = props;
    let format = dateFormat;
    if (showTime) {
      format += ` ${timeFormat}`;
    }
    return format || props.format;
  };
  const getLabels = () => {
    const d = moment(props.value);
    const labels = formatMomentValue(d.isValid() ? d : null, getDefaultFormat(), placeholder);
    return isArr(labels) ? labels.join('~') : labels;
  };
  return <div className={cls(prefixCls, props.className)}>{getLabels()}</div>;
};

const DateRangePickerDisplay: React.FC<AntdRangePickerProps> = (props) => {
  const placeholder = usePlaceholder();
  const prefixCls = usePrefixCls('description-text', props);
  const getLabels = () => {
    const labels = formatMomentValue(props.value, props.format, placeholder);
    return isArr(labels) ? labels.join('~') : labels;
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
};

export const DatePicker: ComposedDatePicker = connect(
  AntdDatePicker,
  mapProps(mapDateFormat()),
  mapReadPretty(DatePickerDisplay),
);

DatePicker.RangePicker = connect(
  AntdDatePicker.RangePicker,
  mapProps(mapDateFormat()),
  mapReadPretty(DateRangePickerDisplay),
);

export default DatePicker;
