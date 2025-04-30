/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';
import { vi } from 'vitest';

describe('update through', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should not be reset', async () => {
    db.collection({
      name: 'c',
      autoGenId: true,
      fields: [
        {
          name: 'id',
          type: 'integer',
          primaryKey: true,
          autoIncrement: true,
        },
      ],
    });
    db.collection({
      name: 'a',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'b',
          target: 'b',
          through: 'c',
        },
      ],
    });
    db.collection({
      name: 'b',
      fields: [],
    });
    await db.sync();
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    db.on('c.afterCreate', callback1);
    db.on('c.afterBulkCreate', callback2);
    const b = await db.getRepository('b').create({
      values: {},
    });
    const a = await db.getRepository('a').create({
      values: {
        b: [b.toJSON()],
      },
    });
    const c1 = await db.getRepository('c').findOne();
    await db.getRepository('a').update({
      filterByTk: a.id,
      values: {
        b: [b.toJSON()],
      },
    });

    const c2 = await db.getRepository('c').findOne();
    expect(c1.get('id')).toBe(c2.get('id'));
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
