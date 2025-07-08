/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { dayjs } from '@nocobase/utils/client';
import { DateTimeFieldModel } from './DateTimeFieldModel';

function parseToDate(value: string | Date | undefined, format?: string): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;

  const trimmed = String(value).trim();
  if (!trimmed) return undefined;

  if (format) {
    if (format === 'dddd HH:mm:ss') {
      const [weekdayLabel, time = '00:00:00'] = trimmed.split(' ');
      const weekdayMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      const weekday = weekdayMap[weekdayLabel];
      if (weekday === undefined) return undefined;

      const [hh, mm, ss] = time.split(':').map((s) => parseInt(s || '0', 10));

      const d = dayjs().weekday(weekday).startOf('day').hour(hh).minute(mm).second(ss);

      return d.isValid() ? d.toDate() : undefined;
    }
    const d = dayjs(trimmed, format, true); // strict match
    return d.isValid() ? d.toDate() : undefined;
  }

  const d = dayjs(trimmed);
  return d.isValid() ? d.toDate() : undefined;
}
export class DateTimeEditableWithTzFieldModel extends DateTimeFieldModel {
  static supportedFieldInterfaces = ['createdAt', 'datetime', 'updatedAt', 'unixTimestamp'];

  setComponentProps(componentProps) {
    super.setComponentProps({
      ...componentProps,
      onChange: (value) => {
        const val = parseToDate(value, this.field.componentProps.format);
        this.field.setValue(val);
      },
    });
  }
}
