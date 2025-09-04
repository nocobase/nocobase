/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DateTimeFilterFieldModel } from './DateTimeFilterFieldModel';
import dayjs from 'dayjs';
import React from 'react';
import { DateFilterDynamicComponent } from './components/DateFilterDynamicComponent';

const DateOnlyPicker = (props) => {
  const { value, format = 'YYYY-MM-DD', picker = 'date', showTime, ...rest } = props;
  const parsedValue = value && dayjs(value).isValid() ? dayjs(value) : null;

  const componentProps = {
    ...rest,
    value: parsedValue,
    format,
    picker,
    showTime,
    onChange: (val: any) => {
      const outputFormat = 'YYYY-MM-DD';
      if (!val) {
        props.onChange(undefined);
        return;
      }
      if (picker === 'date') {
        props.onChange(val.format(outputFormat));
      } else {
        props.onChange(val.startOf(picker).format(outputFormat));
      }
    },
  };
  return <DateFilterDynamicComponent {...componentProps} />;
};

export class DateOnlyFilterFieldModel extends DateTimeFilterFieldModel {
  static readonly supportedFieldInterfaces = ['date'];

  setProps(componentProps) {
    super.setProps({
      ...componentProps,
      showTime: false,
      utc: false,
    });
  }

  get component() {
    return [DateOnlyPicker, {}];
  }
}
