import type { Database } from '@nocobase/database';

export default {
  async ['collections:setFields'](ctx, next) {
    const { filterByTk, values } = ctx.action.params;

    const transaction = await ctx.app.db.sequelize.transaction();

    try {
      const fields = values.fields?.map((f) => {
        delete f.key;
        return f;
      });

      const db = ctx.app.db as Database;

      const collection = await db.getRepository('collections').findOne({
        filter: {
          name: filterByTk,
        },
        transaction,
      });

      await db.getRepository('collections').update({
        filterByTk,
        values: {
          fields,
        },
        transaction,
      });

      await collection.loadFields({
        transaction,
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }

    await next();
  },
};
