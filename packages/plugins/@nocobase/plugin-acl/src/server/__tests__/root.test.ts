/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';

describe('root', async () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'field-sort', 'error-handler', 'acl', 'data-source-main', 'data-source-manager'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('can not set root', async () => {
    const initUser = await app.db.getRepository('users').findOne({
      appends: ['roles'],
    });
    expect(initUser).toBeTruthy();
    expect(initUser.get('roles').map((role) => role.get('name'))).toContain('root');

    await expect(
      app.db.getRepository('users').create({
        values: {
          username: 'test',
          roles: ['root'],
        },
      }),
    ).rejects.toThrow(/No permissions/);
  });
});
