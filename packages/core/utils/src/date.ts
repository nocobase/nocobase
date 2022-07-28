import moment from 'moment';

export interface Str2momentOptions {
  gmt?: boolean;
  picker?: 'year' | 'month' | 'week' | 'quarter';
}

export const getDefaultFormat = (props: any) => {
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

export const toGmt = (value: moment.Moment | moment.Moment[]) => {
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

export const toLocal = (value: moment.Moment | moment.Moment[]) => {
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
const toMoment = (val: any, options?: Str2momentOptions) => {
  if (!val) {
    return;
  }
  if (moment.isMoment(val)) {
    return val;
  }
  if (val instanceof Date) {
    val = val.toISOString();
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
