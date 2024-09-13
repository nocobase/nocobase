/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Sequelize } from 'sequelize';
import { SQLiteFormatter } from './sqlite-formatter';
import { PostgresFormatter } from './postgres-formatter';
import { MySQLFormatter } from './mysql-formatter';

export const createFormatter = (sequelize: Sequelize) => {
  const dialect = sequelize.getDialect();
  switch (dialect) {
    case 'sqlite':
      return new SQLiteFormatter(sequelize);
    case 'postgres':
      return new PostgresFormatter(sequelize);
    case 'mysql':
    case 'mariadb':
      return new MySQLFormatter(sequelize);
  }
};
