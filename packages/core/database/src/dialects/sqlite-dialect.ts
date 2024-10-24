/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseDialect } from './base-dialect';

export class SqliteDialect extends BaseDialect {
  static dialectName = 'sqlite';

  getVersionGuard() {
    return {
      sql: 'select sqlite_version() as version',
      get: (v: string) => v,
      version: '3.x',
    };
  }
}
