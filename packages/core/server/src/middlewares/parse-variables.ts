import { Collection } from '@nocobase/database';
import { getDateVars, parseFilter } from '@nocobase/utils';
import moment from 'moment';

function getUser(ctx) {
  return async ({ fields }) => {
    const collection = ctx.db.getCollection('users') as Collection;
    const userFields = fields.filter((f) => f && collection.hasField(f));
    if (!ctx.state.currentUser) {
      return;
    }
    if (!userFields.length) {
      return;
    }
    const user = await ctx.db.getRepository('users').findOne({
      filterByTk: ctx.state.currentUser.id,
      fields: userFields,
    });
    return user;
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
    now: moment().toISOString(),
    vars: {
      $system: {
        now: moment().toISOString(),
      },
      $date: getDateVars(),
      $user: getUser(ctx),
    },
  });
  await next();
};
