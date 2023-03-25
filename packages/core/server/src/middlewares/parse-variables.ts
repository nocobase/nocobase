import { getDateVariable, getLastDays, getNextDays, parseFilter } from '@nocobase/utils';
import moment from 'moment';

function getDateVars() {
  return {
    today: ({ operator, timezone }) => {
      return getDateVariable({ timezone, operator, unitOfTime: 'day' });
    },
    thisWeek: ({ operator, timezone }) => {
      return getDateVariable({ timezone, operator, unitOfTime: 'isoWeek' });
    },
    lastWeek: ({ operator, timezone }) => {
      return getDateVariable({ offset: -1, timezone, operator, unitOfTime: 'isoWeek' });
    },
    nextWeek: ({ operator, timezone }) => {
      return getDateVariable({ offset: 1, timezone, operator, unitOfTime: 'isoWeek' });
    },
    thisMonth: ({ operator, timezone }) => {
      return getDateVariable({ timezone, operator, unitOfTime: 'month' });
    },
    lastMonth: ({ operator, timezone }) => {
      return getDateVariable({ offset: -1, timezone, operator, unitOfTime: 'month' });
    },
    nextMonth: ({ operator, timezone }) => {
      return getDateVariable({ offset: 1, timezone, operator, unitOfTime: 'month' });
    },
    thisYear: ({ operator, timezone }) => {
      return getDateVariable({ offset: 1, timezone, operator, unitOfTime: 'year' });
    },
    lastYear: ({ operator, timezone }) => {
      return getDateVariable({ offset: -1, timezone, operator, unitOfTime: 'year' });
    },
    nextYear: ({ operator, timezone }) => {
      return getDateVariable({ offset: 1, timezone, operator, unitOfTime: 'year' });
    },
    last7Days: ({ timezone }) => getLastDays({ timezone, amount: 7 }),
    next7Days: ({ timezone }) => getNextDays({ timezone, amount: 7 }),
    last30Days: ({ timezone }) => getLastDays({ timezone, amount: 30 }),
    next30Days: ({ timezone }) => getNextDays({ timezone, amount: 30 }),
    last90Days: ({ timezone }) => getLastDays({ timezone, amount: 90 }),
    next90Days: ({ timezone }) => getNextDays({ timezone, amount: 90 }),
  };
}

export const parseVariables = async (ctx, next) => {
  const filter = ctx.action.params.filter;
  console.log(ctx.get('x-timezone'));
  if (!filter) {
    return next();
  }
  ctx.action.params.filter = await parseFilter(filter, {
    timezone: ctx.get('x-timezone'),
    vars: {
      $system: {
        now: moment().toISOString(),
      },
      $date: getDateVars(),
      $user: async ({ fields }) => {
        // const user = await ctx.db.getRepository('users').findOne({
        //   filterByTk: ctx.state.currentUser.id,
        //   fields,
        // });
        // return user || {};
        return ctx.state.currentUser || {};
      },
    },
  });
  await next();
};
