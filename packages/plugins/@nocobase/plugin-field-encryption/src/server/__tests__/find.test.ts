/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mockDatabase, MockDatabase } from '@nocobase/test';
import { EncryptionField } from '../encryption-field';

describe('password field', () => {
  let db: MockDatabase;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('basic', async () => {
    db.registerFieldTypes({
      encryption: EncryptionField,
    });
    db.collection({
      name: 'tests',
      fields: [
        {
          type: 'encryption',
          name: 'name1',
          iv: '1234567890123456',
        },
      ],
    });
    await db.sync();
    const r = db.getRepository('tests');
    const model = await r.create({
      values: {
        name1: 'aaa',
      },
    });
    expect(model.get('name1')).not.toBe('aaa');
    console.log(model.get('name1'));
    const model2 = await r.findOne();
    expect(model2.get('name1')).toBe('aaa');
  });
});
