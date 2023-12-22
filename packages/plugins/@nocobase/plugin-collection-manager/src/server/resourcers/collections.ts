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

      const collectionModel = await db.getRepository('collections').findOne({
        filter: {
          name: filterByTk,
        },
        transaction,
      });

      const existFields = await collectionModel.getFields({
        transaction,
      });

      const needUpdateFields = fields
        .filter((f) => {
          return existFields.find((ef) => ef.name === f.name);
        })
        .map((f) => {
          return {
            ...f,
            key: existFields.find((ef) => ef.name === f.name).key,
          };
        });

      const needDestroyFields = existFields.filter((ef) => {
        return !fields.find((f) => f.name === ef.name);
      });

      const needCreatedFields = fields.filter((f) => {
        return !existFields.find((ef) => ef.name === f.name);
      });

      if (needDestroyFields.length) {
        await db.getRepository('fields').destroy({
          filterByTk: needDestroyFields.map((f) => f.key),
          transaction,
        });
      }

      if (needUpdateFields.length) {
        await db.getRepository('fields').updateMany({
          records: needUpdateFields,
          transaction,
        });
      }

      if (needCreatedFields.length) {
        await db.getRepository('collections.fields', filterByTk).create({
          values: needCreatedFields,
          transaction,
        });
      }

      await collectionModel.loadFields({
        transaction,
      });

      const collection = db.getCollection(filterByTk);

      await collection.sync({
        force: false,
        alter: {
          drop: false,
        },
        transaction,
      } as any);

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }

    await next();
  },
};
