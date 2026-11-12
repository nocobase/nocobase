/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';

describe('UI template management permissions', () => {
  let app: MockServer;

  beforeAll(async () => {
    app = await createMockServer({
      acl: true,
      plugins: ['acl', 'field-sort', 'users', 'auth', 'data-source-manager', 'flow-engine', 'ui-templates'],
    });
  });

  afterAll(async () => {
    await app.destroy();
  });

  it('allows members to read templates and reserves management operations for authorized roles', async () => {
    const roles = app.db.getRepository('roles');
    await roles.create({ values: { name: 'templateManager', snippets: ['pm.ui-templates.templates'] } });
    await roles.update({
      filterByTk: 'member',
      values: { strategy: { actions: ['view', 'create', 'update', 'destroy'] } },
    });
    const users = app.db.getRepository('users');
    const manager = await app.agent().login(await users.create({ values: { roles: ['templateManager'] } }));
    const member = await app.agent().login(await users.create({ values: { roles: ['member'] } }));

    const managerTemplates = manager.resource('flowModelTemplates');
    const memberTemplates = member.resource('flowModelTemplates');
    const values = { uid: 'template-a', name: 'Template A', targetUid: 'block-a' };
    const filterByTk = values.uid;
    await app.db
      .getRepository('flowModels')
      .create({ values: { uid: values.targetUid, options: { use: 'TableBlockModel' } } });

    expect((await memberTemplates.create({ values })).status).toBe(403);
    expect((await managerTemplates.create({ values })).status).toBe(200);
    expect((await memberTemplates.list()).status).toBe(200);
    expect((await memberTemplates.get({ filterByTk })).body.data.name).toBe(values.name);
    expect((await memberTemplates.update({ filterByTk, values: { name: 'Member edit' } })).status).toBe(403);
    expect((await memberTemplates.destroy({ filterByTk })).status).toBe(403);
    expect((await managerTemplates.update({ filterByTk, values: { name: 'Manager edit' } })).status).toBe(200);

    const managerUsages = manager.resource('flowModelTemplateUsages');
    const memberUsages = member.resource('flowModelTemplateUsages');
    const usage = { uid: 'usage-a', templateUid: filterByTk, modelUid: 'ref-a' };
    expect((await memberUsages.create({ values: usage })).status).toBe(403);
    expect((await managerUsages.create({ values: usage })).status).toBe(200);
    expect((await memberUsages.list()).status).toBe(403);
    expect((await memberUsages.get({ filterByTk: usage.uid })).status).toBe(403);
    expect((await managerUsages.get({ filterByTk: usage.uid })).body.data.templateUid).toBe(filterByTk);
    expect((await memberUsages.destroy({ filterByTk: usage.uid })).status).toBe(403);
    expect((await memberTemplates.get({ filterByTk })).body.data.usageCount).toBe(1);
    expect((await managerTemplates.destroy({ filterByTk })).status).toBe(400);
    expect((await managerUsages.destroy({ filterByTk: usage.uid })).status).toBe(200);
    expect((await managerTemplates.destroy({ filterByTk })).status).toBe(200);
  });
});
