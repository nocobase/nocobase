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

describe('api key role binding when the system role mode is only-use-union', () => {
  let app: MockServer;
  let db: Database;
  let user;
  let userAgent;
  let noPermissionRole;
  const expiresIn = 60 * 60 * 24;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      // `ui-schema-storage` is required by `roles:check`: it owns `roles.menuUiSchemas` and
      // `uiButtonSchemasRoles`, and the action reads both.
      plugins: [
        'acl',
        'error-handler',
        'field-sort',
        'users',
        'ui-schema-storage',
        'data-source-main',
        'auth',
        'data-source-manager',
        'collection-tree',
        'system-settings',
        'api-keys',
      ],
    });

    db = app.db;
    user = await db.getRepository('users').findOne({
      appends: ['roles'],
    });

    noPermissionRole = await db.getRepository('roles').create({
      values: {
        name: 'noPermissionRole',
      },
    });
    await db.getRepository('rolesUsers').create({
      values: {
        userId: user.id,
        roleName: noPermissionRole.name,
      },
    });

    userAgent = await app.agent().login(user);
    await userAgent.resource('roles').setSystemRoleMode({
      values: {
        roleMode: 'only-use-union',
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should evaluate the key with the role it was created for', async () => {
    const created = await userAgent.resource('apiKeys').create({
      values: {
        name: 'ONLY_UNION',
        role: { name: noPermissionRole.name },
        expiresIn,
      },
    });
    const keyAgent = app.agent().set('Authorization', `Bearer ${created.body.data.token}`);

    const checkRes = await keyAgent.resource('roles').check();
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.data.role).toBe(noPermissionRole.name);
    expect(checkRes.body.data.roles).toContain(noPermissionRole.name);
    expect(checkRes.body.data.roles).not.toContain('root');

    const listRes = await keyAgent.resource('users').list();
    expect(listRes.status).toBe(403);
  });

  it('should keep the role union for a signed-in session', async () => {
    const checkRes = await userAgent.resource('roles').check();
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.data.role).toBe('__union__');
    expect(checkRes.body.data.roles).toContain('root');

    const listRes = await userAgent.resource('users').list();
    expect(listRes.status).toBe(200);
  });
});
