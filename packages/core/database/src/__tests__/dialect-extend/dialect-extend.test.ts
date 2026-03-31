/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseDialect, Database, createMockDatabase } from '@nocobase/database';

describe('dialect extend', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should register dialect', async () => {
    class SubDialect extends BaseDialect {
      static dialectName = 'test';

      async checkDatabaseVersion(db: Database): Promise<boolean> {
        return true;
      }
    }

    Database.registerDialect(SubDialect);
    expect(Database.getDialect('test')).toBe(SubDialect);
  });
});
