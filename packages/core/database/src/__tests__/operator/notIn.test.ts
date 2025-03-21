/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('ne operator', () => {
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

  it('should notIn with null', async () => {
    await db.getRepository('tests').create({});

    const results = await db.getRepository('tests').count({
      filter: {
        'name.$notIn': ['123'],
      },
    });

    expect(results).toEqual(1);
  });
});
