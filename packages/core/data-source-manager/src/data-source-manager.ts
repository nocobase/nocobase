/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ToposortOptions } from '@nocobase/utils';
import { DataSource } from './data-source';
import { DataSourceFactory } from './data-source-factory';
import { createConsoleLogger, createLogger, Logger, LoggerOptions } from '@nocobase/logger';

type DataSourceHook = (dataSource: DataSource) => void;

type DataSourceManagerOptions = {
  logger?: LoggerOptions | Logger;
  app?: any;
};

export class DataSourceManager {
  dataSources: Map<string, DataSource>;
  /**
   * @internal
   */
  factory: DataSourceFactory = new DataSourceFactory();
  protected middlewares = [];
  private onceHooks: Array<DataSourceHook> = [];
  private beforeAddHooks: Array<DataSourceHook> = [];

  constructor(public options: DataSourceManagerOptions = {}) {
    this.dataSources = new Map();
    this.middlewares = [];

    if (options.app) {
      options.app.on('beforeStop', async () => {
        for (const dataSource of this.dataSources.values()) {
          await dataSource.close();
        }
      });
    }
  }

  get(dataSourceKey: string) {
    return this.dataSources.get(dataSourceKey);
  }

  async add(dataSource: DataSource, options: any = {}) {
    let logger;

    if (this.options.logger) {
      if (typeof this.options.logger['log'] === 'function') {
        logger = this.options.logger as Logger;
      } else {
        logger = createLogger(this.options.logger);
      }
    } else {
      logger = createConsoleLogger();
    }

    dataSource.setLogger(logger);

    for (const hook of this.beforeAddHooks) {
      hook(dataSource);
    }

    const oldDataSource = this.dataSources.get(dataSource.name);

    if (oldDataSource) {
      await oldDataSource.close();
    }

    await dataSource.load(options);
    this.dataSources.set(dataSource.name, dataSource);

    for (const hook of this.onceHooks) {
      hook(dataSource);
    }
  }

  use(fn: any, options?: ToposortOptions) {
    this.middlewares.push([fn, options]);
  }

  middleware() {
    const self = this;

    return async function dataSourceManager(ctx, next) {
      const name = ctx.get('x-data-source') || 'main';

      if (!self.dataSources.has(name)) {
        ctx.throw(`data source ${name} does not exist`);
      }

      const ds = self.dataSources.get(name);
      ctx.dataSource = ds;

      const composedFn = ds.middleware(self.middlewares);
      return composedFn(ctx, next);
    };
  }

  registerDataSourceType(type: string, DataSourceClass: typeof DataSource) {
    this.factory.register(type, DataSourceClass);
  }

  getDataSourceType(type: string): typeof DataSource | undefined {
    return this.factory.getClass(type);
  }

  buildDataSourceByType(type: string, options: any = {}): DataSource {
    return this.factory.create(type, options);
  }

  beforeAddDataSource(hook: DataSourceHook) {
    this.beforeAddHooks.push(hook);
    for (const dataSource of this.dataSources.values()) {
      hook(dataSource);
    }
  }

  afterAddDataSource(hook: DataSourceHook) {
    this.addHookAndRun(hook);
  }

  private addHookAndRun(hook: DataSourceHook) {
    this.onceHooks.push(hook);
    for (const dataSource of this.dataSources.values()) {
      hook(dataSource);
    }
  }
}
