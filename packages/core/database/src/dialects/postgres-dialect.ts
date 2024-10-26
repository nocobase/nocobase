/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import semver from 'semver';
import { BaseDialect } from './base-dialect';

export class PostgresDialect extends BaseDialect {
  static dialectName = 'postgres';

  getSequelizeOptions(options: any) {
    if (!options.hooks) {
      options.hooks = {};
    }

    if (!options.hooks['afterConnect']) {
      options.hooks['afterConnect'] = [];
    }

    options.hooks['afterConnect'].push(async (connection) => {
      await connection.query('SET search_path TO public;');
    });

    return options;
  }

  getVersionGuard() {
    return {
      sql: 'select version() as version',
      get: (v: string) => {
        const m = /([\d+.]+)/.exec(v);
        return semver.minVersion(m[0]).version;
      },
      version: '>=10',
    };
  }
}
