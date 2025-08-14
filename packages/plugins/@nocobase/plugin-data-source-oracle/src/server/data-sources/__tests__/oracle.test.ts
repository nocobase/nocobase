/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { OracleDataSource } from '../oracle';
import oracledb from 'oracledb';

jest.mock('oracledb', () => ({
  getConnection: jest.fn().mockResolvedValue({
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('OracleDataSource', () => {
  describe('testConnection', () => {
    it('should return true if the connection is successful', async () => {
      const result = await OracleDataSource.testConnection({});
      expect(result).toBe(true);
    });
  });
});
