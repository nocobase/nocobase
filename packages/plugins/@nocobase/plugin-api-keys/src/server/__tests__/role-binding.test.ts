/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { createMockServer, ExtendedAgent, MockServer } from '@nocobase/test';
import type { SuperAgentTest } from 'supertest';

type KeyAgent = ExtendedAgent & Pick<SuperAgentTest, 'set'>;

describe('API key role binding', () => {
  let app: MockServer;
  let user: Model;
  let sessionAgent: ExtendedAgent;
  let keyAgent: KeyAgent;
  const roleName = 'api_key_restricted';

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
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
        'api-keys',
      ],
    });
    user = await app.db.getRepository('users').findOne();
    await app.db.getRepository('roles').create({ values: { name: roleName } });
    await app.db.getRepository('rolesUsers').create({ values: { userId: user.id, roleName } });
    sessionAgent = await app.agent().login(user);
    const created = await sessionAgent.resource('apiKeys').create({
      values: { name: 'ROLE_BINDING', role: { name: roleName }, expiresIn: '1d' },
    });
    expect(created.status).toBe(200);
    keyAgent = app.agent() as KeyAgent;
    keyAgent.set('Authorization', `Bearer ${created.body.data.token}`);
  });

  afterEach(async () => {
    await app.destroy();
  });

  it.each(['default', 'allow-use-union', 'only-use-union'])(
    'keeps the bound role and denies data access in %s mode',
    async (roleMode) => {
      const updated = await sessionAgent.resource('roles').setSystemRoleMode({ values: { roleMode } });
      expect(updated.status).toBe(200);
      const check = await keyAgent.resource('roles').check();
      expect(check.status).toBe(200);
      expect(check.body.data.role).toBe(roleName);
      expect(check.body.data.roles).toEqual([roleName]);
      expect((await keyAgent.resource('users').list()).status).toBe(403);
    },
  );

  it.each(['root', '__union__', 'anonymous'])('does not expand the key role through X-Role: %s', async (role) => {
    await sessionAgent.resource('roles').setSystemRoleMode({ values: { roleMode: 'only-use-union' } });
    keyAgent.set('X-Role', role);
    const check = await keyAgent.resource('roles').check();
    expect(check.status).toBe(200);
    expect(check.body.data.roles).toEqual([roleName]);
    expect((await keyAgent.resource('users').list()).status).toBe(403);
  });

  it('rejects a key after the bound role is removed from the user in only-use-union mode', async () => {
    await sessionAgent.resource('roles').setSystemRoleMode({ values: { roleMode: 'only-use-union' } });
    expect((await keyAgent.resource('roles').check()).status).toBe(200);
    const removed = await sessionAgent.resource('roles.users', roleName).remove({ values: [user.id] });
    expect(removed.status).toBe(200);
    const response = await keyAgent.resource('users').list();
    expect(response.status).toBe(401);
    expect(response.body.errors[0].code).toBe('ROLE_NOT_FOUND_FOR_USER');
  });

  it('preserves the data scope and fields granted to the bound role', async () => {
    await sessionAgent.resource('roles').setSystemRoleMode({ values: { roleMode: 'only-use-union' } });
    await app.db.getRepository('users').create({ values: { nickname: 'Other user' } });
    app.acl.getRole(roleName).grantAction('users:view', { filter: { id: user.id }, fields: ['id'] });
    const response = await keyAgent.resource('users').list();
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(user.id);
    expect(response.body.data[0]).not.toHaveProperty('nickname');
    expect(response.body.data[0]).not.toHaveProperty('username');
  });

  it('keeps the union for a signed-in session in only-use-union mode', async () => {
    await sessionAgent.resource('roles').setSystemRoleMode({ values: { roleMode: 'only-use-union' } });
    const check = await sessionAgent.resource('roles').check();
    expect(check.status).toBe(200);
    expect(check.body.data.role).toBe('__union__');
    expect(check.body.data.roles).toContain('root');
    expect((await sessionAgent.resource('users').list()).status).toBe(200);
  });
});
