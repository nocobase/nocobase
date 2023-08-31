import { Database } from '@nocobase/database';

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

      const existFields = await collection.getFields({
        transaction,
      });

      await db.getRepository('fields').destroy({
        filterByTk: existFields.map((f) => f.key),
        transaction,
      });

      await db.getRepository('collections.fields', filterByTk).create({
        values: fields,
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
