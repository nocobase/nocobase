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
const NARROW_DEFAULT_FILTER_COLLECTION = 'flow_surface_authoring_narrow_default_filter';
const NARROW_DEFAULT_FILTER_FIELDS = ['title', 'name'];
const LARGE_DEFAULTS_ASSOCIATION_SOURCE_COLLECTION = 'flow_surface_authoring_large_defaults_sources';
const LARGE_DEFAULTS_ASSOCIATION_TARGET_COLLECTION = 'flow_surface_authoring_large_defaults_targets';
const LARGE_DEFAULTS_ASSOCIATION_TARGET_FIELDS = Array.from(
  { length: 11 },
  (_item, index) => `targetField${index + 1}`,
);
const EMPLOYEE_VISIBLE_FIELDS = ['nickname', 'status', 'email'];
const USER_VISIBLE_FIELDS = ['username', 'nickname', 'email'];
const ROLE_VISIBLE_FIELDS = ['name', 'title', 'description'];
const DEFAULT_FILTER_CAP_VISIBLE_FIELDS = DEFAULT_FILTER_CAP_FIELDS.slice(0, 3);
const LARGE_DEFAULTS_ACTION_VISIBLE_FIELDS = LARGE_DEFAULTS_ACTION_FIELDS.slice(0, 3);

