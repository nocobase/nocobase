/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('afterCreateWithAssociations', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('case 1', async () => {
    db.collection({
      name: 'test',
    });
    await db.sync();
    const repo = db.getRepository('test');
    db.on('test.afterCreateWithAssociations', async (model, { transaction }) => {
      throw new Error('test error');
    });
    try {
      await repo.create({
        values: {},
      });
    } catch (error) {
      console.log(error);
    }
    const count = await repo.count();
    expect(count).toBe(0);
  });
});
