/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { createMockDatabase } from '@nocobase/database';

describe('database utils', () => {
  let db: Database;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase({});

    await db.clean({ drop: true });
  });

  it.runIf(process.env['DB_DIALECT'] === 'postgres')('should get database schema', async () => {
    const schema = process.env['DB_SCHEMA'] || 'public';
    expect(db.utils.schema()).toEqual(schema);
  });
});
