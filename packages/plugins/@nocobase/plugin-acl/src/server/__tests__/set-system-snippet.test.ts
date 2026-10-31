/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BelongsToManyRepository } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('roles:setSystemSnippet', () => {
  let app: MockServer;
  let adminAgent: ReturnType<MockServer['agent']>;
  const roleName = 'snippet-regression';
  const original = ['ui.*', 'pm', 'pm.*', '!app', '!pm.v1-only', 'custom.v1'];

  beforeEach(async () => {
    app = await createMockServer({ registerActions: true, acl: true, plugins: ['nocobase', 'collection-tree'] });
    await app.db.getRepository('roles').create({ values: { name: roleName, snippets: original } });
    const admin = await app.db.getRepository('users').create({ values: { roles: ['admin'] } });
    adminAgent = await app.agent().login(admin);
  });

  afterEach(async () => {
    await app.destroy();
  });

  async function readSnippets() {
    return (await app.db.getRepository('roles').findOne({ filterByTk: roleName })).get('snippets') as string[];
  }

  it('preserves current plugin permissions and v1 routes when changing a system switch repeatedly', async () => {
    const page = await app.db
      .getRepository('desktopRoutes')
      .create({ values: { type: 'page', title: 'V1', children: [{ type: 'tabs', title: 'V1 tab', hidden: true }] } });
    const routes = await app.db
      .getRepository('desktopRoutes')
      .find({ filter: { $or: [{ id: page.id }, { parentId: page.id }] } });
    await app.db
      .getRepository<BelongsToManyRepository>('roles.desktopRoutes', roleName)
      .add(routes.map((route) => route.id));
    const before = (await app.db.getRepository('roles.desktopRoutes', roleName).find()).map((route) => route.id).sort();
    const agent = adminAgent;
    await agent.resource('roles.snippets', roleName).add({ values: ['!pm.logger'] });
    await agent.resource('roles.snippets', roleName).remove({ values: ['!pm.logger'] });
    for (let i = 0; i < 2; i++) {
      const response = await agent.resource('roles').setSystemSnippet({
        filterByTk: roleName,
        values: { snippet: 'ui.*', enabled: false, snippets: ['!pm.logger'], desktopRoutes: [] },
      });
      expect(response.status).toBe(200);
      expect(new Set(await readSnippets())).toEqual(
        new Set(['!ui.*', 'pm', 'pm.*', '!app', '!pm.v1-only', 'custom.v1']),
      );
      expect(new Set(response.body.data)).toEqual(new Set(await readSnippets()));
      expect(
        (await app.db.getRepository('roles.desktopRoutes', roleName).find()).map((route) => route.id).sort(),
      ).toEqual(before);
    }
    const response = await agent
      .resource('roles')
      .setSystemSnippet({ filterByTk: roleName, values: { snippet: 'ui.*', enabled: true } });
    expect(response.status).toBe(200);
    expect(new Set(await readSnippets())).toEqual(new Set(original));
  });

  it('keeps unchanged permissions untouched on a no-op save', async () => {
    const before = await app.db.getRepository('roles').findOne({ filterByTk: roleName });
    const response = await adminAgent
      .resource('roles')
      .setSystemSnippet({ filterByTk: roleName, values: { snippet: 'ui.*', enabled: true } });
    expect(response.status).toBe(200);
    expect(new Set(await readSnippets())).toEqual(new Set(original));
    const after = await app.db.getRepository('roles').findOne({ filterByTk: roleName });
    expect(after.get('updatedAt')).toEqual(before.get('updatedAt'));
  });

  it('rejects invalid system switches without changing permissions', async () => {
    for (const values of [
      { snippet: 'pm.v1-only', enabled: true },
      { snippet: 'ui.*', enabled: 'false' },
      { enabled: true },
    ]) {
      const response = await adminAgent.resource('roles').setSystemSnippet({ filterByTk: roleName, values });
      expect(response.status).toBe(400);
      expect(new Set(await readSnippets())).toEqual(new Set(original));
    }
    const response = await adminAgent
      .resource('roles')
      .setSystemSnippet({ filterByTk: 'missing-role', values: { snippet: 'app', enabled: true } });
    expect(response.status).toBe(404);
  });

  it('does not allow a role without role-management access to change system permissions', async () => {
    const user = await app.db.getRepository('users').create({ values: { roles: ['member'] } });
    const agent = await app.agent().login(user);
    const response = await agent
      .resource('roles')
      .setSystemSnippet({ filterByTk: roleName, values: { snippet: 'ui.*', enabled: true } });
    expect(response.status).toBe(403);
    expect(new Set(await readSnippets())).toEqual(new Set(original));
  });
});
