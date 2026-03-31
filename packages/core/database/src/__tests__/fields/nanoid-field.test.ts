/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('nanoid field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create nanoid field type', async () => {
    const Test = db.collection({
      name: 'tests',
      autoGenId: false,
      fields: [
        {
          type: 'nanoid',
          name: 'id',
          primaryKey: true,
          size: 21,
          customAlphabet: '1234567890abcdef',
        },
        {
          type: 'nanoid',
          name: 'id2',
        },
      ],
    });
    await Test.sync();
    const test = await Test.model.create();
    expect(test.id).toHaveLength(21);
    expect(test.id2).toHaveLength(12);
  });

  it('should set autofill attribute', async () => {
    const Test = db.collection({
      name: 'tests',
      autoGenId: false,
      fields: [
        {
          type: 'nanoid',
          name: 'nanoid',
          autoFill: false,
        },
      ],
    });

    await Test.sync();
    const item = await Test.model.create();
    expect(item.get('nanoid')).toBeFalsy();
  });
});
