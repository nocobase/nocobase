/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { SQLiteFormatter } from '../formatter/sqlite-formatter';
import { QueryParser } from './query-parser';

export class SQLiteQueryParser extends QueryParser {
  declare formatter: SQLiteFormatter;

  constructor(db: Database) {
    super(db);
    this.formatter = new SQLiteFormatter(db.sequelize);
  }
}
