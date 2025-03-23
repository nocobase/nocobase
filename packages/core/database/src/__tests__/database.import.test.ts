/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import path from 'path';

describe('database', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('import', async () => {
    await db.import({
      directory: path.resolve(__dirname, './fixtures/c0'),
    });
    await db.import({
      directory: path.resolve(__dirname, './fixtures/c1'),
    });
    await db.import({
      directory: path.resolve(__dirname, './fixtures/c2'),
    });

    const test = db.getCollection('tests');

    expect(test.getField('n0')).toBeDefined();
    expect(test.getField('n1')).toBeDefined();
    expect(test.getField('n2')).toBeDefined();
  });
});
