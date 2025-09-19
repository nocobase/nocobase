/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { DatabaseIntrospector } from './database-introspector/database-introspector';
import { PostgresIntrospector } from './database-introspector/postgres-introspector';
import { MariaDBIntrospector } from './database-introspector/mariadb-introspector';
import { DataSource } from './data-source';
import { Context } from '@nocobase/actions';

export abstract class DatabaseDataSource<T extends DatabaseIntrospector = DatabaseIntrospector> extends DataSource {
  declare introspector: T;

  createDatabaseIntrospector(db: Database): T {
    if (db.isPostgresCompatibleDialect()) {
      return new PostgresIntrospector({
        db,
      }) as unknown as T;
    }
    const dialect = db.sequelize.getDialect();
    switch (dialect) {
      case 'mariadb':
        return new MariaDBIntrospector({
          db,
        }) as T;
      default:
        return new DatabaseIntrospector({
          db,
        }) as T;
    }
  }

  abstract readTables(): Promise<any>;
  abstract loadTables(ctx: Context, tables: string[]): Promise<void>;
}
