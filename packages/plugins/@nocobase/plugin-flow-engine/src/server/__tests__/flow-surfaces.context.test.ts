/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { uid } from '@nocobase/utils';
import { MockServer } from '@nocobase/test';
import FlowModelRepository from '../repository';
import { isBareFlowContextPath } from '../flow-surfaces/context';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';

describe('flowSurfaces context', () => {
  let app: MockServer;
  let db: Database;
  let flowRepo: FlowModelRepository;
  let rootAgent: any;

  beforeAll(async () => {
    app = await createFlowSurfacesMockServer();
    db = app.db;
    flowRepo = db.getCollection('flowModels').repository as FlowModelRepository;
    rootAgent = await loginFlowSurfacesRootAgent(app);
    await setupFixtureCollections(rootAgent, db);
  }, 120000);

  beforeEach(async () => {
    rootAgent = await loginFlowSurfacesRootAgent(app);
  });

  afterAll(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should accept dashed bare flow context paths', () => {
    expect(isBareFlowContextPath('formValues.oho-test.o2m-users')).toBe(true);
    expect(isBareFlowContextPath('item.parentItem.value')).toBe(true);
  });

  it('should return root vars, support path pruning and reject non-bare paths', async () => {
    const page = await createPage(rootAgent, {
      title: 'Context details page',
      tabTitle: 'Context details tab',
    });
    const detailsBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'details',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );

    const rootRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: detailsBlock.uid },
        maxDepth: 3,
      },
    });
    expect(rootRes.status).toBe(200);
    const rootData = getData(rootRes);
    expect(rootData.vars.record.properties.nickname).toBeTruthy();
    expect(rootData.vars.record.properties.department.properties.title).toBeTruthy();

    const pathRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: detailsBlock.uid },
        path: 'record',
        maxDepth: 2,
      },
    });
    expect(pathRes.status).toBe(200);
    const pathData = getData(pathRes);
    expect(pathData.vars.record.properties.nickname).toBeTruthy();
    expect(pathData.vars.record.properties.department).toBeTruthy();
    expect(pathData.vars.record.properties.department.properties).toBeUndefined();

    const deepPathRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: detailsBlock.uid },
        path: 'record.department',
        maxDepth: 2,
      },
    });
    expect(deepPathRes.status).toBe(200);
    const deepPathData = getData(deepPathRes);
    expect(deepPathData.vars['record.department'].properties.title).toBeTruthy();

    for (const invalidPath of ['ctx.record', '{{ ctx.record }}']) {
      const invalidRes = await rootAgent.resource('flowSurfaces').context({
        values: {
          target: { uid: detailsBlock.uid },
          path: invalidPath,
        },
      });
      expect(invalidRes.status).toBe(400);
      expect(readErrorMessage(invalidRes)).toContain('bare paths');
    }
  });

  it('should not expose record on collection-backed table without explicit record meta', async () => {
    const page = await createPage(rootAgent, {
      title: 'Context table page',
      tabTitle: 'Context table tab',
    });
    const tableBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'table',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );

    const tableContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: tableBlock.uid },
        maxDepth: 3,
      },
    });
    expect(tableContextRes.status).toBe(200);
    const tableContext = getData(tableContextRes);
    expect(tableContext.vars.record).toBeUndefined();
  });

  it('should expose builder chart collection context but hide it for sql charts', async () => {
    const page = await createPage(rootAgent, {
      title: 'Context chart page',
      tabTitle: 'Context chart tab',
    });
    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'chart',
        },
      }),
    );

    const configureBuilderRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
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
            dimensions: [{ field: 'department.title' }],
          },
          visual: {
            type: 'bar',
            mappings: {
              x: 'department.title',
              y: 'employeeCount',
            },
          },
        },
      },
    });
    expect(configureBuilderRes.status).toBe(200);

    const builderContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: chartBlock.uid },
        path: 'collection',
        maxDepth: 3,
      },
    });
    expect(builderContextRes.status).toBe(200);
    const builderContext = getData(builderContextRes);
    expect(builderContext.vars.collection.properties.nickname).toBeTruthy();
    expect(builderContext.vars.collection.properties.department.properties.title).toBeTruthy();

    const chartContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: chartBlock.uid },
        path: 'chart',
        maxDepth: 4,
      },
    });
    expect(chartContextRes.status).toBe(200);
    const chartContext = getData(chartContextRes);
    expect(chartContext.vars.chart.properties.queryOutputs.properties.employeeCount.type).toBe('number');
    expect(chartContext.vars.chart.properties.queryOutputs.properties['department.title'].type).toBe('string');
    expect(chartContext.vars.chart.properties.aliases.properties.employeeCount).toBeTruthy();
    expect(chartContext.vars.chart.properties.supportedVisualTypes.properties.bar).toBeTruthy();

    const configureSqlRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
          query: {
            mode: 'sql',
            sql: 'select 1 as total',
            sqlDatasource: 'main',
          },
        },
      },
    });
    expect(configureSqlRes.status).toBe(200);

    const sqlContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: chartBlock.uid },
        path: 'collection',
        maxDepth: 3,
      },
    });
    expect(sqlContextRes.status).toBe(200);
    expect(getData(sqlContextRes).vars.collection).toBeUndefined();

    const sqlChartContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: chartBlock.uid },
        path: 'chart',
        maxDepth: 4,
      },
    });
    expect(sqlChartContextRes.status).toBe(200);
    const sqlChartContext = getData(sqlChartContextRes);
    expect(sqlChartContext.vars.chart.properties.queryOutputs.properties.total.type).toBe('number');
    expect(sqlChartContext.vars.chart.properties.aliases).toBeUndefined();

    const configureRiskySqlRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
          query: {
            mode: 'sql',
            sql: "select '{{ ctx.user.id }}' as viewer_id, count(*) as total_count from employees",
            sqlDatasource: 'main',
          },
        },
      },
    });
    expect(configureRiskySqlRes.status).toBe(200);

    const riskySqlChartContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: chartBlock.uid },
        path: 'chart',
        maxDepth: 4,
      },
    });
    expect(riskySqlChartContextRes.status).toBe(200);
    const riskySqlChartContext = getData(riskySqlChartContextRes);
    expect(riskySqlChartContext.vars.chart.properties.queryOutputs).toBeUndefined();
    expect(riskySqlChartContext.vars.chart.properties.riskyPatterns.properties.sql_runtime_context).toBeTruthy();
  });

  it('should expose formValues on edit form, keep record hidden there, and expose item chain on nested association surfaces', async () => {
    const page = await createPage(rootAgent, {
      title: 'Context form page',
      tabTitle: 'Context form tab',
    });
    const editFormBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'editForm',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );

    const formContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: editFormBlock.uid },
        maxDepth: 3,
      },
    });
    expect(formContextRes.status).toBe(200);
    const formContext = getData(formContextRes);
    expect(formContext.vars.record).toBeUndefined();
    expect(formContext.vars.formValues.properties.nickname).toBeTruthy();
    expect(formContext.vars.formValues.properties.department.properties.title).toBeTruthy();

    const formGrid = await flowRepo.findModelByParentId(editFormBlock.uid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    const subFormUid = uid();
    await flowRepo.upsertModel({
      uid: subFormUid,
      parentId: formGrid.uid,
      subKey: 'items',
      subType: 'array',
      use: 'SubFormFieldModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'employees',
            fieldPath: 'tasks',
          },
        },
      },
    });

    const itemContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: subFormUid },
        maxDepth: 5,
      },
    });
    expect(itemContextRes.status).toBe(200);
    const itemContext = getData(itemContextRes);
    expect(itemContext.vars.item.properties.index).toBeTruthy();
    expect(itemContext.vars.item.properties.value.properties.title).toBeTruthy();
    expect(itemContext.vars.item.properties.parentItem.properties.value.properties.nickname).toBeTruthy();

    const itemPathRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: subFormUid },
        path: 'item.parentItem.value',
        maxDepth: 2,
      },
    });
    expect(itemPathRes.status).toBe(200);
    const itemPathData = getData(itemPathRes);
    expect(itemPathData.vars['item.parentItem.value'].properties.nickname).toBeTruthy();
    expect(itemPathData.vars['item.parentItem.value'].properties.department.properties).toBeUndefined();
  });

  it('should fall back to record as item.parentItem root when the host has no formValues', async () => {
    const page = await createPage(rootAgent, {
      title: 'Context record fallback page',
      tabTitle: 'Context record fallback tab',
    });
    const detailsBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'details',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );

    const detailsGrid = await flowRepo.findModelByParentId(detailsBlock.uid, {
      subKey: 'grid',
      includeAsyncNode: true,
    });
    const recordPickerUid = uid();
    await flowRepo.upsertModel({
      uid: recordPickerUid,
      parentId: detailsGrid.uid,
      subKey: 'items',
      subType: 'array',
      use: 'RecordPickerFieldModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'employees',
            fieldPath: 'tasks',
          },
        },
      },
    });

    const itemContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: recordPickerUid },
        maxDepth: 5,
      },
    });
    expect(itemContextRes.status).toBe(200);
    const itemContext = getData(itemContextRes);
    expect(itemContext.vars.item.properties.value.properties.title).toBeTruthy();
    expect(itemContext.vars.item.properties.parentItem.properties.value.properties.nickname).toBeTruthy();
  });

  it('should expose popup record, sourceRecord and parent popup record for nested popup trees', async () => {
    const page = await createPage(rootAgent, {
      title: 'Context popup page',
      tabTitle: 'Context popup tab',
    });
    const tabGrid = await flowRepo.findModelById(page.gridUid, {
      includeAsyncNode: true,
    });

    const outerHostUid = uid();
    const outerPopupPageUid = uid();
    const outerPopupTabUid = uid();
    const outerPopupGridUid = uid();
    const innerHostUid = uid();
    const innerPopupPageUid = uid();
    const innerPopupTabUid = uid();
    const innerPopupGridUid = uid();

    await flowRepo.upsertModel({
      uid: outerHostUid,
      parentId: tabGrid.uid,
      subKey: 'items',
      subType: 'array',
      use: 'ViewActionModel',
      stepParams: {
        popupSettings: {
          openView: {
            dataSourceKey: 'main',
            collectionName: 'employees',
            associationName: 'employees.tasks',
            sourceId: 1,
            mode: 'drawer',
          },
        },
      },
    });
    await flowRepo.upsertModel({
      uid: outerPopupPageUid,
      parentId: outerHostUid,
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
    });
    await flowRepo.upsertModel({
      uid: outerPopupTabUid,
      parentId: outerPopupPageUid,
      subKey: 'tabs',
      subType: 'array',
      use: 'ChildPageTabModel',
    });
    await flowRepo.upsertModel({
      uid: outerPopupGridUid,
      parentId: outerPopupTabUid,
      subKey: 'grid',
      subType: 'object',
      use: 'BlockGridModel',
    });

    await flowRepo.upsertModel({
      uid: innerHostUid,
      parentId: outerPopupGridUid,
      subKey: 'items',
      subType: 'array',
      use: 'ViewActionModel',
      stepParams: {
        popupSettings: {
          openView: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
            associationName: 'employees.tasks',
            filterByTk: 11,
            sourceId: 1,
            mode: 'dialog',
          },
        },
      },
    });
    await flowRepo.upsertModel({
      uid: innerPopupPageUid,
      parentId: innerHostUid,
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
    });
    await flowRepo.upsertModel({
      uid: innerPopupTabUid,
      parentId: innerPopupPageUid,
      subKey: 'tabs',
      subType: 'array',
      use: 'ChildPageTabModel',
    });
    await flowRepo.upsertModel({
      uid: innerPopupGridUid,
      parentId: innerPopupTabUid,
      subKey: 'grid',
      subType: 'object',
      use: 'BlockGridModel',
    });

    const outerPopupContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: outerPopupGridUid },
        maxDepth: 5,
      },
    });
    expect(outerPopupContextRes.status).toBe(200);
    const outerPopupContext = getData(outerPopupContextRes);
    expect(outerPopupContext.vars.popup.properties.record).toBeUndefined();
    expect(outerPopupContext.vars.popup.properties.sourceRecord.properties.nickname).toBeTruthy();

    const popupContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: innerPopupGridUid },
        maxDepth: 5,
      },
    });
    expect(popupContextRes.status).toBe(200);
    const popupContext = getData(popupContextRes);
    expect(popupContext.vars.popup.properties.uid).toBeTruthy();
    expect(popupContext.vars.popup.properties.record.properties.title).toBeTruthy();
    expect(popupContext.vars.popup.properties.sourceRecord.properties.nickname).toBeTruthy();
    expect(popupContext.vars.popup.properties.parent.properties.record.properties.nickname).toBeTruthy();
    expect(popupContext.vars.popup.properties.parent.properties.sourceRecord).toBeUndefined();
    expect(popupContext.vars.popup.properties.parent.properties.parent).toBeUndefined();

    const popupPathRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: innerPopupGridUid },
        path: 'popup.parent.record',
        maxDepth: 3,
      },
    });
    expect(popupPathRes.status).toBe(200);
    const popupPath = getData(popupPathRes);
    expect(popupPath.vars['popup.parent.record'].properties.nickname).toBeTruthy();

    const popupParentParentRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: innerPopupGridUid },
        path: 'popup.parent.parent.record',
        maxDepth: 3,
      },
    });
    expect(popupParentParentRes.status).toBe(200);
    const popupParentParent = getData(popupParentParentRes);
    expect(popupParentParent.vars).toEqual({});
  });

  it('should mark supportsFlowContext only on confirmed configure options in catalog output', async () => {
    const page = await createPage(rootAgent, {
      title: 'Context catalog page',
      tabTitle: 'Context catalog tab',
    });
    const catalogExpand = ['item.configureOptions'];

    const pageCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: { uid: page.pageUid },
        },
      }),
    );
    expect(pageCatalog.node.configureOptions.documentTitle.supportsFlowContext).toBe(true);
    expect(pageCatalog.node.configureOptions.title.supportsFlowContext).toBeUndefined();

    const tabCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: { uid: page.gridUid },
          expand: catalogExpand,
        },
      }),
    );
    const detailsCatalogItem = tabCatalog.blocks.find((item: any) => item.key === 'details');
    expect(detailsCatalogItem).toBeTruthy();
    expect(detailsCatalogItem.configureOptions.dataScope.supportsFlowContext).toBe(true);
    expect(detailsCatalogItem.configureOptions.title.supportsFlowContext).toBeUndefined();

    const editFormBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'editForm',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );
    const formCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: { uid: editFormBlock.uid },
        },
      }),
    );
    expect(formCatalog.node.configureOptions.assignRules.supportsFlowContext).toBe(true);
    expect(formCatalog.node.configureOptions.resource.supportsFlowContext).toBeUndefined();
  });
});

