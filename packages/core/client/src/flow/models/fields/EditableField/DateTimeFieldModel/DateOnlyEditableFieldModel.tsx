/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DatePicker } from 'antd';
import React from 'react';
import dayjs from 'dayjs';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { PreviewText } from '@formily/antd-v5';
import { DateTimeFieldModel } from './DateTimeFieldModel';

const DatePickerCom = connect(
  DatePicker,
  mapProps((props: any, field: any) => {
    const { value, format = 'YYYY-MM-DD', picker = 'date', showTime, ...rest } = props;
    const parsedValue = value && dayjs(value).isValid() ? dayjs(value) : null;

    return {
      ...rest,
      value: parsedValue,
      format,
      picker,
      showTime,
      onChange: (val: any) => {
        const outputFormat = 'YYYY-MM-DD';
        if (!val) {
          field.setValue(undefined);
          return;
        }
        if (picker === 'date') {
          field.setValue(val.format(outputFormat));
        } else {
          field.setValue(val.startOf(picker).format(outputFormat));
        }
      },
    };
  }),
  mapReadPretty(({ value, format = 'YYYY-MM-DD', ...rest }) => {
    if (!value) {
      return;
    }
    const display = value && dayjs(value).format(format);
    return <PreviewText.DatePicker {...rest} value={display} />;
  }),
);

export default DatePickerCom;

export class DateOnlyEditableFieldModel extends DateTimeFieldModel {
  static supportedFieldInterfaces = ['date'];

  setComponentProps(componentProps) {
    super.setComponentProps({
      ...componentProps,
      showTime: false,
      utc: false,
    });
  }
  get component() {
    return [DatePickerCom, {}];
  }
}
