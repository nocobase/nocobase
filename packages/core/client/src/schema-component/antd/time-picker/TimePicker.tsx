/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dayjsable, formatDayjsValue } from '@formily/antd-v5/esm/__builtins__';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import dayjs from 'dayjs';
import { TimePicker as AntdTimePicker } from 'antd';
import { TimePickerProps as AntdTimePickerProps, TimeRangePickerProps } from 'antd/es/time-picker';
import { ReadPretty } from './ReadPretty';

type ComposedTimePicker = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<Partial<AntdTimePickerProps>> & React.RefAttributes<unknown>
> & {
  RangePicker?: React.FC<TimeRangePickerProps>;
  ReadPretty?: React.FC<any>;
};

export const mapTimeFormat = function () {
  return (props: any, field) => {
    const format = props['format'] || 'HH:mm:ss';
    const onChange = props.onChange;
    return {
      ...props,
      format,
      inputReadOnly: true,
      value: dayjsable(props.value, 'HH:mm:ss'),
      onChange: (value: dayjs.Dayjs | dayjs.Dayjs[]) => {
        if (onChange) {
          onChange(formatDayjsValue(value, 'HH:mm:ss') || null);
        }
      },
    };
  };
};

export const TimePicker: ComposedTimePicker = connect(
  AntdTimePicker,
  mapProps(mapTimeFormat()),
  mapReadPretty(ReadPretty),
);

TimePicker.RangePicker = connect(AntdTimePicker.RangePicker, mapProps(mapTimeFormat()), mapReadPretty(ReadPretty));
TimePicker.ReadPretty = ReadPretty;
export default TimePicker;
