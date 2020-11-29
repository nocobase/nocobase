import { actions } from '@nocobase/actions';

export default async (ctx: actions.Context, next: actions.Next) => {
  ctx.body = ctx.state.currentUser;
  await next();
}
