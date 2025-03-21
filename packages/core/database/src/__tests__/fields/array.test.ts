/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('array field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should not be ambiguous', async () => {
    db.collection({
      name: 'a',
      fields: [
        {
          type: 'array',
          name: 'arr',
        },
        {
          type: 'belongsToMany',
          name: 'b',
          target: 'b',
        },
      ],
    });
    db.collection({
      name: 'b',
      fields: [
        {
          type: 'array',
          name: 'arr',
        },
      ],
    });
    await db.sync();
    const repository = db.getRepository('a');
    await repository.find({
      filter: {
        'arr.$match': ['aa'],
      },
      appends: ['b'],
    });
    await repository.find({
      filter: {
        'arr.$notMatch': ['aa'],
      },
      appends: ['b'],
    });
    await repository.find({
      filter: {
        'arr.$anyOf': ['aa'],
      },
      appends: ['b'],
    });
    await repository.find({
      filter: {
        'arr.$noneOf': ['aa'],
      },
      appends: ['b'],
    });
  });
});
