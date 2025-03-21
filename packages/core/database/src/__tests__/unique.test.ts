/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

describe('unique field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({
      logging: console.log,
    });

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should not transform empty string to null when field is not unique', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        {},
        {
          name: '',
        },
        {
          name: 'user3',
        },
      ],
    });

    const u3 = await User.repository.findOne({
      filter: {
        name: 'user3',
      },
    });

    await User.repository.update({
      filter: {
        id: u3.id,
      },
      values: {
        name: '',
      },
    });

    await u3.reload();
    expect(u3.get('name')).toBe('');
  });

  it('should transform empty string to null when field is unique', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        {},
        {
          name: '',
        },
        {
          name: 'user3',
        },
      ],
    });

    const u3 = await User.repository.findOne({
      filter: {
        name: 'user3',
      },
    });

    let error;

    try {
      await User.repository.update({
        filter: {
          id: u3.id,
        },
        values: {
          name: '',
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeUndefined();

    await u3.reload();
    expect(u3.get('name')).toBe(null);
  });
});
