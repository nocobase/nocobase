import { Database } from '@nocobase/database';

export default {
  name: 'dbViews',
  actions: {
    async list(ctx, next) {
      const db = ctx.app.db as Database;
      const dbViews = await db.queryInterface.listViews();
      ctx.body = dbViews.map((dbView) => {
        return {
          ...dbView,
          from: [],
        };
      });

      await next();
    },
    async query(ctx, next) {
      const { resourceIndex } = ctx.action.params;
      const sql = `SELECT *
                   FROM ${resourceIndex}`;
      const results = await ctx.app.db.sequelize.query(sql, { type: 'SELECT' });
      ctx.body = results;
      await next();
    },
  },
};
