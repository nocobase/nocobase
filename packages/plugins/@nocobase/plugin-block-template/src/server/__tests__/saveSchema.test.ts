/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { createMockServer, MockServer } from '@nocobase/test';

describe('blockTemplates:saveSchema', () => {
  let app: MockServer;

  beforeAll(async () => {
    app = await createMockServer({
      acl: true,
      plugins: ['acl', 'field-sort', 'users', 'auth', 'data-source-manager', 'ui-schema-storage', 'block-template'],
    });
  });

  afterAll(async () => {
    await app.destroy();
  });

  it('only saves the layout when the active role can configure the interface', async () => {
    const roles = app.db.getRepository('roles');
    await roles.create({ values: { name: 'designer', snippets: ['ui.*'] } });
    await roles.update({
      filterByTk: 'member',
      values: { strategy: { actions: ['view', 'create', 'update', 'destroy'] } },
    });
    const user = await app.db.getRepository('users').create({ values: { roles: ['member', 'designer'] } });
    const schemas = app.db.getRepository<UiSchemaRepository>('uiSchemas');
    const pageUid = 'template-page';
    await schemas.insert({ 'x-uid': pageUid, type: 'object' });
    const original = await schemas.getJsonSchema(pageUid);
    const params = {
      filterByTk: pageUid,
      position: 'beforeEnd',
      values: { schema: { 'x-uid': 'template-section', name: 'section', type: 'void' } },
    };

    const member = await app.agent().login(user, 'member');
    expect((await member.resource('blockTemplates').saveSchema(params)).status).toBe(403);
    expect(await schemas.getJsonSchema(pageUid)).toEqual(original);

    const designer = await app.agent().login(user, 'designer');
    expect((await designer.resource('blockTemplates').saveSchema(params)).status).toBe(200);
    expect(await schemas.getJsonSchema(pageUid)).toMatchObject({
      properties: { section: { 'x-uid': 'template-section' } },
    });
  });
});