describe('flowSurfaces backend authoring applyBlueprint compiler', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];
  let flowRepo: FlowSurfacesContractContext['flowRepo'];
  let routesRepo: FlowSurfacesContractContext['routesRepo'];

  async function createAuthoringRelationFixture() {
    const suffix = _.uniqueId();
    const sourceCollection = `fab_s_${suffix}`;
    const targetCollection = `fab_t_${suffix}`;
    const throughCollection = `fab_m_${suffix}`;
    await rootAgent.resource('collections').create({
      values: {
        name: targetCollection,
        title: targetCollection,
        titleField: 'title',
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'description', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: sourceCollection,
        titleField: 'username',
        fields: [
          { name: 'username', type: 'string', interface: 'input' },
          { name: 'nickname', type: 'string', interface: 'input' },
          { name: 'email', type: 'string', interface: 'email' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: throughCollection,
        title: throughCollection,
        fields: [
          {
            name: 'id',
            type: 'integer',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            interface: 'id',
          },
        ],
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'roles',
        type: 'belongsToMany',
        target: targetCollection,
        through: throughCollection,
        foreignKey: 'sourceId',
        otherKey: 'targetId',
        interface: 'm2m',
        reverseField: {
          type: 'belongsToMany',
          name: 'users',
          interface: 'm2m',
        },
      },
    });
    await waitForFixtureCollectionsReady(context.db, {
      [sourceCollection]: USER_VISIBLE_FIELDS,
      [targetCollection]: ROLE_VISIBLE_FIELDS,
      [throughCollection]: ['id', 'sourceId', 'targetId'],
    });
    return {
      sourceCollection,
      targetCollection,
      sourceAssociationName: `${sourceCollection}.roles`,
      targetAssociationName: `${targetCollection}.users`,
    };
  }

  async function createAuthoringMultiHopRelationFixture() {
    const suffix = _.uniqueId();
    const sourceCollection = `fab_mh_a_${suffix}`;
    const middleCollection = `fab_mh_b_${suffix}`;
    const targetCollection = `fab_mh_c_${suffix}`;
    await rootAgent.resource('collections').create({
      values: {
        name: targetCollection,
        title: targetCollection,
        titleField: 'name',
        filterTargetKey: 'id',
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: middleCollection,
        title: middleCollection,
        titleField: 'name',
        filterTargetKey: 'id',
        fields: [{ name: 'name', type: 'string', interface: 'input' }],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: sourceCollection,
        title: sourceCollection,
        titleField: 'name',
        filterTargetKey: 'id',
        fields: [{ name: 'name', type: 'string', interface: 'input' }],
      },
    });
    await rootAgent.resource('collections.fields', sourceCollection).create({
      values: {
        name: 'middle',
        type: 'belongsTo',
        target: middleCollection,
        foreignKey: 'middleId',
        interface: 'm2o',
      },
    });
    await rootAgent.resource('collections.fields', middleCollection).create({
      values: {
        name: 'target',
        type: 'belongsTo',
        target: targetCollection,
        foreignKey: 'targetId',
        interface: 'm2o',
      },
    });
    await waitForFixtureCollectionsReady(context.db, {
      [sourceCollection]: ['name', 'middleId'],
      [middleCollection]: ['name', 'targetId'],
      [targetCollection]: ['name', 'code'],
    });
    return {
      sourceCollection,
      middleCollection,
      targetCollection,
      leafAssociationName: `${middleCollection}.target`,
    };
  }

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
        name: NARROW_DEFAULT_FILTER_COLLECTION,
        title: 'Flow surface authoring narrow default filter',
        fields: NARROW_DEFAULT_FILTER_FIELDS.map((name) => ({
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
      [NARROW_DEFAULT_FILTER_COLLECTION]: NARROW_DEFAULT_FILTER_FIELDS,
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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

  it('should include supported chart types and jsBlock guidance for unsupported chart asset visual types', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring unsupported chart type blueprint',
          },
        },
        page: {
          title: 'Authoring unsupported chart type blueprint',
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
              },
              visual: {
                mode: 'basic',
                type: 'stat',
                mappings: {
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

    expect(response.status).toBe(400);
    const chartError = response.body?.errors?.find((error: any) => error.ruleId === 'chart-visual-type-unsupported');
    expect(chartError).toMatchObject({
      path: '$.assets.charts.statusChart.visual.type',
      details: expect.objectContaining({
        type: 'stat',
        supportedVisualTypes: ['line', 'area', 'bar', 'barHorizontal', 'pie', 'doughnut', 'funnel', 'scatter'],
        alternativeBlockType: 'jsBlock',
      }),
    });
    expect(chartError?.message).toContain('Supported basic chart visual types');
    expect(chartError?.message).toContain('jsBlock');
    expect(chartError?.message).not.toContain('Do not change this block type');
    expect(chartError?.details?.repairHint).not.toContain('Do not change this block type');
    expect(chartError?.details?.forbiddenFallbacks).not.toContain('jsBlock');
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
              },
              {
                key: 'employeesList',
                type: 'list',
                title: 'Employees list',
                collection: 'employees',
                defaultFilter: employeeDefaultFilter(),
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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

  it('should include repair hints on jsBlock and chart authoring errors', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring jsBlock chart repair hint blueprint',
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'missingJsSource',
                type: 'jsBlock',
                title: 'KPI summary',
              },
              {
                key: 'topLevelJsCode',
                type: 'jsBlock',
                title: 'KPI summary with wrong key',
                code: 'return { value: 1 };',
              },
              {
                key: 'missingChartAsset',
                type: 'chart',
                title: 'Status chart',
                chart: 'missingAsset',
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    const jsBlockError = response.body.errors.find((error: any) => error.ruleId === 'jsBlock-source-required');
    const chartError = response.body.errors.find(
      (error: any) => error.ruleId === 'chart-block-asset-reference-missing',
    );
    const topLevelCodeError = response.body.errors.find(
      (error: any) => error.ruleId === 'jsBlock-top-level-code-unsupported',
    );
    expect(jsBlockError?.details?.repairHint).toContain('settings.code');
    expect(jsBlockError?.details?.repairHint).toContain('Do not change this block type');
    expect(jsBlockError?.details?.requiredBlockType).toBe('jsBlock');
    expect(jsBlockError?.details?.fixStrategy).toBe('repair_same_block_type');
    expect(jsBlockError?.details?.repairExample?.inlineBlock?.type).toBe('jsBlock');
    expect(jsBlockError?.details?.forbiddenFallbacks).toEqual(
      expect.arrayContaining(['table', 'list', 'defer jsBlock']),
    );
    expect(jsBlockError?.message).toContain('jsBlock payload shape problem');
    expect(jsBlockError?.message).toContain('Do not change this block type');
    expect(topLevelCodeError?.details?.repairHint).toContain('settings.code');
    expect(topLevelCodeError?.details?.repairHint).toContain('Do not change this block type');
    expect(chartError?.details?.repairHint).toContain('assets.charts');
    expect(chartError?.details?.repairHint).toContain('Do not change this block type');
    expect(chartError?.details?.requiredBlockType).toBe('chart');
    expect(chartError?.details?.fixStrategy).toBe('repair_same_block_type');
    expect(chartError?.details?.repairExample?.block).toEqual({ type: 'chart', chart: 'chartKey' });
    expect(chartError?.details?.repairHint).toContain('do not drop or defer the chart');
    expect(chartError?.details?.repairHint).toContain('KPI');
    expect(chartError?.details?.repairSteps).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Keep the block type as chart'),
        expect.stringContaining('assets.charts.<key>.query'),
      ]),
    );
    expect(chartError?.details?.expectedShape?.block).toEqual({ type: 'chart', chart: 'chartKey' });
    expect(chartError?.details?.forbiddenFallbacks).toEqual(expect.arrayContaining(['table', 'drop chart']));
    expect(chartError?.message).toContain('chart payload shape problem');
    expect(chartError?.message).toContain('Do not change this block type');
    expect(chartError?.message).toContain('do not drop or defer the chart');
  });

  it('should include repair hints on invalid jsBlock script assets', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring script asset chart mapping repair hint blueprint',
          },
        },
        assets: {
          scripts: {
            brokenKpi: {},
          },
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'brokenKpi',
                type: 'jsBlock',
                title: 'KPI summary',
                script: 'brokenKpi',
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(expect.any(Array));
    const scriptError = response.body.errors.find(
      (error: any) => error.ruleId === 'apply-blueprint-script-asset-code-required',
    );
    expect(scriptError?.details?.repairHint).toContain('assets.scripts');
    expect(scriptError?.details?.repairHint).toContain('Do not change this block type');
    expect(scriptError?.details?.requiredBlockType).toBe('jsBlock');
    expect(scriptError?.details?.fixStrategy).toBe('repair_same_block_type');
    expect(scriptError?.details?.repairExample?.assetBlock?.block?.type).toBe('jsBlock');
  });

  it('should include repair hints on invalid chart SQL output mappings', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring chart SQL mapping repair hint blueprint',
          },
        },
        assets: {
          charts: {
            statusChart: {
              query: {
                mode: 'sql',
                sql: 'select 1 as value',
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'value',
                  y: 'missingOutput',
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

    expect(response.status).toBe(400);
    const chartError = response.body?.errors?.[0];
    expect(chartError?.message).toContain('chart visual mappings only support SQL query output fields');
    expect(chartError?.message).toContain('Do not change this block type');
    expect(chartError?.details?.repairHint).toContain('chart payload shape problem');
    expect(chartError?.details?.repairHint).toContain('Do not change this block type');
    expect(chartError?.details?.repairSteps).toEqual(
      expect.arrayContaining([expect.stringContaining('Retry the chart payload')]),
    );
    expect(chartError?.details?.supportedOutputs).toEqual(['value']);
  });

  it('should include repair hints on invalid chart SQL during applyBlueprint', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring chart invalid SQL repair hint blueprint',
          },
        },
        assets: {
          charts: {
            statusChart: {
              query: {
                mode: 'sql',
                sql: 'select * from missing_flow_surfaces_chart_table',
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'status',
                  y: 'value',
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

    expect(response.status).toBe(400);
    const chartError = response.body?.errors?.[0];
    expect(chartError?.message).toContain('chart query.sql is invalid');
    expect(chartError?.message).toContain('Do not change this block type');
    expect(chartError?.details?.repairHint).toContain('chart payload shape problem');
    expect(chartError?.details?.repairSteps).toEqual(
      expect.arrayContaining([expect.stringContaining('Retry the chart payload')]),
    );
    expect(chartError?.details?.forbiddenFallbacks).toEqual(expect.arrayContaining(['table', 'drop chart']));
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
    expect(filterAction?.props?.filterableFieldNames).toBeUndefined();
    expect(filterAction?.stepParams?.filterSettings?.filterableFieldNames).toBeUndefined();
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
                fields: DEFAULT_FILTER_CAP_VISIBLE_FIELDS,
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
    expect(filterAction?.props?.filterableFieldNames).toBeUndefined();
    expect(filterAction?.stepParams?.filterSettings?.filterableFieldNames).toBeUndefined();
  });

  it('should require three defaultFilter fields for collections with four or more candidates', async () => {
    const validResponse = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring three field explicit default filter blueprint',
          },
        },
        page: {
          title: 'Authoring three field explicit default filter blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'largeDefaultsTable',
                type: 'table',
                collection: DEFAULT_FILTER_CAP_COLLECTION,
                fields: DEFAULT_FILTER_CAP_VISIBLE_FIELDS,
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: 'capField1', operator: '$notEmpty' },
                    { path: 'capField2', operator: '$notEmpty' },
                    { path: 'capField3', operator: '$notEmpty' },
                  ],
                },
              },
            ],
          },
        ],
      },
    });

    expect(validResponse.status, readErrorMessage(validResponse)).toBe(200);

    const invalidResponse = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring two field explicit default filter blueprint',
          },
        },
        page: {
          title: 'Authoring two field explicit default filter blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'largeDefaultsTable',
                type: 'table',
                collection: DEFAULT_FILTER_CAP_COLLECTION,
                fields: DEFAULT_FILTER_CAP_VISIBLE_FIELDS,
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: 'capField1', operator: '$notEmpty' },
                    { path: 'capField2', operator: '$notEmpty' },
                  ],
                },
              },
            ],
          },
        ],
      },
    });

    expect(invalidResponse.status).toBe(400);
    const minimumError = invalidResponse.body?.errors?.find(
      (error: any) => error.ruleId === 'defaultFilter-minimum-fields',
    );
    expect(minimumError).toMatchObject({
      details: {
        fieldCount: 2,
        requiredFieldCount: 3,
        fieldNames: ['capField1', 'capField2'],
      },
    });
  });

  it('should relax defaultFilter field count for narrow direct-interface collections', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring narrow collection default filter blueprint',
          },
        },
        page: {
          title: 'Authoring narrow collection default filter blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'narrowDefaultsTable',
                type: 'table',
                collection: NARROW_DEFAULT_FILTER_COLLECTION,
                fields: ['title', 'name'],
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
    expect(generatedFilter?.items).toHaveLength(2);
    expect(generatedFilter.items.map((item: any) => item.path)).toEqual(['name', 'title']);
    expect(filterAction?.props?.filterableFieldNames).toBeUndefined();
    expect(filterAction?.stepParams?.filterSettings?.filterableFieldNames).toBeUndefined();
  });

  it('should require all available defaultFilter candidates for narrow direct-interface collections', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring narrow collection incomplete default filter blueprint',
          },
        },
        page: {
          title: 'Authoring narrow collection incomplete default filter blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'narrowDefaultsTable',
                type: 'table',
                collection: NARROW_DEFAULT_FILTER_COLLECTION,
                fields: ['title', 'name'],
                defaultFilter: {
                  logic: '$and',
                  items: [{ path: 'title', operator: '$notEmpty' }],
                },
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    const minimumError = response.body?.errors?.find((error: any) => error.ruleId === 'defaultFilter-minimum-fields');
    expect(minimumError).toMatchObject({
      details: {
        fieldCount: 1,
        requiredFieldCount: 2,
        fieldNames: ['title'],
      },
    });
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
    const minimumError = response.body.errors.find((error: any) => error.ruleId === 'defaultFilter-minimum-fields');
    expect(minimumError?.details?.requiredFieldCount).toBe(3);
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
                fields: DEFAULT_FILTER_CAP_VISIBLE_FIELDS,
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
    expect(filterAction?.props?.filterableFieldNames).toBeUndefined();
    expect(filterAction?.stepParams?.filterSettings?.filterableFieldNames).toBeUndefined();
  });

  it('should reject rich data blocks with too few visible business fields before applyBlueprint writes', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring minimum visible fields blueprint',
          },
        },
        page: {
          title: 'Authoring minimum visible fields blueprint',
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

    expect(response.status).toBe(400);
    const minimumError = response.body?.errors?.find(
      (error: any) => error.ruleId === 'data-block-visible-fields-minimum',
    );
    expect(minimumError).toMatchObject({
      path: '$.tabs[0].blocks[0].fields',
      details: {
        blockType: 'table',
        collection: DEFAULT_FILTER_CAP_COLLECTION,
        fieldCount: 1,
        requiredFieldCount: 3,
      },
    });
    expect(minimumError?.message).toContain('Add at least 3 collection field names');
  });

  it('should not count defaults.collections fieldGroups as visible table fields', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        defaults: {
          collections: {
            [DEFAULT_FILTER_CAP_COLLECTION]: {
              fieldGroups: [
                {
                  title: 'Generated popup fields',
                  fields: DEFAULT_FILTER_CAP_VISIBLE_FIELDS,
                },
              ],
            },
          },
        },
        navigation: {
          item: {
            title: 'Authoring defaults fieldGroups only blueprint',
          },
        },
        page: {
          title: 'Authoring defaults fieldGroups only blueprint',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'largeDefaultsTable',
                type: 'table',
                collection: DEFAULT_FILTER_CAP_COLLECTION,
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    const visibleFieldError = response.body?.errors?.find(
      (error: any) => error.ruleId === 'data-block-visible-fields-required',
    );
    expect(visibleFieldError).toMatchObject({
      path: '$.tabs[0].blocks[0].fields',
      details: {
        blockType: 'table',
        collection: DEFAULT_FILTER_CAP_COLLECTION,
      },
    });
    expect(visibleFieldError?.message).toContain('defaults.collections.*.fieldGroups');
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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

  it('should auto-complete default table actions when raw applyBlueprint passes empty action arrays', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring empty table action arrays',
          },
        },
        page: {
          title: 'Authoring empty table action arrays',
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
                actions: [],
                recordActions: [],
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
                          fields: EMPLOYEE_VISIBLE_FIELDS,
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
                          fields: EMPLOYEE_VISIBLE_FIELDS,
                        },
                        {
                          key: 'second',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: EMPLOYEE_VISIBLE_FIELDS,
                        },
                        {
                          key: 'third',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: EMPLOYEE_VISIBLE_FIELDS,
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
                recordActions: [
                  {
                    key: 'viewEmployee',
                    type: 'view',
                    title: 'Review employee',
                    popup: {
                      tryTemplate: false,
                      blocks: [
                        {
                          key: 'employeeDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: EMPLOYEE_VISIBLE_FIELDS,
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

  it('should reuse auto-saved local popup templates when creating the same blueprint structure again', async () => {
    const unique = Date.now();
    const fieldCollection = `authoring_popup_reuse_field_${unique}`;
    const actionCollection = `authoring_popup_reuse_action_${unique}`;
    const fieldPopupTitle = `Authoring field popup reuse ${unique}`;
    const actionPopupTitle = `Authoring action popup reuse ${unique}`;
    await createAuthoringPopupReuseCollection(rootAgent, context.db, fieldCollection);
    await createAuthoringPopupReuseCollection(rootAgent, context.db, actionCollection);
    const baselineTemplateUids = await listPopupTemplateUids(context.db);

    const buildValues = (pageTitle: string) => ({
      mode: 'create',
      navigation: {
        item: {
          title: pageTitle,
        },
      },
      page: {
        title: pageTitle,
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'fieldDetails',
              type: 'details',
              collection: fieldCollection,
              fields: [
                {
                  key: 'nameWithPopup',
                  field: 'name',
                  popup: {
                    title: fieldPopupTitle,
                    blocks: [
                      {
                        key: 'fieldPopupDetails',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['name', 'code'],
                      },
                    ],
                  },
                },
              ],
            },
            {
              key: 'actionTable',
              type: 'table',
              collection: actionCollection,
              fields: ['name'],
              recordActions: [
                {
                  key: 'viewActionRecord',
                  type: 'view',
                  title: 'Inspect',
                  popup: {
                    title: actionPopupTitle,
                    blocks: [
                      {
                        key: 'actionPopupDetails',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['name', 'label'],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const firstRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: buildValues(`Authoring popup reuse first ${unique}`),
    });
    expect(firstRes.status, readErrorMessage(firstRes)).toBe(200);
    const firstData = getData(firstRes);
    const firstFieldTemplateUid = readAuthoringReuseFieldPopupTemplateUid(firstData.surface.tree);
    const firstActionTemplateUid = readAuthoringReuseActionPopupTemplateUid(firstData.surface.tree);
    expect(firstFieldTemplateUid).toBeTruthy();
    expect(firstActionTemplateUid).toBeTruthy();
    const afterFirstTemplateUids = await listPopupTemplateUids(context.db);
    const newTemplateUids = afterFirstTemplateUids.filter((uid) => !baselineTemplateUids.includes(uid));
    expect(newTemplateUids).toEqual(expect.arrayContaining([firstActionTemplateUid, firstFieldTemplateUid]));

    const secondRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: buildValues(`Authoring popup reuse second ${unique}`),
    });
    expect(secondRes.status, readErrorMessage(secondRes)).toBe(200);
    const secondData = getData(secondRes);
    expect(readAuthoringReuseFieldPopupTemplateUid(secondData.surface.tree)).toBe(firstFieldTemplateUid);
    expect(readAuthoringReuseActionPopupTemplateUid(secondData.surface.tree)).toBe(firstActionTemplateUid);

    expect(await listPopupTemplateUids(context.db)).toEqual(afterFirstTemplateUids);
    await expectPopupTemplateUsage(rootAgent, firstFieldTemplateUid, 2);
    await expectPopupTemplateUsage(rootAgent, firstActionTemplateUid, 2);
  });

  it('should reuse explicit saveAsTemplate popup templates even when metadata changes', async () => {
    const unique = Date.now();
    const collection = `authoring_popup_explicit_reuse_${unique}`;
    const firstTemplateName = `Authoring explicit popup source ${unique}`;
    const secondTemplateName = `Authoring explicit popup ignored ${unique}`;
    await createAuthoringPopupReuseCollection(rootAgent, context.db, collection);
    const baselineTemplateUids = await listPopupTemplateUids(context.db);

    const buildValues = (pageTitle: string, templateName: string, description: string) => ({
      mode: 'create',
      navigation: {
        item: {
          title: pageTitle,
        },
      },
      page: {
        title: pageTitle,
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'detailsWithPopup',
              type: 'details',
              collection,
              fields: [
                {
                  key: 'nameWithPopup',
                  field: 'name',
                  popup: {
                    blocks: [
                      {
                        key: 'popupDetails',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['name', 'code'],
                      },
                    ],
                    saveAsTemplate: {
                      name: templateName,
                      description,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const firstRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: buildValues(
        `Authoring explicit popup first ${unique}`,
        firstTemplateName,
        'Explicit popup template source.',
      ),
    });
    expect(firstRes.status, readErrorMessage(firstRes)).toBe(200);
    const firstTemplateUid = readPopupTemplateUidForFieldPath(getData(firstRes).surface.tree, 'name');
    expect(firstTemplateUid).toBeTruthy();
    const afterFirstTemplateUids = await listPopupTemplateUids(context.db);
    expect(afterFirstTemplateUids.filter((uid) => !baselineTemplateUids.includes(uid))).toContain(firstTemplateUid);

    const secondRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: buildValues(
        `Authoring explicit popup second ${unique}`,
        secondTemplateName,
        'Different metadata should not force a new template.',
      ),
    });
    expect(secondRes.status, readErrorMessage(secondRes)).toBe(200);
    expect(readPopupTemplateUidForFieldPath(getData(secondRes).surface.tree, 'name')).toBe(firstTemplateUid);
    expect(await listPopupTemplateUids(context.db)).toEqual(afterFirstTemplateUids);
    expect(await findPopupTemplateByName(context.db, secondTemplateName)).toBeUndefined();
    await expectPopupTemplateUsage(rootAgent, firstTemplateUid, 2);
  });

  it('should reuse popup templates saved earlier in the same blueprint before considering new metadata', async () => {
    const unique = Date.now();
    const collection = `authoring_popup_same_blueprint_${unique}`;
    const firstTemplateName = `Authoring same blueprint source ${unique}`;
    const secondTemplateName = `Authoring same blueprint ignored ${unique}`;
    await createAuthoringPopupReuseCollection(rootAgent, context.db, collection);
    const baselineTemplateUids = await listPopupTemplateUids(context.db);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Authoring same blueprint popup reuse ${unique}`,
          },
        },
        page: {
          title: 'Authoring same blueprint popup reuse',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'detailsWithPopups',
                type: 'details',
                collection,
                fields: [
                  {
                    key: 'nameWithPopup',
                    field: 'name',
                    popup: {
                      blocks: [
                        {
                          key: 'firstPopupDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['name'],
                        },
                      ],
                      saveAsTemplate: {
                        name: firstTemplateName,
                        description: 'Template saved by the first popup in this blueprint.',
                      },
                    },
                  },
                  {
                    key: 'codeWithPopup',
                    field: 'code',
                    popup: {
                      blocks: [
                        {
                          key: 'secondPopupDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['code'],
                        },
                      ],
                      saveAsTemplate: {
                        name: secondTemplateName,
                        description: 'Different metadata must not force a second template in the same blueprint.',
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
    const firstTemplateUid = readPopupTemplateUidForFieldPath(data.surface.tree, 'name');
    const secondTemplateUid = readPopupTemplateUidForFieldPath(data.surface.tree, 'code');
    expect(firstTemplateUid).toBeTruthy();
    expect(secondTemplateUid).toBe(firstTemplateUid);

    const afterTemplateUids = await listPopupTemplateUids(context.db);
    expect(afterTemplateUids.filter((uid) => !baselineTemplateUids.includes(uid))).toContain(firstTemplateUid);
    expect((await findPopupTemplateByName(context.db, firstTemplateName))?.uid).toBe(firstTemplateUid);
    expect(await findPopupTemplateByName(context.db, secondTemplateName)).toBeUndefined();
    await expectPopupTemplateUsage(rootAgent, firstTemplateUid, 2);
  });

  it('should prefer popup templates with matching block types and create a new template when none match', async () => {
    const unique = Date.now();
    const collection = `authoring_popup_type_reuse_${unique}`;
    const detailsTemplateName = `Authoring popup details source ${unique}`;
    const tableTemplateName = `Authoring popup table source ${unique}`;
    await createAuthoringPopupReuseCollection(rootAgent, context.db, collection);

    const buildValues = (pageTitle: string, fieldPath: string, popup: Record<string, any>) => ({
      mode: 'create',
      navigation: {
        item: {
          title: pageTitle,
        },
      },
      page: {
        title: pageTitle,
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'detailsWithPopup',
              type: 'details',
              collection,
              fields: [
                {
                  key: `${fieldPath}WithPopup`,
                  field: fieldPath,
                  popup,
                },
              ],
            },
          ],
        },
      ],
    });

    const detailsSourceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: buildValues(`Authoring popup details source ${unique}`, 'name', {
        tryTemplate: false,
        blocks: [
          {
            key: 'detailsPopup',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['name'],
          },
        ],
        saveAsTemplate: {
          name: detailsTemplateName,
          description: 'Details popup template used for block type priority.',
        },
      }),
    });
    expect(detailsSourceRes.status, readErrorMessage(detailsSourceRes)).toBe(200);
    const detailsTemplateUid = readPopupTemplateUidForFieldPath(getData(detailsSourceRes).surface.tree, 'name');
    expect(detailsTemplateUid).toBeTruthy();

    const tableSourceRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: buildValues(`Authoring popup table source ${unique}`, 'code', {
        tryTemplate: false,
        blocks: [
          {
            key: 'tablePopup',
            type: 'table',
            resource: {
              binding: 'otherRecords',
              collectionName: collection,
            },
            fields: ['name'],
          },
        ],
        saveAsTemplate: {
          name: tableTemplateName,
          description: 'Table popup template used as the newer fallback candidate.',
        },
      }),
    });
    expect(tableSourceRes.status, readErrorMessage(tableSourceRes)).toBe(200);
    const tableTemplateUid = readPopupTemplateUidForFieldPath(getData(tableSourceRes).surface.tree, 'code');
    expect(tableTemplateUid).toBeTruthy();
    expect(tableTemplateUid).not.toBe(detailsTemplateUid);
    const updateTableTemplateRes = await rootAgent.resource('flowSurfaces').updateTemplate({
      values: {
        uid: tableTemplateUid,
        name: tableTemplateName,
        description: 'Updated table popup template used as the newer fallback candidate.',
      },
    });
    expect(updateTableTemplateRes.status, readErrorMessage(updateTableTemplateRes)).toBe(200);
    const afterSourceTemplateUids = await listPopupTemplateUids(context.db);

    const matchingRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: buildValues(`Authoring popup type match ${unique}`, 'label', {
        blocks: [
          {
            key: 'requestedDetailsPopup',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['label'],
          },
        ],
        saveAsTemplate: {
          name: `Authoring popup details ignored ${unique}`,
          description: 'Matching block type should reuse the existing details template.',
        },
      }),
    });
    expect(matchingRes.status, readErrorMessage(matchingRes)).toBe(200);
    const matchingTemplateUid = readPopupTemplateUidForFieldPath(getData(matchingRes).surface.tree, 'label');
    expect(matchingTemplateUid).toBeTruthy();
    expect(afterSourceTemplateUids).toContain(matchingTemplateUid);
    const matchingTemplateSurface = await readPopupTemplateSurface(rootAgent, flowRepo, matchingTemplateUid);
    expect(collectDescendantNodes(matchingTemplateSurface, (item) => item?.use === 'DetailsBlockModel')).not.toEqual(
      [],
    );
    expect(await listPopupTemplateUids(context.db)).toEqual(afterSourceTemplateUids);

    const fallbackRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: buildValues(`Authoring popup type fallback ${unique}`, 'label', {
        blocks: [
          {
            key: 'requestedCreatePopup',
            type: 'createForm',
            collection,
            fields: ['name'],
          },
        ],
        saveAsTemplate: {
          name: `Authoring popup fallback ignored ${unique}`,
          description: 'Unmatched block type should create a compatible template.',
        },
      }),
    });
    expect(fallbackRes.status, readErrorMessage(fallbackRes)).toBe(200);
    const fallbackTemplateUid = readPopupTemplateUidForFieldPath(getData(fallbackRes).surface.tree, 'label');
    expect(fallbackTemplateUid).toBeTruthy();
    expect(fallbackTemplateUid).not.toBe(detailsTemplateUid);
    expect(fallbackTemplateUid).not.toBe(tableTemplateUid);
    const afterFallbackTemplateUids = await listPopupTemplateUids(context.db);
    expect(afterFallbackTemplateUids).toEqual(
      expect.arrayContaining([...afterSourceTemplateUids, fallbackTemplateUid]),
    );
    expect(afterFallbackTemplateUids.length).toBe(afterSourceTemplateUids.length + 1);
    const fallbackTemplateSurface = await readPopupTemplateSurface(rootAgent, flowRepo, fallbackTemplateUid);
    expect(collectDescendantNodes(fallbackTemplateSurface, (item) => item?.use === 'CreateFormModel')).not.toEqual([]);
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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

  it('should auto-complete the tree table title click popup with a default details block', async () => {
    const unique = `${Date.now()}_${_.uniqueId()}`;
    const collectionName = `authoring_tree_title_popup_${unique}`;
    const applyCollectionRes = await rootAgent.resource('collections').apply({
      values: {
        name: collectionName,
        title: 'Authoring tree title popup',
        template: 'tree',
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
        ],
      },
    });
    expect(applyCollectionRes.status, readErrorMessage(applyCollectionRes)).toBe(200);
    await waitForFixtureCollectionsReady(context.db, {
      [collectionName]: ['title', 'code', 'parentId'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Authoring tree title popup ${unique}`,
          },
        },
        page: {
          title: 'Authoring tree title popup',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'treeTitlePopupTable',
                type: 'table',
                collection: collectionName,
                fields: ['title'],
                settings: {
                  treeTable: true,
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
    const titleField = collectDescendantNodes(
      persistedTable,
      (item) => item?.use === 'DisplayTextFieldModel' && item?.stepParams?.fieldSettings?.init?.fieldPath === 'title',
    )[0];
    expect(titleField?.props?.clickToOpen).toBe(true);

    const popupSurface = await readPopupSurfaceForHost(rootAgent, flowRepo, titleField);
    const detailsBlock = collectDescendantNodes(popupSurface, (item) => item?.use === 'DetailsBlockModel')[0];
    expect(detailsBlock?.uid).toBeTruthy();
    expect(readDetailsFieldPaths(detailsBlock)).toEqual(expect.arrayContaining(['title']));
  });

  it('should preserve explicit tree table field priority without injecting title or name', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring tree table explicit field priority',
          },
        },
        page: {
          title: 'Authoring tree table explicit field priority',
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
                fields: ['parentId', 'title'],
                settings: {
                  treeTable: true,
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
    const fieldPaths = readTableColumnFieldPaths(persistedTable);
    expect(fieldPaths.slice(0, 2)).toEqual(['title', 'parentId']);
    expect(fieldPaths).not.toContain('name');
  });

  it('should accept explicit tree table fields with a direct interface even when they are not titleable', async () => {
    const collectionName = `authoring_tree_interface_${_.uniqueId()}`;
    const applyCollectionRes = await rootAgent.resource('collections').apply({
      values: {
        name: collectionName,
        title: 'Authoring tree interface fields',
        template: 'tree',
        fields: [{ name: 'active', type: 'boolean', interface: 'checkbox', titleable: false }],
      },
    });
    expect(applyCollectionRes.status, readErrorMessage(applyCollectionRes)).toBe(200);
    await waitForFixtureCollectionsReady(context.db, {
      [collectionName]: ['active', 'parentId'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring tree table interface field priority',
          },
        },
        page: {
          title: 'Authoring tree table interface field priority',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'treeInterfaceTable',
                type: 'table',
                collection: collectionName,
                fields: ['active'],
                settings: {
                  treeTable: true,
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
    expect(readTableColumnFieldPaths(persistedTable)).toEqual(['active']);
  });

  it('should reject explicit tree table fields with no readable first-column candidate', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring tree table unreadable explicit fields',
          },
        },
        page: {
          title: 'Authoring tree table unreadable explicit fields',
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
                fields: ['parentId'],
                settings: {
                  treeTable: true,
                },
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(readErrorMessage(response)).toContain('explicit fields must include at least one direct readable');

    const emptyResponse = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring tree table empty explicit fields',
          },
        },
        page: {
          title: 'Authoring tree table empty explicit fields',
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
                fields: [],
                settings: {
                  treeTable: true,
                },
              },
            ],
          },
        ],
      },
    });

    expect(emptyResponse.status).toBe(400);
    expect(emptyResponse.body?.errors?.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['data-block-visible-fields-required', 'tree-table-explicit-fields-readable-required']),
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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

  it('should require a group icon when the only same-title group is under a different parent', async () => {
    const parent = await createMenu(rootAgent, {
      title: `Authoring nested parent ${Date.now()}`,
      type: 'group',
    });
    const nestedGroupTitle = `Authoring nested duplicate title ${Date.now()}`;
    await createMenu(rootAgent, {
      title: nestedGroupTitle,
      type: 'group',
      parentMenuRouteId: parent.routeId,
    });

    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            title: nestedGroupTitle,
          },
          item: {
            title: 'Authoring nested duplicate title item',
          },
        },
        page: {
          title: 'Authoring nested duplicate title item',
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors?.[0]).toMatchObject({
      ruleId: 'navigation-icon-required',
      path: '$.navigation.group.icon',
    });
  });

  it('should create a root group instead of reusing a same-title group from another parent', async () => {
    const parent = await createMenu(rootAgent, {
      title: `Authoring scoped parent ${Date.now()}`,
      type: 'group',
    });
    const groupTitle = `Authoring scoped group ${Date.now()}`;
    const nestedGroup = await createMenu(rootAgent, {
      title: groupTitle,
      type: 'group',
      parentMenuRouteId: parent.routeId,
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          group: {
            title: groupTitle,
            icon: 'FolderOpenOutlined',
          },
          item: {
            title: 'Authoring scoped group item',
          },
        },
        page: {
          title: 'Authoring scoped group item',
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    expect(data.surface.pageRoute.parentId).not.toBe(nestedGroup.routeId);
    const matchedGroups = await routesRepo.find({
      filter: {
        type: 'group',
        title: groupTitle,
      },
    });
    expect(_.castArray(matchedGroups).filter((route: any) => _.isNil(route.get('parentId')))).toHaveLength(1);
  });

  it('should validate the effective create-mode page icon fallback for the navigation item', async () => {
    const invalidFallbackRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring invalid page icon fallback',
          },
        },
        page: {
          title: 'Authoring invalid page icon fallback',
          icon: 'NotARealAntDesignIcon',
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
              },
            ],
          },
        ],
      },
    });

    expect(invalidFallbackRes.status).toBe(400);
    expect(invalidFallbackRes.body?.errors?.[0]).toMatchObject({
      ruleId: 'navigation-icon-unknown',
      path: '$.page.icon',
    });

    const explicitItemIconRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring explicit item icon still validates page icon',
            icon: 'FileOutlined',
          },
        },
        page: {
          title: 'Authoring explicit item icon still validates page icon',
          icon: 'NotARealAntDesignIcon',
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
              },
            ],
          },
        ],
      },
    });

    expect(explicitItemIconRes.status).toBe(400);
    expect(explicitItemIconRes.body?.errors?.[0]).toMatchObject({
      ruleId: 'navigation-icon-unknown',
      path: '$.page.icon',
    });
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
              },
            ],
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(readErrorMessage(response)).toContain('already has 2 flow pages titled');
  });

  it('should reject raw details blocks without visible fields before generating fieldGroups', async () => {
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

    expect(executeRes.status).toBe(400);
    const visibleFieldError = executeRes.body?.errors?.find(
      (error: any) => error.ruleId === 'data-block-visible-fields-required',
    );
    expect(visibleFieldError).toMatchObject({
      path: '$.tabs[0].blocks[0].fields',
      details: {
        blockType: 'details',
        collection: 'employees',
      },
    });
    expect(visibleFieldError.message).toContain('Add collection field names');
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
                fields: EMPLOYEE_VISIBLE_FIELDS,
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
                          fields: EMPLOYEE_VISIBLE_FIELDS,
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
                fields: LARGE_DEFAULTS_ACTION_VISIBLE_FIELDS,
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
                          fields: EMPLOYEE_VISIBLE_FIELDS,
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

  it('should auto-complete default click popups for ordinary display fields', async () => {
    const unique = `${Date.now()}_${_.uniqueId()}`;
    const collection = `authoring_plain_field_popup_${unique}`;
    await createAuthoringPopupReuseCollection(rootAgent, context.db, collection);

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Authoring plain field popup ${unique}`,
          },
        },
        page: {
          title: 'Authoring plain field popup',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'plainFieldDetails',
                type: 'details',
                collection,
                fields: [
                  {
                    field: 'name',
                    popup: {
                      tryTemplate: true,
                      defaultType: 'view',
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
    const nameField = collectDescendantNodes(
      data.surface.tree,
      (item) => item?.use === 'DisplayTextFieldModel' && item?.stepParams?.fieldSettings?.init?.fieldPath === 'name',
    )[0];
    const persistedNameField = await flowRepo.findModelById(nameField.uid, { includeAsyncNode: true });
    expect(persistedNameField?.props?.clickToOpen).toBe(true);

    const popupSurface = await readPopupSurfaceForHost(rootAgent, flowRepo, persistedNameField);
    const detailsBlock = collectDescendantNodes(popupSurface, (item) => item?.use === 'DetailsBlockModel')[0];
    expect(detailsBlock?.uid).toBeTruthy();
    expect(readDetailsFieldPaths(detailsBlock)).toEqual(expect.arrayContaining(['name']));
  });

  it('should persist multi-hop relation field popups with the leaf association context like manual fields', async () => {
    const { sourceCollection, middleCollection, targetCollection, leafAssociationName } =
      await createAuthoringMultiHopRelationFixture();
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: `Authoring multi-hop relation field popup ${_.uniqueId()}`,
          },
        },
        page: {
          title: 'Authoring multi-hop relation field popup',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'sourceTable',
                type: 'table',
                collection: sourceCollection,
                fields: [
                  'name',
                  {
                    field: 'middle.target.name',
                    popup: {
                      tryTemplate: true,
                      defaultType: 'view',
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
    const targetNameField = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.use === 'DisplayTextFieldModel' &&
        item?.stepParams?.fieldSettings?.init?.fieldPath === 'middle.target.name',
    )[0];
    expect(targetNameField?.uid).toBeTruthy();
    expect(targetNameField?.stepParams?.fieldSettings?.init).toMatchObject({
      collectionName: sourceCollection,
      fieldPath: 'middle.target.name',
      associationPathName: 'middle.target',
    });

    const persistedTargetNameField = await flowRepo.findModelById(targetNameField.uid, { includeAsyncNode: true });
    const openView = readPopupOpenView(persistedTargetNameField);
    expect(openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: targetCollection,
      associationName: leafAssociationName,
    });
    expect(openView).not.toHaveProperty('sourceId');

    const popupTemplateUid = readPopupTemplateUid(persistedTargetNameField);
    const template = getData(
      await rootAgent.resource('flowSurfaces').getTemplate({
        values: {
          uid: popupTemplateUid,
        },
      }),
    );
    expect(template).toMatchObject({
      collectionName: targetCollection,
      associationName: leafAssociationName,
    });
    expect(template.sourceId || undefined).toBeUndefined();

    const popupSurface = await readPopupSurfaceForHost(rootAgent, flowRepo, persistedTargetNameField);
    const detailsBlock = collectDescendantNodes(popupSurface, (item) => item?.use === 'DetailsBlockModel')[0];
    expect(detailsBlock?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: targetCollection,
    });
    expect(openView.associationName).toBe(`${middleCollection}.target`);
  });

  it('should reject raw createForm blocks without visible fields before generating fieldGroups', async () => {
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

    expect(executeRes.status).toBe(400);
    const visibleFieldError = executeRes.body?.errors?.find(
      (error: any) => error.ruleId === 'data-block-visible-fields-required',
    );
    expect(visibleFieldError).toMatchObject({
      path: '$.tabs[0].blocks[0].fields',
      details: {
        blockType: 'createForm',
        collection: 'employees',
      },
    });
    expect(visibleFieldError.message).toContain('Add collection field names');
  });

  it('should preserve wide field rows when explicit fields use live richText metadata', async () => {
    const collectionName = `flow_surface_authoring_wide_${_.uniqueId()}`;
    await rootAgent.resource('collections').create({
      values: {
        name: collectionName,
        title: collectionName,
        fields: [
          { name: 'title', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'input' },
          { name: 'body', type: 'text', interface: 'richText' },
          { name: 'summary', type: 'string', interface: 'input' },
        ],
      },
    });
    await waitForFixtureCollectionsReady(context.db, {
      [collectionName]: ['title', 'status', 'body', 'summary'],
    });

    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring generated wide field groups',
          },
        },
        page: {
          title: 'Authoring generated wide field groups',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'wideCreateForm',
                type: 'createForm',
                collection: collectionName,
                fields: ['title', 'status', 'body', 'summary'],
              },
            ],
          },
        ],
      },
    });

    expect(executeRes.status, readErrorMessage(executeRes)).toBe(200);
    const data = getData(executeRes);
    const createFormBlock = collectDescendantNodes(data.surface.tree, (item) => item?.use === 'CreateFormModel')[0];
    const grid = createFormBlock?.subModels?.grid;
    const items = _.castArray(grid?.subModels?.items || []);
    const titleWrapper = items.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'title')?.uid;
    const statusWrapper = items.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'status')?.uid;
    const bodyWrapper = items.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'body')?.uid;
    const summaryWrapper = items.find((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'summary')
      ?.uid;

    expect(grid?.props?.rows).toEqual({
      row1: [[titleWrapper], [statusWrapper]],
      row2: [[bodyWrapper]],
      row3: [[summaryWrapper]],
    });
    expect(grid?.props?.sizes).toEqual({
      row1: [12, 12],
      row2: [24],
      row3: [24],
    });
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

  it('should resolve associatedRecords inside relation field popup from the popup target collection', async () => {
    const { sourceCollection, targetCollection, targetAssociationName } = await createAuthoringRelationFixture();
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring relation popup target associatedRecords',
          },
        },
        page: {
          title: 'Authoring relation popup target associatedRecords',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'usersTable',
                type: 'table',
                collection: sourceCollection,
                fields: [
                  ...USER_VISIBLE_FIELDS,
                  {
                    field: 'roles',
                    popup: {
                      tryTemplate: false,
                      blocks: [
                        {
                          key: 'roleUsersTable',
                          type: 'table',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'users',
                          },
                          fields: USER_VISIBLE_FIELDS,
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
    const rolesField = collectDescendantNodes(
      data.surface.tree,
      (item) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'roles',
    )[0];
    const popupHost = findPopupHostNode(rolesField);
    const persistedRolesField = await flowRepo.findModelById(popupHost.uid, { includeAsyncNode: true });
    const popupTemplateUid =
      readPopupTemplateUid(persistedRolesField) || readPopupTemplateUid(popupHost) || readPopupTemplateUid(rolesField);
    const templateSurface = await readPopupTemplateSurface(rootAgent, flowRepo, popupTemplateUid);
    const roleUsersTable = collectDescendantNodes(
      templateSurface,
      (item) =>
        item?.use === 'TableBlockModel' &&
        item?.stepParams?.resourceSettings?.init?.collectionName === sourceCollection,
    )[0];
    expect(roleUsersTable?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: sourceCollection,
      associationName: targetAssociationName,
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
    });
  });

  it('should compile auto-saved record action popup currentRecord from popup input args', async () => {
    const { sourceCollection, targetCollection, sourceAssociationName } = await createAuthoringRelationFixture();
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring auto-saved record action popup current record',
          },
        },
        page: {
          title: 'Authoring auto-saved record action popup current record',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'usersTable',
                type: 'table',
                collection: sourceCollection,
                fields: USER_VISIBLE_FIELDS,
                recordActions: [
                  {
                    key: 'maintainUser',
                    type: 'view',
                    title: 'Maintain user',
                    popup: {
                      blocks: [
                        {
                          key: 'userDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: USER_VISIBLE_FIELDS,
                        },
                        {
                          key: 'userRoles',
                          type: 'table',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'roles',
                          },
                          fields: ROLE_VISIBLE_FIELDS,
                          recordActions: ['view'],
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
    const viewAction = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.use === 'ViewActionModel' &&
        (item?.props?.title === 'Maintain user' ||
          item?.stepParams?.buttonSettings?.general?.title === 'Maintain user'),
    )[0];
    const persistedAction = await flowRepo.findModelById(viewAction.uid, { includeAsyncNode: true });
    expect(readPopupOpenView(persistedAction)).toMatchObject({
      collectionName: sourceCollection,
    });
    expect(readPopupTemplateUid(persistedAction)).toBeTruthy();

    const popupSurface = await readPopupSurfaceForHost(rootAgent, flowRepo, persistedAction);
    const userDetails = collectDescendantNodes(
      popupSurface,
      (item) =>
        item?.use === 'DetailsBlockModel' &&
        item?.stepParams?.resourceSettings?.init?.collectionName === sourceCollection,
    )[0];
    expect(userDetails?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: sourceCollection,
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });

    const roleTable = collectDescendantNodes(
      popupSurface,
      (item) =>
        item?.use === 'TableBlockModel' &&
        item?.stepParams?.resourceSettings?.init?.collectionName === targetCollection,
    )[0];
    expect(roleTable?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: targetCollection,
      associationName: sourceAssociationName,
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
    });
  });

  it('should validate nested associatedRecords blocks against the current popup collection', async () => {
    const { sourceCollection, targetCollection, sourceAssociationName } = await createAuthoringRelationFixture();
    const executeRes = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        mode: 'create',
        navigation: {
          item: {
            title: 'Authoring nested associatedRecords source context',
          },
        },
        page: {
          title: 'Authoring nested associatedRecords source context',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'usersTable',
                type: 'table',
                collection: sourceCollection,
                fields: [...USER_VISIBLE_FIELDS, 'roles'],
                recordActions: [
                  {
                    key: 'maintainUser',
                    title: 'Maintain user',
                    type: 'view',
                    popup: {
                      tryTemplate: false,
                      saveAsTemplate: {
                        name: 'Authoring nested associatedRecords popup',
                        description: 'Popup template saved for nested associatedRecords source context.',
                      },
                      blocks: [
                        {
                          key: 'userDetails',
                          type: 'details',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: [...USER_VISIBLE_FIELDS, 'roles'],
                        },
                        {
                          key: 'userEditForm',
                          type: 'editForm',
                          resource: {
                            binding: 'currentRecord',
                          },
                          fields: ['username', 'roles'],
                        },
                        {
                          key: 'userRolesTable',
                          type: 'table',
                          resource: {
                            binding: 'associatedRecords',
                            associationField: 'roles',
                          },
                          fields: ROLE_VISIBLE_FIELDS,
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
    const viewAction = collectDescendantNodes(
      data.surface.tree,
      (item) =>
        item?.use === 'ViewActionModel' &&
        (item?.props?.title === 'Maintain user' ||
          item?.stepParams?.buttonSettings?.general?.title === 'Maintain user'),
    )[0];
    const persistedAction = await flowRepo.findModelById(viewAction.uid, { includeAsyncNode: true });
    const templateSurface = await readPopupTemplateSurface(
      rootAgent,
      flowRepo,
      persistedAction?.stepParams?.popupSettings?.openView?.popupTemplateUid,
    );
    const userDetails = collectDescendantNodes(
      templateSurface,
      (item) =>
        item?.use === 'DetailsBlockModel' &&
        item?.stepParams?.resourceSettings?.init?.collectionName === sourceCollection,
    )[0];
    expect(userDetails?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: sourceCollection,
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });
    const userEditForm = collectDescendantNodes(
      templateSurface,
      (item) =>
        item?.use === 'EditFormModel' && item?.stepParams?.resourceSettings?.init?.collectionName === sourceCollection,
    )[0];
    expect(userEditForm?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: sourceCollection,
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    });
    const roleTable = collectDescendantNodes(
      templateSurface,
      (item) =>
        item?.use === 'TableBlockModel' &&
        item?.stepParams?.resourceSettings?.init?.collectionName === targetCollection,
    )[0];
    expect(roleTable?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: targetCollection,
      associationName: sourceAssociationName,
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
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

function readTableColumnFieldPaths(node: any) {
  return _.castArray(node?.subModels?.columns || [])
    .filter((column: any) => column?.use === 'TableColumnModel')
    .map((column: any) => column?.stepParams?.fieldSettings?.init?.fieldPath)
    .filter(Boolean);
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

async function readPopupSurfaceForHost(rootAgent: any, flowRepo: any, hostNode: any) {
  const persistedHost = hostNode?.uid
    ? await flowRepo.findModelById(hostNode.uid, { includeAsyncNode: true })
    : hostNode;
  const templateUid = readPopupTemplateUid(persistedHost) || readPopupTemplateUid(hostNode);
  if (templateUid) {
    return readPopupTemplateSurface(rootAgent, flowRepo, templateUid);
  }
  return persistedHost;
}

function readDetailsFieldPaths(detailsBlock: any) {
  return _.castArray(detailsBlock?.subModels?.grid?.subModels?.items || [])
    .map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath)
    .filter(Boolean);
}

async function createAuthoringPopupReuseCollection(rootAgent: any, db: any, name: string) {
  await rootAgent.resource('collections').create({
    values: {
      name,
      title: name,
      fields: [
        { name: 'name', type: 'string', interface: 'input' },
        { name: 'code', type: 'string', interface: 'input' },
        { name: 'label', type: 'string', interface: 'input' },
      ],
    },
  });
  await waitForFixtureCollectionsReady(db, {
    [name]: ['name', 'code', 'label'],
  });
}

async function listPopupTemplateUids(db: any) {
  const rows = await db.getRepository('flowModelTemplates').find({
    filter: {
      type: 'popup',
    },
  });
  return _.castArray(rows || [])
    .map((row: any) => String(row?.uid ?? row?.get?.('uid') ?? '').trim())
    .filter(Boolean)
    .sort();
}

async function findPopupTemplateByName(db: any, name: string) {
  const rows = await db.getRepository('flowModelTemplates').find({
    filter: {
      type: 'popup',
      name,
    },
  });
  return _.castArray(rows || [])
    .map((row: any) => row?.toJSON?.() || row)
    .find((row: any) => row?.name === name);
}

async function expectPopupTemplateUsage(rootAgent: any, templateUid: string, usageCount: number) {
  const template = getData(
    await rootAgent.resource('flowSurfaces').getTemplate({
      values: {
        uid: templateUid,
      },
    }),
  );
  expect(template.usageCount).toBe(usageCount);
}

function readPopupTemplateUidForFieldPath(tree: any, fieldPath: string) {
  const field = collectDescendantNodes(
    tree,
    (item) => item?.stepParams?.fieldSettings?.init?.fieldPath === fieldPath && !!readPopupTemplateUid(item),
  )[0];
  return readPopupTemplateUid(field);
}

function readAuthoringReuseFieldPopupTemplateUid(tree: any) {
  const field = collectDescendantNodes(
    tree,
    (item) =>
      item?.use === 'DisplayTextFieldModel' &&
      item?.stepParams?.fieldSettings?.init?.fieldPath === 'name' &&
      !!readPopupTemplateUid(item),
  )[0];
  return readPopupTemplateUid(field);
}

function readAuthoringReuseActionPopupTemplateUid(tree: any) {
  const action = collectDescendantNodes(
    tree,
    (item) => item?.use === 'ViewActionModel' && item?.props?.title === 'Inspect' && !!readPopupTemplateUid(item),
  )[0];
  return readPopupTemplateUid(action);
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
