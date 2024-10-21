/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, DatabaseOptions } from '../database';
import semver from 'semver';

export interface DialectVersionGuard {
  sql: string;
  get: (v: string) => string;
  version: string;
}

export abstract class BaseDialect {
  static dialectName: string;

  getSequelizeOptions(options: DatabaseOptions) {
    return options;
  }

  async checkDatabaseVersion(db: Database): Promise<boolean> {
    const versionGuard = this.getVersionGuard();

    const result = await db.sequelize.query(versionGuard.sql, {
      type: 'SELECT',
    });

    // @ts-ignore
    const version = versionGuard.get(result?.[0]?.version);

    const versionResult = semver.satisfies(version, versionGuard.version);

    if (!versionResult) {
      throw new Error(
        `to use ${(this.constructor as typeof BaseDialect).dialectName}, please ensure the version is ${
          versionGuard.version
        }, current version is ${version}`,
      );
    }

    return true;
  }

  getVersionGuard(): DialectVersionGuard {
    throw new Error('not implemented');
  }
}
