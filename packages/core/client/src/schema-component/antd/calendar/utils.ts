import { get } from 'lodash';
import moment from 'moment';
import solarLunar from 'solarlunar-es';
import { i18n } from '../../../i18n';

export const toEvents = (data: any[], fieldNames: any) => {
  return data?.map((item) => {
    return {
      id: get(item, fieldNames.id || 'id'),
      title: get(item, fieldNames.title) || i18n.t('Untitle'),
      start: new Date(get(item, fieldNames.start)),
      end: new Date(get(item, fieldNames.end || fieldNames.start)),
    };
  });
};

export const getLunarDay = (date: moment.MomentInput) => {
  const md = moment(date);
  const result = solarLunar.solar2lunar(md.year(), md.month() + 1, md.date());
  return typeof result !== 'number' ? result.lunarFestival || result.term || result.dayCn : result;
};

export const formatDate = (date: moment.Moment) => {
  return date.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
};
