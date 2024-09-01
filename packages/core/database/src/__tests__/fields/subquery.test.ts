/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, mockDatabase } from '@nocobase/database';

describe('subquery', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      timezone: '+08:00',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should query subquery field value', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ name: 'subquery1', type: 'subquery', sql: `SELECT 1+1` }],
    });

    await db.sync();

    await Test.repository.create({});

    const instance = await Test.repository.findOne();

    expect(instance.get('subquery1')).toEqual(2);
  });
});
