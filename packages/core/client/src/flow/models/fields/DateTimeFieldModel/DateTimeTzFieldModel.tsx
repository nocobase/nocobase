/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { dayjs } from '@nocobase/utils/client';
import { EditableItemModel } from '@nocobase/flow-engine';
import { DatePicker } from 'antd';
import React from 'react';
import { DateTimeFieldModel } from './DateTimeFieldModel';

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

export const DateTimeTzPicker = (props) => {
  const { value, format = 'YYYY-MM-DD HH:mm:ss', picker = 'date', showTime, ...rest } = props;
  const componentProps = {
    ...rest,
    value: parseInitialValue(value, format),
    format,
    picker,
    showTime,
    onChange: (val: any) => {
      const result = parseToDate(val, format);
      rest.onChange(result);
    },
  };
  return <DatePicker {...componentProps} />;
};

export class DateTimeTzFieldModel extends DateTimeFieldModel {
  static supportedFieldInterfaces = ['createdAt', 'datetime', 'updatedAt', 'unixTimestamp'];
  setProps(componentProps) {
    super.setProps({
      ...componentProps,
      utc: true,
    });
  }
  get component() {
    return [DateTimeTzPicker, {}];
  }
}

EditableItemModel.bindModelToInterface(
  'DateTimeTzFieldModel',
  ['createdAt', 'datetime', 'updatedAt', 'unixTimestamp'],
  { isDefault: true },
);
