import { Context, Next } from '@nocobase/actions';

export default {
  listTypes: async (ctx: Context, next: Next) => {
    ctx.body = ctx.app.authManager.listTypes();
    await next();
  },

  getConfig: async (ctx: Context, next: Next) => {
    const { authType } = ctx.action.params;
    const { optionsSchema } = ctx.app.authManager.getAuthConfig(authType);
    ctx.body = { optionsSchema };
    await next();
  },
};
