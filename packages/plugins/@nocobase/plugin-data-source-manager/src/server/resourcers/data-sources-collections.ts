/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { filterMatch } from '@nocobase/database';
import type { Transaction } from 'sequelize';

function isExtractedField(field: { key?: string; name?: string; rawType?: string }) {
  return field?.key == null && typeof field?.rawType === 'string' && typeof field.name === 'string';
}

export default {
  name: 'dataSources.collections',
  actions: {
    async list(ctx, next) {
      const params = ctx.action.params;

      const { associatedIndex: dataSourceKey } = params;
      const dataSource = ctx.app.dataSourceManager.dataSources.get(dataSourceKey);
      const plugin: any = ctx.app.pm.get('data-source-manager');

      const dataSourceStatus = plugin.dataSourceStatus[dataSourceKey];

      if (dataSourceStatus === 'loading-failed') {
        const error = plugin.dataSourceErrors[dataSourceKey];
        if (error) {
          throw new Error(`dataSource ${dataSourceKey} loading failed: ${error.message}`);
        }

        throw new Error(`dataSource ${dataSourceKey} loading failed`);
      }

      if (['loading', 'reloading'].includes(dataSourceStatus)) {
        const progress = plugin.dataSourceLoadingProgress[dataSourceKey];

        if (progress) {
          throw new Error(`dataSource ${dataSourceKey} is ${dataSourceStatus} (${progress.loaded}/${progress.total})`);
        }

        throw new Error(`dataSource ${dataSourceKey} is ${dataSourceStatus}`);
      }

      if (!dataSource) {
        throw new Error(`dataSource ${dataSourceKey} not found`);
      }

      const { paginate, filter = {} } = ctx.action.params;

      const collections = lodash.sortBy(
        dataSource.collectionManager.getCollections().filter((collection) => {
          return filterMatch(collection.options, filter);
        }),
        'name',
      );

      const mapCollection = (collections) => {
        return collections.map((collection) => {
          return {
            ...collection.options,
            fields: collection.getFields().map((field) => field.options),
          };
        });
      };

      if (paginate === false || paginate === 'false') {
        ctx.body = mapCollection(collections);
      } else {
        const { page = 1, pageSize = 20 } = ctx.action.params;

        ctx.withoutDataWrapping = true;

        ctx.body = {
          data: mapCollection(collections.slice((page - 1) * pageSize, page * pageSize)),
          meta: {
            count: collections.length,
            page,
            pageSize,
            totalPage: Math.ceil(collections.length / pageSize),
          },
        };
      }

      await next();
    },

    async update(ctx, next) {
      const params = ctx.action.params;
      const { filterByTk: collectionName, associatedIndex: dataSourceKey } = params;

      const collections = ctx.db.getRepository('dataSourcesCollections');
      const filter = { name: collectionName, dataSourceKey };
      const fields = params.values?.fields;
      const HttpDataSource = ctx.app.dataSourceManager.factory.getClass('http');
      const hasExtractedFields =
        HttpDataSource &&
        ctx.app.dataSourceManager.get(dataSourceKey) instanceof HttpDataSource &&
        Array.isArray(fields) &&
        fields.some(isExtractedField);

      const saveCollection = async (transaction?: Transaction) => {
        const collection = await collections.findOne({ filter, transaction, lock: Boolean(hasExtractedFields) });
        if (!collection) {
          await collections.create({ values: { ...params.values, ...filter }, transaction });
          return;
        }

        let values = params.values;
        if (hasExtractedFields) {
          // Extraction produces fresh metadata without keys. Reuse saved fields just as extraction without clearing does.
          const savedFields = await ctx.db.getRepository('dataSourcesFields').find({
            filter: {
              dataSourceKey: collection.get('dataSourceKey'),
              collectionName: collection.get('name'),
              name: fields.filter(isExtractedField).map((field) => field.name),
            },
            fields: ['key', 'name'],
            transaction,
          });
          const keysByName = new Map(savedFields.map((field) => [field.get('name'), field.get('key')]));
          values = {
            ...values,
            fields: fields.map((field) => (isExtractedField(field) ? keysByName.get(field.name) ?? field : field)),
          };
        }

        await collections.update({ filter, values, updateAssociationValues: ['fields'], transaction });
      };

      if (hasExtractedFields) {
        await ctx.db.sequelize.transaction(saveCollection);
      } else {
        await saveCollection();
      }

      const dataSourceCollectionRecord = await collections.findOne({ filter });
      ctx.body = dataSourceCollectionRecord.toJSON();

      await next();
    },
  },
};
