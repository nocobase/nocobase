import moment from 'moment';

export interface Str2momentOptions {
  gmt?: boolean;
  picker?: 'year' | 'month' | 'week' | 'quarter';
}
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
