/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MySqlDataSource } from '../mysql';
import mysql from 'mysql2/promise';

jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn().mockResolvedValue({
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('MySqlDataSource', () => {
  describe('testConnection', () => {
    it('should return true if the connection is successful', async () => {
      const result = await MySqlDataSource.testConnection({});
      expect(result).toBe(true);
    });
  });
});
