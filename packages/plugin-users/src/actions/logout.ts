import { actions } from '@nocobase/actions';

export default async (ctx: actions.Context, next: actions.Next) => {
  ctx.body = {};
  await next();
}