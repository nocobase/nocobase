/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('find collection that without primary key', () => {
  let db: Database;

  beforeAll(async () => {
    db = await createMockDatabase({
      tablePrefix: '',
    });

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should find collection with belongsTo', async () => {
    const B = db.collection({
      name: 'b',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    const A = db.collection({
      name: 'a',
      autoGenId: false,
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsTo',
          name: 'b',
          target: 'b',
          foreignKey: 'b_id',
        },
      ],
    });

    await db.sync();

    const b1 = await B.repository.create({
      values: {
        name: 'b1',
      },
    });

    await A.repository.create({
      values: {
        name: 'a1',
        b_id: b1.get('id'),
      },
    });

    const aWithB = await A.repository.find({
      appends: ['b'],
      filter: {
        'b.name': 'b1',
      },
    });

    expect(aWithB[0].get('b').get('name')).toBe('b1');
  });
});
