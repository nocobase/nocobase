import { isArr, isEmpty, isFn } from '@formily/shared';
import { dayjs } from '@nocobase/utils/client';
import type { ConfigType, Dayjs } from 'dayjs';

type Date = Dayjs | string | number;

export function dayjsable(value: ConfigType, format?: string): Dayjs;
export function dayjsable(value: ConfigType[], format?: string): Dayjs[];

export function dayjsable(value: ConfigType | ConfigType[], format?: string): any {
  if (!value) return value;
  if (Array.isArray(value)) {
    return value.map((val) => {
      const date = dayjs(val, format);
      if (date.isValid()) return date;
      const _date = dayjs(val);
      return _date.isValid() ? _date : val;
    });
  } else {
    const date = dayjs(value, format);
    if (date.isValid()) return date;
    const _date = dayjs(value);
    return _date.isValid() ? _date : value;
  }
}

export const formatDayjsValue = (
  value: Date | Date[],
  format: string | string[],
  placeholder = '',
): string | string[] => {
  const validFormatDate = (date: Date, format: string) => {
    if (typeof date === 'number') {
      return dayjs(date).format(format);
    }
    const _date = dayjs(date);
    return _date.isValid() ? _date.format(format) : date;
  };

  const formatDate = (date: Date, format: string) => {
    if (!date) return placeholder;
    if (isFn(format)) {
      return format(date);
    }
    if (isEmpty(format)) {
      return date;
    }
    return validFormatDate(date, format);
  };

  if (isArr(value)) {
    return value.map((val, index) => {
      return formatDate(val, isArr(format) ? format[index] || format[format.length - 1] : format);
    });
  } else {
    return value ? formatDate(value, isArr(format) ? format[0] : format) : value || placeholder;
  }
};
