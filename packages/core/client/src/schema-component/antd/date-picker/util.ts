import { getDefaultFormat, str2moment, toGmt, toLocal } from '@nocobase/utils/client';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

const toStringByPicker = (value, picker, timezone: 'gmt' | 'local') => {
  if (!moment.isMoment(value)) return value;
  if (timezone === 'local') {
    const offset = new Date().getTimezoneOffset();
    return moment(toStringByPicker(value, picker, 'gmt')).add(offset, 'minutes').toISOString();
  }

  if (picker === 'year') {
    return value.format('YYYY') + '-01-01T00:00:00.000Z';
  }
  if (picker === 'month') {
    return value.format('YYYY-MM') + '-01T00:00:00.000Z';
  }
  if (picker === 'quarter') {
    return value.startOf('quarter').format('YYYY-MM') + '-01T00:00:00.000Z';
  }
  if (picker === 'week') {
    return value.startOf('week').add(1, 'day').format('YYYY-MM-DD') + 'T00:00:00.000Z';
  }
  return value.format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z';
};

const toGmtByPicker = (value: moment.Moment, picker?: any) => {
  if (!value || !moment.isMoment(value)) {
    return value;
  }
  return toStringByPicker(value, picker, 'gmt');
};

const toLocalByPicker = (value: moment.Moment, picker?: any) => {
  if (!value || !moment.isMoment(value)) {
    return value;
  }
  return toStringByPicker(value, picker, 'local');
};

export interface Moment2strOptions {
  showTime?: boolean;
  gmt?: boolean;
  utc?: boolean;
  picker?: 'year' | 'month' | 'week' | 'quarter';
}

export const moment2str = (value?: moment.Moment, options: Moment2strOptions = {}) => {
  const { showTime, gmt, picker, utc = true } = options;
  if (!value) {
    return value;
  }
  if (!utc) {
    const format = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
    return value.format(format);
  }
  if (showTime) {
    return gmt ? toGmt(value) : toLocal(value);
  }
  if (typeof gmt === 'boolean') {
    return gmt ? toGmtByPicker(value, picker) : toLocalByPicker(value, picker);
  }
  return toGmtByPicker(value, picker);
};

export const mapDatePicker = function () {
  return (props: any) => {
    const format = getDefaultFormat(props) as any;
    const onChange = props.onChange;

    return {
      ...props,
      format: format,
      value: str2moment(props.value, props),
      onChange: (value: moment.Moment) => {
        if (onChange) {
          onChange(moment2str(value, props));
        }
      },
    };
  };
};

export const mapRangePicker = function () {
  return (props: any) => {
    const { t } = useTranslation();
    const format = getDefaultFormat(props) as any;
    const onChange = props.onChange;

    return {
      ...props,
      format: format,
      value: str2moment(props.value, props),
      onChange: (value: moment.Moment[]) => {
        if (onChange) {
          onChange([
            moment2str(getRangeStart(value[0], props), props),
            moment2str(getRangeEnd(value[1], props), props),
          ]);
        }
      },
      ranges: {
        [t('Today')]: [moment(), moment()],
        [t('This Week')]: [moment().startOf('week'), moment().endOf('week')],
        [t('This Month')]: [moment().startOf('month'), moment().endOf('month')],
        [t('This Year')]: [moment().startOf('year'), moment().endOf('year')],
        [t('Last Week')]: [moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week')],
        [t('Last Month')]: [
          moment().subtract(1, 'month').startOf('month'),
          moment().subtract(1, 'month').endOf('month'),
        ],
        [t('Last Year')]: [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')],
        [t('Last 7 Days')]: [moment().subtract(7, 'days'), moment()],
        [t('Last 30 Days')]: [moment().subtract(30, 'days'), moment()],
        [t('Last 90 Days')]: [moment().subtract(90, 'days'), moment()],
      },
    } as any;
  };
};

function getRangeStart(value: moment.Moment, options: Moment2strOptions) {
  const { showTime } = options;
  if (showTime) {
    return value;
  }
  return value.startOf('day');
}

function getRangeEnd(value: moment.Moment, options: Moment2strOptions) {
  const { showTime } = options;
  if (showTime) {
    return value;
  }
  return value.endOf('day');
}
