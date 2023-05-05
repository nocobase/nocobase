import { Context, Next } from '@nocobase/actions';

export default {
  listTypes: async (ctx: Context, next: Next) => {
    ctx.body = ctx.app.authManager.listTypes();
    await next();
  },
  publicList: async (ctx: Context, next: Next) => {
    const repo = ctx.db.getRepository('authenticators');
    ctx.body = await repo.find({
      fields: ['name', 'authType'],
    });
    await next();
  },
};
