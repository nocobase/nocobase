/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parseDatabaseOptionsFromEnv } from '@nocobase/database';

describe('database helpers', () => {
  describe('parseDatabaseOptionsFromEnv()', () => {
    it('undefined pool options', async () => {
      const options1 = await parseDatabaseOptionsFromEnv();
      expect(options1).toMatchObject({
        pool: {},
      });
    });

    it('custom pool options', async () => {
      process.env.DB_POOL_MAX = '10';
      process.env.DB_POOL_MIN = '1';
      process.env.DB_POOL_IDLE = '5000';
      process.env.DB_POOL_ACQUIRE = '30000';
      process.env.DB_POOL_EVICT = '2000';
      process.env.DB_POOL_MAX_USES = '0'; // Set to 0 to test default behavior

      const options2 = await parseDatabaseOptionsFromEnv();
      expect(options2.pool).toMatchObject({
        max: 10,
        min: 1,
        idle: 5000,
        acquire: 30000,
        evict: 2000,
        maxUses: Number.POSITIVE_INFINITY, // Default value
      });
    });
  });
});
