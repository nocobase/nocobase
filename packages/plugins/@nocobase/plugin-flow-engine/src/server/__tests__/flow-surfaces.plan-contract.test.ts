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
  addBlockData,
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getData,
  getRouteBackedTabs,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

describe('flowSurfaces plan contract', () => {
  let context: FlowSurfacesContractContext;
  let flowRepo: FlowSurfacesContractContext['flowRepo'];
  let routesRepo: FlowSurfacesContractContext['routesRepo'];
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  function getComposeBlock(result: Record<string, any>, key: string) {
    const matched = _.castArray(result?.blocks || []).find((item: any) => item?.key === key);
    expect(matched).toBeTruthy();
    return matched;
  }

  function getComposeField(block: Record<string, any>, key: string) {
    const matched = _.castArray(block?.fields || []).find((item: any) => item?.key === key);
    expect(matched).toBeTruthy();
    return matched;
  }

  function getComposeAction(block: Record<string, any>, scope: 'actions' | 'recordActions', key: string) {
    const matched = _.castArray(block?.[scope] || []).find((item: any) => item?.key === key);
    expect(matched).toBeTruthy();
    return matched;
  }

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ flowRepo, routesRepo, rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should execute representative bootstrap steps through executePlan and return the created page surface', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        plan: {
          steps: [
            {
              id: 'group',
              action: 'createMenu',
              values: {
                title: 'Bootstrap workspace',
                type: 'group',
              },
            },
            {
              id: 'menu',
              action: 'createMenu',
              values: {
                title: 'Bootstrap employees',
                type: 'item',
                parentMenuRouteId: {
                  step: 'group',
                  path: 'routeId',
                },
              },
            },
            {
              id: 'page',
              action: 'createPage',
              values: {
                menuRouteId: {
                  step: 'menu',
                  path: 'routeId',
                },
                key: 'employeesPage',
                tabTitle: 'Overview',
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);

    const executeData = getData(executeRes);
    expect(executeData.surfaceExistsAfterExecute).toBe(true);
    expect(executeData.compiledSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'group',
          action: 'createMenu',
          payload: expect.objectContaining({
            title: 'Bootstrap workspace',
            type: 'group',
          }),
        }),
        expect.objectContaining({
          id: 'menu',
          action: 'createMenu',
          payload: expect.objectContaining({
            type: 'item',
            parentMenuRouteId: {
              step: 'group',
              path: 'routeId',
            },
          }),
        }),
        expect.objectContaining({
          id: 'page',
          action: 'createPage',
          payload: expect.objectContaining({
            menuRouteId: {
              step: 'menu',
              path: 'routeId',
            },
            key: 'employeesPage',
          }),
        }),
      ]),
    );

    const resultById = Object.fromEntries(
      executeData.results.map((item: Record<string, any>) => [String(item.id || item.index), item.result]),
    );
    expect(resultById.group.routeId).toBeTruthy();
    expect(resultById.menu.parentMenuRouteId).toBe(resultById.group.routeId);
    expect(resultById.page.routeId).toBe(resultById.menu.routeId);
    expect(executeData.target).toMatchObject({
      locator: {
        pageSchemaUid: resultById.page.pageSchemaUid,
      },
      uid: resultById.page.pageUid,
      kind: 'page',
    });
    expect(executeData.keys.surface.uid).toBe(resultById.page.pageUid);
    expect(executeData.keys.employeesPage.uid).toBe(resultById.page.pageUid);

    const pageSurface = await getSurface(rootAgent, {
      pageSchemaUid: resultById.page.pageSchemaUid,
    });
    const tabs = getRouteBackedTabs(pageSurface);
    expect(tabs).toHaveLength(1);
    expect(tabs[0]?.uid).toBe(resultById.page.tabSchemaUid);
  });

  it('should execute compose through executePlan runtime dispatch', async () => {
    const page = await createPage(rootAgent, {
      title: 'Execute plan compose page',
      tabTitle: 'Execute plan compose tab',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              id: 'composeTable',
              action: 'compose',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
                mode: 'append',
                blocks: [
                  {
                    key: 'employeesTable',
                    type: 'table',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'employees',
                    },
                    fields: [{ key: 'employeesTable.nickname', fieldPath: 'nickname' }],
                  },
                ],
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);

    const executeData = getData(executeRes);
    expect(executeData.compiledSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'composeTable',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: page.tabSchemaUid,
            },
          }),
        }),
      ]),
    );
    expect(executeData.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'composeTable',
          action: 'compose',
          result: expect.objectContaining({
            blocks: expect.arrayContaining([
              expect.objectContaining({ key: 'employeesTable', uid: expect.any(String) }),
            ]),
          }),
        }),
      ]),
    );

    const tableUid = getComposeBlock(executeData.results[0]?.result, 'employeesTable').uid;
    const tableSurface = await getSurface(rootAgent, {
      uid: tableUid,
    });
    expect(tableSurface.tree.use).toBe('TableBlockModel');
    expect(tableSurface.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
  });

  it('should aggregate top-level addField issues during validatePlan dry-run and rollback the preview writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Validate plan addField preview page',
      tabTitle: 'Validate plan addField preview tab',
    });

    const validateRes = await rootAgent.resource('flowSurfaces').validatePlan({
      values: {
        validation: {
          collectFieldIssues: true,
        },
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              id: 'addRolesDetails',
              action: 'addBlock',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
                type: 'details',
                resourceInit: {
                  dataSourceKey: 'main',
                  collectionName: 'roles',
                },
              },
            },
            {
              id: 'addDefault',
              action: 'addField',
              selectors: {
                target: {
                  step: 'addRolesDetails',
                  path: 'uid',
                },
              },
              values: {
                fieldPath: 'default',
              },
            },
            {
              id: 'addHidden',
              action: 'addField',
              selectors: {
                target: {
                  step: 'addRolesDetails',
                  path: 'uid',
                },
              },
              values: {
                fieldPath: 'hidden',
              },
            },
          ],
        },
      },
    });
    expect(validateRes.status).toBe(200);

    const validateData = getData(validateRes);
    expect(validateData.validation).toEqual(
      expect.objectContaining({
        ok: false,
        fieldIssues: expect.arrayContaining([
          expect.objectContaining({
            stepId: 'addDefault',
            action: 'addField',
            fieldPath: 'default',
            blocking: false,
          }),
          expect.objectContaining({
            stepId: 'addHidden',
            action: 'addField',
            fieldPath: 'hidden',
            blocking: false,
          }),
        ]),
      }),
    );
    expect(validateData.validation.fieldIssues).toHaveLength(2);
    expect(validateData.validation.fieldIssues[0].message).toContain('has no interface');

    const pageSurface = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const gridItems = _.castArray(pageSurface?.tree?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || []);
    expect(gridItems).toHaveLength(0);
  });

  it('should aggregate compose field issues and report blocked downstream keys without mutating the surface', async () => {
    const page = await createPage(rootAgent, {
      title: 'Validate plan compose preview page',
      tabTitle: 'Validate plan compose preview tab',
    });

    const validateRes = await rootAgent.resource('flowSurfaces').validatePlan({
      values: {
        validation: {
          collectFieldIssues: true,
        },
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              id: 'composeRoles',
              action: 'compose',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
                mode: 'append',
                blocks: [
                  {
                    key: 'rolesDetails',
                    type: 'details',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'roles',
                    },
                    fields: [
                      { key: 'rolesDetails.title', fieldPath: 'title' },
                      { key: 'rolesDetails.hidden', fieldPath: 'hidden' },
                      { key: 'rolesDetails.default', fieldPath: 'default' },
                    ],
                  },
                ],
              },
            },
            {
              id: 'configureMissingField',
              action: 'configure',
              selectors: {
                target: {
                  key: 'rolesDetails.hidden',
                },
              },
              values: {
                changes: {
                  label: 'Blocked label',
                },
              },
            },
          ],
        },
      },
    });
    expect(validateRes.status).toBe(200);

    const validateData = getData(validateRes);
    expect(validateData.validation).toEqual(
      expect.objectContaining({
        ok: false,
      }),
    );
    expect(validateData.validation.fieldIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stepId: 'composeRoles',
          action: 'compose',
          blockKey: 'rolesDetails',
          fieldKey: 'rolesDetails.hidden',
          fieldPath: 'hidden',
          blocking: false,
        }),
        expect.objectContaining({
          stepId: 'composeRoles',
          action: 'compose',
          blockKey: 'rolesDetails',
          fieldKey: 'rolesDetails.default',
          fieldPath: 'default',
          blocking: false,
        }),
        expect.objectContaining({
          stepId: 'configureMissingField',
          action: 'configure',
          blocking: true,
          code: 'FLOW_SURFACE_VALIDATE_PLAN_BLOCKED_BY_FIELD_ISSUE',
        }),
      ]),
    );

    const pageSurface = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const gridItems = _.castArray(pageSurface?.tree?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || []);
    expect(gridItems).toHaveLength(0);
  });

  it('should not treat key declarations as blocked dependencies after earlier field issues', async () => {
    const page = await createPage(rootAgent, {
      title: 'Validate plan key declarations page',
      tabTitle: 'Validate plan key declarations tab',
    });

    const validateRes = await rootAgent.resource('flowSurfaces').validatePlan({
      values: {
        validation: {
          collectFieldIssues: true,
        },
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              id: 'composeRoles',
              action: 'compose',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
                mode: 'append',
                blocks: [
                  {
                    key: 'rolesDetails',
                    type: 'details',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'roles',
                    },
                    fields: [{ key: 'rolesDetails.hidden', fieldPath: 'hidden' }],
                  },
                ],
              },
            },
            {
              id: 'addHelpBlock',
              action: 'addBlock',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
                key: 'helpPanel',
                type: 'markdown',
                settings: {
                  content: '# Preview help',
                },
              },
            },
            {
              id: 'composeHelpPanel',
              action: 'compose',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
                mode: 'append',
                blocks: [
                  {
                    key: 'profileHelp',
                    type: 'markdown',
                    settings: {
                      content: 'Key declarations should not block preview',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
    expect(validateRes.status).toBe(200);

    const validateData = getData(validateRes);
    expect(validateData.validation).toEqual(
      expect.objectContaining({
        ok: false,
        fieldIssues: [
          expect.objectContaining({
            stepId: 'composeRoles',
            action: 'compose',
            blockKey: 'rolesDetails',
            fieldKey: 'rolesDetails.hidden',
            fieldPath: 'hidden',
            blocking: false,
          }),
        ],
      }),
    );
    expect(validateData.validation.fieldIssues).toHaveLength(1);

    const blockedStepIds = new Set(
      _.castArray(validateData.validation.fieldIssues)
        .filter((issue: any) => issue?.blocking)
        .map((issue: any) => issue?.stepId),
    );
    expect(blockedStepIds.has('addHelpBlock')).toBe(false);
    expect(blockedStepIds.has('composeHelpPanel')).toBe(false);

    const pageSurface = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const gridItems = _.castArray(pageSurface?.tree?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || []);
    expect(gridItems).toHaveLength(0);
  });

  it('should still block downstream key-targeted payloads after earlier field issues', async () => {
    const page = await createPage(rootAgent, {
      title: 'Validate plan blocked key payload page',
      tabTitle: 'Validate plan blocked key payload tab',
    });

    const validateRes = await rootAgent.resource('flowSurfaces').validatePlan({
      values: {
        validation: {
          collectFieldIssues: true,
        },
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              id: 'composeRoles',
              action: 'compose',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
                mode: 'append',
                blocks: [
                  {
                    key: 'rolesDetails',
                    type: 'details',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'roles',
                    },
                    fields: [{ key: 'rolesDetails.hidden', fieldPath: 'hidden' }],
                  },
                ],
              },
            },
            {
              id: 'configureMissingField',
              action: 'configure',
              selectors: {
                target: {
                  key: 'rolesDetails.hidden',
                },
              },
              values: {
                changes: {
                  label: 'Blocked label',
                },
              },
            },
          ],
        },
      },
    });
    expect(validateRes.status).toBe(200);

    const validateData = getData(validateRes);
    expect(validateData.validation).toEqual(
      expect.objectContaining({
        ok: false,
        fieldIssues: [
          expect.objectContaining({
            stepId: 'composeRoles',
            action: 'compose',
            blockKey: 'rolesDetails',
            fieldKey: 'rolesDetails.hidden',
            fieldPath: 'hidden',
            blocking: false,
          }),
          expect.objectContaining({
            stepId: 'configureMissingField',
            action: 'configure',
            blocking: true,
            code: 'FLOW_SURFACE_VALIDATE_PLAN_BLOCKED_BY_FIELD_ISSUE',
          }),
        ],
      }),
    );
    expect(validateData.validation.fieldIssues).toHaveLength(2);

    const pageSurface = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const gridItems = _.castArray(pageSurface?.tree?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || []);
    expect(gridItems).toHaveLength(0);
  });

  it('should validate representative bootstrap preview by reusing created keys without mutating routes', async () => {
    const routeCountBefore = await routesRepo.count();

    const validateRes = await rootAgent.resource('flowSurfaces').validatePlan({
      values: {
        validation: {
          collectFieldIssues: true,
        },
        plan: {
          steps: [
            {
              id: 'group',
              action: 'createMenu',
              values: {
                title: 'Validate preview workspace',
                type: 'group',
              },
            },
            {
              id: 'menu',
              action: 'createMenu',
              values: {
                title: 'Validate preview users',
                type: 'item',
                parentMenuRouteId: {
                  step: 'group',
                  path: 'routeId',
                },
              },
            },
            {
              id: 'page',
              action: 'createPage',
              values: {
                menuRouteId: {
                  step: 'menu',
                  path: 'routeId',
                },
                key: 'usersPage',
                title: 'Validate preview users page',
                tabTitle: 'Users',
              },
            },
            {
              id: 'composeMain',
              action: 'compose',
              selectors: {
                target: {
                  key: 'usersPage.tab',
                },
              },
              values: {
                mode: 'append',
                blocks: [
                  {
                    key: 'usersTable',
                    type: 'table',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'users',
                    },
                    fields: [{ key: 'usersTable.username', fieldPath: 'username' }],
                  },
                ],
              },
            },
          ],
        },
      },
    });
    expect(validateRes.status).toBe(200);

    const validateData = getData(validateRes);
    expect(validateData.compiledSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'composeMain',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: {
                key: 'usersPage.tab',
              },
            },
          }),
        }),
      ]),
    );
    expect(validateData.validation).toEqual({
      ok: true,
      fieldIssues: [],
    });
    expect(await routesRepo.count()).toBe(routeCountBefore);
  });

  it('should execute a one-shot bootstrap plan for nested popup content by reusing created keys', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        plan: {
          steps: [
            {
              id: 'group',
              action: 'createMenu',
              values: {
                title: 'One-shot workspace',
                type: 'group',
              },
            },
            {
              id: 'menu',
              action: 'createMenu',
              values: {
                title: 'One-shot users',
                type: 'item',
                parentMenuRouteId: {
                  step: 'group',
                  path: 'routeId',
                },
              },
            },
            {
              id: 'page',
              action: 'createPage',
              values: {
                menuRouteId: {
                  step: 'menu',
                  path: 'routeId',
                },
                key: 'usersPage',
                title: 'One-shot users page',
                tabTitle: 'Users',
              },
            },
            {
              id: 'composeMain',
              action: 'compose',
              selectors: {
                target: {
                  key: 'usersPage.tab',
                },
              },
              values: {
                mode: 'append',
                blocks: [
                  {
                    key: 'usersTable',
                    type: 'table',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'users',
                    },
                    fields: [
                      { key: 'usersTable.username', fieldPath: 'username' },
                      { key: 'usersTable.nickname', fieldPath: 'nickname' },
                    ],
                    recordActions: [{ key: 'usersTable.viewUser', type: 'view' }],
                  },
                ],
              },
            },
            {
              id: 'userPopupContent',
              action: 'compose',
              selectors: {
                target: {
                  key: 'usersTable.viewUser.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    key: 'userDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [
                      { key: 'userDetails.username', fieldPath: 'username' },
                      { key: 'userDetails.nickname', fieldPath: 'nickname' },
                    ],
                    recordActions: [{ key: 'userDetails.editUser', type: 'edit' }],
                  },
                ],
              },
            },
            {
              id: 'userEditPopupContent',
              action: 'compose',
              selectors: {
                target: {
                  key: 'userDetails.editUser.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    key: 'userEditForm',
                    type: 'editForm',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [
                      { key: 'userEditForm.username', fieldPath: 'username' },
                      { key: 'userEditForm.nickname', fieldPath: 'nickname' },
                    ],
                    actions: [{ key: 'userEditForm.submit', type: 'submit' }],
                  },
                ],
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);

    const executeData = getData(executeRes);
    expect(executeData.surfaceExistsAfterExecute).toBe(true);
    expect(executeData.compiledSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'userPopupContent',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: {
                key: 'usersTable.viewUser.popupGrid',
              },
            },
          }),
        }),
        expect.objectContaining({
          id: 'userEditPopupContent',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: {
                key: 'userDetails.editUser.popupGrid',
              },
            },
          }),
        }),
      ]),
    );

    const resultById = Object.fromEntries(
      executeData.results.map((item: Record<string, any>) => [String(item.id || item.index), item.result]),
    );
    const mainUsersTable = getComposeBlock(resultById.composeMain, 'usersTable');
    const mainViewUser = getComposeAction(mainUsersTable, 'recordActions', 'usersTable.viewUser');
    expect(mainViewUser.popupGridUid).toBeTruthy();
    expect(resultById.userPopupContent.target.uid).toBe(mainViewUser.popupGridUid);

    const userDetails = getComposeBlock(resultById.userPopupContent, 'userDetails');
    const userEditAction = getComposeAction(userDetails, 'recordActions', 'userDetails.editUser');
    expect(userDetails.uid).toBeTruthy();
    expect(userEditAction.popupGridUid).toBeTruthy();
    expect(resultById.userEditPopupContent.target.uid).toBe(userEditAction.popupGridUid);

    const userEditForm = getComposeBlock(resultById.userEditPopupContent, 'userEditForm');
    const userEditSubmit = getComposeAction(userEditForm, 'actions', 'userEditForm.submit');
    expect(userEditForm.uid).toBeTruthy();
    expect(userEditSubmit.uid).toBeTruthy();

    const mainTableSurface = await getSurface(rootAgent, {
      uid: mainUsersTable.uid,
    });
    expect(mainTableSurface.tree.use).toBe('TableBlockModel');
    expect(getComposeField(mainUsersTable, 'usersTable.nickname').fieldPath).toBe('nickname');

    const userDetailsSurface = await getSurface(rootAgent, {
      uid: userDetails.uid,
    });
    expect(userDetailsSurface.tree.use).toBe('DetailsBlockModel');

    const userEditFormSurface = await getSurface(rootAgent, {
      uid: userEditForm.uid,
    });
    expect(userEditFormSurface.tree.use).toBe('EditFormModel');
    expect(userEditFormSurface.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });
  });

  it('should execute configure-created popup keys in the same plan and persist the popup keys', async () => {
    const page = await createPage(rootAgent, {
      title: 'Execute configure popup keys page',
      tabTitle: 'Execute configure popup keys tab',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              id: 'addDetails',
              action: 'addBlock',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
                type: 'details',
                resourceInit: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
              },
            },
            {
              id: 'addManagerField',
              action: 'addField',
              selectors: {
                target: {
                  step: 'addDetails',
                  path: 'uid',
                },
              },
              values: {
                key: 'employeeManagerTitle',
                fieldPath: 'manager.nickname',
              },
            },
            {
              id: 'configureManagerPopup',
              action: 'configure',
              selectors: {
                target: {
                  key: 'employeeManagerTitle.field',
                },
              },
              values: {
                key: 'managerPopup',
                changes: {
                  openView: {
                    dataSourceKey: 'main',
                    collectionName: 'employees',
                    associationName: 'employees.manager',
                    mode: 'modal',
                  },
                },
              },
            },
            {
              id: 'composeManagerPopup',
              action: 'compose',
              selectors: {
                target: {
                  key: 'managerPopup.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    key: 'managerDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [{ key: 'managerDetails.nickname', fieldPath: 'nickname' }],
                  },
                ],
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);

    const executeData = getData(executeRes);
    expect(executeData.compiledSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'configureManagerPopup',
          action: 'configure',
          payload: expect.objectContaining({
            target: {
              uid: {
                key: 'employeeManagerTitle.field',
              },
            },
            key: 'managerPopup',
          }),
        }),
        expect.objectContaining({
          id: 'composeManagerPopup',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: {
                key: 'managerPopup.popupGrid',
              },
            },
          }),
        }),
      ]),
    );
    const resultById = Object.fromEntries(
      executeData.results.map((item: Record<string, any>) => [String(item.id || item.index), item.result]),
    );
    const configureStep = executeData.results.find((item: Record<string, any>) => item.id === 'configureManagerPopup');
    expect(configureStep).toBeTruthy();
    expect(resultById.configureManagerPopup.popupPageUid).toBeTruthy();
    expect(resultById.configureManagerPopup.popupTabUid).toBeTruthy();
    expect(resultById.configureManagerPopup.popupGridUid).toBeTruthy();
    expect(configureStep.createdKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'managerPopup.popupPage',
          uid: resultById.configureManagerPopup.popupPageUid,
        }),
        expect.objectContaining({
          key: 'managerPopup.popupTab',
          uid: resultById.configureManagerPopup.popupTabUid,
        }),
        expect.objectContaining({
          key: 'managerPopup.popupGrid',
          uid: resultById.configureManagerPopup.popupGridUid,
        }),
      ]),
    );
    expect(executeData.persistedKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'managerPopup.popupPage',
          uid: resultById.configureManagerPopup.popupPageUid,
          persisted: true,
        }),
        expect.objectContaining({
          key: 'managerPopup.popupTab',
          uid: resultById.configureManagerPopup.popupTabUid,
          persisted: true,
        }),
        expect.objectContaining({
          key: 'managerPopup.popupGrid',
          uid: resultById.configureManagerPopup.popupGridUid,
          persisted: true,
        }),
      ]),
    );
    expect(resultById.composeManagerPopup.target.uid).toBe(resultById.configureManagerPopup.popupGridUid);

    const managerDetails = getComposeBlock(resultById.composeManagerPopup, 'managerDetails');
    const managerDetailsSurface = await getSurface(rootAgent, {
      uid: managerDetails.uid,
    });
    expect(managerDetailsSurface.tree.use).toBe('DetailsBlockModel');
  });

  it('should infer configure-created popup keys from a target field key during validatePlan', async () => {
    const page = await createPage(rootAgent, {
      title: 'Validate inferred configure popup keys page',
      tabTitle: 'Validate inferred configure popup keys tab',
    });

    const validateRes = await rootAgent.resource('flowSurfaces').validatePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              id: 'addDetails',
              action: 'addBlock',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
                type: 'details',
                resourceInit: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
              },
            },
            {
              id: 'addManagerField',
              action: 'addField',
              selectors: {
                target: {
                  step: 'addDetails',
                  path: 'uid',
                },
              },
              values: {
                key: 'employeeManagerTitle',
                fieldPath: 'manager.nickname',
              },
            },
            {
              id: 'configureManagerPopup',
              action: 'configure',
              selectors: {
                target: {
                  key: 'employeeManagerTitle.field',
                },
              },
              values: {
                changes: {
                  openView: {
                    dataSourceKey: 'main',
                    collectionName: 'employees',
                    associationName: 'employees.manager',
                    mode: 'modal',
                  },
                },
              },
            },
            {
              id: 'composeManagerPopup',
              action: 'compose',
              selectors: {
                target: {
                  key: 'employeeManagerTitle.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    key: 'managerDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [{ key: 'managerDetails.nickname', fieldPath: 'nickname' }],
                  },
                ],
              },
            },
          ],
        },
      },
    });
    expect(validateRes.status).toBe(200);

    const validateData = getData(validateRes);
    expect(validateData.compiledSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'composeManagerPopup',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: {
                key: 'employeeManagerTitle.popupGrid',
              },
            },
          }),
        }),
      ]),
    );

    const pageSurface = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const gridItems = _.castArray(pageSurface?.tree?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || []);
    expect(gridItems).toHaveLength(0);
  });

  it('should infer configure-created popup keys from a target field key during executePlan and persist them', async () => {
    const page = await createPage(rootAgent, {
      title: 'Execute inferred configure popup keys page',
      tabTitle: 'Execute inferred configure popup keys tab',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              id: 'addDetails',
              action: 'addBlock',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
                type: 'details',
                resourceInit: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
              },
            },
            {
              id: 'addManagerField',
              action: 'addField',
              selectors: {
                target: {
                  step: 'addDetails',
                  path: 'uid',
                },
              },
              values: {
                key: 'employeeManagerTitle',
                fieldPath: 'manager.nickname',
              },
            },
            {
              id: 'configureManagerPopup',
              action: 'configure',
              selectors: {
                target: {
                  key: 'employeeManagerTitle.field',
                },
              },
              values: {
                changes: {
                  openView: {
                    dataSourceKey: 'main',
                    collectionName: 'employees',
                    associationName: 'employees.manager',
                    mode: 'modal',
                  },
                },
              },
            },
            {
              id: 'composeManagerPopup',
              action: 'compose',
              selectors: {
                target: {
                  key: 'employeeManagerTitle.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    key: 'managerDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [
                      { key: 'managerDetails.nickname', fieldPath: 'nickname' },
                      { key: 'managerDetails.status', fieldPath: 'status' },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);

    const executeData = getData(executeRes);
    const resultById = Object.fromEntries(
      executeData.results.map((item: Record<string, any>) => [String(item.id || item.index), item.result]),
    );
    const configureStep = executeData.results.find((item: Record<string, any>) => item.id === 'configureManagerPopup');
    expect(configureStep).toBeTruthy();
    expect(configureStep.createdKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'employeeManagerTitle.popupPage',
          uid: resultById.configureManagerPopup.popupPageUid,
        }),
        expect.objectContaining({
          key: 'employeeManagerTitle.popupTab',
          uid: resultById.configureManagerPopup.popupTabUid,
        }),
        expect.objectContaining({
          key: 'employeeManagerTitle.popupGrid',
          uid: resultById.configureManagerPopup.popupGridUid,
        }),
      ]),
    );
    expect(executeData.persistedKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'employeeManagerTitle.popupPage',
          uid: resultById.configureManagerPopup.popupPageUid,
          persisted: true,
        }),
        expect.objectContaining({
          key: 'employeeManagerTitle.popupTab',
          uid: resultById.configureManagerPopup.popupTabUid,
          persisted: true,
        }),
        expect.objectContaining({
          key: 'employeeManagerTitle.popupGrid',
          uid: resultById.configureManagerPopup.popupGridUid,
          persisted: true,
        }),
      ]),
    );
    expect(resultById.composeManagerPopup.target.uid).toBe(resultById.configureManagerPopup.popupGridUid);
  });

  it('should persist only used bindKeys as declared keys and keep metadata hidden from public reads', async () => {
    const page = await createPage(rootAgent, {
      title: 'Key persistence page',
      tabTitle: 'Key persistence tab',
    });
    const pageReadback = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const pageGridUid = getRouteBackedTabs(pageReadback)[0]?.subModels?.grid?.uid;
    expect(pageGridUid).toBeTruthy();

    const table = await addBlockData(rootAgent, {
      target: {
        uid: pageGridUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const describeRes = await rootAgent.resource('flowSurfaces').describeSurface({
      values: {
        locator: {
          pageSchemaUid: page.pageSchemaUid,
        },
        bindKeys: [
          {
            key: 'employeesTable',
            locator: {
              uid: table.uid,
            },
            expectedKind: 'block',
          },
        ],
      },
    });
    expect(describeRes.status).toBe(200);
    const describeData = getData(describeRes);
    expect(describeData.keys.employeesTable.uid).toBe(table.uid);

    const describeWithoutBindRefs = getData(
      await rootAgent.resource('flowSurfaces').describeSurface({
        values: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
      }),
    );
    expect(describeWithoutBindRefs.fingerprint).not.toBe(describeData.fingerprint);

    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        bindKeys: [
          {
            key: 'employeesTable',
            locator: {
              uid: table.uid,
            },
            expectedKind: 'block',
          },
          {
            key: 'unusedTable',
            locator: {
              uid: table.uid,
            },
            expectedKind: 'block',
          },
        ],
        plan: {
          steps: [
            {
              id: 'configureTable',
              action: 'configure',
              selectors: {
                target: {
                  key: 'employeesTable',
                },
              },
              values: {
                changes: {
                  pageSize: 25,
                },
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);
    const executeData = getData(executeRes);
    expect(executeData.persistedKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'employeesTable',
          uid: table.uid,
          persisted: true,
        }),
      ]),
    );
    expect(executeData.persistedKeys).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'unusedTable',
        }),
      ]),
    );

    const describedAgain = getData(
      await rootAgent.resource('flowSurfaces').describeSurface({
        values: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
      }),
    );
    expect(describedAgain.keys.employeesTable.uid).toBe(table.uid);
    expect(describedAgain.keys.unusedTable).toBeUndefined();
    const describeWithBindKeyAfterPersist = getData(
      await rootAgent.resource('flowSurfaces').describeSurface({
        values: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
          bindKeys: [
            {
              key: 'employeesTable',
              locator: {
                uid: table.uid,
              },
              expectedKind: 'block',
            },
          ],
        },
      }),
    );
    expect(describeWithBindKeyAfterPersist.fingerprint).toBe(describedAgain.fingerprint);

    const publicTableReadback = await getSurface(rootAgent, {
      uid: table.uid,
    });
    expect(publicTableReadback.tree?.stepParams?.__flowSurfaceMeta).toBeUndefined();

    const rawTable = await flowRepo.findModelById(table.uid, {
      includeAsyncNode: true,
    });
    expect(_.get(rawTable, ['stepParams', '__flowSurfaceMeta', 'declaredKey'])).toBe('employeesTable');
  });

  it('should ignore reserved declared keys and persist surface.key when anchoring a persistable surface', async () => {
    const page = await createPage(rootAgent, {
      title: 'Surface anchor page',
      tabTitle: 'Surface anchor tab',
    });
    const pageReadback = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const pageGridUid = getRouteBackedTabs(pageReadback)[0]?.subModels?.grid?.uid;
    expect(pageGridUid).toBeTruthy();

    const table = await addBlockData(rootAgent, {
      target: {
        uid: pageGridUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const rawTableBeforePollution = await flowRepo.findModelById(table.uid, {
      includeAsyncNode: true,
    });
    await flowRepo.patch({
      uid: table.uid,
      stepParams: {
        ...(rawTableBeforePollution?.stepParams || {}),
        __flowSurfaceMeta: {
          declaredKey: 'surface',
        },
      },
    });

    const describedWithReservedDeclaredRef = getData(
      await rootAgent.resource('flowSurfaces').describeSurface({
        values: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
      }),
    );
    expect(describedWithReservedDeclaredRef.keys.surface.uid).toBe(page.pageUid);
    expect(describedWithReservedDeclaredRef.keys.surface.uid).not.toBe(table.uid);

    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          key: 'employeesTable',
        },
        bindKeys: [
          {
            key: 'employeesTable',
            locator: {
              uid: table.uid,
            },
            expectedKind: 'block',
          },
        ],
        plan: {
          steps: [
            {
              action: 'configure',
              selectors: {
                target: {
                  key: 'surface',
                },
              },
              values: {
                changes: {
                  pageSize: 30,
                },
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);
    expect(getData(executeRes).persistedKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'employeesTable',
          uid: table.uid,
          persisted: true,
        }),
      ]),
    );

    const describedAgain = getData(
      await rootAgent.resource('flowSurfaces').describeSurface({
        values: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
      }),
    );
    expect(describedAgain.keys.employeesTable.uid).toBe(table.uid);
  });

  it('should report only truly persisted created keys when alias keys share the same uid', async () => {
    const page = await createPage(rootAgent, {
      title: 'Execute plan persisted created keys page',
      tabTitle: 'Execute plan persisted created keys tab',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              id: 'addDetails',
              action: 'addBlock',
              selectors: {
                target: {
                  locator: {
                    uid: page.tabSchemaUid,
                  },
                },
              },
              values: {
                type: 'details',
                resourceInit: {
                  dataSourceKey: 'main',
                  collectionName: 'users',
                },
              },
            },
            {
              id: 'addUsernameField',
              action: 'addField',
              selectors: {
                target: {
                  step: 'addDetails',
                  path: 'uid',
                },
              },
              values: {
                key: 'profileUsername',
                fieldPath: 'username',
              },
            },
          ],
        },
      },
    });
    expect(executeRes.status).toBe(200);

    const executeData = getData(executeRes);
    const addUsernameFieldStep = executeData.results.find(
      (item: Record<string, any>) => item.id === 'addUsernameField',
    );
    expect(addUsernameFieldStep).toBeTruthy();
    expect(addUsernameFieldStep.createdKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'profileUsername',
          uid: addUsernameFieldStep.result.uid,
        }),
        expect.objectContaining({
          key: 'profileUsername.field',
          uid: addUsernameFieldStep.result.fieldUid,
        }),
        expect.objectContaining({
          key: 'profileUsername.innerField',
          uid: addUsernameFieldStep.result.innerFieldUid,
        }),
      ]),
    );
    expect(addUsernameFieldStep.result.fieldUid).toBe(addUsernameFieldStep.result.innerFieldUid);
    expect(executeData.persistedKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'profileUsername',
          uid: addUsernameFieldStep.result.uid,
          persisted: true,
        }),
        expect.objectContaining({
          key: 'profileUsername.field',
          uid: addUsernameFieldStep.result.fieldUid,
          persisted: true,
        }),
      ]),
    );
    expect(executeData.persistedKeys).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'profileUsername.innerField',
          uid: addUsernameFieldStep.result.innerFieldUid,
          persisted: true,
        }),
      ]),
    );
  });

  it('should reject reserved or duplicated bindKeys, allow route-backed keys, and report missing after-state when executePlan removes the surface', async () => {
    const page = await createPage(rootAgent, {
      title: 'Key guard page',
      tabTitle: 'Key guard tab',
    });
    const pageReadback = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const pageGridUid = getRouteBackedTabs(pageReadback)[0]?.subModels?.grid?.uid;
    expect(pageGridUid).toBeTruthy();

    const table = await addBlockData(rootAgent, {
      target: {
        uid: pageGridUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const reservedRefRes = await rootAgent.resource('flowSurfaces').describeSurface({
      values: {
        locator: {
          pageSchemaUid: page.pageSchemaUid,
        },
        bindKeys: [
          {
            key: 'surface',
            locator: {
              uid: table.uid,
            },
          },
        ],
      },
    });
    expect(reservedRefRes.status).toBe(400);
    expect(readErrorMessage(reservedRefRes)).toContain('reserved');

    const duplicateRefRes = await rootAgent.resource('flowSurfaces').describeSurface({
      values: {
        locator: {
          pageSchemaUid: page.pageSchemaUid,
        },
        bindKeys: [
          {
            key: 'employeesTable',
            locator: {
              uid: table.uid,
            },
          },
          {
            key: 'employeesTable',
            locator: {
              uid: table.uid,
            },
          },
        ],
      },
    });
    expect(duplicateRefRes.status).toBe(400);
    expect(readErrorMessage(duplicateRefRes)).toContain('duplicated');

    const validateRouteBackedRefRes = await rootAgent.resource('flowSurfaces').validatePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        bindKeys: [
          {
            key: 'pageRoot',
            locator: {
              uid: page.pageUid,
            },
            expectedKind: 'page',
          },
        ],
        plan: {
          steps: [
            {
              action: 'addTab',
              selectors: {
                target: {
                  key: 'pageRoot',
                },
              },
              values: {
                title: 'Should fail',
              },
            },
          ],
        },
      },
    });
    expect(validateRouteBackedRefRes.status).toBe(200);
    const validateRouteBackedData = getData(validateRouteBackedRefRes);
    expect(validateRouteBackedData.compiledSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'addTab',
          payload: expect.objectContaining({
            target: {
              uid: page.pageUid,
            },
          }),
          resolvedSelectors: {
            target: {
              key: 'pageRoot',
              source: 'request',
              kind: 'page',
              uid: page.pageUid,
            },
          },
        }),
      ]),
    );

    const executeRouteBackedRefRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        bindKeys: [
          {
            key: 'pageRoot',
            locator: {
              uid: page.pageUid,
            },
            expectedKind: 'page',
          },
        ],
        plan: {
          steps: [
            {
              id: 'addTabViaPageRef',
              action: 'addTab',
              selectors: {
                target: {
                  key: 'pageRoot',
                },
              },
              values: {
                title: 'Should fail',
              },
            },
          ],
        },
      },
    });
    expect(executeRouteBackedRefRes.status).toBe(200);
    const executeRouteBackedData = getData(executeRouteBackedRefRes);
    expect(executeRouteBackedData.persistedKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'pageRoot',
          uid: page.pageUid,
          persisted: true,
        }),
      ]),
    );
    expect(executeRouteBackedData.keys.pageRoot.uid).toBe(page.pageUid);
    const routeBackedResultById = Object.fromEntries(
      executeRouteBackedData.results.map((item: Record<string, any>) => [String(item.id || item.index), item.result]),
    );
    expect(routeBackedResultById.addTabViaPageRef.pageUid).toBe(page.pageUid);
    const updatedPageSurface = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    expect(getRouteBackedTabs(updatedPageSurface)).toHaveLength(2);

    const destroyPageRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
        },
        plan: {
          steps: [
            {
              action: 'destroyPage',
              selectors: {
                target: {
                  locator: {
                    uid: page.pageUid,
                  },
                },
              },
            },
          ],
        },
      },
    });
    expect(destroyPageRes.status).toBe(200);
    expect(getData(destroyPageRes)).toMatchObject({
      surfaceExistsAfterExecute: false,
      keys: {},
    });
  });
});
