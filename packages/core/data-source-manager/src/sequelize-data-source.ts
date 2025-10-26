/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { DataSourceOptions } from './data-source';
import { DatabaseDataSource } from './database-data-source';
import { DatabaseIntrospector } from './database-introspector/database-introspector';
import { SequelizeCollectionManager } from './sequelize-collection-manager';

export class SequelizeDataSource<T extends DatabaseIntrospector = DatabaseIntrospector> extends DatabaseDataSource<T> {
  declare collectionManager: SequelizeCollectionManager;

  constructor(options: DataSourceOptions) {
    super(options);
    this.introspector = this.createDatabaseIntrospector(this.collectionManager.db);
  }

  createCollectionManager(options?: any) {
    return new SequelizeCollectionManager(options.collectionManager);
  }

  async readTables(): Promise<any> {
    return;
  }
  async loadTables(ctx: Context, tables: string[]): Promise<any> {
    return;
  }
}
