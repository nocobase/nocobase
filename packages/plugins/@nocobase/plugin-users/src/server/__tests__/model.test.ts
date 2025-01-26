/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import { UserModel } from '../models/UserModel';

describe('models', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-sort', 'auth', 'users'],
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('model registeration', async () => {
    const model = db.getModel('users');
    const u1 = model.build({ nickname: 'test', password: '123' });
    expect(u1).toBeInstanceOf(UserModel);
    const n = u1.desensitize();
    expect(n.password).toBeUndefined();
  });
});
