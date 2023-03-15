import moment from 'moment';
import { toGmt } from '@nocobase/utils';

/**
 * 解析变量所需的上下文
 * @returns
 */
export const getContext = () => {
  return {
    $system: {
      now: toGmt(moment()) as string,
    },
    $date: {
      today: [toGmt(moment()), toGmt(moment())] as string[],
      lastWeek: [
        toGmt(moment().subtract(1, 'week').startOf('week')),
        toGmt(moment().subtract(1, 'week').endOf('week')),
      ] as string[],
      thisWeek: [toGmt(moment().startOf('week')), toGmt(moment().endOf('week'))] as string[],
      nextWeek: [
        toGmt(moment().add(1, 'week').startOf('week')),
        toGmt(moment().add(1, 'week').endOf('week')),
      ] as string[],
      lastMonth: [
        toGmt(moment().subtract(1, 'month').startOf('month')),
        toGmt(moment().subtract(1, 'month').endOf('month')),
      ] as string[],
      thisMonth: [toGmt(moment().startOf('month')), toGmt(moment().endOf('month'))] as string[],
      nextMonth: [
        toGmt(moment().add(1, 'month').startOf('month')),
        toGmt(moment().add(1, 'month').endOf('month')),
      ] as string[],
      lastYear: [
        toGmt(moment().subtract(1, 'year').startOf('year')),
        toGmt(moment().subtract(1, 'year').endOf('year')),
      ] as string[],
      thisYear: [toGmt(moment().startOf('year')), toGmt(moment().endOf('year'))] as string[],
      nextYear: [
        toGmt(moment().add(1, 'year').startOf('year')),
        toGmt(moment().add(1, 'year').endOf('year')),
      ] as string[],
      last7Days: [toGmt(moment().subtract(7, 'days')), toGmt(moment())] as string[],
      next7Days: [toGmt(moment()), toGmt(moment().add(7, 'days'))] as string[],
      last30Days: [toGmt(moment().subtract(30, 'days')), toGmt(moment())] as string[],
      next30Days: [toGmt(moment()), toGmt(moment().add(30, 'days'))] as string[],
      last90Days: [toGmt(moment().subtract(90, 'days')), toGmt(moment())] as string[],
      next90Days: [toGmt(moment()), toGmt(moment().add(90, 'days'))] as string[],
    },
  };
};
