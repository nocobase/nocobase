import { Database, ViewFieldInference } from '@nocobase/database';

export default {
  name: 'dbViews',
  actions: {
    async get(ctx, next) {
      const { filterByTk, schema } = ctx.action.params;
      const db = ctx.app.db as Database;

      const fields = await ViewFieldInference.inferFields({
        db,
        viewName: filterByTk,
        viewSchema: schema,
      });

      ctx.body = {
        fields,
        sources: [
          ...new Set(
            Object.values(fields)
              .map((field) => field.source)
              .filter(Boolean)
              .map((source) => source.split('.')[0]),
          ),
        ],
      };

      await next();
    },

    list: async function (ctx, next) {
      const db = ctx.app.db as Database;
      const dbViews = await db.queryInterface.listViews();

      const viewCollections = Array.from(db.collections.values()).filter((collection) => collection.isView());

      ctx.body = dbViews
        .map((dbView) => {
          return {
            ...dbView,
          };
        })
        .filter((dbView) => {
          // if view is connected, skip
          return !viewCollections.find((collection) => {
            const viewName = dbView.name;
            const schema = dbView.schema;

            return collection.options.name === viewName && collection.options.schema === schema;
          });
        });

      await next();
    },

    async query(ctx, next) {
      const { filterByTk, schema = 'public', page = 1, pageSize = 10 } = ctx.action.params;

      const offset = (page - 1) * pageSize;
      const limit = 1 * pageSize;

      const sql = `SELECT *
                   FROM ${ctx.app.db.utils.quoteTable(
                     ctx.app.db.utils.addSchema(filterByTk, schema),
                   )} LIMIT ${limit} OFFSET ${offset}`;

      ctx.body = await ctx.app.db.sequelize.query(sql, { type: 'SELECT' });
      await next();
    },
  },
};
