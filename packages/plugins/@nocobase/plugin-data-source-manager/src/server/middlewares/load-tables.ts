/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { DatabaseDataSource } from '@nocobase/data-source-manager';
import { ALLOW_MAX_COLLECTIONS_COUNT } from '../constants';
import { DataSourceModel } from '../models/data-source';
import _ from 'lodash';

export async function loadDataSourceTablesIntoCollections(ctx: Context, next: Next) {
  const dataSourcesRepo = ctx.app.db.getRepository('dataSources');
  const { actionName, resourceName, params } = ctx.action;
  if (resourceName === 'dataSources' && (actionName === 'create' || actionName === 'update')) {
    const { options, type, collections, key } = params.values || {};
    const dataSource: DatabaseDataSource = ctx.app.dataSourceManager.factory.create(type, {
      name: key,
      ...options,
    });
    dataSource.setLogger(ctx.logger);
    if (!(dataSource instanceof DatabaseDataSource)) {
      return next();
    }
    if (options?.addAllCollections) {
      const allTables = await dataSource.introspector.getTables();
      if (allTables.length > ALLOW_MAX_COLLECTIONS_COUNT) {
        throw new Error(
          `The number of collections exceeds the limit of ${ALLOW_MAX_COLLECTIONS_COUNT}. Please remove some collections before adding new ones.`,
        );
      }
    } else {
      if (actionName === 'update') {
        const model: DataSourceModel = await dataSourcesRepo.findByTargetKey(key);
        if (_.isEqual(model.get('options'), options)) {
          await ctx.app.dataSourceManager.get(key).loadTables(ctx, collections);
        } else {
          await dataSource.loadTables(ctx, collections);
        }
      } else {
        await dataSource.loadTables(ctx, collections);
      }
    }
    if (collections) {
      delete ctx.action.params.values.collections;
    }
  }
  await next();
}
