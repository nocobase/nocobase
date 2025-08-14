/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SqlServerDialect } from '../sql-server';

describe('SqlServerDialect', () => {
  describe('getVersionGuard', () => {
    it('should return the correct version guard', () => {
      const dialect = new SqlServerDialect();
      const versionGuard = dialect.getVersionGuard();
      expect(versionGuard.sql).toBe('SELECT @@VERSION as version;');
      expect(versionGuard.version).toBe('>=2017');
    });

    it('should parse the version string correctly', () => {
      const dialect = new SqlServerDialect();
      const versionGuard = dialect.getVersionGuard();
      const versionString =
        'Microsoft SQL Server 2019 (RTM) - 15.0.2000.5 (X64)   Sep 24 2019 13:48:23   Copyright (C) 2019 Microsoft Corporation  Developer Edition (64-bit) on Windows 10 Pro 10.0 <X64> (Build 19042: )';
      expect(versionGuard.get(versionString)).toBe('Microsoft SQL Server 2019');
    });
  });
});
