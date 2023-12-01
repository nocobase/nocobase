import { Context, Next } from '@nocobase/actions';

export async function updateProfile(ctx: Context, next: Next) {
  const { values } = ctx.action.params;
  const { currentUser } = ctx.state;
  if (!currentUser) {
    ctx.throw(401);
  }
  const UserRepo = ctx.db.getRepository('users');
  const result = await UserRepo.update({
    filterByTk: currentUser.id,
    values,
  });
  ctx.body = result;
  await next();
}
