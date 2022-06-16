import { usePrefixCls } from '@formily/antd/lib/__builtins__';
import { isArr } from '@formily/shared';
import type {
  DatePickerProps as AntdDatePickerProps,
  RangePickerProps as AntdRangePickerProps
} from 'antd/lib/date-picker';
import cls from 'classnames';
import moment from 'moment';
import React from 'react';
import { getDefaultFormat, str2moment } from './util';

type Composed = {
  DatePicker: React.FC<AntdDatePickerProps>;
  DateRangePicker: React.FC<AntdRangePickerProps>;
};

export const ReadPretty: Composed = () => null;

ReadPretty.DatePicker = (props: any) => {
  if (!props.value) {
    return <div></div>;
  }
  const prefixCls = usePrefixCls('description-date-picker', props);
  const getLabels = () => {
    const format = getDefaultFormat(props) as string;
    const m = str2moment(props.value, props);
    const labels = moment.isMoment(m) ? m.format(format) : '';
    return isArr(labels) ? labels.join('~') : labels;
  };
  return <div className={cls(prefixCls, props.className)}>{getLabels()}</div>;
};

ReadPretty.DateRangePicker = (props: any) => {
  const prefixCls = usePrefixCls('description-text', props);
  const format = getDefaultFormat(props);
  const getLabels = () => {
    const m = str2moment(props.value, props);
    if (!m) {
      return '';
    }
    const labels = m.map(m => m.format(format));
    return isArr(labels) ? labels.join('~') : labels;
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
};
