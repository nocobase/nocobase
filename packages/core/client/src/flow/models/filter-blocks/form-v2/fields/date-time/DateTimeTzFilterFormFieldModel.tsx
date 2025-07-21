/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { PreviewText } from '@formily/antd-v5';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { dayjs } from '@nocobase/utils/client';
import { DatePicker } from 'antd';
import React from 'react';
import { DateTimeFilterFormFieldModel } from './DateTimeFilterFormFieldModel';

function parseToDate(value: string | Date | dayjs.Dayjs | undefined, format?: string): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (dayjs.isDayjs(value)) return value.toDate();

  const trimmed = String(value).trim();
  if (!trimmed) return undefined;

  if (format) {
    const parsed = dayjs(trimmed, format, true); // strict parse
    return parsed.isValid() ? parsed.toDate() : undefined;
  }
  const autoParsed = dayjs(trimmed);
  return autoParsed.isValid() ? autoParsed.toDate() : undefined;
}

function parseInitialValue(value: string | Date | undefined, format?: string): dayjs.Dayjs | null {
  if (!value) return null;
  if (value instanceof Date) return dayjs(value);
  const trimmed = String(value).trim();
  const isIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(trimmed);
  if (isIso) {
    const d = dayjs.utc(trimmed).local();
    return d.isValid() ? d : null;
  }
  if (format) {
    const d = dayjs.utc(trimmed, format, true).local();
    return d.isValid() ? d : null;
  }
  const d = dayjs(trimmed);
  return d.isValid() ? d : null;
}

const DatePickerCom = connect(
  DatePicker,
  mapProps((props: any, field: any) => {
    const { value, format = 'YYYY-MM-DD HH:mm:ss', picker = 'date', showTime, ...rest } = props;

    return {
      ...rest,
      value: parseInitialValue(value, format),
      format,
      picker,
      showTime,
      onChange: (val: any) => {
        const result = parseToDate(val, format);
        field.setValue(result);
      },
    };
  }),
  mapReadPretty(({ value, format = 'YYYY-MM-DD HH:mm:ss', ...rest }) => {
    if (!value) {
      return;
    }
    const display = value ? dayjs(value).format(format) : '-';
    return <PreviewText.DatePicker {...rest} value={display} />;
  }),
);

export class DateTimeTzFilterFormFieldModel extends DateTimeFilterFormFieldModel {
  static readonly supportedFieldInterfaces = ['createdAt', 'datetime', 'updatedAt', 'unixTimestamp'];
  setComponentProps(componentProps) {
    super.setComponentProps({
      ...componentProps,
      utc: true,
    });
  }
  get component() {
    return [DatePickerCom, {}];
  }
}
