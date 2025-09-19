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

export async function loadDataSourceTablesIntoCollections(ctx: Context, next: Next) {
  const { actionName, resourceName, params } = ctx.action;
  if (resourceName === 'dataSources' && (actionName === 'create' || actionName === 'update')) {
    const { filterByTk: dataSourceKey } = params;
    const { options, type, collections } = params.values || {};
    let dataSource: DatabaseDataSource;
    if (actionName === 'create') {
      dataSource = ctx.app.dataSourceManager.factory.create(type, {
        name: dataSourceKey,
        ...options,
      }) as DatabaseDataSource;
    } else {
      dataSource = ctx.app.dataSourceManager.dataSources.get(dataSourceKey) as DatabaseDataSource;
      if (!dataSource) {
        throw new Error(`dataSource ${dataSourceKey} not found`);
      }
    }
    if (options?.addAllCollections) {
      const allTables = await dataSource.introspector.getTables();
      if (allTables.length > ALLOW_MAX_COLLECTIONS_COUNT) {
        throw new Error(
          `The number of collections exceeds the limit of ${ALLOW_MAX_COLLECTIONS_COUNT}. Please remove some collections before adding new ones.`,
        );
      }
    } else {
      await dataSource.loadTables(ctx, collections);
    }
    if (collections) {
      delete ctx.action.params.values.collections;
    }
  }
  await next();
}
