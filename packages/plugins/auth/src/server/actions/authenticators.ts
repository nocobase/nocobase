import { Context, Next } from '@nocobase/actions';

export default {
  listTypes: async (ctx: Context, next: Next) => {
    ctx.body = ctx.app.authManager.listTypes();
    await next();
  },
};
