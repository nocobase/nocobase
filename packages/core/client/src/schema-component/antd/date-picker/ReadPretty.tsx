/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { usePrefixCls } from '@formily/antd-v5/esm/__builtins__';
import { isArr } from '@formily/shared';
import {
  GetDefaultFormatProps,
  Str2momentOptions,
  Str2momentValue,
  getDefaultFormat,
  str2moment,
} from '@nocobase/utils/client';
import cls from 'classnames';
import dayjs from 'dayjs';
import React from 'react';

export type ReadPrettyComposed = {
  DatePicker: React.FC<ReadPrettyDatePickerProps>;
  DateRangePicker: React.FC<DateRangePickerReadPrettyProps>;
};

export const ReadPretty: ReadPrettyComposed = () => null;

export interface ReadPrettyDatePickerProps extends Str2momentOptions, GetDefaultFormatProps {
  value?: Str2momentValue;
  className?: string;
  prefixCls?: string;
  showTime?: boolean;
}
const getFormat = (picker) => {
  switch (picker) {
    case 'week':
      return 'YYYY-wo'; // Week format
    case 'month':
      return 'YYYY-MM'; // Month format
    case 'quarter':
      return 'YYYY [Q]Q'; // Quarter format
    case 'year':
      return 'YYYY'; // Year format
    default:
      return 'YYYY-MM-DD'; // Date format
  }
};

ReadPretty.DatePicker = function DatePicker(props: any) {
  const { value, picker = 'date' } = props;
  const prefixCls = usePrefixCls('description-date-picker', props);
  if (!value) {
    return <div></div>;
  }
  if (picker !== 'date') {
    return (
      <div className={cls(prefixCls, props.className)}>
        {dayjs(value as any)
          .utc()
          .format(getFormat(picker))}
      </div>
    );
  }
  const getLabels = () => {
    const format = getDefaultFormat(props) as string;
    const m = str2moment(value, props);
    const labels = dayjs.isDayjs(m) ? m.format(format) : '';
    return isArr(labels) ? labels.join('~') : labels;
  };
  return <div className={cls(prefixCls, props.className)}>{getLabels()}</div>;
};

export interface DateRangePickerReadPrettyProps extends Str2momentOptions, GetDefaultFormatProps {
  value?: Str2momentValue;
  className?: string;
  prefixCls?: string;
  style?: React.CSSProperties;
}

ReadPretty.DateRangePicker = function DateRangePicker(props: DateRangePickerReadPrettyProps) {
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
