/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('uuid field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create uuid field', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          name: 'uuid',
          type: 'uuid',
          allowNull: false,
        },
      ],
    });

    await Test.sync();
    const item = await Test.model.create();

    expect(item['uuid']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should filter uuid field', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ type: 'uuid', name: 'uuid' }],
    });

    await Test.sync();

    const item1 = await Test.model.create();

    const result = await Test.repository.find({
      filter: {
        uuid: { $includes: [item1['uuid']] },
      },
    });

    expect(result.length).toBe(1);
  });

  it('should set autofill attribute', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          name: 'uuid',
          type: 'uuid',
          autoFill: false,
        },
      ],
    });

    await Test.sync();
    const item = await Test.model.create();
    expect(item['uuid']).toBeFalsy();
  });
});
