import { actions } from '@nocobase/actions';

export default async (ctx: actions.Context, next: actions.Next) => {
  const User = ctx.db.getModel('users');
  const { values } = ctx.action.params;
  const user = await User.create(values);
  ctx.body = {
    data: user,
  };
  await next();
}
