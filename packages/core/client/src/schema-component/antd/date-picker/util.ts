import type { DatePickerProps } from 'antd/lib/date-picker';
import moment from 'moment';

const toGmt = (value: moment.Moment | moment.Moment[]) => {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((val) => `${val.format('YYYY-MM-DD')}T${val.format('HH:mm:ss.SSS')}Z`);
  }
  if (moment.isMoment(value)) {
    return `${value.format('YYYY-MM-DD')}T${value.format('HH:mm:ss.SSS')}Z`;
  }
};

const toStringByPicker = (value, picker) => {
  if (picker === 'year') {
    return value.format('YYYY') + '-01-01T00:00:00.000Z';
  }
  if (picker === 'month') {
    return value.format('YYYY-MM') + '-01T00:00:00.000Z';
  }
  if (picker === 'quarter') {
    return value.format('YYYY-MM') + '-01T00:00:00.000Z';
  }
  if (picker === 'week') {
    return value.format('YYYY-MM-DD') + 'T00:00:00.000Z';
  }
  return value.format('YYYY-MM-DD') + 'T00:00:00.000Z';
};

const toGmtByPicker = (value: moment.Moment | moment.Moment[], picker?: any) => {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((val) => toStringByPicker(val, picker));
  }
  if (moment.isMoment(value)) {
    return toStringByPicker(value, picker);
  }
};

const toLocal = (value: moment.Moment | moment.Moment[]) => {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((val) => val.toISOString());
  }
  if (moment.isMoment(value)) {
    return value.toISOString();
  }
};

export interface Str2momentOptions {
  gmt?: boolean;
  picker?: 'year' | 'month' | 'week' | 'quarter';
}

const toMoment = (val: any, options?: Str2momentOptions) => {
  if (moment.isMoment(val)) {
    return val;
  }
  const { gmt, picker } = options;
  if (gmt || picker) {
    val = val.replace('T', ' ').replace('Z', '');
    return moment(val);
  }
  return moment(val);
};

export const str2moment = (value?: string | string[], options: Str2momentOptions = {}): any => {
  return Array.isArray(value)
    ? value.map((val) => {
        return toMoment(val, options);
      })
    : value
    ? toMoment(value, options)
    : value;
};

export interface Moment2strOptions {
  showTime?: boolean;
  gmt?: boolean;
  picker?: 'year' | 'month' | 'week' | 'quarter';
}

export const moment2str = (value?: moment.Moment | moment.Moment[], options: Moment2strOptions = {}) => {
  const { showTime, gmt, picker } = options;
  if (!value) {
    return value;
  }
  if (showTime) {
    return gmt ? toGmt(value) : toLocal(value);
  }
  return toGmtByPicker(value, picker);
};

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

export const mapDateFormat = function () {
  return (props: any) => {
    const format = getDefaultFormat(props) as any;
    const onChange = props.onChange;
    return {
      ...props,
      format: format,
      value: str2moment(props.value, props),
      onChange: (value: moment.Moment | moment.Moment[]) => {
        if (onChange) {
          onChange(moment2str(value, props));
        }
      },
    };
  };
};
