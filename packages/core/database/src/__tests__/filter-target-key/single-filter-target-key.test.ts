/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { createMockDatabase } from '@nocobase/database';

describe('single filter target key', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should update by filter target key', async () => {
    const Student = db.collection({
      name: 'students',
      autoGenId: false,
      filterTargetKey: ['name'],
      fields: [
        {
          name: 'name',
          type: 'string',
          primaryKey: true,
        },
        {
          name: 'age',
          type: 'integer',
        },
      ],
    });

    await db.sync();

    const s1 = await Student.repository.create({
      values: {
        name: 's1',
        age: 10,
      },
    });

    const s2 = await Student.repository.create({
      values: {
        name: 's2',
        age: 10,
      },
    });

    const s3 = await Student.repository.create({
      values: {
        name: 's3',
        age: 10,
      },
    });

    await Student.repository.update({
      filter: {
        name: 's3',
      },
      values: {
        age: 20,
      },
    });

    await s3.reload();

    expect(s3.age).toBe(20);

    const s3Instance = await Student.repository.findOne({
      filterByTk: 's3',
    });

    expect(s3Instance.age).toBe(20);
  });
});
