/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '../database';
import MysqlQueryInterface from '../query-interface/mysql-query-interface';
import QueryInterface from '../query-interface/query-interface';
import { BaseDialect } from './base-dialect';

export class MariadbDialect extends BaseDialect {
  static dialectName = 'mariadb';

  static getQueryInterface(db: Database): QueryInterface {
    return new MysqlQueryInterface(db);
  }

  getVersionGuard() {
    return {
      sql: 'select version() as version',
      get: (v: string) => {
        const m = /([\d+.]+)/.exec(v);
        return m[0];
      },
      version: '>=10.9',
    };
  }
}
