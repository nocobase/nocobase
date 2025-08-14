/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseDialect, DialectVersionGuard } from '@nocobase/database';

export class SqlServerDialect extends BaseDialect {
  static dialectName = 'mssql';

  getVersionGuard(): DialectVersionGuard {
    return {
      sql: `SELECT @@VERSION as version;`,
      get: (v) => v.match(/Microsoft SQL Server\s(20(17|19|22|24))?/)[0],
      version: '>=2017',
    };
  }
}
