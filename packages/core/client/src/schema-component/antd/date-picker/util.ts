import { getDefaultFormat, str2moment, toGmt, toLocal } from '@nocobase/utils/client';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

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

export const mapDateRange = function () {
  return (props: Record<string, any>) => {
    const { t } = useTranslation();

    return {
      ...props,
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
