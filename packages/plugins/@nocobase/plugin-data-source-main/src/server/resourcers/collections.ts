/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Database, snakeCase } from '@nocobase/database';
import lodash from 'lodash';
import { CollectionService } from '../services/collection-service';

export default {
  async ['collections:listMeta'](ctx, next) {
    const db = ctx.app.db as Database;
    const results = [];

    db.collections.forEach((collection) => {
      if (!collection.options.loadedFromCollectionManager) {
        return;
      }

      const obj = {
        ...collection.options,
        filterTargetKey: collection.filterTargetKey,
      };

      if (collection && collection.unavailableActions) {
        obj['unavailableActions'] = collection.unavailableActions();
      }

      obj.fields = lodash.sortBy(
        [...collection.fields.values()].map((field) => {
          return {
            ...field.options,
          };
        }),
        '__sort',
      );

      results.push(obj);
    });

    ctx.body = lodash.sortBy(results, 'sort');

    await next();
  },

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

  async ['collections:selectable'](ctx, next) {
    const allTables = await ctx.app.db.sequelize.getQueryInterface().showAllTables();
    const underscored = ctx.app.db.options.underscored;
    const existsCollections = Array.from(ctx.app.db.collections.values()).map((x: Collection) =>
      underscored ? snakeCase(x.name) : x.name,
    );

    const tableNames = allTables.map((table) => {
      if (typeof table === 'object' && table.tableName) {
        return table.tableName;
      }
      return table;
    });

    const diffTables = tableNames.filter((tableName) => !existsCollections.includes(tableName));

    ctx.body = diffTables.map((name) => ({ name }));
    await next();
  },

  async ['collections:add'](ctx, next) {
    const { values } = ctx.action.params;
    const existsCollections = await ctx.app.db.getRepository('collections').find({
      filter: { name: values },
    });
    const existsCollectionNames = existsCollections.map((c) => c.name);
    const addToCollections = values.filter((table) => !existsCollectionNames.includes(table));
    const mainDataSource = ctx.app.pm.get('data-source-main');
    if (addToCollections.length) {
      const collectionService = new CollectionService(ctx.app.db);
      try {
        (async () => {
          mainDataSource.status = 'loading';
          const results = await collectionService.loadCollections(addToCollections);
          await ctx.app.db.getRepository('collections').create({ values: results });
          mainDataSource.status = 'loaded';
        })();
      } catch (e) {
        ctx.app.db.logger.error('Failed to add collections', {
          error: e.message,
          stack: e.stack,
        });
      }
    }
    ctx.body = true;
    await next();
  },
};
