/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SqlServerDataSource } from '../sql-server';
import sql from 'mssql';

jest.mock('mssql', () => {
  const pool = {
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
  return {
    ConnectionPool: jest.fn(() => pool),
  };
});

describe('SqlServerDataSource', () => {
  describe('testConnection', () => {
    it('should return true if the connection is successful', async () => {
      const result = await SqlServerDataSource.testConnection({});
      expect(result).toBe(true);
    });
  });
});
