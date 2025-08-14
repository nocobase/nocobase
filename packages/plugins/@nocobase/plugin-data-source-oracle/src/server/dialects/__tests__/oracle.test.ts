/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { OracleDialect } from '../oracle-dialect';

describe('OracleDialect', () => {
  describe('getVersionGuard', () => {
    it('should return the correct version guard', () => {
      const dialect = new OracleDialect();
      const versionGuard = dialect.getVersionGuard();
      expect(versionGuard.sql).toBe('SELECT * FROM v$version');
      expect(versionGuard.version).toBe('>=12');
    });

    it('should parse the version string correctly', () => {
      const dialect = new OracleDialect();
      const versionGuard = dialect.getVersionGuard();
      const versionString = 'Oracle Database 19c Enterprise Edition Release 19.0.0.0.0 - Production';
      expect(versionGuard.get(versionString)).toBe(versionString);
    });
  });
});
