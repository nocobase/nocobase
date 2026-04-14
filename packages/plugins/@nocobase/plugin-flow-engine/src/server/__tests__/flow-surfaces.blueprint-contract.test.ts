/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import {
  createFlowSurfacesContractContext,
  createPage,
  createMenu,
  destroyFlowSurfacesContractContext,
  getData,
  getRouteBackedTabs,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

describe('flowSurfaces applyBlueprint contract', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];
  let flowRepo: FlowSurfacesContractContext['flowRepo'];
  let routesRepo: FlowSurfacesContractContext['routesRepo'];

  function collectDescendantNodes(node: any, predicate: (input: any) => boolean, bucket: any[] = []) {
    if (!node || typeof node !== 'object') {
      return bucket;
    }
    if (predicate(node)) {
      bucket.push(node);
    }
    const subModels = _.isPlainObject(node.subModels) ? Object.values(node.subModels) : [];
    subModels.forEach((subModel) => {
      _.castArray(subModel).forEach((child) => {
        collectDescendantNodes(child, predicate, bucket);
      });
    });
    return bucket;
  }

  function collectFieldPaths(node: any) {
    return collectDescendantNodes(node, (item) => !!item?.stepParams?.fieldSettings?.init?.fieldPath).map(
      (item) => item?.stepParams?.fieldSettings?.init?.fieldPath,
    );
  }

  function readNodeActionUses(node: any) {
    return _.castArray(node?.subModels?.actions || []).map((item: any) => item?.use);
  }

  function readTableRecordActionUses(node: any) {
    const actionsColumn = _.castArray(node?.subModels?.columns || []).find(
      (column: any) => column?.use === 'TableActionsColumnModel',
    );
    return readNodeActionUses(actionsColumn);
  }

  function readCardItemRecordActionUses(node: any) {
    return _.castArray(node?.subModels?.item?.subModels?.actions || []).map((item: any) => item?.use);
  }

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ rootAgent, flowRepo, routesRepo } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should create one page from a simplified page blueprint and return only target/surface', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            title: 'Workspace',
          },
          item: {
            title: 'Employees',
          },
        },
        page: {
          title: 'Employees',
          documentTitle: 'Employees workspace',
          enableHeader: true,
          displayTitle: true,
        },
        assets: {
          scripts: {
            overviewBanner: {
              version: '1.0.0',
              code: "ctx.render('<div>Employees overview</div>');",
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                recordActions: [
                  {
                    type: 'view',
                    title: 'View',
                    popup: {
                      title: 'Employee details',
                      blocks: [
                        {
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: 'employees',
                          },
                          fields: ['nickname'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
          {
            title: 'Summary',
            blocks: [
              {
                type: 'jsBlock',
                title: 'Overview banner',
                script: 'overviewBanner',
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);

    expect(data).toMatchObject({
      version: '1',
      mode: 'create',
      target: {
        pageSchemaUid: expect.any(String),
        pageUid: expect.any(String),
      },
    });
    expect(Object.keys(data).sort()).toEqual(['mode', 'surface', 'target', 'version']);

    expect(getRouteBackedTabs(data.surface).map((tab: any) => tab?.props?.title)).toEqual(['Overview', 'Summary']);
    expect(data.surface.target.locator.pageSchemaUid).toBe(data.target.pageSchemaUid);
  });

  it('should replace an existing page by pageSchemaUid and remove extra tabs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Legacy employees',
      tabTitle: 'Legacy overview',
      enableTabs: true,
    });
    const addTabRes = await rootAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: page.pageUid,
        },
        title: 'Legacy extra',
      },
    });
    expect(addTabRes.status).toBe(200);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        page: {
          title: 'Employees workspace',
          documentTitle: 'Employees replace flow',
          displayTitle: false,
          enableTabs: false,
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);

    expect(data).toMatchObject({
      version: '1',
      mode: 'replace',
      target: {
        pageSchemaUid: page.pageSchemaUid,
        pageUid: page.pageUid,
      },
    });
    expect(getRouteBackedTabs(data.surface)).toHaveLength(1);
    expect(data.surface.pageRoute.displayTitle).toBe(false);
  });

  it('should reuse a unique same-title navigation group instead of creating a duplicate group', async () => {
    const groupTitle = `Unique applyBlueprint group ${Date.now()}`;
    const existingGroup = await createMenu(rootAgent, {
      title: groupTitle,
      type: 'group',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          group: {
            title: groupTitle,
          },
          item: {
            title: 'Employees under reused group',
          },
        },
        page: {
          title: 'Employees under reused group',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(String(data.surface.pageRoute.parentId)).toBe(String(existingGroup.routeId));

    const matchedGroups = _.castArray(
      await routesRepo.find({
        filter: {
          type: 'group',
          title: groupTitle,
        },
      }),
    );
    expect(matchedGroups).toHaveLength(1);
  });

  it('should reject same-title navigation group reuse when group metadata is also provided', async () => {
    const groupTitle = `Same-title metadata group ${Date.now()}`;
    await createMenu(rootAgent, {
      title: groupTitle,
      type: 'group',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          group: {
            title: groupTitle,
            icon: 'UserOutlined',
            tooltip: 'Should fail for reused group',
          },
          item: {
            title: 'Employees with reused group metadata',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain(
      `navigation.group.title '${groupTitle}' matched an existing menu group`,
    );
    expect(readErrorMessage(executeRes)).toContain('navigation.group.icon');
    expect(readErrorMessage(executeRes)).toContain('navigation.group.tooltip');
    expect(readErrorMessage(executeRes)).toContain('Same-title reuse is title-only');
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces:updateMenu');
  });

  it('should reject navigation.group.routeId when existing-group metadata is also provided', async () => {
    const existingGroup = await createMenu(rootAgent, {
      title: `Explicit group ${Date.now()}`,
      type: 'group',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          group: {
            routeId: existingGroup.routeId,
            icon: 'UserOutlined',
            hideInMenu: true,
          },
          item: {
            title: 'Employees under explicit group',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain('navigation.group.routeId');
    expect(readErrorMessage(executeRes)).toContain('navigation.group.icon');
    expect(readErrorMessage(executeRes)).toContain('navigation.group.hideInMenu');
    expect(readErrorMessage(executeRes)).toContain('does not update existing menu-group metadata');
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces:updateMenu');
  });

  it('should reject ambiguous navigation group title reuse and ask for routeId explicitly', async () => {
    const groupTitle = `Ambiguous applyBlueprint group ${Date.now()}`;
    await createMenu(rootAgent, {
      title: groupTitle,
      type: 'group',
    });
    await createMenu(rootAgent, {
      title: groupTitle,
      type: 'group',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          group: {
            title: groupTitle,
          },
          item: {
            title: 'Ambiguous group page',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain(
      `navigation.group.title '${groupTitle}' matches 2 existing menu groups`,
    );
    expect(readErrorMessage(executeRes)).toContain('navigation.group.routeId explicitly');
  });

  it('should auto-generate a vertical grid layout when tab layout is omitted', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Auto layout page',
          },
        },
        page: {
          title: 'Auto layout page',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
              {
                type: 'details',
                collection: 'employees',
                fields: ['nickname', 'status'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const firstTab = getRouteBackedTabs(data.surface)[0];
    const tabGrid = await flowRepo.findModelByParentId(firstTab.uid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    const gridItems = Array.isArray(tabGrid?.subModels?.items) ? tabGrid.subModels.items : [];

    expect(gridItems).toHaveLength(2);
    expect(tabGrid?.props?.rowOrder).toEqual(['row1', 'row2']);
    expect(tabGrid?.props?.rows?.row1).toEqual([[gridItems[0]?.uid]]);
    expect(tabGrid?.props?.rows?.row2).toEqual([[gridItems[1]?.uid]]);
    expect(tabGrid?.props?.sizes?.row1).toEqual([24]);
    expect(tabGrid?.props?.sizes?.row2).toEqual([24]);
  });

  it('should report layout errors with index-based tab paths instead of generated tab keys', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Layout error page',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
            layout: {
              rows: [['missingBlock']],
            },
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    const message = readErrorMessage(executeRes);
    expect(message).toContain(`flowSurfaces applyBlueprint tabs[0].layout.rows[0][0]`);
    expect(message).toContain(`references unknown block 'missingBlock'`);
    expect(message).not.toContain(`tabs['`);
  });

  it('should normalize currentRecord associationPathName resource shorthand into an associated-records popup table', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Association shorthand popup page',
          },
        },
        page: {
          title: 'Association shorthand popup page',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          type: 'table',
                          resource: {
                            binding: 'currentRecord',
                            associationPathName: 'roles',
                            collectionName: 'roles',
                          },
                          fields: ['title', 'name'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(viewAction?.uid).toBeTruthy();

    const viewReadback = await getSurface(rootAgent, {
      uid: viewAction.uid,
    });
    const popupBlock = _.castArray(viewReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels?.grid
      ?.subModels?.items?.[0];

    expect(popupBlock?.use).toBe('TableBlockModel');
    expect(popupBlock?.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: 'roles',
      associationName: 'users.roles',
    });
    expect(collectFieldPaths(popupBlock)).toEqual(expect.arrayContaining(['title', 'name']));
  });

  it('should reject multi-segment associationPathName when binding-centered shorthand tries to normalize it', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid multi-segment relation popup page',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          type: 'table',
                          resource: {
                            binding: 'currentRecord',
                            associationPathName: 'manager.roles',
                            collectionName: 'roles',
                          },
                          fields: ['title', 'name'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    const message = readErrorMessage(executeRes);
    expect(message).toContain(`associationPathName 'manager.roles'`);
    expect(message).toContain('single association field name');
    expect(message).toContain('associationField');
  });

  it('should create the nested users-roles popup page structure and auto-promote record actions from details.actions', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Users popup page ${Date.now()}`,
          },
        },
        page: {
          title: 'Users popup page',
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                key: 'usersTable',
                type: 'table',
                collection: 'users',
                fields: ['username', 'nickname', 'roles'],
                recordActions: [
                  {
                    type: 'view',
                    title: '详情',
                    popup: {
                      layout: {
                        rows: [
                          [
                            { key: 'userDetails', span: 12 },
                            { key: 'userRoles', span: 12 },
                          ],
                        ],
                      },
                      blocks: [
                        {
                          key: 'userDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: 'users',
                          },
                          fields: ['username', 'nickname', 'email', 'roles'],
                          actions: [
                            {
                              type: 'edit',
                              title: '编辑用户',
                              popup: {
                                blocks: [
                                  {
                                    key: 'userEditForm',
                                    type: 'editForm',
                                    resource: {
                                      binding: 'currentRecord',
                                      collectionName: 'users',
                                    },
                                    fields: ['username', 'nickname', 'email', 'roles'],
                                    actions: ['submit'],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        {
                          key: 'userRoles',
                          type: 'table',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'roles',
                            collectionName: 'roles',
                          },
                          fields: ['title', 'name'],
                          recordActions: [
                            {
                              type: 'view',
                              title: '查看角色',
                              popup: {
                                blocks: [
                                  {
                                    key: 'roleDetails',
                                    type: 'details',
                                    resource: {
                                      binding: 'currentRecord',
                                      collectionName: 'roles',
                                    },
                                    fields: ['title', 'name'],
                                    actions: [
                                      {
                                        type: 'edit',
                                        title: '编辑角色',
                                        popup: {
                                          blocks: [
                                            {
                                              key: 'roleEditForm',
                                              type: 'editForm',
                                              resource: {
                                                binding: 'currentRecord',
                                                collectionName: 'roles',
                                              },
                                              fields: ['title', 'name'],
                                              actions: ['submit'],
                                            },
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const pageTree = data.surface.tree;
    const mainTable = collectDescendantNodes(pageTree, (item) => item?.use === 'TableBlockModel')[0];
    expect(mainTable?.uid).toBeTruthy();

    const mainTableReadback = await getSurface(rootAgent, {
      uid: mainTable.uid,
    });
    expect(mainTableReadback.tree.use).toBe('TableBlockModel');
    expect(collectFieldPaths(mainTableReadback.tree)).toEqual(expect.arrayContaining(['roles']));

    const mainViewAction = collectDescendantNodes(mainTableReadback.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(mainViewAction?.uid).toBeTruthy();

    const mainViewReadback = await getSurface(rootAgent, {
      uid: mainViewAction.uid,
    });
    const popupItems = _.castArray(
      _.castArray(mainViewReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels?.grid?.subModels?.items ||
        [],
    );
    expect(popupItems).toHaveLength(2);
    const userDetailsBlock = popupItems.find((item: any) => item?.use === 'DetailsBlockModel');
    const userRolesTable = popupItems.find((item: any) => item?.use === 'TableBlockModel');
    expect(userDetailsBlock?.uid).toBeTruthy();
    expect(userRolesTable?.uid).toBeTruthy();

    const userDetailsReadback = await getSurface(rootAgent, {
      uid: userDetailsBlock.uid,
    });
    expect(collectFieldPaths(userDetailsReadback.tree)).toEqual(expect.arrayContaining(['email', 'roles']));
    expect(_.castArray(userDetailsReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'EditActionModel',
    );
    const userEditAction = _.castArray(userDetailsReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'EditActionModel',
    );
    expect(userEditAction?.uid).toBeTruthy();

    const userEditReadback = await getSurface(rootAgent, {
      uid: userEditAction.uid,
    });
    const userEditForm = _.castArray(userEditReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels?.grid
      ?.subModels?.items?.[0];
    expect(userEditForm?.use).toBe('EditFormModel');
    expect(_.castArray(userEditForm?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    const userRolesReadback = await getSurface(rootAgent, {
      uid: userRolesTable.uid,
    });
    expect(userRolesReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: 'roles',
      associationName: 'users.roles',
    });
    expect(collectFieldPaths(userRolesReadback.tree)).toEqual(expect.arrayContaining(['title', 'name']));
    const roleViewAction = collectDescendantNodes(userRolesReadback.tree, (item) => item?.use === 'ViewActionModel')[0];
    expect(roleViewAction?.uid).toBeTruthy();

    const roleViewReadback = await getSurface(rootAgent, {
      uid: roleViewAction.uid,
    });
    const roleDetailsBlock = _.castArray(roleViewReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels
      ?.grid?.subModels?.items?.[0];
    expect(roleDetailsBlock?.use).toBe('DetailsBlockModel');

    const roleDetailsReadback = await getSurface(rootAgent, {
      uid: roleDetailsBlock.uid,
    });
    expect(_.castArray(roleDetailsReadback.tree.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'EditActionModel',
    );
    const roleEditAction = _.castArray(roleDetailsReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'EditActionModel',
    );
    expect(roleEditAction?.uid).toBeTruthy();

    const roleEditReadback = await getSurface(rootAgent, {
      uid: roleEditAction.uid,
    });
    const roleEditForm = _.castArray(roleEditReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels?.grid
      ?.subModels?.items?.[0];
    expect(roleEditForm?.use).toBe('EditFormModel');
    expect(_.castArray(roleEditForm?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );
  });

  it('should allow custom edit popups with one inherited editForm plus sibling blocks', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Inherited edit popup page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username', 'roles'],
                recordActions: [
                  {
                    type: 'view',
                    title: '详情',
                    popup: {
                      blocks: [
                        {
                          key: 'userDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: 'users',
                          },
                          fields: ['username', 'roles'],
                          actions: [
                            {
                              type: 'edit',
                              title: '编辑用户',
                              popup: {
                                layout: {
                                  rows: [
                                    [
                                      { key: 'userEditForm', span: 12 },
                                      { key: 'userRoles', span: 12 },
                                    ],
                                  ],
                                },
                                blocks: [
                                  {
                                    key: 'userEditForm',
                                    type: 'editForm',
                                    fields: ['username', 'roles'],
                                    actions: ['submit'],
                                  },
                                  {
                                    key: 'userRoles',
                                    type: 'table',
                                    resource: {
                                      binding: 'associatedRecords',
                                      associationField: 'roles',
                                      collectionName: 'roles',
                                    },
                                    fields: ['title', 'name'],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const mainTable = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const mainViewAction = collectDescendantNodes(mainTable, (item) => item?.use === 'ViewActionModel')[0];
    const mainViewReadback = await getSurface(rootAgent, {
      uid: mainViewAction.uid,
    });
    const userDetailsBlock = _.castArray(mainViewReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels
      ?.grid?.subModels?.items?.[0];
    const userDetailsReadback = await getSurface(rootAgent, {
      uid: userDetailsBlock.uid,
    });
    const userEditAction = _.castArray(userDetailsReadback.tree.subModels?.actions || []).find(
      (item: any) => item?.use === 'EditActionModel',
    );
    const userEditReadback = await getSurface(rootAgent, {
      uid: userEditAction.uid,
    });
    const popupItems = _.castArray(
      _.castArray(userEditReadback.tree.subModels?.page?.subModels?.tabs || [])[0]?.subModels?.grid?.subModels?.items ||
        [],
    );
    const userEditForm = popupItems.find((item: any) => item?.use === 'EditFormModel');
    const userRolesTable = popupItems.find((item: any) => item?.use === 'TableBlockModel');

    expect(userEditForm?.use).toBe('EditFormModel');
    expect(userEditForm?.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: 'users',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });
    expect(collectFieldPaths(userEditForm)).toEqual(expect.arrayContaining(['username', 'roles']));
    expect(_.castArray(userEditForm?.subModels?.actions || []).map((item: any) => item?.use)).toContain(
      'FormSubmitActionModel',
    );

    expect(userRolesTable?.use).toBe('TableBlockModel');
    expect(userRolesTable?.stepParams?.resourceSettings?.init).toMatchObject({
      collectionName: 'roles',
      associationName: 'users.roles',
    });
  });

  it('should auto-promote common record actions from actions to recordActions on table, list, and gridCard blocks', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Record action promotion page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Table',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username'],
                actions: ['refresh', { type: 'view', title: 'View row' }, { type: 'edit', title: 'Edit row' }],
                recordActions: [{ type: 'delete', title: 'Delete row' }],
              },
            ],
          },
          {
            title: 'List',
            blocks: [
              {
                type: 'list',
                collection: 'users',
                fields: ['username'],
                actions: ['refresh', { type: 'view', title: 'View row' }, { type: 'edit', title: 'Edit row' }],
                recordActions: [{ type: 'delete', title: 'Delete row' }],
              },
            ],
          },
          {
            title: 'Grid',
            blocks: [
              {
                type: 'gridCard',
                collection: 'users',
                fields: ['username'],
                actions: ['refresh', { type: 'view', title: 'View row' }, { type: 'edit', title: 'Edit row' }],
                recordActions: [{ type: 'delete', title: 'Delete row' }],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const listBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ListBlockModel')[0];
    const gridCardBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'GridCardBlockModel')[0];

    const tableReadback = await getSurface(rootAgent, { uid: tableBlock?.uid });
    const listReadback = await getSurface(rootAgent, { uid: listBlock?.uid });
    const gridCardReadback = await getSurface(rootAgent, { uid: gridCardBlock?.uid });

    expect(readNodeActionUses(tableReadback.tree)).toEqual(['RefreshActionModel']);
    expect(readTableRecordActionUses(tableReadback.tree)).toEqual([
      'DeleteActionModel',
      'ViewActionModel',
      'EditActionModel',
    ]);

    expect(readNodeActionUses(listReadback.tree)).toEqual(['RefreshActionModel']);
    expect(readCardItemRecordActionUses(listReadback.tree)).toEqual([
      'DeleteActionModel',
      'ViewActionModel',
      'EditActionModel',
    ]);

    expect(readNodeActionUses(gridCardReadback.tree)).toEqual(['RefreshActionModel']);
    expect(readCardItemRecordActionUses(gridCardReadback.tree)).toEqual([
      'DeleteActionModel',
      'ViewActionModel',
      'EditActionModel',
    ]);
  });

  it('should reject unsupported applyBlueprint top-level keys', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        unexpectedEnvelope: {
          version: '1',
          title: 'unsupported',
        },
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain('only accepts top-level keys');
    expect(readErrorMessage(res)).toContain('unsupported keys: unexpectedEnvelope');
  });

  it.each([
    [
      'reject create mode target',
      {
        version: '1',
        mode: 'create',
        target: {
          pageSchemaUid: 'employees-page-schema',
        },
        tabs: [
          {
            key: 'overview',
            blocks: [{ key: 'employeesTable', type: 'table', collection: 'employees', fields: ['nickname'] }],
          },
        ],
      },
      'create mode does not accept target',
    ],
    [
      'reject replace mode without target',
      {
        version: '1',
        mode: 'replace',
        tabs: [
          {
            key: 'overview',
            blocks: [{ key: 'employeesTable', type: 'table', collection: 'employees', fields: ['nickname'] }],
          },
        ],
      },
      'replace mode requires target.pageSchemaUid',
    ],
    [
      'reject replace navigation',
      {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: 'employees-page-schema',
        },
        navigation: {
          item: {
            title: 'Employees',
          },
        },
        tabs: [
          {
            key: 'overview',
            blocks: [{ key: 'employeesTable', type: 'table', collection: 'employees', fields: ['nickname'] }],
          },
        ],
      },
      'replace mode does not accept navigation',
    ],
    [
      'reject empty tabs',
      {
        version: '1',
        mode: 'create',
        tabs: [],
      },
      'tabs must be a non-empty array',
    ],
    [
      'reject empty tab blocks',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [],
          },
        ],
      },
      'tabs[0].blocks must be a non-empty array',
    ],
    [
      'reject unsupported blueprint-style key',
      {
        version: '1',
        kind: 'blueprint',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [{ key: 'employeesTable', type: 'table', collection: 'employees', fields: ['nickname'] }],
          },
        ],
      },
      'unsupported keys: kind',
      undefined,
    ],
    [
      'reject block unknown key',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                unexpectedKey: true,
              },
            ],
          },
        ],
      },
      'unsupported keys: unexpectedKey',
      'flowSurfaces applyBlueprint tabs[0].blocks[0]',
    ],
    [
      'reject block.resource unknown key',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                resource: {
                  binding: 'currentRecord',
                  unexpectedKey: true,
                },
              },
            ],
          },
        ],
      },
      'unsupported keys: unexpectedKey',
      'flowSurfaces applyBlueprint tabs[0].blocks[0].resource',
    ],
    [
      'reject block.resource mixed binding and raw-only keys',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                resource: {
                  binding: 'currentRecord',
                  sourceId: 1,
                },
              },
            ],
          },
        ],
      },
      'cannot mix binding with flowSurfaces applyBlueprint tabs[0].blocks[0].resource.sourceId',
      'flowSurfaces applyBlueprint tabs[0].blocks[0].resource',
    ],
    [
      'reject field unknown key',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: [{ key: 'nicknameField', field: 'nickname', unexpectedKey: true }],
              },
            ],
          },
        ],
      },
      'unsupported keys: unexpectedKey',
      'flowSurfaces applyBlueprint tabs[0].blocks[0].fields[0]',
    ],
    [
      'reject field target object',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
              {
                key: 'employeesFilter',
                type: 'filterForm',
                collection: 'employees',
                fields: [
                  {
                    key: 'nicknameField',
                    field: 'nickname',
                    target: {
                      key: 'employeesTable',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      'must be a string block key',
      'flowSurfaces applyBlueprint tabs[0].blocks[1].fields[0].target',
    ],
    [
      'reject action unknown key',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                recordActions: [{ type: 'view', unexpectedKey: true }],
              },
            ],
          },
        ],
      },
      'unsupported keys: unexpectedKey',
      'flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0]',
    ],
    [
      'reject layout cell unknown key',
      {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
            layout: {
              rows: [[{ unexpectedKey: 'employeesTable' }]],
            },
          },
        ],
      },
      'unsupported keys: unexpectedKey',
      'flowSurfaces applyBlueprint tabs[0].layout.rows[0][0]',
    ],
  ])('should %s', async (_label, values, message, expectedPath) => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values,
    });

    expect(res.status).toBe(400);
    const errorMessage = readErrorMessage(res);
    expect(errorMessage).toContain(message);
    if (expectedPath) {
      expect(errorMessage).toContain(expectedPath);
      expect(errorMessage).not.toContain(`tabs['`);
    }
  });

  it('should reject popup unknown keys instead of ignoring them', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      foo: 'bar',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      'flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0].popup only accepts keys title, mode, template, blocks, layout; unsupported keys: foo',
    );
  });

  it('should reject block-level layout and point authors to tabs[] or popup layout only', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                layout: {
                  rows: [['employeesTable']],
                },
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      'flowSurfaces applyBlueprint tabs[0].blocks[0].layout is not supported; layout is only allowed on tabs[] and popup',
    );
  });

  it('should reject generic form blocks in applyBlueprint and point authors to editForm/createForm', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Generic form page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Main',
            blocks: [
              {
                type: 'form',
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      "flowSurfaces applyBlueprint tabs[0].blocks[0].type 'form' is unsupported in applyBlueprint; use 'editForm' or 'createForm'",
    );
  });

  it('should reject custom edit popups that do not contain exactly one editForm block', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Missing editForm page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: 'users',
                          },
                          fields: ['username'],
                          actions: [
                            {
                              type: 'edit',
                              popup: {
                                blocks: [
                                  {
                                    type: 'details',
                                    resource: {
                                      binding: 'currentRecord',
                                      collectionName: 'users',
                                    },
                                    fields: ['username'],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      'flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0].popup.blocks[0].recordActions[0].popup custom edit popup must contain exactly one editForm block',
    );
  });

  it('should reject custom edit popup editForm resources that are not currentRecord-bound', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Invalid editForm resource page ${Date.now()}`,
          },
        },
        tabs: [
          {
            title: 'Users',
            blocks: [
              {
                type: 'table',
                collection: 'users',
                fields: ['username'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                            collectionName: 'users',
                          },
                          fields: ['username'],
                          actions: [
                            {
                              type: 'edit',
                              popup: {
                                blocks: [
                                  {
                                    type: 'editForm',
                                    resource: {
                                      binding: 'associatedRecords',
                                      associationField: 'roles',
                                      collectionName: 'roles',
                                    },
                                    fields: ['title'],
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      "flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0].popup.blocks[0].recordActions[0].popup.blocks[0].resource.binding must be 'currentRecord' in a custom edit popup",
    );
  });

  it('should reject tab layout uid cells and require key-only applyBlueprint layout cells', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
            layout: {
              rows: [[{ uid: 'existing-block-uid' }]],
            },
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain(
      'flowSurfaces applyBlueprint tabs[0].layout.rows[0][0] only accepts keys key, span; unsupported keys: uid',
    );
  });

  it('should reject non-object tab layout values instead of silently dropping them', async () => {
    const res = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
            layout: 'auto',
          },
        ],
      },
    });

    expect(res.status).toBe(400);
    expect(readErrorMessage(res)).toContain('flowSurfaces applyBlueprint tabs[0].layout must be an object');
  });

  it('should keep page enableTabs unchanged in replace mode when page.enableTabs is omitted', async () => {
    const page = await createPage(rootAgent, {
      title: 'Preserve enableTabs',
      tabTitle: 'Legacy overview',
      enableTabs: true,
    });
    const addTabRes = await rootAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: page.pageUid,
        },
        title: 'Legacy extra',
      },
    });
    expect(addTabRes.status).toBe(200);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        page: {
          title: 'Preserved tabs page',
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(getRouteBackedTabs(data.surface)).toHaveLength(1);
    expect(data.surface.pageRoute.enableTabs).toBe(true);
  });

  it('should rewrite existing route-backed tab slots by index without requiring tab keys', async () => {
    const page = await createPage(rootAgent, {
      title: 'Tab order page',
      tabTitle: 'Legacy overview',
      enableTabs: true,
      tabSchemaName: 'overview',
    });
    const addTabRes = await rootAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: page.pageUid,
        },
        title: 'Legacy summary',
        tabSchemaName: 'summary',
      },
    });
    const addedTab = getData(addTabRes);
    const beforeSurface = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const beforeTabs = getRouteBackedTabs(beforeSurface);
    expect(beforeTabs).toHaveLength(2);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        tabs: [
          {
            title: 'Summary',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
          {
            title: 'Overview',
            blocks: [
              {
                type: 'details',
                collection: 'employees',
                fields: ['nickname', 'status'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(getRouteBackedTabs(data.surface).map((tab: any) => tab.uid)).toEqual([
      page.tabSchemaUid,
      addedTab.tabSchemaUid,
    ]);
    expect(getRouteBackedTabs(data.surface).map((tab: any) => tab?.props?.title)).toEqual(['Summary', 'Overview']);
  });

  it('should reject replace multi-tab payload when enableTabs is omitted but current page enableTabs is false', async () => {
    const page = await createPage(rootAgent, {
      title: 'Hidden tabs page',
      tabTitle: 'Legacy overview',
      enableTabs: false,
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'overviewTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
          {
            key: 'summary',
            title: 'Summary',
            blocks: [
              {
                key: 'summaryTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain(
      'replace mode requires page.enableTabs=true when tabs.length > 1 and the current page has enableTabs=false',
    );
  });

  it('should allow replace multi-tab payload when current page enableTabs is false but page.enableTabs=true is explicit', async () => {
    const page = await createPage(rootAgent, {
      title: 'Hidden tabs upgrade page',
      tabTitle: 'Legacy overview',
      enableTabs: false,
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: page.pageSchemaUid,
        },
        page: {
          enableTabs: true,
        },
        tabs: [
          {
            key: 'overview',
            title: 'Overview',
            blocks: [
              {
                key: 'overviewTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
          {
            key: 'summary',
            title: 'Summary',
            blocks: [
              {
                key: 'summaryTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(200);
    const data = getData(executeRes);
    expect(getRouteBackedTabs(data.surface)).toHaveLength(2);
    expect(data.surface.pageRoute.enableTabs).toBe(true);
  });

  it('should reject object-style field target keys in applyBlueprint and require string block keys only', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Filter target page',
          },
        },
        tabs: [
          {
            key: 'overview',
            blocks: [
              {
                key: 'employeesFilter',
                type: 'filterForm',
                collection: 'employees',
                fields: [
                  {
                    key: 'nickname',
                    field: 'nickname',
                    target: {
                      key: 'employeesTable',
                    },
                  },
                ],
              },
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces applyBlueprint tabs[0].blocks[0].fields[0].target');
    expect(readErrorMessage(executeRes)).toContain('target must be a string block key');
  });

  it('should reject duplicate reaction slots with index-based public paths', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Duplicate reaction slot page',
          },
        },
        tabs: [
          {
            key: 'main',
            title: 'Overview',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['status'],
                actions: ['submit'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: [],
            },
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: [],
            },
          ],
        },
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces applyBlueprint reaction.items[1]');
    expect(readErrorMessage(executeRes)).toContain(`duplicates reaction slot 'setFieldValueRules'`);
    expect(readErrorMessage(executeRes)).toContain(`target 'main.employeeForm'`);
  });

  it('should reject invalid reaction target payloads with index-based public paths', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid reaction payload page',
          },
        },
        tabs: [
          {
            key: 'main',
            title: 'Overview',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['status'],
                actions: ['submit'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: {},
              rules: {},
            },
          ],
        },
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces applyBlueprint reaction.items[0].target');
    expect(readErrorMessage(executeRes)).toContain('must be a non-empty string');
  });

  it('should reject non-array reaction rules payloads with index-based public paths', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid reaction rules page',
          },
        },
        tabs: [
          {
            key: 'main',
            title: 'Overview',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['status'],
                actions: ['submit'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: {},
            },
          ],
        },
      },
    });

    expect(executeRes.status).toBe(400);
    expect(readErrorMessage(executeRes)).toContain('flowSurfaces applyBlueprint reaction.items[0].rules');
    expect(readErrorMessage(executeRes)).toContain('must be an array');
  });

  it('should report popup nested block errors with index-based public paths', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Popup validation page',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: ['nickname'],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          type: 'details',
                          collection: 'employees',
                          unexpectedNestedKey: 'department',
                          fields: ['nickname'],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    const message = readErrorMessage(executeRes);
    expect(message).toContain('flowSurfaces applyBlueprint tabs[0].blocks[0].recordActions[0].popup.blocks[0]');
    expect(message).toContain('unsupported keys: unexpectedNestedKey');
    expect(message).not.toContain(`tabs['`);
  });
});
