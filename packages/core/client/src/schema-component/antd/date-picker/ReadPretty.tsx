import { usePrefixCls } from '@formily/antd-v5/esm/__builtins__';
import { isArr } from '@formily/shared';
import { Str2momentOptions, getDefaultFormat, str2moment } from '@nocobase/utils/client';
import type {
  DatePickerProps as AntdDatePickerProps,
  RangePickerProps as AntdRangePickerProps,
} from 'antd/es/date-picker';
import cls from 'classnames';
import dayjs from 'dayjs';
import React from 'react';

type Composed = {
  DatePicker: React.FC<AntdDatePickerProps>;
  DateRangePicker: React.FC<AntdRangePickerProps>;
};

export const ReadPretty: Composed = () => null;

export type ReadPrettyDatePickerProps = AntdDatePickerProps & Str2momentOptions;

ReadPretty.DatePicker = function DatePicker(props: ReadPrettyDatePickerProps) {
  const prefixCls = usePrefixCls('description-date-picker', props);

  if (!props.value) {
    return <div></div>;
  }

  const getLabels = () => {
    const format = getDefaultFormat(props) as string;
    const m = str2moment(props.value, props);
    const labels = dayjs.isDayjs(m) ? m.format(format) : '';
    return isArr(labels) ? labels.join('~') : labels;
  };
  return <div className={cls(prefixCls, props.className)}>{getLabels()}</div>;
};

export type ReadPrettyDateRangePickerProps = AntdRangePickerProps & Str2momentOptions;

ReadPretty.DateRangePicker = function DateRangePicker(props: ReadPrettyDateRangePickerProps) {
  const prefixCls = usePrefixCls('description-text', props);
  const format = getDefaultFormat(props);
  const getLabels = () => {
    const m = str2moment(props.value, props);
    if (!m) {
      return '';
    }
    const labels = m.map((m) => m.format(format));
    return isArr(labels) ? labels.join('~') : labels;
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
};
