import { isValidFilter } from '@nocobase/utils';

export default async function validateFilterParams(ctx, next) {
  const { params } = ctx.action;
  const guardedActions = ['update', 'destroy'];

  if (params.filter && !isValidFilter(params.filter) && guardedActions.includes(params.actionName)) {
    throw new Error(`Invalid filter: ${JSON.stringify(params.filter)}`);
  }

  await next();
}
