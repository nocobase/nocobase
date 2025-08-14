/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PostgreSqlDataSource } from '../postgresql';
import { Pool } from 'pg';

jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn().mockResolvedValue({
      release: jest.fn(),
    }),
    end: jest.fn(),
  };
  return {
    Pool: jest.fn(() => mPool),
  };
});

describe('PostgreSqlDataSource', () => {
  describe('testConnection', () => {
    it('should return true if the connection is successful', async () => {
      const result = await PostgreSqlDataSource.testConnection({});
      expect(result).toBe(true);
    });
  });
});
