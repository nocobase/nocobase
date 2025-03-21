/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import { md5 } from '../../utils';

describe('index field options', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('case 1', async () => {
    const t1 = 't1234567890223456789032345678904234567890523456789';
    const f1 = 'f1234567890223456789032345678904234567890523456789062345678901';
    const f2 = 'f1234567890223456789032345678904234567890523456789062345678902';
    db.collection({
      name: t1,
      fields: [
        {
          type: 'string',
          name: f1,
          index: true,
        },
        {
          type: 'string',
          name: f2,
          index: true,
        },
      ],
    });
    await db.sync();
    // @ts-ignore
    const indexes = db.getModel(t1)._indexes;
    const index1 = indexes.find((item) => item.fields.includes(f1));
    const index2 = indexes.find((item) => item.fields.includes(f2));
    expect('i_' + md5(db.getTablePrefix() + `${t1}_${f1}`)).toBe(index1.name);
    expect('i_' + md5(db.getTablePrefix() + `${t1}_${f2}`)).toBe(index2.name);
  });
});
