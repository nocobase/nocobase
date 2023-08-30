import { Context, Next } from '@nocobase/actions';
import { SQLModel, SqlCollection } from '@nocobase/database';
import { omit } from 'lodash';
import { CollectionModel } from '../models';

const updateCollection = async (ctx: Context, transaction: any) => {
  const { filterByTk, values } = ctx.action.params;
  const fields = values.fields?.map((f: any) => {
    delete f.key;
    return f;
  });
  const repo = ctx.db.getRepository('collections');
  const upRes = await repo.update({
    filterByTk,
    values: {
      ...values,
      fields,
    },
    transaction,
  });
  const collection: CollectionModel = await repo.findOne({
    filter: {
      name: filterByTk,
    },
    transaction,
  });

  return { collection, upRes };
};

export default {
  name: 'sql-collection',
  actions: {
    execute: async (ctx: Context, next: Next) => {
      let {
        values: { sql },
      } = ctx.action.params;
      sql = sql.trim().split(';').shift();
      if (!sql) {
        ctx.throw(400, ctx.t('SQL is empty'));
      }
      if (!/^select/i.test(sql) && !/^with([\s\S]+)select([\s\S]+)/i.test(sql)) {
        ctx.throw(400, ctx.t('Only select query allowed'));
      }
      const tmpCollection = new SqlCollection({ name: 'tmp', sql }, { database: ctx.db });
      const model = tmpCollection.model as typeof SQLModel;
      // The result is for preview only, add limit clause to avoid too many results
      const data = await model.findAll({ attributes: ['*'], limit: 5, raw: true });
      let fields: {
        [field: string]: {
          type: string;
          source: string;
          collection: string;
          interface: string;
        };
      } = {};
      try {
        fields = model.inferFields();
      } catch (err) {
        ctx.logger.warn('resource: sql-collection, action: execute, error: ', err);
        fields = {};
      }
      const sources = Array.from(new Set(Object.values(fields).map((field) => field.collection)));
      ctx.body = { data, fields, sources };
      await next();
    },
    setFields: async (ctx: Context, next: Next) => {
      const transaction = await ctx.app.db.sequelize.transaction();
      try {
        const { collection } = await updateCollection(ctx, transaction);
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
    update: async (ctx: Context, next: Next) => {
      const transaction = await ctx.app.db.sequelize.transaction();
      try {
        const { collection, upRes } = await updateCollection(ctx, transaction);
        await collection.load({ transaction, resetFields: true });
        await transaction.commit();
        ctx.body = upRes;
      } catch (e) {
        await transaction.rollback();
        throw e;
      }
      await next();
    },
  },
};