function getData(response: any) {
  return response?.body?.data || response?.data || response;
}

function readErrorMessage(response: any) {
  return response?.body?.errors?.[0]?.message || response?.body?.message || response?.message || '';
}

async function createPage(rootAgent: any, values: Record<string, any>) {
  const response = await rootAgent.resource('flowSurfaces').createPage({ values });
  expect(response.status).toBe(200);
  return getData(response);
}

async function setupFixtureCollections(rootAgent: any, db: Database) {
  await rootAgent.resource('collections').create({
    values: {
      name: 'departments',
      title: 'Departments',
      fields: [
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'location', type: 'string', interface: 'input' },
      ],
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'employees',
      title: 'Employees',
      fields: [
        { name: 'nickname', type: 'string', interface: 'input' },
        { name: 'status', type: 'string', interface: 'input' },
      ],
    },
  });

  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'department',
      type: 'belongsTo',
      target: 'departments',
      foreignKey: 'departmentId',
      interface: 'm2o',
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'tasks',
      title: 'Tasks',
      fields: [
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'status', type: 'string', interface: 'input' },
      ],
    },
  });

  await rootAgent.resource('collections.fields', 'tasks').create({
    values: {
      name: 'employee',
      type: 'belongsTo',
      target: 'employees',
      foreignKey: 'employeeId',
      interface: 'm2o',
    },
  });

  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'tasks',
      type: 'hasMany',
      target: 'tasks',
      foreignKey: 'employeeId',
      interface: 'o2m',
    },
  });

  await waitForFixtureCollectionsReady(db, {
    departments: ['title', 'location'],
    employees: ['nickname', 'status', 'departmentId'],
    tasks: ['title', 'status', 'employeeId'],
  });
}
