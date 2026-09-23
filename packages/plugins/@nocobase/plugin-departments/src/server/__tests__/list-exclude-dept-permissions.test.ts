/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';

describe('users:listExcludeDept permissions', () => {
  let app: MockServer;

  beforeAll(async () => {
    app = await createMockServer({
      acl: true,
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
        'departments',
      ],
    });
  });

  afterAll(async () => {
    await app.destroy();
  });

  it('denies a logged-in role without department management permission', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'department-list-denied',
        snippets: ['!pm', '!pm.*'],
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username: 'department-list-denied',
        roles: ['department-list-denied'],
      },
    });
    const agent = await app.agent().login(user, 'department-list-denied');

    const response = await agent.resource('users').listExcludeDept({ departmentId: 999999 });
    expect(response.status).toBe(403);
  });

  it('allows a role with department management permission', async () => {
    await app.db.getRepository('roles').create({
      values: {
        name: 'department-list-manager',
        snippets: ['pm.departments'],
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username: 'department-list-manager',
        roles: ['department-list-manager'],
      },
    });
    const agent = await app.agent().login(user, 'department-list-manager');

    const response = await agent.resource('users').listExcludeDept({ departmentId: 999999 });
    expect(response.status).toBe(200);
  });
});
