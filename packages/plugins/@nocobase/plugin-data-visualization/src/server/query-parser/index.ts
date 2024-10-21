/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { SQLiteQueryParser } from './sqlite-query-parser';
import { PostgresQueryParser } from './postgres-query-parser';
import { MySQLQueryParser } from './mysql-query-parser';
import { QueryParser } from './query-parser';
import { OracleQueryParser } from './oracle-query-parser';

export const createQueryParser = (db: Database) => {
  const dialect = db.sequelize.getDialect();
  switch (dialect) {
    case 'sqlite':
      return new SQLiteQueryParser(db);
    case 'postgres':
      return new PostgresQueryParser(db);
    case 'mysql':
    case 'mariadb':
      return new MySQLQueryParser(db);
    case 'oracle':
      return new OracleQueryParser(db);
    default:
      return new QueryParser(db);
  }
};
