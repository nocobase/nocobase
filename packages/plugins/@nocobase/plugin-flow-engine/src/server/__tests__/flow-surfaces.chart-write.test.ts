/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import _ from 'lodash';
import FlowModelRepository from '../repository';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';

describe('flowSurfaces chart write paths', () => {
  let app: MockServer;
  let db: Database;
  let flowRepo: FlowModelRepository;
  let rootAgent: any;

  beforeAll(async () => {
    app = await createFlowSurfacesMockServer();
    db = app.db;
    flowRepo = db.getCollection('flowModels').repository as FlowModelRepository;
    rootAgent = await loginFlowSurfacesRootAgent(app);
    await setupFixtureCollections(rootAgent);
  }, 120000);

  beforeEach(async () => {
    rootAgent = await loginFlowSurfacesRootAgent(app);
  });

  afterAll(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should canonicalize raw chartSettings.configure writes through updateSettings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart raw update page',
      tabTitle: 'Chart raw update tab',
    });
    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'chart',
        },
      }),
    );

    const updateRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: chartBlock.uid },
        stepParams: {
          chartSettings: {
            configure: {
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
                sorting: [{ field: 'department.title', direction: 'desc' }],
              },
              chart: {
                option: {
                  mode: 'basic',
                  builder: {
                    type: 'bar',
                    xField: 'department.title',
                    yField: 'employeeCount',
                  },
                },
              },
            },
          },
        },
      },
    });
    expect(updateRes.status).toBe(200);

    const surface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartBlock.uid,
      }),
    );
    expect(surface.tree.stepParams?.chartSettings?.configure?.query).toMatchObject({
      mode: 'builder',
      collectionPath: ['main', 'employees'],
      measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
      dimensions: [{ field: 'department.title' }],
      orders: [{ field: 'department.title', order: 'DESC' }],
    });
    expect(surface.tree.stepParams?.chartSettings?.configure?.query?.resource).toBeUndefined();

    const chartContextRes = await rootAgent.resource('flowSurfaces').context({
      values: {
        target: { uid: chartBlock.uid },
        path: 'chart',
        maxDepth: 4,
      },
    });
    expect(chartContextRes.status).toBe(200);
    expect(getData(chartContextRes).vars.chart.properties.aliases.properties.employeeCount).toBeTruthy();

    const invalidRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: chartBlock.uid },
        stepParams: {
          chartSettings: {
            configure: {
              query: {
                mode: 'builder',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                collectionPath: ['main', 'departments'],
                measures: [
                  {
                    field: 'id',
                    aggregation: 'count',
                    alias: 'employeeCount',
                  },
                ],
              },
            },
          },
        },
      },
    });
    expect(invalidRes.status).toBe(400);
    expect(readErrorMessage(invalidRes)).toContain('must reference the same collection');
  });

  it('should allow configure to clear stale builder sorting with an explicit empty array', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart clear sorting page',
      tabTitle: 'Chart clear sorting tab',
    });
    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'chart',
        },
      }),
    );

    const seededRes = await rootAgent.resource('flowSurfaces').configure({
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
            sorting: [{ field: 'department.title', direction: 'desc' }],
          },
          visual: {
            mode: 'basic',
            type: 'bar',
            mappings: {
              x: 'department.title',
              y: 'employeeCount',
            },
          },
        },
      },
    });
    expect(seededRes.status).toBe(200);

    const clearedRes = await rootAgent.resource('flowSurfaces').configure({
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
            sorting: [],
          },
        },
      },
    });
    expect(clearedRes.status).toBe(200);

    const surface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartBlock.uid,
      }),
    );
    expect(surface.tree.stepParams?.chartSettings?.configure?.query?.orders).toEqual([]);
  });

  it('should reject builder sorting on aggregated measure outputs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart invalid builder sorting page',
      tabTitle: 'Chart invalid builder sorting tab',
    });
    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'chart',
        },
      }),
    );

    const invalidRes = await rootAgent.resource('flowSurfaces').configure({
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
            sorting: [{ field: 'employeeCount', direction: 'desc' }],
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

    expect(invalidRes.status).toBe(400);
    expect(readErrorMessage(invalidRes)).toContain('does not support aggregated measure outputs');
  });

  it('should reject invalid sql preview and sql mappings outside inferred outputs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart invalid sql page',
      tabTitle: 'Chart invalid sql tab',
    });
    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'chart',
        },
      }),
    );

    const invalidSqlRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
          query: {
            mode: 'sql',
            sql: 'select * from missing_flow_surfaces_chart_table',
            sqlDatasource: 'main',
          },
        },
      },
    });
    expect(invalidSqlRes.status).toBe(400);
    expect(readErrorMessage(invalidSqlRes)).toContain('chart query.sql is invalid');

    const zeroOutputRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
          query: {
            mode: 'sql',
            sql: 'select from (values (1)) as sample(x)',
            sqlDatasource: 'main',
          },
        },
      },
    });
    expect(zeroOutputRes.status).toBe(400);
    expect(readErrorMessage(zeroOutputRes)).toContain('chart query.sql must expose at least one output column');

    const invalidMappingRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
          query: {
            mode: 'sql',
            sql: 'select nickname, count(*) as employeeCount from employees group by nickname',
            sqlDatasource: 'main',
          },
          visual: {
            type: 'bar',
            mappings: {
              x: 'missingField',
              y: 'employeeCount',
            },
          },
        },
      },
    });
    expect(invalidMappingRes.status).toBe(400);
    expect(readErrorMessage(invalidMappingRes)).toContain('chart visual mappings only support SQL query output fields');
  });

  it('should keep legacy partial configure writes during compose for backward compatibility', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart legacy compose page',
      tabTitle: 'Chart legacy compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'chart',
            type: 'chart',
            settings: {
              configure: {
                query: {
                  mode: 'builder',
                },
                chart: {
                  option: {
                    legend: {
                      show: true,
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(200);

    const chartUid = getData(composeRes).keyToUid.chart;
    expect(chartUid).toBeTruthy();

    const surface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartUid,
      }),
    );
    expect(surface.tree.stepParams?.chartSettings?.configure).toEqual({
      query: {
        mode: 'builder',
      },
      chart: {
        option: {
          legend: {
            show: true,
          },
        },
      },
    });
  });

  it('should mirror chart title and height into runtime cardSettings when configuring block chrome', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart card settings page',
      tabTitle: 'Chart card settings tab',
    });
    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'chart',
        },
      }),
    );

    const configureVisibleRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
          title: 'Revenue by status',
          displayTitle: true,
          height: 420,
          heightMode: 'fixed',
        },
      },
    });
    expect(configureVisibleRes.status).toBe(200);

    const visibleSurface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartBlock.uid,
      }),
    );
    expect(visibleSurface.tree.decoratorProps).toMatchObject({
      title: 'Revenue by status',
      displayTitle: true,
      height: 420,
      heightMode: 'specifyValue',
    });
    expect(visibleSurface.tree.stepParams?.cardSettings?.titleDescription).toMatchObject({
      title: 'Revenue by status',
    });
    expect(visibleSurface.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'specifyValue',
      height: 420,
    });

    const configureHiddenRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
          displayTitle: false,
          heightMode: 'defaultHeight',
        },
      },
    });
    expect(configureHiddenRes.status).toBe(200);

    const hiddenSurface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartBlock.uid,
      }),
    );
    expect(hiddenSurface.tree.decoratorProps).toMatchObject({
      title: 'Revenue by status',
      displayTitle: false,
      height: 420,
      heightMode: 'defaultHeight',
    });
    expect(hiddenSurface.tree.stepParams?.cardSettings?.titleDescription).toBeUndefined();
    expect(hiddenSurface.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'defaultHeight',
    });
    expect(hiddenSurface.tree.stepParams?.cardSettings?.blockHeight?.height).toBeUndefined();
  });

  it('should persist sql chart bindings, cleanup stale flowSql and resync filter targets when chart mode changes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart mode sync page',
      tabTitle: 'Chart mode sync tab',
    });

    const filterFormUid = await addBlock(rootAgent, page.gridUid, 'filterForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const chartUid = await addBlock(rootAgent, page.gridUid, 'chart', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const configureBuilderRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartUid },
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

    const filterCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: { uid: filterFormUid },
        },
      }),
    );
    expect(filterCatalog.fields.some((item: any) => item.key === 'nickname' && item.targetBlockUid === chartUid)).toBe(
      true,
    );

    const nicknameFilterField = await addField(rootAgent, filterFormUid, 'nickname', {
      defaultTargetUid: chartUid,
    });
    const pageGrid = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(pageGrid?.filterManager || []).find((item: any) => item.filterId === nicknameFilterField.wrapperUid),
    ).toMatchObject({
      targetId: chartUid,
      filterPaths: ['nickname'],
    });

    const configureSqlRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartUid },
        changes: {
          query: {
            mode: 'sql',
            sql: 'select nickname, count(*) as employeeCount from employees group by nickname',
            sqlDatasource: 'main',
          },
        },
      },
    });
    expect(configureSqlRes.status).toBe(200);

    const flowSqlRecord = await db.getRepository('flowSql').findOne({
      filter: { uid: chartUid },
    });
    expect(flowSqlRecord?.get?.('sql')).toContain('group by nickname');

    const pageGridAfterSql = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(pageGridAfterSql?.filterManager || []).some(
        (item: any) => item.filterId === nicknameFilterField.wrapperUid,
      ),
    ).toBe(false);

    const configureBackToBuilderRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartUid },
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
        },
      },
    });
    expect(configureBackToBuilderRes.status).toBe(200);

    const staleFlowSqlRecord = await db.getRepository('flowSql').findOne({
      filter: { uid: chartUid },
    });
    expect(staleFlowSqlRecord).toBeNull();

    const pageGridAfterBuilder = await flowRepo.findModelById(page.gridUid, { includeAsyncNode: true });
    expect(
      _.castArray(pageGridAfterBuilder?.filterManager || []).find(
        (item: any) => item.filterId === nicknameFilterField.wrapperUid,
      ),
    ).toMatchObject({
      targetId: chartUid,
      filterPaths: ['nickname'],
    });
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

async function addBlock(rootAgent: any, targetUid: string, type: string, resourceInit?: Record<string, any>) {
  const response = await rootAgent.resource('flowSurfaces').addBlock({
    values: {
      target: { uid: targetUid },
      type,
      ...(resourceInit ? { resourceInit } : {}),
    },
  });
  expect(response.status).toBe(200);
  return getData(response).uid;
}

async function addField(rootAgent: any, targetUid: string, fieldPath: string, extraValues: Record<string, any> = {}) {
  const response = await rootAgent.resource('flowSurfaces').addField({
    values: {
      target: { uid: targetUid },
      fieldPath,
      ...extraValues,
    },
  });
  expect(response.status).toBe(200);
  return getData(response);
}

async function setupFixtureCollections(rootAgent: any) {
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
}
