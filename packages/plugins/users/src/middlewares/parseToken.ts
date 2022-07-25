import { Context, Next } from '@nocobase/actions';
import { MiddlewareManager } from '@nocobase/resourcer';
import UsersPlugin from '../server';

export function parseToken(options?: { plugin: UsersPlugin }) {
  const middleware = new MiddlewareManager();
  middleware.use(async function (ctx: Context, next: Next) {
    const user = await findUserByToken(ctx, options.plugin);
    if (user) {
      ctx.state.currentUser = user;
    }
    return next();
  });
  return middleware;
}

async function findUserByToken(ctx: Context, plugin: UsersPlugin) {
  const token = ctx.getBearerToken();
  if (!token) {
    return null;
  }

  try {
    const { userId } = await plugin.jwtService.decode(token);
    const collection = ctx.db.getCollection('users');
    const appends = [];
    for (const [, field] of collection.fields) {
      if (field.type === 'belongsTo') {
        appends.push(field.name);
      }
    }
    return await ctx.db.getRepository('users').findOne({
      appends,
      filter: {
        id: userId,
      },
    });
  } catch (error) {
    return null;
  }
}
