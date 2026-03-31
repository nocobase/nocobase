/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/20250507220644-fix-verifier-typo';

describe('providers to verificators', () => {
  let app: MockServer;
  let db: MockDatabase;

  beforeEach(async () => {
    app = await createMockServer({
      version: '1.7.0',
      plugins: ['verification', 'auth', 'field-sort', 'users'],
    });
    db = app.db;
    const verificator = await db.getRepository('verificators').create({
      values: {
        name: 'test',
        title: 'SMS OTP',
        verificationType: 'sms-otp',
      },
      context: {},
    });
    await verificator.addUser(1, {
      through: {
        uuid: '13888888888',
      },
    });
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('should migrate providers to verificators', async () => {
    const migration = new Migration({
      db: db,
      // @ts-ignore
      app,
    });
    await migration.up();
    const verifiers = await db.getRepository('verifiers').find();
    expect(verifiers.length).toBe(1);
    expect(verifiers[0]).toMatchObject(
      expect.objectContaining({
        name: 'test',
        title: 'SMS OTP',
        verificationType: 'sms-otp',
      }),
    );
    const through = await db.getRepository('usersVerifiers').find();
    expect(through.length).toBe(1);
    expect(through[0]).toMatchObject(
      expect.objectContaining({
        verifier: 'test',
        userId: 1,
        uuid: '13888888888',
      }),
    );
  });
});
