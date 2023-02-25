import { getDefaultFormat, str2moment, toGmt, toLocal } from '@nocobase/utils/client';
import moment from 'moment';

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

export const mapDateFormat = function () {
  return (props: any, field) => {
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
