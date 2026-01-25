/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { DataSourceModel } from '../models/data-source';
import { mapDataSourceWithCollection } from '../utils';
import { DataSourceManager, DatabaseDataSource } from '@nocobase/data-source-manager';

const canRefreshStatus = ['loaded', 'loading-failed', 'reloading-failed'];

export default {
  async ['dataSources:listEnabled'](ctx: Context, next: Next) {
    const dataSources = await ctx.db.getRepository('dataSources').find({
      filter: {
        enabled: true,
        'type.$ne': 'main',
      },
    });

    ctx.body = dataSources.map((dataSourceModel: DataSourceModel) => {
      return mapDataSourceWithCollection(ctx.app, dataSourceModel);
    });

    await next();
  },

  async ['dataSources:testConnection'](ctx: Context, next: Next) {
    const { values } = ctx.action.params;

    const { options, type } = values;

    const klass = ctx.app.dataSourceManager.factory.getClass(type);

    try {
      await klass.testConnection(ctx.app.environment.renderJsonTemplate(options));
    } catch (error) {
      throw new Error(`Test connection failed: ${error.message}`);
    }

    ctx.body = {
      success: true,
    };

    await next();
  },

  async ['dataSources:refresh'](ctx: Context, next: Next) {
    const plugin = ctx.app.pm.get('data-source-manager');
    const { filterByTk, clientStatus } = ctx.action.params;

    const dataSourceModel: DataSourceModel = await ctx.db.getRepository('dataSources').findOne({
      filter: {
        key: filterByTk,
      },
    });

    const currentStatus = plugin.dataSourceStatus[filterByTk];

    if (
      canRefreshStatus.includes(currentStatus) &&
      (clientStatus ? clientStatus && canRefreshStatus.includes(clientStatus) : true)
    ) {
      dataSourceModel.loadIntoApplication({
        app: ctx.app,
        refresh: true,
        reuseDB: true,
      });

      ctx.app.syncMessageManager.publish(plugin.name, {
        type: 'loadDataSource',
        dataSourceKey: dataSourceModel.get('key'),
      });
    }

    ctx.body = {
      status: plugin.dataSourceStatus[filterByTk],
    };

    await next();
  },

  async ['dataSources:readTables'](ctx: Context, next: Next) {
    const { dataSourceKey, dbOptions } = ctx.action.params.values || {};
    const dataSourceManager = ctx.app.dataSourceManager as DataSourceManager;
    let dataSource: DatabaseDataSource;
    if (dbOptions) {
      dataSource = dataSourceManager.factory.create(dbOptions.type, {
        name: dataSourceKey,
        ...dbOptions,
      }) as DatabaseDataSource;
    } else {
      dataSource = dataSourceManager.dataSources.get(dataSourceKey) as DatabaseDataSource;
      if (!dataSource) {
        throw new Error(`dataSource ${dataSourceKey} not found`);
      }
    }
    const tables = await dataSource.readTables();
    ctx.body = tables;
    await next();
  },

  async ['dataSources:loadTables'](ctx: Context, next: Next) {
    const { dataSourceKey, tables } = ctx.action.params.values || {};
    const dataSourceManager = ctx.app.dataSourceManager as DataSourceManager;
    const dataSource = dataSourceManager.dataSources.get(dataSourceKey) as DatabaseDataSource;
    if (!dataSource) {
      throw new Error(`dataSource ${dataSourceKey} not found`);
    }
    await dataSource.loadTables(ctx, tables);
    await next();
  },
};
