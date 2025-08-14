/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseDialect, DialectVersionGuard } from '@nocobase/database';

export class OracleDialect extends BaseDialect {
  static dialectName = 'oracle';

  getVersionGuard(): DialectVersionGuard {
    return {
      sql: `SELECT * FROM v$version`,
      get: (v) => v,
      version: '>=12',
    };
  }
}
