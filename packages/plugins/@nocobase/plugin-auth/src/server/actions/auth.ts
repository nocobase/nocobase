import { Context, Next } from '@nocobase/actions';

export default {
  lostPassword: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.lostPassword();
    await next();
  },
  resetPassword: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.resetPassword();
    await next();
  },
  getUserByResetToken: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.getUserByResetToken();
    await next();
  },
  changePassword: async (ctx: Context, next: Next) => {
    ctx.body = await ctx.auth.changePassword();
    await next();
  },
};
