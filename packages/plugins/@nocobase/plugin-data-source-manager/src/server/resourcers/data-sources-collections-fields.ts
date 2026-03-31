/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';

export default {
  name: 'dataSourcesCollections.fields',
  actions: {
    async list(ctx, next) {
      const { associatedIndex: collectionNameWithDataSourceKey } = ctx.action.params;
      const [dataSourceKey, collectionName] = collectionNameWithDataSourceKey.split('.');

      const dataSource = ctx.app.dataSourceManager.dataSources.get(dataSourceKey);
      const collection = dataSource.collectionManager.getCollection(collectionName);

      const fields = collection.getFields();

      ctx.body = lodash.sortBy(
        fields.map((field) => field.options),
        'name',
      );

      await next();
    },

    async get(ctx, next) {
      const { associatedIndex: collectionNameWithDataSourceKey, filterByTk: name } = ctx.action.params;
      const [dataSourceKey, collectionName] = collectionNameWithDataSourceKey.split('.');

      const dataSource = ctx.app.dataSourceManager.dataSources.get(dataSourceKey);
      const collection = dataSource.collectionManager.getCollection(collectionName);

      const field = collection.getField(name);

      ctx.body = field.options;

      await next();
    },

    async update(ctx, next) {
      const { associatedIndex: collectionNameWithDataSourceKey, filterByTk: name, values } = ctx.action.params;
      const [dataSourceKey, collectionName] = collectionNameWithDataSourceKey.split('.');

      const mainDb = ctx.app.db;

      let fieldRecord = await mainDb.getRepository('dataSourcesFields').findOne({
        filter: {
          name,
          collectionName,
          dataSourceKey,
        },
      });
      if (values.possibleTypes) {
        delete values.possibleTypes;
      }
      if (!fieldRecord) {
        fieldRecord = await mainDb.getRepository('dataSourcesFields').create({
          values: {
            ...values,
            name,
            collectionName: collectionName,
            dataSourceKey,
          },
        });
      } else {
        fieldRecord = (
          await mainDb.getRepository('dataSourcesFields').update({
            filter: {
              name,
              collectionName,
              dataSourceKey,
            },
            values,
          })
        )[0];
      }

      const field = ctx.app.dataSourceManager.dataSources
        .get(dataSourceKey)
        .collectionManager.getCollection(collectionName)
        .getField(fieldRecord.get('name'));

      ctx.body = field.options;

      await next();
    },

    async create(ctx, next) {
      const { associatedIndex: collectionNameWithDataSourceKey, values } = ctx.action.params;
      const [dataSourceKey, collectionName] = collectionNameWithDataSourceKey.split('.');

      const mainDb = ctx.app.db;

      const name = values.name;
      if (
        await mainDb.getRepository('dataSourcesFields').findOne({
          filter: {
            name,
            collectionName,
            dataSourceKey,
          },
        })
      ) {
        throw new Error(
          `Field name ${name} already exists in collection ${collectionName} of data source ${dataSourceKey}`,
        );
      }
      if (values.possibleTypes) {
        delete values.possibleTypes;
      }
      const fieldRecord = await mainDb.getRepository('dataSourcesFields').create({
        values: {
          ...values,
          collectionName,
          dataSourceKey,
        },
      });

      ctx.body = fieldRecord.toJSON();

      await next();
    },

    async destroy(ctx, next) {
      const { associatedIndex: collectionNameWithDataSourceKey, filterByTk: name } = ctx.action.params;
      const [dataSourceKey, collectionName] = collectionNameWithDataSourceKey.split('.');

      const mainDb = ctx.app.db;

      const fieldRecord = await mainDb.getRepository('dataSourcesFields').findOne({
        filter: {
          name,
          collectionName,
          dataSourceKey,
        },
      });

      if (fieldRecord) {
        await fieldRecord.destroy();
      }

      ctx.body = 'ok';

      await next();
    },
  },
};
