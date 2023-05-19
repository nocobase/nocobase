import { Context, Next } from '@nocobase/actions';

export async function parseToken(ctx: Context, next: Next) {
  const user = await findUserByToken(ctx);
  if (user) {
    ctx.state.currentUser = user;
  }
  return next();
}

async function findUserByToken(ctx: Context) {
  const token = ctx.getBearerToken();
  if (!token) {
    return null;
  }
  const { jwtService } = ctx.app.getPlugin('users');
  try {
    const { userId } = await jwtService.decode(token);
    const collection = ctx.db.getCollection('users');
    ctx.state.currentUserAppends = ctx.state.currentUserAppends || [];
    for (const [, field] of collection.fields) {
      if (field.type === 'belongsTo') {
        ctx.state.currentUserAppends.push(field.name);
      }
    }

    const user = await ctx.db.getRepository('users').findOne({
      appends: ctx.state.currentUserAppends,
      filter: {
        id: userId,
      },
    });

    ctx.logger.info(`Current user id: ${userId}`);
    return user;
  } catch (error) {
    console.log(error);
    ctx.logger.error(error);
    return null;
  }
}
