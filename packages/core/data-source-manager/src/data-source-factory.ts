/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource } from './data-source';
import { DataSourceManager } from './data-source-manager';
import { DataSourceConstructor } from './types';

export class DataSourceFactory {
  public collectionTypes: Map<string, DataSourceConstructor> = new Map();

  constructor(protected dataSourceManager: DataSourceManager) {}

  register(type: string, dataSourceClass: DataSourceConstructor) {
    this.collectionTypes.set(type, dataSourceClass);
  }

  getClass<T extends DataSource = DataSource>(type: string): DataSourceConstructor<T> {
    return this.collectionTypes.get(type) as DataSourceConstructor<T>;
  }

  create<T extends DataSource = DataSource>(type: string, options: any = {}): T {
    const klass = this.getClass<T>(type);
    if (!klass) {
      throw new Error(`Data source type "${type}" not found`);
    }
    const environment = this.dataSourceManager.options.app?.environment;
    const { logger, sqlLogger, databaseInstance, ...others } = options;

    const opts = { logger, sqlLogger, databaseInstance, ...others };

    if (environment) {
      Object.assign(opts, environment.renderJsonTemplate(others));
    }
    const dataSource = new klass(opts);
    dataSource.setDataSourceManager(this.dataSourceManager);
    return dataSource;
  }
}
