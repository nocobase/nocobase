/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import mysql from 'mysql2';
import { BaseDialect } from './base-dialect';
import Database, { DatabaseOptions } from '../database';
import { parseBigIntValue } from '@nocobase/utils';

export class MysqlDialect extends BaseDialect {
  static dialectName = 'mysql';

  getVersionGuard() {
    return {
      sql: 'select version() as version',
      get: (v: string) => {
        const m = /([\d+.]+)/.exec(v);
        return m[0];
      },
      version: '>=8.0.17',
    };
  }

  getSequelizeOptions(options: DatabaseOptions, db: Database) {
    const dialectOptions: mysql.ConnectionOptions = {
      ...(options.dialectOptions || {}),
      supportBigNumbers: true,
      bigNumberStrings: true,
      multipleStatements: true,
      typeCast: (field, next) => {
        // @ts-ignore
        const ConnectionManager = db.sequelize.dialect.connectionManager.constructor;
        if (field.type === 'LONGLONG') {
          const val = field.string();
          return parseBigIntValue(val);
        }
        // @ts-ignore
        return ConnectionManager._typecast.bind(db.sequelize.dialect.connectionManager)(field, next);
      },
    };

    options.dialectOptions = dialectOptions;
    return options;
  }
}
