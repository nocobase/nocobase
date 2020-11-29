import { actions } from '@nocobase/actions';

export default async (ctx: actions.Context, next: actions.Next) => {
  ctx.body = {
    data: ctx.state.currentUser,
  };
  await next();
}
