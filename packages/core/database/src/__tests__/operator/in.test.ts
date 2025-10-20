/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('operator > $in', () => {
  let db: Database;
  let Test;
  beforeEach(async () => {
    db = await createMockDatabase({});
    await db.clean({ drop: true });

    Test = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('in with empty array should return 0', async () => {
    await db.getRepository('tests').create({});

    const result = await db.getRepository('tests').count({
      filter: {
        'name.$in': [],
      },
    });
    expect(result).toEqual(0);
  });

  it('in with array not contains value should return 0', async () => {
    await db.getRepository('tests').create({
      values: { name: 'test' },
    });

    const result = await db.getRepository('tests').count({
      filter: {
        'name.$in': ['test2', 'test1'],
      },
    });
    expect(result).toEqual(0);
  });

  it('in with array contains value should return 1', async () => {
    await db.getRepository('tests').create({
      values: { name: 'test' },
    });

    const result = await db.getRepository('tests').count({
      filter: {
        'name.$in': ['test', 'test1'],
      },
    });
    expect(result).toEqual(1);
  });

  it('in with null should not throw error', async () => {
    await db.getRepository('tests').create({});

    await expect(
      db.getRepository('tests').count({
        filter: {
          'name.$in': null,
        },
      }),
    ).resolves.not.toThrow();
  });
});
