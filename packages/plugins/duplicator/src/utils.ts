import lodash from 'lodash';
import { Database } from '@nocobase/database';

export const DUMPED_EXTENSION = 'nbdump';

export function sqlAdapter(database: Database, sql: string) {
  if (database.sequelize.getDialect() === 'mysql') {
    return lodash.replace(sql, /"/g, '`');
  }

  return sql;
}
