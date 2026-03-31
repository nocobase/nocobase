/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/20250111192640-providers2verificators';

describe('providers to verificators', () => {
  let app: MockServer;
  let db: MockDatabase;

  beforeEach(async () => {
    app = await createMockServer({
      version: '1.6.0',
      plugins: ['verification', 'auth', 'field-sort'],
    });
    db = app.db;
    await db.getRepository('verifications_providers').create({
      values: [
        {
          id: 'test1',
          title: 'Test1',
          type: 'sms-aliyun',
          options: {
            accessKeyId: 'test',
          },
          default: true,
        },
        {
          id: 'test2',
          title: 'Test2',
          type: 'sms-tencent',
          options: {
            accessKeyId: 'test',
          },
          default: false,
        },
      ],
      context: {},
    });
    await db.getRepository('authenticators').create({
      values: {
        name: 'test',
        authType: 'SMS',
        title: 'SMS',
        options: {
          public: {
            allowSignUp: true,
          },
        },
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
    const verificators = await db.getRepository('verificators').find();
    expect(verificators.length).toBe(2);
    expect(verificators).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Test1',
          verificationType: 'sms-otp',
          options: {
            provider: 'sms-aliyun',
            settings: {
              accessKeyId: 'test',
            },
          },
        }),
        expect.objectContaining({
          title: 'Test2',
          verificationType: 'sms-otp',
          options: {
            provider: 'sms-tencent',
            settings: {
              accessKeyId: 'test',
            },
          },
        }),
      ]),
    );
    const authenticator = await db.getRepository('authenticators').findOne({
      filter: {
        name: 'test',
      },
    });
    expect(authenticator.options).toMatchObject({
      public: {
        allowSignUp: true,
        verificator: verificators.find((item) => item.title === 'Test1').name,
      },
    });
  });
});
