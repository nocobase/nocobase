/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/20250507222432-fix-verifier-typo.ts';

describe('providers to verificators', () => {
  let app: MockServer;
  let db: MockDatabase;

  beforeEach(async () => {
    app = await createMockServer({
      version: '1.7.0',
      plugins: ['auth', 'field-sort'],
    });
    db = app.db;
    await db.getRepository('authenticators').create({
      values: {
        name: 'test',
        authType: 'SMS',
        title: 'SMS',
        options: {
          public: {
            allowSignUp: true,
            verificator: 'test',
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
    const authenticator = await db.getRepository('authenticators').findOne({
      filter: {
        name: 'test',
      },
    });
    expect(authenticator.options).toMatchObject({
      public: {
        allowSignUp: true,
        verifier: 'test',
      },
    });
  });
});
