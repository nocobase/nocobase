export default {
  listTypes: async (ctx, next) => {
    ctx.body = ctx.app.authManager.listTypes();
    await next();
  },
};
