export default {
  name: 'views',
  actions: {
    async list(ctx, next) {
      const db = ctx.app.db;
      ctx.body = await db.queryInterface.listViews();

      await next();
    },
  },
};
