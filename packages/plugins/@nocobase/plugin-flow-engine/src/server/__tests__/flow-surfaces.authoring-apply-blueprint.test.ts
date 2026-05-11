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
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';

const LARGE_DEFAULTS_ACTION_COLLECTION = 'flow_surface_authoring_large_defaults_actions';
const LARGE_DEFAULTS_ACTION_FIELDS = Array.from({ length: 11 }, (_item, index) => `actionField${index + 1}`);
const DEFAULT_FILTER_CAP_COLLECTION = 'flow_surface_authoring_default_filter_caps';
const DEFAULT_FILTER_CAP_FIELDS = Array.from({ length: 6 }, (_item, index) => `capField${index + 1}`);
const LARGE_DEFAULTS_ASSOCIATION_SOURCE_COLLECTION = 'flow_surface_authoring_large_defaults_sources';
const LARGE_DEFAULTS_ASSOCIATION_TARGET_COLLECTION = 'flow_surface_authoring_large_defaults_targets';
const LARGE_DEFAULTS_ASSOCIATION_TARGET_FIELDS = Array.from(
  { length: 11 },
  (_item, index) => `targetField${index + 1}`,
);

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
    await rootAgent.resource('collections').create({
      values: {
        name: LARGE_DEFAULTS_ACTION_COLLECTION,
        title: 'Flow surface authoring large defaults actions',
        fields: LARGE_DEFAULTS_ACTION_FIELDS.map((name) => ({
          name,
          type: 'string',
          interface: 'input',
        })),
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: DEFAULT_FILTER_CAP_COLLECTION,
        title: 'Flow surface authoring default filter caps',
        fields: DEFAULT_FILTER_CAP_FIELDS.map((name) => ({
          name,
          type: 'string',
          interface: 'input',
        })),
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: LARGE_DEFAULTS_ASSOCIATION_SOURCE_COLLECTION,
        title: 'Flow surface authoring large defaults sources',
        fields: [
          {
            name: 'title',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: LARGE_DEFAULTS_ASSOCIATION_TARGET_COLLECTION,
        title: 'Flow surface authoring large defaults targets',
        fields: LARGE_DEFAULTS_ASSOCIATION_TARGET_FIELDS.map((name) => ({
          name,
          type: 'string',
          interface: 'input',
        })),
      },
    });
    await rootAgent.resource('collections.fields', LARGE_DEFAULTS_ASSOCIATION_SOURCE_COLLECTION).create({
      values: {
        name: 'target',
        type: 'belongsTo',
        target: LARGE_DEFAULTS_ASSOCIATION_TARGET_COLLECTION,
        foreignKey: 'targetId',
        interface: 'm2o',
      },
    });
    await rootAgent.resource('collections.fields', 'categories').create({
      values: {
        name: 'sort',
        type: 'sort',
        interface: 'sort',
        hidden: true,
      },
    });
    await waitForFixtureCollectionsReady(context.db, {
      [LARGE_DEFAULTS_ACTION_COLLECTION]: LARGE_DEFAULTS_ACTION_FIELDS,
      [DEFAULT_FILTER_CAP_COLLECTION]: DEFAULT_FILTER_CAP_FIELDS,
      [LARGE_DEFAULTS_ASSOCIATION_SOURCE_COLLECTION]: ['title', 'targetId'],
      [LARGE_DEFAULTS_ASSOCIATION_TARGET_COLLECTION]: LARGE_DEFAULTS_ASSOCIATION_TARGET_FIELDS,
      categories: ['title', 'code', 'status', 'scope', 'sort'],
    });
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

  it('should accept whole-page chart assets with public builder resource settings', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring chart asset blueprint',
          },
        },
        page: {
          title: 'Authoring chart asset blueprint',
        },
        assets: {
          charts: {
            statusChart: {
              query: {
                mode: 'builder',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                measures: [
                  {
                    field: 'id',
                    aggregation: 'count',
                    alias: 'employeeCount',
                  },
                ],
                dimensions: [{ field: 'status' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'status',
                  y: 'employeeCount',
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
                key: 'statusChart',
                type: 'chart',
                title: 'Status chart',
                chart: 'statusChart',
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const chartBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ChartBlockModel')[0];
    const persistedChart = await flowRepo.findModelById(chartBlock.uid, { includeAsyncNode: true });
    expect(persistedChart?.stepParams?.chartSettings?.configure?.query?.collectionPath).toEqual(['main', 'employees']);
    expect(persistedChart?.stepParams?.chartSettings?.configure?.chart?.option?.builder).toMatchObject({
      type: 'bar',
      xField: 'status',
      yField: 'employeeCount',
    });
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

  it('should auto-generate a capped defaultFilter for direct public data blocks', async () => {
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

    expect(response.status, readErrorMessage(response)).toBe(200);
    const data = getData(response);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const persistedTable = await flowRepo.findModelById(tableBlock.uid, { includeAsyncNode: true });
    const filterAction = readTableActionNodes(persistedTable).find((item: any) => item?.use === 'FilterActionModel');
    expect(filterAction).toBeTruthy();
    const generatedFilter = filterAction?.props?.defaultFilterValue;
    expect(generatedFilter?.logic).toBe('$and');
    expect(generatedFilter?.items).toHaveLength(4);
    expect(generatedFilter.items.map((item: any) => item.path)).toEqual(['nickname', 'email', 'status', 'phone']);
    expect(generatedFilter.items.map((item: any) => item.operator)).toEqual([
      '$includes',
      '$includes',
      '$includes',
      '$includes',
    ]);
    expect(filterAction?.stepParams?.filterSettings?.defaultFilter?.defaultFilter).toEqual(generatedFilter);
    expect(filterAction?.props?.filterableFieldNames).toEqual(['nickname', 'email', 'status', 'phone']);
    expect(filterAction?.stepParams?.filterSettings?.filterableFieldNames?.filterableFieldNames).toEqual([
      'nickname',
      'email',
      'status',
      'phone',
    ]);
  });

  it('should cap auto-generated defaultFilter fields at four candidates', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring capped generated default filter blueprint',
          },
        },
        page: {
          title: 'Authoring capped generated default filter blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'largeDefaultsTable',
                type: 'table',
                collection: DEFAULT_FILTER_CAP_COLLECTION,
                fields: ['capField1'],
              },
            ],
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
    const data = getData(response);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const persistedTable = await flowRepo.findModelById(tableBlock.uid, { includeAsyncNode: true });
    const filterAction = readTableActionNodes(persistedTable).find((item: any) => item?.use === 'FilterActionModel');
    const generatedFilter = filterAction?.props?.defaultFilterValue;
    expect(generatedFilter?.items).toHaveLength(4);
    expect(generatedFilter.items.map((item: any) => item.path)).toEqual([
      'capField1',
      'capField2',
      'capField3',
      'capField4',
    ]);
    expect(filterAction?.props?.filterableFieldNames).toEqual(['capField1', 'capField2', 'capField3', 'capField4']);
  });

  it('should reject explicit narrow defaultFilter before applyBlueprint writes', async () => {
    const explicitFilter = {
      logic: '$and',
      items: [{ path: 'nickname', operator: '$notEmpty' }],
    };
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring narrow explicit default filter blueprint',
          },
        },
        page: {
          title: 'Authoring narrow explicit default filter blueprint',
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
                defaultFilter: explicitFilter,
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    expect(response.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['defaultFilter-minimum-fields']),
    );
    expect(response.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.tabs[0].blocks[0].defaultFilter']),
    );
    for (const error of response.body.errors) {
      expectStructuredError(error, {
        status: 400,
        type: 'bad_request',
      });
    }
  });

  it('should truncate explicit defaultFilter and filterable fields to four candidates', async () => {
    const explicitFilter = {
      logic: '$and',
      items: [
        { path: 'capField1', operator: '$notEmpty' },
        { path: 'capField2', operator: '$notEmpty' },
        { path: 'capField3', operator: '$notEmpty' },
        { path: 'capField4', operator: '$notEmpty' },
        { path: 'capField5', operator: '$notEmpty' },
        { path: 'capField6', operator: '$notEmpty' },
      ],
    };
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring truncate explicit default filter blueprint',
          },
        },
        page: {
          title: 'Authoring truncate explicit default filter blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'largeDefaultsTable',
                type: 'table',
                collection: DEFAULT_FILTER_CAP_COLLECTION,
                fields: ['capField1'],
                defaultFilter: explicitFilter,
              },
            ],
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(200);
    const data = getData(response);
    const tableBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'TableBlockModel')[0];
    const persistedTable = await flowRepo.findModelById(tableBlock.uid, { includeAsyncNode: true });
    const filterAction = readTableActionNodes(persistedTable).find((item: any) => item?.use === 'FilterActionModel');
    expect(filterAction?.props?.defaultFilterValue?.items.map((item: any) => item.path)).toEqual([
      'capField1',
      'capField2',
      'capField3',
      'capField4',
    ]);
    expect(filterAction?.props?.filterableFieldNames).toEqual(['capField1', 'capField2', 'capField3', 'capField4']);
  });

  it('should add default table record actions when raw applyBlueprint omits recordActions', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring default table record actions',
          },
        },
        page: {
          title: 'Authoring default table record actions',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                template: {},
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
    const persistedTable = await flowRepo.findModelById(tableBlock.uid, { includeAsyncNode: true });
    expect(readTableRecordActionUses(persistedTable)).toEqual([
      'ViewActionModel',
      'EditActionModel',
      'DeleteActionModel',
    ]);
  });

  it('should merge missing table actions and recordActions when raw applyBlueprint supplies partial lists', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring partial default table actions',
          },
        },
        page: {
          title: 'Authoring partial default table actions',
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
                    type: 'filter',
                    settings: {
                      title: 'Custom filter',
                    },
                  },
                ],
                recordActions: [
                  {
                    type: 'view',
                    popup: {
                      title: 'Custom view',
                    },
                  },
                  {
                    type: 'updateRecord',
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
    expect(readTableActionUses(persistedTable)).toEqual([
      'FilterActionModel',
      'RefreshActionModel',
      'BulkDeleteActionModel',
      'AddNewActionModel',
    ]);
    expect(readTableRecordActionUses(persistedTable)).toEqual([
      'ViewActionModel',
      'EditActionModel',
      'DeleteActionModel',
      'UpdateRecordActionModel',
    ]);
  });

  it('should reject removed default action opt-out fields before applyBlueprint writes', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring table default action opt out',
          },
        },
        page: {
          title: 'Authoring table default action opt out',
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
                actions: [],
                recordActions: [],
                skipDefaultActions: true,
                skipDefaultRecordActions: true,
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status).toBe(400);
    expect(executeRes.body?.errors).toEqual(expect.any(Array));
    expect(executeRes.body.errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['default-actions-opt-out-unsupported']),
    );
    expect(executeRes.body.errors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining(['$.tabs[0].blocks[0]']),
    );
  });

  it('should keep template-backed table blocks from receiving default record actions', async () => {
    const templateSourceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring table template source',
          },
        },
        page: {
          title: 'Authoring table template source',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'templateSourceTable',
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
    expect(templateSourceRes.status, readErrorMessage(templateSourceRes)).toBe(200);
    const templateSourceData = getData(templateSourceRes);
    const sourceTable = collectDescendantNodes(
      templateSourceData.surface.tree,
      (item) => item?.use === 'TableBlockModel',
    )[0];
    const saveTemplateRes = await rootAgent.resource('flowSurfaces').saveTemplate({
      values: {
        target: {
          uid: sourceTable.uid,
        },
        name: `Authoring table template ${Date.now()}`,
        description: 'Table block template used for default record action compatibility coverage.',
        saveMode: 'duplicate',
      },
    });
    expect(saveTemplateRes.status, readErrorMessage(saveTemplateRes)).toBe(200);
    const template = getData(saveTemplateRes);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring table template consumer',
          },
        },
        page: {
          title: 'Authoring table template consumer',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'templateBackedTable',
                type: 'table',
                template: {
                  uid: template.uid,
                  mode: 'copy',
                },
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
    expect(readTableRecordActionUses(persistedTable)).toEqual([
      'ViewActionModel',
      'EditActionModel',
      'DeleteActionModel',
    ]);
  });

  it('should accept legacy popup display modes and map page to embed openView', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring popup display mode page',
          },
        },
        page: {
          title: 'Authoring popup display mode page',
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
                recordActions: [
                  {
                    key: 'viewEmployee',
                    type: 'view',
                    popup: {
                      mode: 'page',
                      blocks: [
                        {
                          key: 'employeeDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
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
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    const persistedAction = await flowRepo.findModelById(viewAction.uid, { includeAsyncNode: true });
    const openView = persistedAction?.stepParams?.popupSettings?.openView;
    expect(openView?.mode).toBe('embed');
    const templateSurface = await readPopupTemplateSurface(rootAgent, flowRepo, openView?.popupTemplateUid);
    const popupDetails = collectDescendantNodes(templateSurface, (item) => item?.use === 'DetailsBlockModel')[0];
    expect(popupDetails?.uid).toBeTruthy();
  });

  it('should default large first-layer local popups to page display mode and not nested popups', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring large popup display mode',
          },
        },
        page: {
          title: 'Authoring large popup display mode',
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
                recordActions: [
                  {
                    key: 'viewEmployee',
                    type: 'view',
                    popup: {
                      blocks: [
                        {
                          key: 'first',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['nickname'],
                        },
                        {
                          key: 'second',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['nickname'],
                        },
                        {
                          key: 'third',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['nickname'],
                        },
                        {
                          key: 'fourth',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: [
                            {
                              field: 'department',
                              popup: {
                                tryTemplate: false,
                                blocks: [
                                  {
                                    key: 'nestedDepartmentDetails',
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
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    const persistedAction = await flowRepo.findModelById(viewAction.uid, { includeAsyncNode: true });
    const actionOpenView = persistedAction?.stepParams?.popupSettings?.openView;
    expect(actionOpenView?.mode).toBe('embed');
    const templateSurface = await readPopupTemplateSurface(rootAgent, flowRepo, actionOpenView?.popupTemplateUid);
    const departmentField = collectDescendantNodes(
      templateSurface,
      (item) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'department',
    )[0];
    expect(departmentField?.uid).toBeTruthy();
    const persistedDepartmentField = await flowRepo.findModelById(findPopupHostNode(departmentField).uid, {
      includeAsyncNode: true,
    });
    expect(readPopupOpenView(persistedDepartmentField)?.mode).toBe('drawer');
  });

  it('should auto-save explicit local action popups as templates in applyBlueprint create mode', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring action popup auto template',
          },
        },
        page: {
          title: 'Authoring action popup auto template',
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
                recordActions: [
                  {
                    key: 'viewEmployee',
                    type: 'view',
                    title: 'Review employee',
                    popup: {
                      blocks: [
                        {
                          key: 'employeeDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
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
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const viewAction = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'ViewActionModel')[0];
    const persistedAction = await flowRepo.findModelById(viewAction.uid, { includeAsyncNode: true });
    const templateUid = persistedAction?.stepParams?.popupSettings?.openView?.popupTemplateUid;
    expect(templateUid).toBeTruthy();
    const template = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: templateUid,
        },
      }),
    );
    expect(template.name).toContain('Review employee');
    expect(template.description).toContain('Reusable popup template');
  });

  it('should normalize legacy calendar field bindings and quickCreateEnabled before writing', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring calendar legacy settings',
          },
        },
        page: {
          title: 'Authoring calendar legacy settings',
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
                titleField: 'title',
                colorField: 'status',
                startField: 'startsAt',
                endField: 'endsAt',
                settings: {
                  quickCreateEnabled: false,
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
    const persistedCalendar = await flowRepo.findModelById(calendarBlock.uid, { includeAsyncNode: true });
    expect(persistedCalendar?.props?.fieldNames).toMatchObject({
      title: 'title',
      colorFieldName: 'status',
      start: 'startsAt',
      end: 'endsAt',
    });
    expect(persistedCalendar?.props?.enableQuickCreateEvent).toBe(false);
  });

  it('should accept and strip legacy top-level pagination and sorting keys in applyBlueprint blocks', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring top-level table compatibility',
          },
        },
        page: {
          title: 'Authoring top-level table compatibility',
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
                pageSize: 99,
                sort: ['nickname'],
                sorting: [{ field: 'createdAt', direction: 'asc' }],
                settings: {
                  pageSize: 20,
                  sorting: [{ field: 'nickname', direction: 'desc' }],
                },
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
    expect(persistedTable?.stepParams?.tableSettings?.pageSize?.pageSize).toBe(20);
    expect(persistedTable?.stepParams?.tableSettings?.defaultSorting?.sort).toEqual([
      {
        field: 'nickname',
        direction: 'desc',
      },
    ]);
  });

  it('should normalize incompatible legacy tree table dragSortBy before writing', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring tree table drag sort compatibility',
          },
        },
        page: {
          title: 'Authoring tree table drag sort compatibility',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'categoriesTable',
                type: 'table',
                collection: 'categories',
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: 'title', operator: '$notEmpty' },
                    { path: 'code', operator: '$notEmpty' },
                    { path: 'status', operator: '$notEmpty' },
                    { path: 'scope', operator: '$notEmpty' },
                  ],
                },
                fields: ['title'],
                settings: {
                  treeTable: true,
                  dragSortBy: 'title',
                },
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
    expect(persistedTable?.stepParams?.tableSettings?.dragSortBy?.dragSortBy).toBe('sort');
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
            [LARGE_DEFAULTS_ACTION_COLLECTION]: {
              popups: {
                addNew: {
                  name: 'Large action add popup from backend defaults',
                  description: 'Large action add popup default metadata from applyBlueprint defaults.',
                },
              },
              fieldGroups: [
                {
                  title: 'Identity',
                  fields: LARGE_DEFAULTS_ACTION_FIELDS.slice(0, 6),
                },
                {
                  title: 'Workflow',
                  fields: LARGE_DEFAULTS_ACTION_FIELDS.slice(6),
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
                collection: LARGE_DEFAULTS_ACTION_COLLECTION,
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: LARGE_DEFAULTS_ACTION_FIELDS[0], operator: '$notEmpty' },
                    { path: LARGE_DEFAULTS_ACTION_FIELDS[1], operator: '$notEmpty' },
                    { path: LARGE_DEFAULTS_ACTION_FIELDS[2], operator: '$notEmpty' },
                    { path: LARGE_DEFAULTS_ACTION_FIELDS[3], operator: '$notEmpty' },
                  ],
                },
                fields: [LARGE_DEFAULTS_ACTION_FIELDS[0]],
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
      name: 'Large action add popup from backend defaults',
      description: 'Large action add popup default metadata from applyBlueprint defaults.',
      collectionName: LARGE_DEFAULTS_ACTION_COLLECTION,
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
      expect.arrayContaining([LARGE_DEFAULTS_ACTION_FIELDS[0], LARGE_DEFAULTS_ACTION_FIELDS[10]]),
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
            [LARGE_DEFAULTS_ASSOCIATION_SOURCE_COLLECTION]: {
              popups: {
                associations: {
                  target: {
                    view: {
                      name: 'Large association popup from backend defaults',
                      description: 'Large association popup default metadata from applyBlueprint defaults.',
                    },
                  },
                },
              },
            },
            [LARGE_DEFAULTS_ASSOCIATION_TARGET_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Target identity',
                  fields: LARGE_DEFAULTS_ASSOCIATION_TARGET_FIELDS.slice(0, 6),
                },
                {
                  title: 'Target details',
                  fields: LARGE_DEFAULTS_ASSOCIATION_TARGET_FIELDS.slice(6),
                },
              ],
              popups: {
                view: {
                  name: 'Target generic popup should not win',
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
                collection: LARGE_DEFAULTS_ASSOCIATION_SOURCE_COLLECTION,
                fields: ['target'],
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
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'target' &&
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
      name: 'Large association popup from backend defaults',
      description: 'Large association popup default metadata from applyBlueprint defaults.',
      collectionName: LARGE_DEFAULTS_ASSOCIATION_TARGET_COLLECTION,
      associationName: `${LARGE_DEFAULTS_ASSOCIATION_SOURCE_COLLECTION}.target`,
      type: 'popup',
    });

    const templateSurface = await flowRepo.findModelById(template.targetUid, { includeAsyncNode: true });
    const detailsBlock = collectDescendantNodes(templateSurface, (item) => item?.use === 'DetailsBlockModel')[0];
    const detailsItems = _.castArray(detailsBlock?.subModels?.grid?.subModels?.items || []);
    expect(
      detailsItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Target identity'),
    ).toBe(true);
    expect(
      detailsItems.some((item: any) => item?.use === 'DividerItemModel' && item?.props?.label === 'Target details'),
    ).toBe(true);
    expect(detailsItems.map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath).filter(Boolean)).toEqual(
      expect.arrayContaining([
        LARGE_DEFAULTS_ASSOCIATION_TARGET_FIELDS[0],
        LARGE_DEFAULTS_ASSOCIATION_TARGET_FIELDS[10],
      ]),
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
    expect(departmentField?.uid).toBeTruthy();
    const departmentPopupHost = findPopupHostNode(departmentField);
    const persistedDepartmentField = await flowRepo.findModelById(departmentPopupHost.uid, { includeAsyncNode: true });
    const popupTemplateUid =
      readPopupTemplateUid(persistedDepartmentField) ||
      readPopupTemplateUid(departmentPopupHost) ||
      readPopupTemplateUid(departmentField);
    const templateSurface = await readPopupTemplateSurface(rootAgent, flowRepo, popupTemplateUid);
    const popupDetails = collectDescendantNodes(templateSurface, (item) => item?.use === 'DetailsBlockModel')[0];
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

function readTableRecordActionUses(node: any) {
  const actionsColumn = _.castArray(node?.subModels?.columns || []).find(
    (column: any) => column?.use === 'TableActionsColumnModel',
  );
  return _.castArray(actionsColumn?.subModels?.actions || []).map((item: any) => item?.use);
}

function readTableActionNodes(node: any) {
  return _.castArray(node?.subModels?.actions || []);
}

function readTableActionUses(node: any) {
  return readTableActionNodes(node).map((item: any) => item?.use);
}

function readPopupOpenView(node: any) {
  return (
    node?.stepParams?.popupSettings?.openView ||
    node?.stepParams?.selectExitRecordSettings?.openView ||
    node?.stepParams?.openSelectRecordView?.openView ||
    node?.stepParams?.openAddRecordView?.openView
  );
}

function readPopupTemplateUid(node: any) {
  return node?.popup?.template?.uid || readPopupOpenView(node)?.popupTemplateUid;
}

function findPopupHostNode(node: any) {
  return (
    collectDescendantNodes(
      node,
      (item) => _.isPlainObject(readPopupOpenView(item)) || !!readPopupTemplateUid(item),
    )[0] || node
  );
}

async function readPopupTemplateSurface(rootAgent: any, flowRepo: any, templateUid: string | undefined) {
  expect(templateUid).toBeTruthy();
  const template = getData(
    await rootAgent.resource('flowSurfaces').getTemplate({
      values: {
        uid: templateUid,
      },
    }),
  );
  expect(template?.targetUid).toBeTruthy();
  return flowRepo.findModelById(template.targetUid, { includeAsyncNode: true });
}

function employeeDefaultFilter() {
  return {
    logic: '$and',
    items: [
      { path: 'nickname', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
      { path: 'email', operator: '$notEmpty' },
      { path: 'phone', operator: '$notEmpty' },
    ],
  };
}

function calendarDefaultFilter() {
  return {
    logic: '$and',
    items: [
      { path: 'title', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
      { path: 'category', operator: '$notEmpty' },
      { path: 'scope', operator: '$notEmpty' },
    ],
  };
}
