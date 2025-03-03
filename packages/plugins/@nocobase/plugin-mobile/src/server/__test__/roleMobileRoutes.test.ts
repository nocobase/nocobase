/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';

describe(`roleMobileRoutes`, async () => {
  let app: MockServer, db;
  let agent, rootUser, user, role;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [
        'acl',
        'mobile',
        'users',
        'ui-schema-storage',
        'system-settings',
        'field-sort',
        'data-source-main',
        'auth',
        'data-source-manager',
        'error-handler',
        'collection-tree',
      ],
    });
    db = app.db;
    rootUser = await db.getRepository('users').findOne({
      filter: {
        email: process.env.INIT_ROOT_EMAIL,
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const role1Response = await rootAgent.resource('roles').create({
      values: {
        name: 'r1',
      },
    });
    role = role1Response.body.data;
    user = await db.getRepository('users').create({
      values: {
        name: 'u1',
        roles: [role.name],
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  const generateRandomString = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const createUiMenu = async (loginAgent, data?: { title?: string }) => {
    const response = await loginAgent.resource(`mobileRoutes`).create({
      values: {
        type: 'page',
        title: data?.title || generateRandomString(),
        schemaUid: generateRandomString(),
        menuSchemaUid: generateRandomString(),
        enableTabs: false,
        children: [
          {
            type: 'tabs',
            schemaUid: generateRandomString(),
            tabSchemaName: generateRandomString(),
            hidden: true,
          },
        ],
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).exist;
    if (data?.title) {
      expect(response.body.data.title).toBe(data.title);
    }
    const menu = response.body.data;
    const uiSchemaResponse = await loginAgent
      .post(`/uiSchemas:insertAdjacent/nocobase-admin-menu`)
      .query({ position: 'beforeEnd' })
      .send({
        schema: {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          title: menu.title,
          'x-component': 'Menu.Item',
          'x-decorator': 'ACLMenuItemProvider',
          'x-component-props': {},
          properties: {
            page: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'Page',
              'x-async': true,
              properties: {
                [menu.children[0].tabSchemaName]: {
                  _isJSONSchemaObject: true,
                  version: '2.0',
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': 'page:addBlock',
                  'x-uid': menu.children[0].schemaUid,
                  name: menu.children[0].tabSchemaName,
                  'x-app-version': '1.6.0-alpha.28',
                },
              },
              'x-uid': menu.schemaUid,
              name: 'page',
              'x-app-version': '1.6.0-alpha.28',
            },
          },
          'x-uid': menu.menuSchemaUid,
          __route__: {
            createdAt: '2025-02-27T03:34:19.689Z',
            updatedAt: '2025-02-27T03:34:19.689Z',
            id: menu.id,
            type: menu.type,
            title: menu.title,
            schemaUid: menu.schemaUid,
            menuSchemaUid: menu.menuSchemaUid,
            enableTabs: false,
            sort: menu.sort,
            createdById: menu.createdById,
            updatedById: menu.updatedById,
            parentId: null,
            icon: null,
            tabSchemaName: null,
            options: null,
            hideInMenu: null,
            enableHeader: null,
            displayTitle: null,
            hidden: null,
            children: [
              {
                createdAt: '2025-02-27T03:34:19.746Z',
                updatedAt: '2025-02-27T03:34:19.746Z',
                id: menu.children[0].id,
                type: 'tabs',
                schemaUid: menu.children[0].schemaUid,
                tabSchemaName: menu.children[0].tabSchemaName,
                hidden: true,
                parentId: menu.children[0].parentId,
                sort: menu.children[0].sort,
                createdById: menu.children[0].createdById,
                updatedById: menu.children[0].updatedById,
                title: null,
                icon: null,
                menuSchemaUid: null,
                options: null,
                hideInMenu: null,
                enableTabs: null,
                enableHeader: null,
                displayTitle: null,
              },
            ],
          },
          name: generateRandomString(),
          'x-app-version': '1.6.0-alpha.28',
        },
        wrap: null,
      });
    expect(uiSchemaResponse.statusCode).toBe(200);
    return response.body.data;
  };

  const getAccessibleMenus = async (loginAgent) => {
    const menuResponse = await loginAgent
      .get(`/mobileRoutes:listAccessible`)
      .query({ tree: true, sort: 'sort', paginate: false })
      .send();
    expect(menuResponse.statusCode).toBe(200);
    return menuResponse.body.data;
  };

  it(`should rolesMobileRoutes tab data valid when menu only one tab and hidden=true`, async () => {
    let rootAgent = await app.agent().login(rootUser);
    const page = await createUiMenu(rootAgent, { title: 'page' });

    let response = await rootAgent.post(`/roles/${role.name}/mobileRoutes:add`).send([page.id]);
    expect(response.statusCode).toBe(200);
    agent = await app.agent().login(user, role.name);
    let accessibleMenus = await getAccessibleMenus(agent);
    expect(accessibleMenus.length).toBe(1);
    expect(accessibleMenus[0].children[0]).exist;
    expect(accessibleMenus[0].children[0].id).toEqual(page.children[0].id);

    rootAgent = await app.agent().login(rootUser);
    response = await rootAgent.post(`/roles/${role.name}/mobileRoutes:remove`).send([page.id]);

    agent = await app.agent().login(user, role.name);
    accessibleMenus = await getAccessibleMenus(agent);
    expect(accessibleMenus.length).toBe(0);
  });
});
