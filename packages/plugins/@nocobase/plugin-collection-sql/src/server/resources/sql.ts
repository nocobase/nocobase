/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { SQLCollection, SQLModel } from '../sql-collection';
import { checkSQL } from '../utils';

const updateCollection = async (ctx: Context, transaction: any) => {
  const { filterByTk, values } = ctx.action.params;
  const repo = ctx.db.getRepository('collections');
  const collection = await repo.findOne({
    filter: {
      name: filterByTk,
    },
    transaction,
  });

  const existFields = await collection.getFields({ transaction });

  const deletedFields = existFields.filter((field: any) => !values.fields?.find((f: any) => f.name === field.name));

  for (const field of deletedFields) {
    await field.destroy({ transaction });
  }

  const upRes = await repo.update({
    filterByTk,
    values: {
      ...values,
      fields: values.fields?.map((f: any) => {
        delete f.key;
        return f;
      }),
    },
    updateAssociationValues: ['fields'],
    transaction,
  });

  return { collection, upRes };
};

export default {
  name: 'sqlCollection',
  actions: {
    execute: async (ctx: Context, next: Next) => {
      const { sql } = ctx.action.params.values || {};
      if (!sql) {
        ctx.throw(400, ctx.t('Please enter a SQL statement'));
      }
      try {
        checkSQL(sql);
      } catch (e) {
        ctx.throw(400, ctx.t(e.message));
      }
      const tmpCollection = new SQLCollection({ name: 'tmp', sql }, { database: ctx.db });
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
        ctx.logger.warn(`resource: sql-collection, action: execute, error: ${err}`);
        fields = {};
      }
      const sources = Array.from(
        new Set(
          Object.values(fields)
            .map((field) => field.collection)
            .filter((c) => c),
        ),
      );
      ctx.body = { data, fields, sources };
      await next();
    },
    setFields: async (ctx: Context, next: Next) => {
      const transaction = await ctx.app.db.sequelize.transaction();
      try {
        const {
          upRes: [collection],
        } = await updateCollection(ctx, transaction);
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
        const { upRes } = await updateCollection(ctx, transaction);
        const [collection] = upRes;
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
