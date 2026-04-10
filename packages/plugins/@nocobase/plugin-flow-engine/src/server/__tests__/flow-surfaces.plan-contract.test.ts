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

  function getComposeBlock(result: Record<string, any>, ref: string) {
    const matched = _.castArray(result?.blocks || []).find((item: any) => item?.ref === ref);
    expect(matched).toBeTruthy();
    return matched;
  }

  function getComposeField(block: Record<string, any>, ref: string) {
    const matched = _.castArray(block?.fields || []).find((item: any) => item?.ref === ref);
    expect(matched).toBeTruthy();
    return matched;
  }

  function getComposeAction(block: Record<string, any>, scope: 'actions' | 'recordActions', ref: string) {
    const matched = _.castArray(block?.[scope] || []).find((item: any) => item?.ref === ref);
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

  it('should execute bootstrap createMenu/createPage steps through executePlan and resolve previous step refs', async () => {
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
                tabTitle: 'Overview',
                enableTabs: true,
              },
            },
            {
              id: 'extraTab',
              action: 'addTab',
              selectors: {
                target: {
                  step: 'page',
                  path: 'pageUid',
                },
              },
              values: {
                title: {
                  step: 'page',
                  path: 'tabSchemaName',
                },
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
              ref: 'group.routeId',
            },
          }),
        }),
        expect.objectContaining({
          id: 'page',
          action: 'createPage',
          payload: expect.objectContaining({
            menuRouteId: {
              ref: 'menu.routeId',
            },
          }),
        }),
        expect.objectContaining({
          id: 'extraTab',
          action: 'addTab',
          payload: expect.objectContaining({
            title: {
              ref: 'page.tabSchemaName',
            },
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
    expect(resultById.extraTab.pageUid).toBe(resultById.page.pageUid);
    expect(executeData.target).toMatchObject({
      locator: {
        pageSchemaUid: resultById.page.pageSchemaUid,
      },
      uid: resultById.page.pageUid,
      kind: 'page',
    });
    expect(executeData.refs.surface.uid).toBe(resultById.page.pageUid);

    const pageSurface = await getSurface(rootAgent, {
      pageSchemaUid: resultById.page.pageSchemaUid,
    });
    const tabs = getRouteBackedTabs(pageSurface);
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.uid).toBe(resultById.page.tabSchemaUid);
    expect(tabs[1]?.uid).toBe(resultById.extraTab.tabSchemaUid);
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
                    ref: 'employeesTable',
                    type: 'table',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'employees',
                    },
                    fields: [{ ref: 'employeesTable.nickname', fieldPath: 'nickname' }],
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
              expect.objectContaining({ ref: 'employeesTable', uid: expect.any(String) }),
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

  it('should aggregate compose field issues and report blocked downstream refs without mutating the surface', async () => {
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
                    ref: 'rolesDetails',
                    type: 'details',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'roles',
                    },
                    fields: [
                      { ref: 'rolesDetails.title', fieldPath: 'title' },
                      { ref: 'rolesDetails.hidden', fieldPath: 'hidden' },
                      { ref: 'rolesDetails.default', fieldPath: 'default' },
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
                  ref: 'rolesDetails.hidden',
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
          blockRef: 'rolesDetails',
          fieldRef: 'rolesDetails.hidden',
          fieldPath: 'hidden',
          blocking: false,
        }),
        expect.objectContaining({
          stepId: 'composeRoles',
          action: 'compose',
          blockRef: 'rolesDetails',
          fieldRef: 'rolesDetails.default',
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

  it('should not treat ref declarations as blocked dependencies after earlier field issues', async () => {
    const page = await createPage(rootAgent, {
      title: 'Validate plan ref declarations page',
      tabTitle: 'Validate plan ref declarations tab',
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
                    ref: 'rolesDetails',
                    type: 'details',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'roles',
                    },
                    fields: [{ ref: 'rolesDetails.hidden', fieldPath: 'hidden' }],
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
                ref: 'helpPanel',
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
                    ref: 'profileHelp',
                    type: 'markdown',
                    settings: {
                      content: 'Ref declarations should not block preview',
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
            blockRef: 'rolesDetails',
            fieldRef: 'rolesDetails.hidden',
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

  it('should still block downstream pure ref payloads after earlier field issues', async () => {
    const page = await createPage(rootAgent, {
      title: 'Validate plan blocked pure ref page',
      tabTitle: 'Validate plan blocked pure ref tab',
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
                    ref: 'rolesDetails',
                    type: 'details',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'roles',
                    },
                    fields: [{ ref: 'rolesDetails.hidden', fieldPath: 'hidden' }],
                  },
                ],
              },
            },
            {
              id: 'configureMissingField',
              action: 'configure',
              selectors: {
                target: {
                  ref: 'rolesDetails.hidden',
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
            blockRef: 'rolesDetails',
            fieldRef: 'rolesDetails.hidden',
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

  it('should validate a one-shot bootstrap plan by reusing created refs during preview collection', async () => {
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
                ref: 'usersPage',
                title: 'Validate preview users page',
                tabTitle: 'Users',
              },
            },
            {
              id: 'composeMain',
              action: 'compose',
              selectors: {
                target: {
                  ref: 'usersPage.tab',
                },
              },
              values: {
                mode: 'append',
                blocks: [
                  {
                    ref: 'usersTable',
                    type: 'table',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'users',
                    },
                    fields: [{ ref: 'usersTable.username', fieldPath: 'username' }],
                    recordActions: [{ ref: 'usersTable.viewUser', type: 'view' }],
                  },
                ],
              },
            },
            {
              id: 'userPopupContent',
              action: 'compose',
              selectors: {
                target: {
                  ref: 'usersTable.viewUser.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'userDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [{ ref: 'userDetails.username', fieldPath: 'username' }],
                    recordActions: [{ ref: 'userDetails.editUser', type: 'edit' }],
                  },
                ],
              },
            },
            {
              id: 'userEditPopupContent',
              action: 'compose',
              selectors: {
                target: {
                  ref: 'userDetails.editUser.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'userEditForm',
                    type: 'editForm',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [{ ref: 'userEditForm.username', fieldPath: 'username' }],
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
                ref: 'usersPage.tab',
              },
            },
          }),
        }),
        expect.objectContaining({
          id: 'userPopupContent',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: {
                ref: 'usersTable.viewUser.popupGrid',
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
                ref: 'userDetails.editUser.popupGrid',
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

  it('should execute a one-shot bootstrap plan for nested popup content by reusing created refs', async () => {
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
                ref: 'usersPage',
                title: 'One-shot users page',
                tabTitle: 'Users',
              },
            },
            {
              id: 'composeMain',
              action: 'compose',
              selectors: {
                target: {
                  ref: 'usersPage.tab',
                },
              },
              values: {
                mode: 'append',
                blocks: [
                  {
                    ref: 'usersTable',
                    type: 'table',
                    resource: {
                      dataSourceKey: 'main',
                      collectionName: 'users',
                    },
                    fields: [
                      { ref: 'usersTable.username', fieldPath: 'username' },
                      { ref: 'usersTable.nickname', fieldPath: 'nickname' },
                      { ref: 'usersTable.rolesTitle', fieldPath: 'roles.title' },
                    ],
                    recordActions: [{ ref: 'usersTable.viewUser', type: 'view' }],
                  },
                ],
              },
            },
            {
              id: 'userPopupContent',
              action: 'compose',
              selectors: {
                target: {
                  ref: 'usersTable.viewUser.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'userDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [
                      { ref: 'userDetails.username', fieldPath: 'username' },
                      { ref: 'userDetails.nickname', fieldPath: 'nickname' },
                    ],
                    recordActions: [{ ref: 'userDetails.editUser', type: 'edit' }],
                  },
                  {
                    ref: 'userRolesTable',
                    type: 'table',
                    resource: {
                      binding: 'associatedRecords',
                      associationField: 'roles',
                    },
                    fields: [
                      { ref: 'userRolesTable.name', fieldPath: 'name' },
                      { ref: 'userRolesTable.title', fieldPath: 'title' },
                    ],
                    recordActions: [{ ref: 'userRolesTable.viewRole', type: 'view' }],
                  },
                ],
                layout: {
                  rows: [
                    [
                      { ref: 'userDetails', span: 12 },
                      { ref: 'userRolesTable', span: 12 },
                    ],
                  ],
                },
              },
            },
            {
              id: 'userEditPopupContent',
              action: 'compose',
              selectors: {
                target: {
                  ref: 'userDetails.editUser.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'userEditForm',
                    type: 'editForm',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [
                      { ref: 'userEditForm.username', fieldPath: 'username' },
                      { ref: 'userEditForm.nickname', fieldPath: 'nickname' },
                    ],
                    actions: [{ ref: 'userEditForm.submit', type: 'submit' }],
                  },
                ],
              },
            },
            {
              id: 'rolePopupContent',
              action: 'compose',
              selectors: {
                target: {
                  ref: 'userRolesTable.viewRole.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'roleDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [
                      { ref: 'roleDetails.name', fieldPath: 'name' },
                      { ref: 'roleDetails.title', fieldPath: 'title' },
                    ],
                    recordActions: [{ ref: 'roleDetails.editRole', type: 'edit' }],
                  },
                ],
              },
            },
            {
              id: 'roleEditPopupContent',
              action: 'compose',
              selectors: {
                target: {
                  ref: 'roleDetails.editRole.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'roleEditForm',
                    type: 'editForm',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [
                      { ref: 'roleEditForm.name', fieldPath: 'name' },
                      { ref: 'roleEditForm.title', fieldPath: 'title' },
                    ],
                    actions: [{ ref: 'roleEditForm.submit', type: 'submit' }],
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
                ref: 'usersTable.viewUser.popupGrid',
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
                ref: 'userDetails.editUser.popupGrid',
              },
            },
          }),
        }),
        expect.objectContaining({
          id: 'rolePopupContent',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: {
                ref: 'userRolesTable.viewRole.popupGrid',
              },
            },
          }),
        }),
        expect.objectContaining({
          id: 'roleEditPopupContent',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: {
                ref: 'roleDetails.editRole.popupGrid',
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

    const userDetails = getComposeBlock(resultById.userPopupContent, 'userDetails');
    const userEditAction = getComposeAction(userDetails, 'recordActions', 'userDetails.editUser');
    const userRolesTable = getComposeBlock(resultById.userPopupContent, 'userRolesTable');
    const viewRoleAction = getComposeAction(userRolesTable, 'recordActions', 'userRolesTable.viewRole');
    expect(userDetails.uid).toBeTruthy();
    expect(userRolesTable.uid).toBeTruthy();
    expect(resultById.userPopupContent.layout.sizes.row1).toEqual([12, 12]);
    expect(userEditAction.popupGridUid).toBeTruthy();
    expect(viewRoleAction.popupGridUid).toBeTruthy();

    const userEditForm = getComposeBlock(resultById.userEditPopupContent, 'userEditForm');
    const userEditSubmit = getComposeAction(userEditForm, 'actions', 'userEditForm.submit');
    const roleDetails = getComposeBlock(resultById.rolePopupContent, 'roleDetails');
    const roleEditAction = getComposeAction(roleDetails, 'recordActions', 'roleDetails.editRole');
    const roleEditForm = getComposeBlock(resultById.roleEditPopupContent, 'roleEditForm');
    const roleEditSubmit = getComposeAction(roleEditForm, 'actions', 'roleEditForm.submit');
    expect(userEditForm.uid).toBeTruthy();
    expect(roleDetails.uid).toBeTruthy();
    expect(roleEditForm.uid).toBeTruthy();
    expect(userEditSubmit.uid).toBeTruthy();
    expect(roleEditAction.popupGridUid).toBeTruthy();
    expect(roleEditSubmit.uid).toBeTruthy();

    const mainTableSurface = await getSurface(rootAgent, {
      uid: mainUsersTable.uid,
    });
    expect(mainTableSurface.tree.use).toBe('TableBlockModel');
    expect(getComposeField(mainUsersTable, 'usersTable.rolesTitle').fieldPath).toBe('roles.title');

    const userDetailsSurface = await getSurface(rootAgent, {
      uid: userDetails.uid,
    });
    expect(userDetailsSurface.tree.use).toBe('DetailsBlockModel');

    const userRolesTableSurface = await getSurface(rootAgent, {
      uid: userRolesTable.uid,
    });
    expect(userRolesTableSurface.tree.use).toBe('TableBlockModel');
    expect(userRolesTableSurface.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
    });

    const userEditFormSurface = await getSurface(rootAgent, {
      uid: userEditForm.uid,
    });
    expect(userEditFormSurface.tree.use).toBe('EditFormModel');
    expect(userEditFormSurface.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });

    const roleDetailsSurface = await getSurface(rootAgent, {
      uid: roleDetails.uid,
    });
    expect(roleDetailsSurface.tree.use).toBe('DetailsBlockModel');
    expect(roleDetailsSurface.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const roleEditFormSurface = await getSurface(rootAgent, {
      uid: roleEditForm.uid,
    });
    expect(roleEditFormSurface.tree.use).toBe('EditFormModel');
    expect(roleEditFormSurface.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });
  });

  it('should validate configure-created popup refs for same-plan popup composition without mutating the surface', async () => {
    const page = await createPage(rootAgent, {
      title: 'Validate configure popup refs page',
      tabTitle: 'Validate configure popup refs tab',
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
                ref: 'employeeManagerTitle',
                fieldPath: 'manager.nickname',
              },
            },
            {
              id: 'configureManagerPopup',
              action: 'configure',
              selectors: {
                target: {
                  ref: 'employeeManagerTitle.field',
                },
              },
              values: {
                ref: 'managerPopup',
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
                  ref: 'managerPopup.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'managerDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [{ ref: 'managerDetails.nickname', fieldPath: 'nickname' }],
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
          id: 'configureManagerPopup',
          action: 'configure',
          payload: expect.objectContaining({
            target: {
              uid: {
                ref: 'employeeManagerTitle.field',
              },
            },
            ref: 'managerPopup',
          }),
        }),
        expect.objectContaining({
          id: 'composeManagerPopup',
          action: 'compose',
          payload: expect.objectContaining({
            target: {
              uid: {
                ref: 'managerPopup.popupGrid',
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

  it('should execute configure-created popup refs in the same plan and persist the popup refs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Execute configure popup refs page',
      tabTitle: 'Execute configure popup refs tab',
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
                ref: 'employeeManagerTitle',
                fieldPath: 'manager.nickname',
              },
            },
            {
              id: 'configureManagerPopup',
              action: 'configure',
              selectors: {
                target: {
                  ref: 'employeeManagerTitle.field',
                },
              },
              values: {
                ref: 'managerPopup',
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
                  ref: 'managerPopup.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'managerDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [
                      { ref: 'managerDetails.nickname', fieldPath: 'nickname' },
                      { ref: 'managerDetails.status', fieldPath: 'status' },
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
    expect(resultById.configureManagerPopup.popupPageUid).toBeTruthy();
    expect(resultById.configureManagerPopup.popupTabUid).toBeTruthy();
    expect(resultById.configureManagerPopup.popupGridUid).toBeTruthy();
    expect(configureStep.createdRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'managerPopup.popupPage',
          uid: resultById.configureManagerPopup.popupPageUid,
        }),
        expect.objectContaining({
          ref: 'managerPopup.popupTab',
          uid: resultById.configureManagerPopup.popupTabUid,
        }),
        expect.objectContaining({
          ref: 'managerPopup.popupGrid',
          uid: resultById.configureManagerPopup.popupGridUid,
        }),
      ]),
    );
    expect(executeData.persistedRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'managerPopup.popupPage',
          uid: resultById.configureManagerPopup.popupPageUid,
          persisted: true,
        }),
        expect.objectContaining({
          ref: 'managerPopup.popupTab',
          uid: resultById.configureManagerPopup.popupTabUid,
          persisted: true,
        }),
        expect.objectContaining({
          ref: 'managerPopup.popupGrid',
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

  it('should infer configure-created popup refs from a target field ref during validatePlan', async () => {
    const page = await createPage(rootAgent, {
      title: 'Validate inferred configure popup refs page',
      tabTitle: 'Validate inferred configure popup refs tab',
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
                ref: 'employeeManagerTitle',
                fieldPath: 'manager.nickname',
              },
            },
            {
              id: 'configureManagerPopup',
              action: 'configure',
              selectors: {
                target: {
                  ref: 'employeeManagerTitle.field',
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
                  ref: 'employeeManagerTitle.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'managerDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [{ ref: 'managerDetails.nickname', fieldPath: 'nickname' }],
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
                ref: 'employeeManagerTitle.popupGrid',
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

  it('should infer configure-created popup refs from a target field ref during executePlan and persist them', async () => {
    const page = await createPage(rootAgent, {
      title: 'Execute inferred configure popup refs page',
      tabTitle: 'Execute inferred configure popup refs tab',
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
                ref: 'employeeManagerTitle',
                fieldPath: 'manager.nickname',
              },
            },
            {
              id: 'configureManagerPopup',
              action: 'configure',
              selectors: {
                target: {
                  ref: 'employeeManagerTitle.field',
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
                  ref: 'employeeManagerTitle.popupGrid',
                },
              },
              values: {
                mode: 'replace',
                blocks: [
                  {
                    ref: 'managerDetails',
                    type: 'details',
                    resource: {
                      binding: 'currentRecord',
                    },
                    fields: [
                      { ref: 'managerDetails.nickname', fieldPath: 'nickname' },
                      { ref: 'managerDetails.status', fieldPath: 'status' },
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
    expect(configureStep.createdRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'employeeManagerTitle.popupPage',
          uid: resultById.configureManagerPopup.popupPageUid,
        }),
        expect.objectContaining({
          ref: 'employeeManagerTitle.popupTab',
          uid: resultById.configureManagerPopup.popupTabUid,
        }),
        expect.objectContaining({
          ref: 'employeeManagerTitle.popupGrid',
          uid: resultById.configureManagerPopup.popupGridUid,
        }),
      ]),
    );
    expect(executeData.persistedRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'employeeManagerTitle.popupPage',
          uid: resultById.configureManagerPopup.popupPageUid,
          persisted: true,
        }),
        expect.objectContaining({
          ref: 'employeeManagerTitle.popupTab',
          uid: resultById.configureManagerPopup.popupTabUid,
          persisted: true,
        }),
        expect.objectContaining({
          ref: 'employeeManagerTitle.popupGrid',
          uid: resultById.configureManagerPopup.popupGridUid,
          persisted: true,
        }),
      ]),
    );
    expect(resultById.composeManagerPopup.target.uid).toBe(resultById.configureManagerPopup.popupGridUid);
  });

  it('should persist only used bindRefs as declared refs and keep metadata hidden from public reads', async () => {
    const page = await createPage(rootAgent, {
      title: 'Ref persistence page',
      tabTitle: 'Ref persistence tab',
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
        bindRefs: [
          {
            ref: 'employeesTable',
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
    expect(describeData.refs.employeesTable.uid).toBe(table.uid);

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
        bindRefs: [
          {
            ref: 'employeesTable',
            locator: {
              uid: table.uid,
            },
            expectedKind: 'block',
          },
          {
            ref: 'unusedTable',
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
                  ref: 'employeesTable',
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
    expect(executeData.persistedRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'employeesTable',
          uid: table.uid,
          persisted: true,
        }),
      ]),
    );
    expect(executeData.persistedRefs).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'unusedTable',
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
    expect(describedAgain.refs.employeesTable.uid).toBe(table.uid);
    expect(describedAgain.refs.unusedTable).toBeUndefined();
    const describeWithBindRefAfterPersist = getData(
      await rootAgent.resource('flowSurfaces').describeSurface({
        values: {
          locator: {
            pageSchemaUid: page.pageSchemaUid,
          },
          bindRefs: [
            {
              ref: 'employeesTable',
              locator: {
                uid: table.uid,
              },
              expectedKind: 'block',
            },
          ],
        },
      }),
    );
    expect(describeWithBindRefAfterPersist.fingerprint).toBe(describedAgain.fingerprint);

    const publicTableReadback = await getSurface(rootAgent, {
      uid: table.uid,
    });
    expect(publicTableReadback.tree?.stepParams?.__flowSurfaceMeta).toBeUndefined();

    const rawTable = await flowRepo.findModelById(table.uid, {
      includeAsyncNode: true,
    });
    expect(_.get(rawTable, ['stepParams', '__flowSurfaceMeta', 'declaredRef'])).toBe('employeesTable');
  });

  it('should ignore reserved declared refs and persist surface.ref when anchoring a persistable surface', async () => {
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
          declaredRef: 'surface',
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
    expect(describedWithReservedDeclaredRef.refs.surface.uid).toBe(page.pageUid);
    expect(describedWithReservedDeclaredRef.refs.surface.uid).not.toBe(table.uid);

    const executeRes = await rootAgent.resource('flowSurfaces').executePlan({
      values: {
        surface: {
          ref: 'employeesTable',
        },
        bindRefs: [
          {
            ref: 'employeesTable',
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
                  ref: 'surface',
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
    expect(getData(executeRes).persistedRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'employeesTable',
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
    expect(describedAgain.refs.employeesTable.uid).toBe(table.uid);
  });

  it('should report only truly persisted created refs when alias refs share the same uid', async () => {
    const page = await createPage(rootAgent, {
      title: 'Execute plan persisted created refs page',
      tabTitle: 'Execute plan persisted created refs tab',
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
                ref: 'profileUsername',
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
    expect(addUsernameFieldStep.createdRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'profileUsername',
          uid: addUsernameFieldStep.result.uid,
        }),
        expect.objectContaining({
          ref: 'profileUsername.field',
          uid: addUsernameFieldStep.result.fieldUid,
        }),
        expect.objectContaining({
          ref: 'profileUsername.innerField',
          uid: addUsernameFieldStep.result.innerFieldUid,
        }),
      ]),
    );
    expect(addUsernameFieldStep.result.fieldUid).toBe(addUsernameFieldStep.result.innerFieldUid);
    expect(executeData.persistedRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'profileUsername',
          uid: addUsernameFieldStep.result.uid,
          persisted: true,
        }),
        expect.objectContaining({
          ref: 'profileUsername.field',
          uid: addUsernameFieldStep.result.fieldUid,
          persisted: true,
        }),
      ]),
    );
    expect(executeData.persistedRefs).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'profileUsername.innerField',
          uid: addUsernameFieldStep.result.innerFieldUid,
          persisted: true,
        }),
      ]),
    );
  });

  it('should reject reserved or duplicated bindRefs, allow route-backed refs, and report missing after-state when executePlan removes the surface', async () => {
    const page = await createPage(rootAgent, {
      title: 'Ref guard page',
      tabTitle: 'Ref guard tab',
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
        bindRefs: [
          {
            ref: 'surface',
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
        bindRefs: [
          {
            ref: 'employeesTable',
            locator: {
              uid: table.uid,
            },
          },
          {
            ref: 'employeesTable',
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
        bindRefs: [
          {
            ref: 'pageRoot',
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
                  ref: 'pageRoot',
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
              ref: 'pageRoot',
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
        bindRefs: [
          {
            ref: 'pageRoot',
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
                  ref: 'pageRoot',
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
    expect(executeRouteBackedData.persistedRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: 'pageRoot',
          uid: page.pageUid,
          persisted: true,
        }),
      ]),
    );
    expect(executeRouteBackedData.refs.pageRoot.uid).toBe(page.pageUid);
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
      refs: {},
    });
  });
});
