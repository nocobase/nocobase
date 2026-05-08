/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as _ from 'lodash';
import {
  FLOW_SURFACES_CONTRACT_TEMPLATE_TEST_PLUGIN_INSTALLS,
  FLOW_SURFACES_CONTRACT_TEMPLATE_TEST_PLUGINS,
  createFlowSurfacesContractContext,
  createMenu,
  destroyFlowSurfacesContractContext,
  expectStructuredError,
  getData,
  getRouteBackedTabs,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

describe('flowSurfaces backend authoring applyBlueprint compiler', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];
  let flowRepo: FlowSurfacesContractContext['flowRepo'];
  let routesRepo: FlowSurfacesContractContext['routesRepo'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext({
      plugins: FLOW_SURFACES_CONTRACT_TEMPLATE_TEST_PLUGIN_INSTALLS as any,
      enabledPluginAliases: FLOW_SURFACES_CONTRACT_TEMPLATE_TEST_PLUGINS,
    });
    ({ rootAgent, flowRepo, routesRepo } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should normalize sort aliases and persist final sorting from raw applyBlueprint payloads', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring sort alias blueprint',
          },
        },
        page: {
          title: 'Authoring sort alias blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                height: 480,
                settings: {
                  sort: ['-createdAt', 'nickname'],
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const persistedTable = await flowRepo.findModelById(tableBlock.uid, { includeAsyncNode: true });
    expect(persistedTable?.stepParams?.cardSettings?.blockHeight).toEqual({
      heightMode: 'specifyValue',
      height: 480,
    });
    expect(persistedTable?.stepParams?.tableSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'createdAt',
        direction: 'desc',
      },
      {
        field: 'nickname',
        direction: 'asc',
      },
    ]);
  });

  it('should strip single-scope non-template data block titles before persisting', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring single block title cleanup',
          },
        },
        page: {
          title: 'Authoring single block title cleanup',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                title: 'Should not persist',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                settings: {
                  title: 'Should not persist either',
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const persistedTable = await flowRepo.findModelById(tableBlock.uid, { includeAsyncNode: true });
    expect(persistedTable?.stepParams?.cardSettings?.titleDescription?.title).toBeUndefined();
    expect(persistedTable?.props?.title).toBeUndefined();
  });

  it('should preserve multi-block non-template data block titles before persisting', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring multi block title preservation',
          },
        },
        page: {
          title: 'Authoring multi block title preservation',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                title: 'Employees table',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                fields: ['nickname'],
              },
              {
                key: 'employeesList',
                type: 'list',
                title: 'Employees list',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const listBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ListBlockModel')[0];
    const persistedTable = await flowRepo.findModelById(tableBlock.uid, { includeAsyncNode: true });
    const persistedList = await flowRepo.findModelById(listBlock.uid, { includeAsyncNode: true });
    expect(persistedTable?.stepParams?.cardSettings?.titleDescription?.title).toBe('Employees table');
    expect(persistedList?.stepParams?.cardSettings?.titleDescription?.title).toBe('Employees list');
  });

  it('should reject conflicting sort aliases as a backend hard validation error', async () => {
    const conflictRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring sort conflict blueprint',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                settings: {
                  sort: ['-createdAt'],
                  sorting: [
                    {
                      field: 'createdAt',
                      direction: 'asc',
                    },
                  ],
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });
    expect(conflictRes.status).toBe(400);
    expect(conflictRes.body?.errors).toEqual(expect.any(Array));
    expect(conflictRes.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['sort-alias-conflict']),
    );
    expect(conflictRes.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.tabs[0].blocks[0].settings.sort']),
    );
    for (const error of conflictRes.body.errors) {
      expectStructuredError(error, {
        status: 400,
        type: 'bad_request',
      });
    }
  });

  it('should aggregate explicit empty defaultFilter groups before applyBlueprint writes', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring empty default filter blueprint',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                defaultFilter: {
                  logic: '$and',
                  items: [],
                },
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['defaultFilter-explicit-empty']),
    );
    expect(response.body.errors.map((error: any) => error.ruleId)).not.toContain(
      'public-data-surface-default-filter-required',
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.tabs[0].blocks[0].defaultFilter']),
    );
  });

  it('should materialize calendar hidden popup template hosts from raw applyBlueprint payloads', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring calendar hidden popup blueprint',
          },
        },
        page: {
          title: 'Authoring calendar hidden popup blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'eventsCalendar',
                type: 'calendar',
                collection: 'calendar_events',
                defaultFilter: calendarDefaultFilter(),
                settings: {
                  titleField: 'title',
                  startField: 'startsAt',
                  endField: 'endsAt',
                },
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const calendarBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'CalendarBlockModel')[0];
    expect(calendarBlock?.subModels?.quickCreateAction?.popup?.template?.uid).toBeTruthy();
    expect(calendarBlock?.subModels?.eventViewAction?.popup?.template?.uid).toBeTruthy();
    const persistedQuickCreateAction = await flowRepo.findModelById(`${calendarBlock.uid}-quickCreateAction`, {
      includeAsyncNode: true,
    });
    const persistedEventAction = await flowRepo.findModelById(`${calendarBlock.uid}-eventViewAction`, {
      includeAsyncNode: true,
    });
    expect(persistedQuickCreateAction?.stepParams?.popupSettings?.openView?.popupTemplateUid).toBeTruthy();
    expect(persistedEventAction?.stepParams?.popupSettings?.openView?.popupTemplateUid).toBeTruthy();
  });

  it('should require UI Builder supplied defaultFilter instead of auto-generating one', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring missing default filter blueprint',
          },
        },
        page: {
          title: 'Authoring missing default filter blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname', 'status'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['public-data-surface-default-filter-required']),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.tabs[0].blocks[0].defaultFilter']),
    );
  });

  it('should normalize a unique navigation.group.title to the existing routeId before writing', async () => {
    const groupTitle = `Authoring unique group ${Date.now()}`;
    const existingGroup = await createMenu(rootAgent, {
      title: groupTitle,
      type: 'group',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            title: groupTitle,
          },
          item: {
            title: 'Authoring unique group item',
          },
        },
        page: {
          title: 'Authoring unique group item',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    expect(String(data.surface.pageRoute.parentId)).toBe(String(existingGroup.routeId));
    const matchedGroups = await routesRepo.find({
      filter: {
        type: 'group',
        title: groupTitle,
      },
    });
    expect(matchedGroups).toHaveLength(1);
  });

  it('should infer replace target when create matches an existing page in the same navigation group', async () => {
    const groupTitle = `Authoring page identity group ${Date.now()}`;
    const pageTitle = `Authoring page identity page ${Date.now()}`;
    const existingGroup = await createMenu(rootAgent, {
      title: groupTitle,
      type: 'group',
    });
    const initialRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            routeId: existingGroup.routeId,
          },
          item: {
            title: pageTitle,
          },
        },
        page: {
          title: pageTitle,
        },
        tabs: [
          {
            title: 'Initial',
            blocks: [
              {
                key: 'initialEmployeesTable',
                type: 'table',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });
    expect(initialRes.status, readErrorMessage(initialRes)).toBe(200);
    const initialData = getData(initialRes);

    const replaceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            routeId: existingGroup.routeId,
          },
          item: {
            title: pageTitle,
          },
        },
        page: {
          title: pageTitle,
        },
        tabs: [
          {
            title: 'Replacement',
            blocks: [
              {
                key: 'replacementEmployeesDetails',
                type: 'details',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(replaceRes.status, readErrorMessage(replaceRes)).toBe(200);
    const replaceData = getData(replaceRes);
    expect(replaceData.mode).toBe('replace');
    expect(replaceData.target.pageSchemaUid).toBe(initialData.target.pageSchemaUid);
    expect(replaceData.target.pageUid).toBe(initialData.target.pageUid);
    expect(getRouteBackedTabs(replaceData.surface).map((tab: any) => tab?.props?.title)).toEqual(['Replacement']);
    const matchedPages = await routesRepo.find({
      filter: {
        type: 'flowPage',
        title: pageTitle,
        parentId: existingGroup.routeId,
      },
    });
    expect(matchedPages).toHaveLength(1);
    expect(String(matchedPages[0]?.schemaUid)).toBe(String(initialData.target.pageSchemaUid));
  });

  it('should reject ambiguous page identity matches before applying create blueprints', async () => {
    const groupTitle = `Authoring ambiguous page identity group ${Date.now()}`;
    const pageTitle = `Authoring ambiguous page identity page ${Date.now()}`;
    const existingGroup = await createMenu(rootAgent, {
      title: groupTitle,
      type: 'group',
    });
    const initialRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            routeId: existingGroup.routeId,
          },
          item: {
            title: pageTitle,
          },
        },
        page: {
          title: pageTitle,
        },
        tabs: [
          {
            title: 'Initial',
            blocks: [
              {
                key: 'initialEmployeesTable',
                type: 'table',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });
    expect(initialRes.status, readErrorMessage(initialRes)).toBe(200);

    await routesRepo.create({
      values: {
        type: 'flowPage',
        title: pageTitle,
        schemaUid: `ambiguous-page-${Date.now()}`,
        parentId: existingGroup.routeId,
        hideInMenu: false,
        sort: Date.now(),
      },
    });

    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            routeId: existingGroup.routeId,
          },
          item: {
            title: pageTitle,
          },
        },
        page: {
          title: pageTitle,
        },
        tabs: [
          {
            title: 'Replacement',
            blocks: [
              {
                key: 'replacementEmployeesDetails',
                type: 'details',
                collection: 'employees',
                fields: ['nickname'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(readErrorMessage(response)).toContain('already has 2 flow pages titled');
  });

  it('should auto-generate fieldGroups for raw details blocks from live metadata', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring generated details field groups',
          },
        },
        page: {
          title: 'Authoring generated details field groups',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeDetails',
                type: 'details',
                collection: 'employees',
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const detailsBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'DetailsBlockModel')[0];
    const items = _.castArray(detailsBlock?.subModels?.grid?.subModels?.items || []);
    expect(items.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Main')).toBe(true);
    expect(items.map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath).filter(Boolean)).toEqual(
      expect.arrayContaining(['nickname', 'status']),
    );
    const persistedDetails = await flowRepo.findModelById(detailsBlock.uid, { includeAsyncNode: true });
    const persistedFields = _.castArray(persistedDetails?.subModels?.grid?.subModels?.items || []);
    expect(persistedFields.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Main')).toBe(
      true,
    );
    expect(
      persistedFields.map((field: any) => field?.stepParams?.fieldSettings?.init?.fieldPath).filter(Boolean),
    ).toEqual(expect.arrayContaining(['nickname', 'status']));
  });

  it('should auto-fill tryTemplate for raw action popups before persisting', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring generated action popup template',
          },
        },
        page: {
          title: 'Authoring generated action popup template',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                fields: ['nickname'],
                actions: [
                  {
                    key: 'inspect',
                    type: 'addNew',
                    title: 'Inspect',
                    popup: {
                      blocks: [
                        {
                          key: 'inspectCreateForm',
                          type: 'createForm',
                          collection: 'employees',
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

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const persistedTable = await flowRepo.findModelById(tableBlock.uid, { includeAsyncNode: true });
    const inspectAction = _.castArray(persistedTable?.subModels?.actions || []).find(
      (item: any) => item?.props?.title === 'Inspect',
    );
    expect(inspectAction?.uid).toBeTruthy();
    const persistedAction = await flowRepo.findModelById(inspectAction.uid, { includeAsyncNode: true });
    expect(persistedAction?.stepParams?.popupSettings?.openView?.popupTemplateUid).toBeTruthy();
  });

  it('should materialize generated action popup defaults from applyBlueprint defaults', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring generated action popup defaults',
          },
        },
        page: {
          title: 'Authoring generated action popup defaults',
        },
        defaults: {
          collections: {
            employees: {
              popups: {
                addNew: {
                  name: 'Employees add popup from backend defaults',
                  description: 'Employees add popup default metadata from applyBlueprint defaults.',
                },
              },
              fieldGroups: [
                {
                  title: 'Identity',
                  fields: ['nickname'],
                },
                {
                  title: 'Workflow',
                  fields: ['status'],
                },
              ],
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                fields: ['nickname'],
                actions: [
                  {
                    key: 'createEmployee',
                    type: 'addNew',
                    title: 'Create employee',
                    popup: {},
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const persistedTable = await flowRepo.findModelById(tableBlock.uid, { includeAsyncNode: true });
    const createAction = _.castArray(persistedTable?.subModels?.actions || []).find(
      (item: any) => item?.props?.title === 'Create employee',
    );
    expect(createAction?.uid).toBeTruthy();
    const persistedAction = await flowRepo.findModelById(createAction.uid, { includeAsyncNode: true });
    const openView = persistedAction?.stepParams?.popupSettings?.openView;
    expect(openView?.popupTemplateUid).toBeTruthy();

    const template = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: openView.popupTemplateUid,
        },
      }),
    );
    expect(template).toMatchObject({
      name: 'Employees add popup from backend defaults',
      description: 'Employees add popup default metadata from applyBlueprint defaults.',
      collectionName: 'employees',
      type: 'popup',
    });
    const templateSurface = await flowRepo.findModelById(template.targetUid, { includeAsyncNode: true });
    const createForm = collectDescendantNodes(templateSurface, (item) => item?.use === 'CreateFormModel')[0];
    const formItems = _.castArray(createForm?.subModels?.grid?.subModels?.items || []);
    expect(formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Identity')).toBe(
      true,
    );
    expect(formItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Workflow')).toBe(
      true,
    );
    expect(formItems.map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath).filter(Boolean)).toEqual(
      expect.arrayContaining(['nickname', 'status']),
    );
  });

  it('should materialize generated association popup defaults from applyBlueprint defaults', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring generated association popup defaults',
          },
        },
        page: {
          title: 'Authoring generated association popup defaults',
        },
        defaults: {
          collections: {
            employees: {
              popups: {
                associations: {
                  department: {
                    view: {
                      name: 'Employee department popup from backend defaults',
                      description: 'Employee department popup default metadata from applyBlueprint defaults.',
                    },
                  },
                },
              },
            },
            departments: {
              fieldGroups: [
                {
                  title: 'Department identity',
                  fields: ['title'],
                },
              ],
              popups: {
                view: {
                  name: 'Department generic popup should not win',
                  description: 'Generic target popup defaults should not override association popup defaults.',
                },
              },
            },
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeDetails',
                type: 'details',
                collection: 'employees',
                fields: ['department'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const departmentField = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'department' &&
        !!(item?.popup?.template?.uid || item?.stepParams?.popupSettings?.openView?.popupTemplateUid),
    )[0];
    expect(departmentField?.uid).toBeTruthy();

    const persistedField = await flowRepo.findModelById(departmentField.uid, { includeAsyncNode: true });
    const popupTemplateUid =
      persistedField?.popup?.template?.uid ||
      departmentField?.popup?.template?.uid ||
      persistedField?.stepParams?.popupSettings?.openView?.popupTemplateUid ||
      departmentField?.stepParams?.popupSettings?.openView?.popupTemplateUid;
    expect(popupTemplateUid).toBeTruthy();

    const template = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: popupTemplateUid,
        },
      }),
    );
    expect(template).toMatchObject({
      name: 'Employee department popup from backend defaults',
      description: 'Employee department popup default metadata from applyBlueprint defaults.',
      collectionName: 'departments',
      associationName: 'employees.department',
      type: 'popup',
    });

    const templateSurface = await flowRepo.findModelById(template.targetUid, { includeAsyncNode: true });
    const detailsBlock = collectDescendantNodes(templateSurface, (item) => item?.use === 'DetailsBlockModel')[0];
    const detailsItems = _.castArray(detailsBlock?.subModels?.grid?.subModels?.items || []);
    expect(
      detailsItems.some(
        (item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Department identity',
      ),
    ).toBe(true);
    expect(detailsItems.map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath).filter(Boolean)).toEqual(
      expect.arrayContaining(['title']),
    );
  });

  it('should save raw field popups as templates before persisting', async () => {
    const templateName = `Authoring field popup template ${Date.now()}`;
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring generated field popup template',
          },
        },
        page: {
          title: 'Authoring generated field popup template',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeDetails',
                type: 'details',
                collection: 'employees',
                fields: [
                  {
                    field: 'nickname',
                    popup: {
                      blocks: [
                        {
                          key: 'nicknameDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['nickname'],
                        },
                      ],
                      saveAsTemplate: {
                        name: templateName,
                        description: 'Popup template saved from a backend authoring field popup.',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const nicknamePopupField = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.use === 'DisplayTextFieldModel' &&
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'nickname' &&
        !!item?.popup?.template?.uid,
    )[0];
    expect(nicknamePopupField?.uid).toBeTruthy();
    const persistedField = await flowRepo.findModelById(nicknamePopupField.uid, { includeAsyncNode: true });
    expect(nicknamePopupField?.popup?.template?.uid || persistedField?.popup?.template?.uid).toBeTruthy();
  });

  it('should auto-generate fieldGroups for raw createForm blocks from live metadata', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring generated create form field groups',
          },
        },
        page: {
          title: 'Authoring generated create form field groups',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeCreateForm',
                type: 'createForm',
                collection: 'employees',
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const createFormBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'CreateFormModel')[0];
    const items = _.castArray(createFormBlock?.subModels?.grid?.subModels?.items || []);
    expect(items.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Main')).toBe(true);
    expect(items.map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath).filter(Boolean)).toEqual(
      expect.arrayContaining(['nickname', 'status']),
    );
    const persistedCreateForm = await flowRepo.findModelById(createFormBlock.uid, { includeAsyncNode: true });
    const persistedFields = _.castArray(persistedCreateForm?.subModels?.grid?.subModels?.items || []);
    expect(persistedFields.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Main')).toBe(
      true,
    );
    expect(
      persistedFields.map((field: any) => field?.stepParams?.fieldSettings?.init?.fieldPath).filter(Boolean),
    ).toEqual(expect.arrayContaining(['nickname', 'status']));
  });

  it('should persist default relation titleField for raw applyBlueprint relation fields', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring relation titleField defaults',
          },
        },
        page: {
          title: 'Authoring relation titleField defaults',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeCreateForm',
                type: 'createForm',
                collection: 'employees',
                fields: [
                  {
                    field: 'department',
                    fieldType: 'picker',
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const pickerField = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'RecordPickerFieldModel')[0];
    expect(pickerField?.props?.titleField).toBe('title');
    const persistedPickerField = await flowRepo.findModelById(pickerField.uid, { includeAsyncNode: true });
    expect(persistedPickerField?.props?.titleField).toBe('title');
  });

  it('should infer relation field popup currentRecord binding from the opener relation', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring relation popup resource binding',
          },
        },
        page: {
          title: 'Authoring relation popup resource binding',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeDetails',
                type: 'details',
                collection: 'employees',
                fields: [
                  {
                    field: 'department',
                    popup: {
                      tryTemplate: false,
                      blocks: [
                        {
                          key: 'departmentDetails',
                          type: 'details',
                          fields: ['title'],
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

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const departmentField = collectDescendantNodes(
      data.surface.tree,
      (item) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'department',
    )[0];
    const popupDetails = collectDescendantNodes(
      departmentField,
      (item) => item?.use === 'DetailsBlockModel' && item?.uid !== 'department',
    )[0];
    expect(popupDetails?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'departments',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });
    const persistedPopupDetails = await flowRepo.findModelById(popupDetails.uid, { includeAsyncNode: true });
    expect(persistedPopupDetails?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'departments',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });
  });
});

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

function employeeDefaultFilter() {
  return {
    logic: '$and',
    items: [
      { path: 'nickname', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
    ],
  };
}

function calendarDefaultFilter() {
  return {
    logic: '$and',
    items: [
      { path: 'title', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
    ],
  };
}
