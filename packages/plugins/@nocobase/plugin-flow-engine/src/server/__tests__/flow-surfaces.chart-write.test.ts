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
      measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
      dimensions: [{ field: ['department', 'title'], alias: 'department.title' }],
      orders: [{ field: ['department', 'title'], order: 'DESC' }],
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

  it('should reject invalid dotted association paths in builder chart updateSettings writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart invalid dotted field update page',
      tabTitle: 'Chart invalid dotted field update tab',
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
                dimensions: [{ field: 'bogus.id' }],
              },
              chart: {
                option: {
                  mode: 'basic',
                  builder: {
                    type: 'bar',
                    xField: 'bogus.id',
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
    expect(readErrorMessage(updateRes)).toContain("chart query.dimensions[0].field 'bogus.id'");
    expect(readErrorMessage(updateRes)).toContain("invalid association path 'bogus'");
    expect(updateRes.body?.errors?.[0]).toMatchObject({
      path: 'chart query.dimensions[0].field',
      ruleId: 'chart-builder-query-association-path-invalid',
      details: {
        fieldPath: 'bogus.id',
        associationPath: 'bogus',
      },
    });
    expectChartRepairDetails(updateRes);
  });

  it('should reject relation subfield count measures before builder chart writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart relation count measure page',
      tabTitle: 'Chart relation count measure tab',
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
                measures: [{ field: 'department.title', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.title' }],
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

    expect(updateRes.status).toBe(400);
    expect(readErrorMessage(updateRes)).toContain("chart query.measures[0].field 'department.title'");
    expect(readErrorMessage(updateRes)).toContain('counts a relation subfield');
    expect(updateRes.body?.errors?.[0]).toMatchObject({
      path: 'chart query.measures[0].field',
      ruleId: 'chart-builder-query-count-measure-relation-subfield',
      details: {
        fieldPath: 'department.title',
        suggestedMeasure: {
          field: 'id',
          aggregation: 'count',
          alias: 'employeeCount',
        },
        suggestedDimension: {
          field: 'department.title',
        },
      },
    });
    expectChartRepairDetails(updateRes);
  });

  it('should reject incompatible relation dimensions before builder chart writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart incompatible relation dimension page',
      tabTitle: 'Chart incompatible relation dimension tab',
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
                dimensions: [{ field: 'department.employerEIN' }],
              },
              chart: {
                option: {
                  mode: 'basic',
                  builder: {
                    type: 'bar',
                    xField: 'department.employerEIN',
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
    expect(readErrorMessage(updateRes)).toContain("Supported fields under 'department'");
    expect(readErrorMessage(updateRes)).toContain('department.title');
    expect(readErrorMessage(updateRes)).toContain('department.location');
    expect(updateRes.body?.errors?.[0]).toMatchObject({
      path: 'chart query.dimensions[0].field',
      ruleId: 'chart-builder-query-relation-subfield-column-unsupported',
      details: {
        fieldPath: 'department.employerEIN',
        associationPath: 'department',
        leafFieldName: 'employerEIN',
        columnName: 'employer_e_i_n',
        supportedFields: expect.arrayContaining([
          expect.objectContaining({ field: 'department.title' }),
          expect.objectContaining({ field: 'department.location' }),
        ]),
      },
    });
    expect(updateRes.body?.errors?.[0]?.details?.supportedFields).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'department.employerEIN' })]),
    );
    expectChartRepairDetails(updateRes);
  });

  it('should keep count measure validation precedence for incompatible relation subfield writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart incompatible relation count measure page',
      tabTitle: 'Chart incompatible relation count measure tab',
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
                measures: [{ field: 'department.employerEIN', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.location' }],
              },
              chart: {
                option: {
                  mode: 'basic',
                  builder: {
                    type: 'bar',
                    xField: 'department.location',
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
    expect(updateRes.body?.errors?.[0]).toMatchObject({
      path: 'chart query.measures[0].field',
      ruleId: 'chart-builder-query-count-measure-relation-subfield',
      details: {
        fieldPath: 'department.employerEIN',
        suggestedMeasure: {
          field: 'id',
          aggregation: 'count',
          alias: 'employeeCount',
        },
      },
    });
    expect(updateRes.body?.errors?.[0]?.ruleId).not.toBe('chart-builder-query-relation-subfield-column-unsupported');
    expectChartRepairDetails(updateRes);
  });

  it('should reject association-valued relation dimensions before builder chart writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart association-valued relation dimension page',
      tabTitle: 'Chart association-valued relation dimension tab',
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
                dimensions: [{ field: 'department.manager' }],
              },
              chart: {
                option: {
                  mode: 'basic',
                  builder: {
                    type: 'bar',
                    xField: 'department.manager',
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
    expect(updateRes.body?.errors?.[0]).toMatchObject({
      path: 'chart query.dimensions[0].field',
      ruleId: 'chart-builder-query-relation-direct-subfield-required',
      details: {
        fieldPath: 'department.manager',
        associationPath: 'department',
        leafFieldName: 'manager',
        selectedSubfieldPath: 'manager',
        supportedFields: expect.arrayContaining([
          expect.objectContaining({ field: 'department.title' }),
          expect.objectContaining({ field: 'department.location' }),
        ]),
      },
    });
    expect(updateRes.body?.errors?.[0]?.details?.supportedFields).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'department.manager' })]),
    );
    expectChartRepairDetails(updateRes);
  });

  it('should reject multi-hop relation dimensions before builder chart writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart multi-hop relation dimension page',
      tabTitle: 'Chart multi-hop relation dimension tab',
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
                dimensions: [{ field: 'department.manager.nickname' }],
              },
              chart: {
                option: {
                  mode: 'basic',
                  builder: {
                    type: 'bar',
                    xField: 'department.manager.nickname',
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
    expect(updateRes.body?.errors?.[0]).toMatchObject({
      path: 'chart query.dimensions[0].field',
      ruleId: 'chart-builder-query-relation-direct-subfield-required',
      details: {
        fieldPath: 'department.manager.nickname',
        associationPath: 'department',
        leafFieldName: 'manager',
        selectedSubfieldPath: 'manager.nickname',
        supportedFields: expect.arrayContaining([
          expect.objectContaining({ field: 'department.title' }),
          expect.objectContaining({ field: 'department.location' }),
        ]),
      },
    });
    expectChartRepairDetails(updateRes);
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

  it('should preserve chart-config repair details for invalid builder visual mappings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart invalid builder mapping page',
      tabTitle: 'Chart invalid builder mapping tab',
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
          query: buildCompleteChartQuery(),
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

    expect(invalidRes.status).toBe(400);
    expect(readErrorMessage(invalidRes)).toContain('chart visual mappings only support query output fields');
    expectChartRepairDetails(invalidRes);
    expect(invalidRes.body?.errors?.[0]?.details?.allowedOutputs).toEqual(
      expect.arrayContaining(['status', 'employeeCount']),
    );
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
            sql: `select nickname, count(*) as employee_count from ${employeesTable} group by nickname`,
            sqlDatasource: 'main',
          },
          visual: {
            type: 'bar',
            mappings: {
              x: 'missingField',
              y: 'employee_count',
            },
          },
        },
      },
    });
    expect(invalidMappingRes.status).toBe(400);
    expect(readErrorMessage(invalidMappingRes)).toContain('chart visual mappings only support SQL query output fields');
    expectChartRepairDetails(invalidMappingRes);
    expect(invalidMappingRes.body?.errors?.[0]?.details?.supportedOutputs).toEqual(
      expect.arrayContaining(['nickname', 'employee_count']),
    );
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
      measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
      dimensions: [{ field: ['department', 'title'], alias: 'department.title' }],
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

  it('should reject unsupported bare globals in custom visual raw and events raw before persisting', async () => {
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
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'fetch',
          }),
        }),
        expect.objectContaining({
          path: '$.changes.events.raw',
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'process',
          }),
        }),
      ]),
    );
  });

  it('should allow optional-chained browser globals in custom visual raw and events raw before persisting', async () => {
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

    expect(response.status, readErrorMessage(response)).toBe(200);

    const surface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartBlock.uid,
      }),
    );
    expect(surface.tree.stepParams?.chartSettings?.configure?.chart?.option?.raw).toBe(
      'window?.localStorage.getItem("chart");\nreturn {};',
    );
    expect(surface.tree.stepParams?.chartSettings?.configure?.chart?.events?.raw).toBe(
      'navigator?.clipboard.writeText("chart");',
    );
  });

  it('should reject unsupported bare globals in inline chart settings on create write paths', async () => {
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

  it('should keep stepwise localized chart placeholders during compose and addBlocks', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart partial compose page',
      tabTitle: 'Chart partial compose tab',
    });

    const titleOnlyRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'titleOnlyChart',
            type: 'chart',
            settings: {
              title: 'Title only chart',
            },
          },
        ],
      },
    });
    expect(titleOnlyRes.status, readErrorMessage(titleOnlyRes)).toBe(200);

    const collectionOnlyRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'collectionOnlyChart',
            type: 'chart',
            collection: 'employees',
            settings: {
              title: 'Collection only chart',
            },
          },
        ],
      },
    });
    expect(collectionOnlyRes.status, readErrorMessage(collectionOnlyRes)).toBe(200);

    const legacyPartialRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'legacyPartialChart',
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
    expect(legacyPartialRes.status, readErrorMessage(legacyPartialRes)).toBe(200);

    const addBlocksRes = await rootAgent.resource('flowSurfaces').addBlocks({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'batchTitleOnlyChart',
            type: 'chart',
            settings: {
              title: 'Batch title only chart',
            },
          },
        ],
      },
    });
    expect(addBlocksRes.status, readErrorMessage(addBlocksRes)).toBe(200);
  });

  it('should reject localized chart query without visual during compose with repair details', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart missing visual compose page',
      tabTitle: 'Chart missing visual compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'queryOnlyChart',
            type: 'chart',
            settings: {
              title: 'Query only chart',
              query: buildCompleteChartQuery(),
            },
          },
        ],
      },
    });
    expect(composeRes.status).toBe(400);
    expectChartRepairDetails(composeRes);
    expect(composeRes.body?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].settings.visual',
          ruleId: 'chart-visual-missing',
        }),
      ]),
    );
  });

  it('should compose localized chart blocks with complete query and visual settings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart complete compose page',
      tabTitle: 'Chart complete compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'completeChart',
            type: 'chart',
            settings: {
              title: 'Employees by status',
              query: buildCompleteChartQuery(),
              visual: buildCompleteChartVisual(),
            },
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const chartUid = getData(composeRes).blocks.find((block: any) => block.key === 'completeChart')?.uid;
    expect(chartUid).toBeTruthy();

    const surface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartUid,
      }),
    );
    expectCompleteChartConfigure(surface.tree.stepParams?.chartSettings?.configure);
  });

  it('should compose chart blocks from chart assets', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart asset compose page',
      tabTitle: 'Chart asset compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        assets: {
          charts: {
            statusChart: {
              query: buildCompleteChartQuery(),
              visual: buildCompleteChartVisual(),
            },
          },
        },
        blocks: [
          {
            key: 'assetChart',
            type: 'chart',
            chart: 'statusChart',
            settings: {
              title: 'Employees by status from asset',
            },
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const chartUid = getData(composeRes).blocks.find((block: any) => block.key === 'assetChart')?.uid;
    expect(chartUid).toBeTruthy();

    const surface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartUid,
      }),
    );
    expectCompleteChartConfigure(surface.tree.stepParams?.chartSettings?.configure);
  });

  it('should preserve inline chart settings when compose chart blocks also carry chart keys', async () => {
    const page = await createPage(rootAgent, {
      title: 'Inline chart with asset key compose page',
      tabTitle: 'Inline chart with asset key compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'inlineSemanticChart',
            type: 'chart',
            chart: 'missingChart',
            settings: {
              title: 'Inline semantic chart',
              query: buildCompleteChartQuery(),
              visual: buildCompleteChartVisual(),
            },
          },
          {
            key: 'inlineLegacyChart',
            type: 'chart',
            chart: 'missingChart',
            settings: {
              title: 'Inline legacy chart',
              configure: buildCompleteLegacyChartConfigure(),
            },
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const semanticChartUid = getData(composeRes).blocks.find((block: any) => block.key === 'inlineSemanticChart')?.uid;
    const legacyChartUid = getData(composeRes).blocks.find((block: any) => block.key === 'inlineLegacyChart')?.uid;
    expect(semanticChartUid).toBeTruthy();
    expect(legacyChartUid).toBeTruthy();

    const semanticSurface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: semanticChartUid,
      }),
    );
    const legacySurface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: legacyChartUid,
      }),
    );
    expectCompleteChartConfigure(semanticSurface.tree.stepParams?.chartSettings?.configure);
    expectCompleteChartConfigure(legacySurface.tree.stepParams?.chartSettings?.configure);
  });

  it('should compose popup chart blocks from top-level chart assets', async () => {
    const page = await createPage(rootAgent, {
      title: 'Popup chart asset compose page',
      tabTitle: 'Popup chart asset compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        assets: {
          charts: {
            statusChart: {
              query: buildCompleteChartQuery(),
              visual: buildCompleteChartVisual(),
            },
          },
        },
        blocks: [
          {
            key: 'employeesList',
            type: 'list',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname', 'status'],
            recordActions: [
              {
                key: 'chartPopup',
                type: 'popup',
                popup: {
                  blocks: [
                    {
                      key: 'popupAssetChart',
                      type: 'chart',
                      chart: 'statusChart',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const popupActionUid = getData(composeRes)
      .blocks.find((block: any) => block.key === 'employeesList')
      ?.recordActions.find((action: any) => action.key === 'chartPopup')?.uid;
    expect(popupActionUid).toBeTruthy();

    const popupSurface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: popupActionUid,
      }),
    );
    const chartBlock = collectDescendantNodes(popupSurface.tree, (item) => item?.use === 'ChartBlockModel')[0];
    expect(chartBlock?.uid).toBeTruthy();
    expectCompleteChartConfigure(chartBlock.stepParams?.chartSettings?.configure);
  });

  it('should compose field group popup chart blocks from top-level chart assets', async () => {
    const page = await createPage(rootAgent, {
      title: 'Field group popup chart asset compose page',
      tabTitle: 'Field group popup chart asset compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        assets: {
          charts: {
            statusChart: {
              query: buildCompleteChartQuery(),
              visual: buildCompleteChartVisual(),
            },
          },
        },
        blocks: [
          {
            key: 'employeeDetails',
            type: 'details',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fieldGroups: [
              {
                title: 'Relations',
                fields: [
                  {
                    key: 'departmentField',
                    fieldPath: 'department',
                    popup: {
                      blocks: [
                        {
                          key: 'fieldGroupPopupAssetChart',
                          type: 'chart',
                          chart: 'statusChart',
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
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const detailsUid = getData(composeRes).blocks.find((block: any) => block.key === 'employeeDetails')?.uid;
    expect(detailsUid).toBeTruthy();

    const detailsSurface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: detailsUid,
      }),
    );
    const chartBlock = collectDescendantNodes(detailsSurface.tree, (item) => item?.use === 'ChartBlockModel')[0];
    expect(chartBlock?.uid).toBeTruthy();
    expectCompleteChartConfigure(chartBlock.stepParams?.chartSettings?.configure);
  });

  it('should reject compose chart blocks that reference missing chart assets', async () => {
    const page = await createPage(rootAgent, {
      title: 'Missing chart asset compose page',
      tabTitle: 'Missing chart asset compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        assets: {
          charts: {},
        },
        blocks: [
          {
            key: 'missingAssetChart',
            type: 'chart',
            chart: 'missingChart',
          },
        ],
      },
    });
    expect(composeRes.status).toBe(400);
    expect(composeRes.body?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].chart',
          ruleId: 'chart-block-asset-reference-missing',
          details: expect.objectContaining({
            chartKey: 'missingChart',
          }),
        }),
      ]),
    );
  });

  it('should reject compose chart assets without visual settings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Missing chart asset visual compose page',
      tabTitle: 'Missing chart asset visual compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        assets: {
          charts: {
            queryOnlyChart: {
              query: buildCompleteChartQuery(),
            },
          },
        },
        blocks: [
          {
            key: 'queryOnlyAssetChart',
            type: 'chart',
            chart: 'queryOnlyChart',
          },
        ],
      },
    });
    expect(composeRes.status).toBe(400);
    expect(composeRes.body?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].settings.visual',
          ruleId: 'chart-visual-missing',
        }),
      ]),
    );
  });

  it('should include supported chart types and jsBlock guidance for unsupported compose chart visual types', async () => {
    const page = await createPage(rootAgent, {
      title: 'Unsupported chart asset visual compose page',
      tabTitle: 'Unsupported chart asset visual compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        assets: {
          charts: {
            statChart: {
              query: buildCompleteChartQuery(),
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
        blocks: [
          {
            key: 'statAssetChart',
            type: 'chart',
            chart: 'statChart',
          },
        ],
      },
    });
    expect(composeRes.status).toBe(400);
    const unsupportedTypeError = composeRes.body?.errors?.find(
      (error: any) => error.ruleId === 'chart-visual-type-unsupported',
    );
    expect(unsupportedTypeError).toMatchObject({
      path: '$.blocks[0].settings.visual.type',
      details: expect.objectContaining({
        type: 'stat',
        supportedVisualTypes: ['line', 'area', 'bar', 'barHorizontal', 'pie', 'doughnut', 'funnel', 'scatter'],
        alternativeBlockType: 'jsBlock',
      }),
    });
    expect(unsupportedTypeError?.message).toContain('Supported basic chart visual types');
    expect(unsupportedTypeError?.message).toContain('jsBlock');
    expect(unsupportedTypeError?.message).not.toContain('Do not change this block type');
    expect(unsupportedTypeError?.details?.alternativeHint).toContain('jsBlock');
    expect(unsupportedTypeError?.details?.repairHint).not.toContain('Do not change this block type');
    expect(unsupportedTypeError?.details?.forbiddenFallbacks).not.toContain('jsBlock');
  });

  it('should compose chart blocks with complete legacy configure settings', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart legacy complete compose page',
      tabTitle: 'Chart legacy complete compose tab',
    });

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'legacyCompleteChart',
            type: 'chart',
            settings: {
              title: 'Legacy complete chart',
              configure: buildCompleteLegacyChartConfigure(),
            },
          },
        ],
      },
    });
    expect(composeRes.status, readErrorMessage(composeRes)).toBe(200);

    const chartUid = getData(composeRes).blocks.find((block: any) => block.key === 'legacyCompleteChart')?.uid;
    expect(chartUid).toBeTruthy();

    const surface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartUid,
      }),
    );
    expectCompleteChartConfigure(surface.tree.stepParams?.chartSettings?.configure);
  });

  it('should reject legacy chart configure with conflicting resource and collectionPath', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart legacy conflict compose page',
      tabTitle: 'Chart legacy conflict compose tab',
    });
    const configure = buildCompleteLegacyChartConfigure();

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: { uid: page.gridUid },
        blocks: [
          {
            key: 'legacyConflictChart',
            type: 'chart',
            settings: {
              title: 'Legacy conflict chart',
              configure: {
                ...configure,
                query: {
                  ...configure.query,
                  resource: {
                    dataSourceKey: 'main',
                    collectionName: 'employees',
                  },
                  collectionPath: ['main', 'departments'],
                },
              },
            },
          },
        ],
      },
    });

    expect(composeRes.status).toBe(400);
    expectChartRepairDetails(composeRes);
    expect(composeRes.body?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].settings.configure.query',
          ruleId: 'chart-legacy-query-resource-conflict',
        }),
      ]),
    );
  });

  it('should return chart repair details for invalid addBlock inline chart configure', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart addBlock conflict page',
      tabTitle: 'Chart addBlock conflict tab',
    });
    const configure = buildCompleteLegacyChartConfigure();

    const addRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.gridUid },
        type: 'chart',
        settings: {
          configure: {
            ...configure,
            query: {
              ...configure.query,
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              collectionPath: ['main', 'departments'],
            },
          },
        },
      },
    });

    expect(addRes.status).toBe(400);
    expectChartRepairDetails(addRes);
    expect(readErrorMessage(addRes)).toContain(
      'chart query.resource and chart query.collectionPath must reference the same collection',
    );
  });

  it('should keep addBlock chart creation stepwise configurable', async () => {
    const page = await createPage(rootAgent, {
      title: 'Chart stepwise addBlock page',
      tabTitle: 'Chart stepwise addBlock tab',
    });
    const addRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: { uid: page.gridUid },
        type: 'chart',
      },
    });
    expect(addRes.status, readErrorMessage(addRes)).toBe(200);
    const chartUid = getData(addRes).uid;
    expect(chartUid).toBeTruthy();

    const queryRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartUid },
        changes: {
          query: buildCompleteChartQuery(),
        },
      },
    });
    expect(queryRes.status, readErrorMessage(queryRes)).toBe(200);

    const visualRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: { uid: chartUid },
        changes: {
          visual: buildCompleteChartVisual(),
        },
      },
    });
    expect(visualRes.status, readErrorMessage(visualRes)).toBe(200);

    const surface = getData(
      await rootAgent.resource('flowSurfaces').get({
        uid: chartUid,
      }),
    );
    expectCompleteChartConfigure(surface.tree.stepParams?.chartSettings?.configure);
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
            sql: `select nickname, count(*) as employee_count from ${employeesTable} group by nickname`,
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
  expect(details?.requiredBlockType).toBe('chart');
  expect(details?.fixStrategy).toBe('repair_same_block_type');
  expect(details?.repairSteps).toEqual(expect.arrayContaining([expect.stringContaining('Retry the chart payload')]));
  expect(details?.expectedShape?.settings?.query?.resource?.collectionName).toBeTruthy();
  expect(details?.expectedShape?.settings?.query?.measures).toEqual(expect.any(Array));
  expect(details?.expectedShape?.settings?.visual?.type).toBeTruthy();
  expect(details?.expectedShape?.settings?.visual?.mappings).toEqual(expect.any(Object));
  expect(details?.repairExample?.settings?.visual?.mappings).toEqual(expect.any(Object));
  expect(details?.forbiddenFallbacks).toEqual(expect.arrayContaining(['table', 'list', 'drop chart', 'defer chart']));
}

