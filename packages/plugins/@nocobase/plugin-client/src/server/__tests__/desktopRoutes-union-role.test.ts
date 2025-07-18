/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { UNION_ROLE_KEY, SystemRoleMode } from '@nocobase/plugin-acl';
import { MockServer, createMockServer, ExtendedAgent } from '@nocobase/test';

describe('Web client desktopRoutes', async () => {
  let app: MockServer, db;
  let agent: ExtendedAgent, rootUser, user, role1, role2;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [
        'acl',
        'client',
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
    role1 = role1Response.body.data;
    const role2Response = await rootAgent.resource('roles').create({
      values: {
        name: 'r2',
      },
    });
    role2 = role2Response.body.data;
    user = await db.getRepository('users').create({
      values: {
        name: 'u1',
        roles: [role1.name, role2.name],
      },
    });

    await rootAgent.resource('roles').setSystemRoleMode({
      values: {
        roleMode: SystemRoleMode.allowUseUnion,
      },
    });

    agent = await app.agent().login(user, UNION_ROLE_KEY);
  });

  afterEach(async () => {
    await app.destroy();
  });

  const generateRandomString = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const createUiMenu = async (loginAgent: ExtendedAgent, data?: { title?: string }) => {
    const response = await loginAgent.resource(`desktopRoutes`).create({
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

  const getAccessibleMenus = async (loginAgent: ExtendedAgent) => {
    const menuResponse = await loginAgent
      .get(`/desktopRoutes:listAccessible`)
      .query({ tree: true, sort: 'sort' })
      .send();
    expect(menuResponse.statusCode).toBe(200);
    return menuResponse.body.data;
  };

  it('Desktop menu, add menu Accessible menu1 to role1, add menu Accessible menu2 to role2, expect role1 visible menu1, role2 visible menu2', async () => {
    const rootAgent = await app.agent().login(rootUser);
    const page1 = await createUiMenu(rootAgent, { title: 'page1' });
    const page2 = await createUiMenu(rootAgent, { title: 'page2' });

    // add accessible menu1 to role1
    let addMenuResponse = await rootAgent.post(`/roles/${role1.name}/desktopRoutes:add`).send([page1.id]);

    // add accessible menu2 to role2
    addMenuResponse = await rootAgent.post(`/roles/${role2.name}/desktopRoutes:add`).send([page2.id]);

    agent = await app.agent().login(user, role1.name);
    let accessibleMenus = await getAccessibleMenus(agent);
    let menuProps = accessibleMenus.map((x) => x.title);
    expect(menuProps).include(page1.title);
    expect(menuProps).not.include(page2.title);

    agent = await app.agent().login(user, role2.name);
    accessibleMenus = await getAccessibleMenus(agent);
    menuProps = accessibleMenus.map((x) => x.title);
    expect(menuProps).include(page2.title);
    expect(menuProps).not.include(page1.title);

    agent = await app.agent().login(user, UNION_ROLE_KEY);
    accessibleMenus = await getAccessibleMenus(agent);
    menuProps = accessibleMenus.map((x) => x.title);
    expect(menuProps).include(page1.title);
    expect(menuProps).include(page2.title);
  });

  it('Desktop menu, allowNewMenu = true, expect display new menu', async () => {
    const rootAgent = await app.agent().login(rootUser);
    const role1Response = await rootAgent.resource('roles').get({
      filterByTk: role1.name,
    });
    expect(role1Response.statusCode).toBe(200);
    const updateRole1Response = await rootAgent.resource('roles').update({
      filterByTk: role1.name,
      values: {
        ...role1Response.body.data,
        allowNewMenu: true,
      },
    });
    expect(updateRole1Response.statusCode).toBe(200);
    agent = await app.agent().login(user, UNION_ROLE_KEY);
    const page1 = await createUiMenu(rootAgent, { title: 'page1' });

    // auto can see new menu
    const accessibleMenus = await getAccessibleMenus(agent);
    expect(accessibleMenus.length).toBe(1);
    expect(accessibleMenus[0].title).toBe(page1.title);
  });

  it('should display desktop menu when roles include root', async () => {
    let rootAgent = await app.agent().login(rootUser);
    const page1 = await createUiMenu(rootAgent, { title: 'page1' });
    let accessibleMenus = await getAccessibleMenus(rootAgent);
    expect(accessibleMenus.some((x) => x.title === page1.title)).toBeTruthy();
    await rootAgent.resource('roles').setSystemRoleMode({
      values: {
        roleMode: SystemRoleMode.allowUseUnion,
      },
    });
    rootAgent = await app.agent().login(rootUser, UNION_ROLE_KEY);
    accessibleMenus = await getAccessibleMenus(rootAgent);
    expect(accessibleMenus.some((x) => x.title === page1.title)).toBeTruthy();
  });
});
