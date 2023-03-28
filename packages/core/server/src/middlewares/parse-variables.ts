import { getDateVars, parseFilter } from '@nocobase/utils';
import moment from 'moment';

export const parseVariables = async (ctx, next) => {
  const filter = ctx.action.params.filter;
  console.log(ctx.get('x-timezone'));
  if (!filter) {
    return next();
  }
  ctx.action.params.filter = await parseFilter(filter, {
    timezone: ctx.get('x-timezone'),
    now: moment().toISOString(),
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
