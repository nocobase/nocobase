export default {
  lostPassword: async (ctx, next) => {
    ctx.body = await ctx.auth.lostPassword();
    await next();
  },
  resetPassword: async (ctx, next) => {
    ctx.body = await ctx.auth.resetPassword();
    await next();
  },
  getUserByResetToken: async (ctx, next) => {
    ctx.body = await ctx.auth.getUserByResetToken();
    await next();
  },
  changePassword: async (ctx, next) => {
    ctx.body = await ctx.auth.changePassword();
    await next();
  },
};
