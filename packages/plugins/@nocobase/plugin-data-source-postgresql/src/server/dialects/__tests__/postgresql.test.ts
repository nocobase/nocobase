/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PostgreSqlDialect } from '../postgresql-dialect';

describe('PostgreSqlDialect', () => {
  describe('getVersionGuard', () => {
    it('should return the correct version guard', () => {
      const dialect = new PostgreSqlDialect();
      const versionGuard = dialect.getVersionGuard();
      expect(versionGuard.sql).toBe('SELECT version()');
      expect(versionGuard.version).toBe('>=10');
    });

    it('should parse the version string correctly', () => {
      const dialect = new PostgreSqlDialect();
      const versionGuard = dialect.getVersionGuard();
      const versionString = 'PostgreSQL 13.4 (Debian 13.4-1.pgdg100+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 8.3.0-6) 8.3.0, 64-bit';
      expect(versionGuard.get(versionString)).toBe(versionString);
    });
  });
});
