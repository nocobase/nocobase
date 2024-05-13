/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mockDatabase } from '../';
import { Database } from '../../database';

describe('text field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create text field type', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          type: 'text',
          name: 'text1',
          defaultValue: 'a',
        },
        {
          type: 'text',
          name: 'text2',
          length: 'tiny',
          defaultValue: 'a',
        },
        {
          type: 'text',
          name: 'text3',
          length: 'medium',
          defaultValue: 'a',
        },
        {
          type: 'text',
          name: 'text4',
          length: 'long',
          defaultValue: 'a',
        },
      ],
    });
    await Test.sync();
  });
});
