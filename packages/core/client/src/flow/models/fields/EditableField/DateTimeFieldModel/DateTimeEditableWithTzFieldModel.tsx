/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import dayjs from 'dayjs';
import { DateTimeFieldModel } from './DateTimeFieldModel';

export const handleDateChangeOnForm = (value, picker, showTime) => {
  // @ts-ignore
  const currentTimeZone = dayjs.tz.guess();
  const format = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
  if (!value) {
    return value;
  }
  if (picker !== 'date') {
    return dayjs(value).startOf(picker).toISOString();
  }
  const formattedDate = dayjs(value).format(format);
  // @ts-ignore
  return dayjs(formattedDate).tz(currentTimeZone, true).toISOString();
};

export class DateTimeEditableWithTzFieldModel extends DateTimeFieldModel {
  static supportedFieldInterfaces = ['createdAt', 'datetime', 'updatedAt', 'unixTimestamp'];

  setComponentProps(componentProps) {
    super.setComponentProps({
      ...componentProps,
      onChange: (value) => {
        const iso = value ? dayjs(value).toDate() : undefined;
        this.field.setValue(iso);
      },
    });
  }
}