function collectDescendantNodes(root: any, predicate: (item: any) => boolean) {
  const result: any[] = [];
  const visit = (node: any) => {
    if (!node) {
      return;
    }
    if (predicate(node)) {
      result.push(node);
    }
    Object.values(node.subModels || {}).forEach((value) => {
      _.castArray(value).forEach(visit);
    });
  };
  visit(root);
  return result;
}

function expectCompleteChartConfigure(configure: any) {
  expect(configure?.query).toMatchObject({
    mode: 'builder',
    collectionPath: ['main', 'employees'],
    measures: [{ field: 'status', aggregation: 'count', alias: 'employeeCount' }],
    dimensions: [{ field: 'status' }],
  });
  expect(configure?.query?.resource).toBeUndefined();
  expect(configure?.chart?.option?.builder).toMatchObject({
    type: 'bar',
    xField: 'status',
    yField: 'employeeCount',
  });
}

function buildCompleteChartQuery() {
  return {
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
  };
}

function buildCompleteChartVisual() {
  return {
    mode: 'basic',
    type: 'bar',
    mappings: {
      x: 'status',
      y: 'employeeCount',
    },
  };
}

function buildCompleteLegacyChartConfigure() {
  return {
    query: {
      mode: 'builder',
      collectionPath: ['main', 'employees'],
      measures: [
        {
          field: 'id',
          aggregation: 'count',
          alias: 'employeeCount',
        },
      ],
      dimensions: [{ field: 'status' }],
    },
    chart: {
      option: {
        mode: 'basic',
        builder: {
          type: 'bar',
          xField: 'status',
          yField: 'employeeCount',
        },
      },
    },
  };
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
        ruleId: 'runjs-global-unknown',
        details: expect.objectContaining({
          global: 'fetch',
        }),
      }),
      expect.objectContaining({
        path: `${pathPrefix}.events.raw`,
        ruleId: 'runjs-global-unknown',
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
        { name: 'employerEIN', field: 'employer_e_i_n', type: 'string', interface: 'input' },
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

  await rootAgent.resource('collections.fields', 'departments').create({
    values: {
      name: 'manager',
      type: 'belongsTo',
      target: 'employees',
      foreignKey: 'managerId',
      interface: 'm2o',
    },
  });

  await waitForFixtureCollectionsReady(db, {
    departments: ['title', 'location', 'employerEIN', 'managerId'],
    employees: ['nickname', 'status', 'departmentId'],
  });
}
