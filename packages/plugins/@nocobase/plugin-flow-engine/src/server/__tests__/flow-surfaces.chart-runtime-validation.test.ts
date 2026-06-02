/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowSurfaceBadRequestError } from '../flow-surfaces/errors';
import { collectFlowSurfaceAuthoringErrors } from '../flow-surfaces/authoring-validation';
import { FlowSurfacesService } from '../flow-surfaces/service';

describe('flowSurfaces chart runtime validation', () => {
  it('should reject invalid dotted association prefixes before chart writes', () => {
    const service = createServiceWithCollections();

    expect(() =>
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'bogus.id' }],
        },
      }),
    ).toThrow(FlowSurfaceBadRequestError);

    try {
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'bogus.id' }],
        },
      });
    } catch (error: any) {
      expect(error.options).toMatchObject({
        path: 'chart query.dimensions[0].field',
        ruleId: 'chart-builder-query-association-path-invalid',
        details: {
          fieldPath: 'bogus.id',
          associationPath: 'bogus',
          repairHint: expect.stringContaining('chart payload shape problem'),
        },
      });
    }
  });

  it('should reject count measures on relation subfields before chart writes', () => {
    const service = createServiceWithCollections();

    try {
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'department.title', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.title' }],
        },
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect(error.options).toMatchObject({
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
          repairHint: expect.stringContaining('chart payload shape problem'),
        },
      });
      return;
    }

    throw new Error('Expected relation subfield count measure to be rejected');
  });

  it('should allow count base fields grouped by relation subfields', () => {
    const service = createServiceWithCollections();

    expect(() =>
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.title' }],
        },
      }),
    ).not.toThrow();
  });
});

describe('flowSurfaces chart authoring validation', () => {
  it('should return aggregate repair details for chart assets that count relation subfields', async () => {
    const collections = createFixtureCollections();

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid relation count chart',
          },
        },
        assets: {
          charts: {
            departmentChart: {
              query: {
                mode: 'builder',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                measures: [{ field: 'department.title', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.title' }],
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
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'departmentChart',
                type: 'chart',
                chart: 'departmentChart',
              },
            ],
          },
        ],
      },
      {
        getCollection: (_dataSourceKey, collectionName) => collections[collectionName],
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.departmentChart.query.measures[0].field',
          ruleId: 'chart-builder-query-count-measure-relation-subfield',
          details: expect.objectContaining({
            fieldPath: 'department.title',
            suggestedMeasure: {
              field: 'id',
              aggregation: 'count',
              alias: 'employeeCount',
            },
            suggestedDimension: {
              field: 'department.title',
            },
            repairHint: expect.stringContaining('chart payload shape problem'),
          }),
        }),
      ]),
    );
  });
});

function createServiceWithCollections() {
  const collections = createFixtureCollections();

  return new FlowSurfacesService({
    app: {
      dataSourceManager: {
        get: () => ({
          collectionManager: {
            getCollection: (collectionName: string) => collections[collectionName],
          },
        }),
      },
      db: {
        getCollection: (collectionName: string) => collections[collectionName],
      },
    },
    db: {
      getCollection: (collectionName: string) => collections[collectionName],
    },
  } as any);
}

function createFixtureCollections() {
  const departments = createCollection('departments', {
    id: { name: 'id', type: 'bigInt', interface: 'id' },
    title: { name: 'title', type: 'string', interface: 'input' },
  });
  const employees = createCollection('employees', {
    id: { name: 'id', type: 'bigInt', interface: 'id' },
    department: {
      name: 'department',
      type: 'belongsTo',
      interface: 'm2o',
      target: 'departments',
      targetCollection: departments,
      isAssociationField: () => true,
    },
  });
  const collections = {
    departments,
    employees,
  } as Record<string, any>;
  return collections;
}

function createCollection(name: string, fields: Record<string, any>) {
  return {
    dataSourceKey: 'main',
    name,
    getField: (fieldName: string) => fields[fieldName] || null,
    fields: {
      get: (fieldName: string) => fields[fieldName] || null,
    },
  };
}
