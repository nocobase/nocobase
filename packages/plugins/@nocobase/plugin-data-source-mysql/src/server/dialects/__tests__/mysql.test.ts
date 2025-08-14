/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MySqlDialect } from '../mysql-dialect';

describe('MySqlDialect', () => {
  describe('getVersionGuard', () => {
    it('should return the correct version guard', () => {
      const dialect = new MySqlDialect();
      const versionGuard = dialect.getVersionGuard();
      expect(versionGuard.sql).toBe('SELECT VERSION() as version;');
      expect(versionGuard.version).toBe('>=5.7');
    });

    it('should parse the version string correctly', () => {
      const dialect = new MySqlDialect();
      const versionGuard = dialect.getVersionGuard();
      const versionString = '8.0.27';
      expect(versionGuard.get(versionString)).toBe('8.0.27');
    });
  });
});
