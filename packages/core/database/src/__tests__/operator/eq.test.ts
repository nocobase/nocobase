/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

describe('eq operator', () => {
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

  it('should eq with array', async () => {
    await db.getRepository('tests').create({
      values: [{ name: '123' }, { name: '234' }, { name: '345' }],
    });

    const results = await db.getRepository('tests').count({
      filter: {
        'name.$eq': ['123', '234'],
      },
    });

    expect(results).toEqual(2);
  });

  it('should eq with array', async () => {
    await db.getRepository('tests').create({
      values: [{ name: '123' }, { name: '234' }, { name: '345' }],
    });

    const results = await db.getRepository('tests').count({
      filter: {
        'name.$eq': '123',
      },
    });

    expect(results).toEqual(1);
  });

  it('should eq with array', async () => {
    await db.getRepository('tests').create({
      values: [{ name: '123' }, { name: '234' }, { name: '345' }],
    });

    const results = await db.getRepository('tests').count({
      filter: {
        'name.$eq': '456',
      },
    });

    expect(results).toEqual(0);
  });
});
