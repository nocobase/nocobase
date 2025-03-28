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

describe('sync', () => {
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

  it('should not sync id fields when inherits not changed', async () => {
    if (!db.inDialect('postgres')) {
      return;
    }

    const Parent = db.collection({
      name: 'parent',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    const fn = vi.fn();

    const Child = db.collection({
      name: 'child',
      inherits: ['parent'],
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    expect(await Child.existsInDb()).toBeFalsy();

    await db.sync();

    expect(await Child.existsInDb()).toBeTruthy();

    Child.setField('age', {
      type: 'integer',
    });

    await db.sync({});

    const tableColumns = await db.sequelize.getQueryInterface().describeTable(Child.getTableNameWithSchema());

    expect(tableColumns).toHaveProperty('age');
  });
});
