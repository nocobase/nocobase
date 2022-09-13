import { Context, Next } from '@nocobase/actions';
import { Middleware } from '@nocobase/resourcer';

export const parseToken = new Middleware(async (ctx: Context, next: Next) => {
  const user = await findUserByToken(ctx);
  if (user) {
    ctx.state.currentUser = user;
  }
  return next();
});

async function findUserByToken(ctx: Context) {
  const token = ctx.getBearerToken();
  if (!token) {
    return null;
  }
  const { jwtService } = ctx.app.getPlugin('@nocobase/plugin-users');
  try {
    const { userId } = await jwtService.decode(token);
    const collection = ctx.db.getCollection('users');
    ctx.state.currentUserAppends = ctx.state.currentUserAppends || [];
    for (const [, field] of collection.fields) {
      if (field.type === 'belongsTo') {
        ctx.state.currentUserAppends.push(field.name);
      }
    }
    return await ctx.db.getRepository('users').findOne({
      appends: ctx.state.currentUserAppends,
      filter: {
        id: userId,
      },
    });
  } catch (error) {
    return null;
  }
}
