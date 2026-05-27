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
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
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
      measures: [{ field: 'department.title', aggregation: 'count', alias: 'employeeCount' }],
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

  it('should reject direct association fields in builder chart updateSettings writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart association field update page',
      tabTitle: 'Chart association field update tab',
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
                measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department' }],
              },
              chart: {
                option: {
                  mode: 'basic',
                  builder: {
                    type: 'bar',
                    xField: 'department',
                    yField: 'employeeCount',
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(updateRes.status).toBe(400);
    expect(readErrorMessage(updateRes)).toContain("chart query.dimensions[0].field 'department'");
    expect(readErrorMessage(updateRes)).toContain('references an association field directly');
    expect(readErrorMessage(updateRes)).toContain("'department.title'");
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
    const employeesTable = getFixtureTableName(db, 'employees');
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
    expectChartRepairDetails(invalidSqlRes);

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
    const zeroOutputMessage = readErrorMessage(zeroOutputRes);
    if (process.env.DB_DIALECT === 'postgres') {
      expect(zeroOutputMessage).toContain('chart query.sql must expose at least one output column');
    } else {
      expect(zeroOutputMessage).toContain('chart query.sql is invalid');
    }
    expectChartRepairDetails(zeroOutputRes);

    // MySQL cannot infer SQL output aliases from an empty aggregate result set,
    // so seed one row to exercise the mapping-validation branch consistently.
    await rootAgent.resource('employees').create({
      values: {
        nickname: 'sql-preview-user',
        status: 'active',
      },
    });

    const invalidMappingRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
          query: {
            mode: 'sql',
            sql: `select nickname, count(*) as employeeCount from ${employeesTable} group by nickname`,
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

  it('should reject basic visual writes when sql preview outputs are unavailable', async () => {
    const employeesTable = getFixtureTableName(db, 'employees');
    const page = await createPage(rootAgent, {
      title: 'Chart risky sql page',
      tabTitle: 'Chart risky sql tab',
    });
    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'chart',
        },
      }),
    );

    const response = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
          query: {
            mode: 'sql',
            sql: `select '{{ ctx.user.id }}' as viewer_id, count(*) as total_count from ${employeesTable}`,
            sqlDatasource: 'main',
          },
          visual: {
            type: 'bar',
            mappings: {
              x: 'viewer_id',
              y: 'total_count',
            },
          },
        },
      },
    });

    expect(response.status).toBe(400);
    expect(readErrorMessage(response)).toContain("chart visual.mode='basic' requires previewable SQL query outputs");
    expectChartRepairDetails(response);
  });

  it('should clear stale basic visual when query switches to risky sql without an explicit visual patch', async () => {
    const employeesTable = getFixtureTableName(db, 'employees');
    const page = await createPage(rootAgent, {
      title: 'Chart risky sql query-only page',
      tabTitle: 'Chart risky sql query-only tab',
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
    expect(seededRes.status).toBe(200);

    const riskySqlRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
          query: {
            mode: 'sql',
            sql: `select '{{ ctx.user.id }}' as viewer_id, count(*) as total_count from ${employeesTable}`,
            sqlDatasource: 'main',
          },
        },
      },
    });
    expect(riskySqlRes.status).toBe(200);

    const surface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartBlock.uid,
      }),
    );
    expect(surface.tree.stepParams?.chartSettings?.configure?.query).toMatchObject({
      mode: 'sql',
      sql: `select '{{ ctx.user.id }}' as viewer_id, count(*) as total_count from ${employeesTable}`,
      sqlDatasource: 'main',
    });
    expect(surface.tree.stepParams?.chartSettings?.configure?.chart?.option).toBeUndefined();

    const flowSqlRecord = await db.getRepository('flowSql').findOne({
      filter: { uid: chartBlock.uid },
    });
    expect(flowSqlRecord?.get?.('sql')).toContain('{{ ctx.user.id }}');
  });

  it('should persist custom visual raw and events raw without semantic loss', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart custom raw page',
      tabTitle: 'Chart custom raw tab',
    });
    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'chart',
        },
      }),
    );

    const customOptionRaw = `
const hasBlockedWord = /fetch|process|localStorage/.test('fetch');
return {
  title: { text: hasBlockedWord ? 'Employee count' : 'Employee count' },
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [{ type: 'bar', encode: { x: 'department.title', y: 'employeeCount' } }],
};
    `.trim();
    const customEventsRaw = `
chart.off('click');
chart.on('click', 'series', function(params) {
  const hasBlockedWord = /fetch|process|localStorage/.test(String(params && params.name || ''));
  console.log('chart-click', hasBlockedWord, params && params.name);
});
    `.trim();

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
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
            mode: 'custom',
            raw: customOptionRaw,
          },
          events: {
            raw: customEventsRaw,
          },
        },
      },
    });
    expect(configureRes.status, readErrorMessage(configureRes)).toBe(200);

    const surface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartBlock.uid,
      }),
    );
    expect(surface.tree.stepParams?.chartSettings?.configure?.query).toMatchObject({
      mode: 'builder',
      collectionPath: ['main', 'employees'],
      measures: [{ field: 'department.title', aggregation: 'count', alias: 'employeeCount' }],
      dimensions: [{ field: 'department.title' }],
    });
    expect(surface.tree.stepParams?.chartSettings?.configure?.chart?.option).toMatchObject({
      mode: 'custom',
      raw: customOptionRaw,
    });
    expect(surface.tree.stepParams?.chartSettings?.configure?.chart?.events).toMatchObject({
      mode: 'custom',
      raw: customEventsRaw,
    });
  });

  it('should reject blocked globals in custom visual raw and events raw before persisting', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart invalid raw page',
      tabTitle: 'Chart invalid raw tab',
    });
    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'chart',
        },
      }),
    );

    const response = await rootAgent.resource('flowSurfaces').configure({
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
          },
          visual: {
            mode: 'custom',
            raw: 'await fetch("/chart-option");\nreturn {};',
          },
          events: {
            raw: 'process.exit(1);',
          },
        },
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.visual.raw',
          ruleId: 'runjs-global-blocked',
          details: expect.objectContaining({
            global: 'fetch',
          }),
        }),
        expect.objectContaining({
          path: '$.changes.events.raw',
          ruleId: 'runjs-global-blocked',
          details: expect.objectContaining({
            global: 'process',
          }),
        }),
      ]),
    );
  });

  it('should reject optional-chained browser globals in custom visual raw and events raw before persisting', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart optional global raw page',
      tabTitle: 'Chart optional global raw tab',
    });
    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'chart',
        },
      }),
    );

    const response = await rootAgent.resource('flowSurfaces').configure({
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
          },
          visual: {
            mode: 'custom',
            raw: 'window?.localStorage.getItem("chart");\nreturn {};',
          },
          events: {
            raw: 'navigator?.clipboard.writeText("chart");',
          },
        },
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.visual.raw',
          ruleId: 'runjs-window-property-blocked',
          details: expect.objectContaining({
            global: 'window',
            member: 'localStorage',
          }),
        }),
        expect.objectContaining({
          path: '$.changes.events.raw',
          ruleId: 'runjs-navigator-property-blocked',
          details: expect.objectContaining({
            global: 'navigator',
            member: 'clipboard',
          }),
        }),
      ]),
    );

    const surface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartBlock.uid,
      }),
    );
    expect(surface.tree.stepParams?.chartSettings?.configure?.chart?.option?.raw).toBeUndefined();
    expect(surface.tree.stepParams?.chartSettings?.configure?.chart?.events?.raw).toBeUndefined();
  });

  it('should reject blocked globals in inline chart settings on create write paths', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart invalid inline raw page',
      tabTitle: 'Chart invalid inline raw tab',
    });

    const composeResponse = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'composeChart',
            type: 'chart',
            settings: buildInvalidInlineChartSettings(),
          },
        ],
      },
    });
    expect(composeResponse.status).toBe(400);
    expectInlineChartRawErrors(composeResponse, '$.blocks[0].settings');

    const addBlockResponse = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.gridUid },
        type: 'chart',
        settings: buildInvalidInlineChartSettings(),
      },
    });
    expect(addBlockResponse.status).toBe(400);
    expectInlineChartRawErrors(addBlockResponse, '$.settings');

    const addBlocksResponse = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'batchChart',
            type: 'chart',
            settings: buildInvalidInlineChartSettings(),
          },
        ],
      },
    });
    expect(addBlocksResponse.status).toBe(400);
    expectInlineChartRawErrors(addBlocksResponse, '$.blocks[0].settings');
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

    const chartUid = getData(composeRes).blocks.find((block: any) => block.key === 'chart')?.uid;
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

  it('should persist chart block chrome into stepParams.cardSettings only when configuring block chrome', async () => {
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
          description: 'Monthly revenue grouped by status',
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
    expect(visibleSurface.tree.decoratorProps || {}).not.toHaveProperty('title');
    expect(visibleSurface.tree.decoratorProps || {}).not.toHaveProperty('displayTitle');
    expect(visibleSurface.tree.decoratorProps || {}).not.toHaveProperty('height');
    expect(visibleSurface.tree.decoratorProps || {}).not.toHaveProperty('heightMode');
    expect(visibleSurface.tree.stepParams?.cardSettings?.titleDescription).toMatchObject({
      title: 'Revenue by status',
      description: 'Monthly revenue grouped by status',
    });
    expect(visibleSurface.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'specifyValue',
      height: 420,
    });

    const configureHiddenRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartBlock.uid },
        changes: {
          title: '',
          description: '',
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
    expect(hiddenSurface.tree.decoratorProps || {}).not.toHaveProperty('title');
    expect(hiddenSurface.tree.decoratorProps || {}).not.toHaveProperty('displayTitle');
    expect(hiddenSurface.tree.decoratorProps || {}).not.toHaveProperty('height');
    expect(hiddenSurface.tree.decoratorProps || {}).not.toHaveProperty('heightMode');
    expect(hiddenSurface.tree.stepParams?.cardSettings?.titleDescription).toBeUndefined();
    expect(hiddenSurface.tree.stepParams?.cardSettings?.blockHeight).toMatchObject({
      heightMode: 'defaultHeight',
    });
    expect(hiddenSurface.tree.stepParams?.cardSettings?.blockHeight?.height).toBeUndefined();
  });

  it('should reject invalid chart card heightMode in raw stepParams writes with a clear error', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart invalid cardSettings page',
      tabTitle: 'Chart invalid cardSettings tab',
    });
    const chartBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: { uid: page.gridUid },
          type: 'chart',
        },
      }),
    );

    const invalidRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: { uid: chartBlock.uid },
        stepParams: {
          cardSettings: {
            blockHeight: {
              heightMode: 'auto',
            },
          },
        },
      },
    });

    expect(invalidRes.status).toBe(400);
    expect(readErrorMessage(invalidRes)).toContain(
      'flowSurfaces updateSettings chart stepParams.cardSettings.blockHeight.heightMode must be one of',
    );
  });

  it('should use chart cardSettings title for multi-target filter catalog labels', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart filter label page',
      tabTitle: 'Chart filter label tab',
    });
    const filterFormUid = await addBlock(rootAgent, page.gridUid, 'filterForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    await addBlock(rootAgent, page.gridUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const chartUid = await addBlock(rootAgent, page.gridUid, 'chart', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartUid },
        changes: {
          title: 'Revenue by status',
        },
      },
    });
    expect(configureRes.status).toBe(200);

    const filterCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: { uid: filterFormUid },
        },
      }),
    );
    const chartNicknameField = filterCatalog.fields.find(
      (item: any) => item.key === 'nickname' && item.targetBlockUid === chartUid,
    );
    expect(chartNicknameField).toBeTruthy();
    expect(String(chartNicknameField.label || '')).toContain('Revenue by status / ');
  });

  it('should persist sql chart bindings, cleanup stale flowSql and resync filter targets when chart mode changes', async () => {
    const employeesTable = getFixtureTableName(db, 'employees');
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
            sql: `select nickname, count(*) as employeeCount from ${employeesTable} group by nickname`,
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

function expectChartRepairDetails(response: any) {
  const details = response?.body?.errors?.[0]?.details;
  expect(details?.repairHint).toContain('chart payload shape problem');
  expect(details?.repairHint).toContain('Do not change this block type');
  expect(details?.repairSteps).toEqual(expect.arrayContaining([expect.stringContaining('Retry the chart payload')]));
  expect(details?.forbiddenFallbacks).toEqual(expect.arrayContaining(['table', 'drop chart']));
}

function buildInvalidInlineChartSettings() {
  return {
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
      mode: 'custom',
      raw: 'await fetch("/chart-option");\nreturn {};',
    },
    events: {
      raw: 'process.exit(1);',
    },
  };
}

function expectInlineChartRawErrors(response: any, pathPrefix: string) {
  expect(response.body?.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: `${pathPrefix}.visual.raw`,
        ruleId: 'runjs-global-blocked',
        details: expect.objectContaining({
          global: 'fetch',
        }),
      }),
      expect.objectContaining({
        path: `${pathPrefix}.events.raw`,
        ruleId: 'runjs-global-blocked',
        details: expect.objectContaining({
          global: 'process',
        }),
      }),
    ]),
  );
}

function getFixtureTableName(db: Database, collectionName: string) {
  return db.getCollection(collectionName)?.getTableNameWithSchemaAsString?.() || collectionName;
}

async function createPage(rootAgent: any, values: Record<string, any>) {
  const response = await rootAgent.resource('flowSurfaces').createPage({ values: { icon: 'FileOutlined', ...values } });
  expect(response.status).toBe(200);
  return getData(response);
}

async function addBlock(rootAgent: any, targetUid: string, type: string, resourceInit?: Record<string, any>) {
  const fields =
    resourceInit && ['filterForm', 'table'].includes(type)
      ? {
          fields: ['nickname'],
        }
      : {};
  const response = await rootAgent.resource('flowSurfaces').addBlock({
    values: {
      target: { uid: targetUid },
      type,
      ...(resourceInit ? { resourceInit } : {}),
      ...fields,
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

  await waitForFixtureCollectionsReady(db, {
    departments: ['title', 'location'],
    employees: ['nickname', 'status', 'departmentId'],
  });
}
