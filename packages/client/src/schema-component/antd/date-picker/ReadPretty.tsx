import { formatMomentValue, usePrefixCls } from '@formily/antd/esm/__builtins__';
import { isArr } from '@formily/shared';
import type {
  DatePickerProps as AntdDatePickerProps,
  RangePickerProps as AntdRangePickerProps,
} from 'antd/lib/date-picker';
import cls from 'classnames';
import moment from 'moment';
import React from 'react';
import { getDefaultFormat } from './util';

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
    const d = moment(props.value);
    const labels = formatMomentValue(d.isValid() ? d : null, getDefaultFormat(props), props.placeholder);
    return isArr(labels) ? labels.join('~') : labels;
  };
  return <div className={cls(prefixCls, props.className)}>{getLabels()}</div>;
};

ReadPretty.DateRangePicker = (props: any) => {
  const prefixCls = usePrefixCls('description-text', props);
  const getLabels = () => {
    const labels = formatMomentValue(props.value, props.format, props.placeholder);
    return isArr(labels) ? labels.join('~') : labels;
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
};
