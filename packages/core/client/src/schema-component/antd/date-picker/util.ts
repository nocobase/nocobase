import { isArr, isEmpty, isFn } from '@formily/shared';
import type { DatePickerProps } from 'antd/lib/date-picker';
import moment from 'moment';

export const getDefaultFormat = (props: DatePickerProps & { dateFormat: string; timeFormat: string }) => {
  if (props.format) {
    return props.format;
  }
  if (props.dateFormat) {
    if (props['showTime']) {
      return `${props.dateFormat} ${props.timeFormat || 'HH:mm:ss'}`;
    }
    return props.dateFormat;
  }
  if (props['picker'] === 'month') {
    return 'YYYY-MM';
  } else if (props['picker'] === 'quarter') {
    return 'YYYY-\\QQ';
  } else if (props['picker'] === 'year') {
    return 'YYYY';
  } else if (props['picker'] === 'week') {
    return 'YYYY-wo';
  }
  return props['showTime'] ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
};

const toMoment = (val, format) => {
  if (moment.isMoment(val)) {
    return val;
  }
  if (typeof val === 'string' && val.includes('T')) {
    return moment(val);
  }
  return moment(val, format);
};

export const momentable = (value: any, format?: string) => {
  return Array.isArray(value)
    ? value.map((val) => {
        return toMoment(val, format);
      })
    : value
    ? toMoment(value, format)
    : value;
};

export const formatMomentValue = (value: any, format: any, placeholder?: string): string | string[] => {
  const formatDate = (date: any, format: any, i = 0) => {
    if (!date) return placeholder;
    if (isArr(format)) {
      const _format = format[i];
      if (isFn(_format)) {
        return _format(date);
      }
      if (isEmpty(_format)) {
        return date;
      }
      return moment(date).format(_format);
    } else {
      if (isFn(format)) {
        return format(date);
      }
      if (isEmpty(format)) {
        return date;
      }
      return moment(date).format(format);
    }
  };
  if (isArr(value)) {
    return value.map((val, index) => {
      return formatDate(val, format, index);
    });
  } else {
    return value ? formatDate(value, format) : value || placeholder;
  }
};


const momentToString = (value: moment.Moment | moment.Moment[]) => {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(val => val.toISOString());
  }
  if (moment.isMoment(value)) {
    return value.toISOString();
  }
}

export const mapDateFormat = function () {
  return (props: any) => {
    const format = getDefaultFormat(props) as any;
    const onChange = props.onChange;
    return {
      ...props,
      format: format,
      value: momentable(props.value, format === 'YYYY-wo' ? 'YYYY-w' : format),
      onChange: (value: moment.Moment | moment.Moment[]) => {
        if (onChange) {
          if (props.withTz) {
            onChange(momentToString(value));
          } else {
            onChange(formatMomentValue(value, format));
          }
        }
      },
    };
  };
};
