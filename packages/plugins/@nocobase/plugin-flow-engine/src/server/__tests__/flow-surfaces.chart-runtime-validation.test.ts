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

  it('should keep count measure validation precedence for incompatible relation subfields', () => {
    const service = createServiceWithCollections();

    try {
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'department.employerEIN', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.state' }],
        },
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect(error.options).toMatchObject({
        path: 'chart query.measures[0].field',
        ruleId: 'chart-builder-query-count-measure-relation-subfield',
        details: {
          fieldPath: 'department.employerEIN',
          suggestedMeasure: {
            field: 'id',
            aggregation: 'count',
            alias: 'employeeCount',
          },
          suggestedDimension: {
            field: 'department.employerEIN',
          },
          repairHint: expect.stringContaining('chart payload shape problem'),
        },
      });
      expect(error.options.ruleId).not.toBe('chart-builder-query-relation-subfield-column-unsupported');
      return;
    }

    throw new Error('Expected incompatible relation subfield count measure to keep count validation precedence');
  });

  it('should keep count measure validation precedence for model-attribute-only relation subfields', () => {
    const service = createServiceWithCollections();

    try {
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'department.managerId', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.state' }],
        },
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect(error.options).toMatchObject({
        path: 'chart query.measures[0].field',
        ruleId: 'chart-builder-query-count-measure-relation-subfield',
        details: {
          fieldPath: 'department.managerId',
          suggestedMeasure: {
            field: 'id',
            aggregation: 'count',
            alias: 'employeeCount',
          },
          suggestedDimension: {
            field: 'department.managerId',
          },
          repairHint: expect.stringContaining('chart payload shape problem'),
        },
      });
      return;
    }

    throw new Error('Expected model-attribute-only relation count measure to keep count validation precedence');
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

  it('should reject relation subfields whose column names are not chart-builder-compatible', () => {
    const service = createServiceWithCollections();

    try {
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.employerEIN' }],
        },
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect(error.message).toContain("Supported fields under 'department'");
      expect(error.options).toMatchObject({
        path: 'chart query.dimensions[0].field',
        ruleId: 'chart-builder-query-relation-subfield-column-unsupported',
        details: {
          fieldPath: 'department.employerEIN',
          associationPath: 'department',
          leafFieldName: 'employerEIN',
          columnName: 'employer_e_i_n',
          supportedFields: expect.arrayContaining([
            expect.objectContaining({ field: 'department.title' }),
            expect.objectContaining({ field: 'department.state' }),
          ]),
          repairHint: expect.stringContaining('chart payload shape problem'),
        },
      });
      expect(error.options.details.supportedFields).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'department.employerEIN' })]),
      );
      return;
    }

    throw new Error('Expected relation subfield with mismatched column name to be rejected');
  });

  it('should reject model-attribute-only relation subfields with incompatible column names', () => {
    const service = createServiceWithCollections();

    try {
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.legacyCode' }],
        },
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect(error.options).toMatchObject({
        path: 'chart query.dimensions[0].field',
        ruleId: 'chart-builder-query-relation-subfield-column-unsupported',
        details: {
          fieldPath: 'department.legacyCode',
          associationPath: 'department',
          leafFieldName: 'legacyCode',
          columnName: 'legacy_code',
          supportedFields: expect.arrayContaining([
            expect.objectContaining({ field: 'department.title' }),
            expect.objectContaining({ field: 'department.state' }),
          ]),
          repairHint: expect.stringContaining('chart payload shape problem'),
        },
      });
      expect(error.options.details.supportedFields).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'department.legacyCode' })]),
      );
      return;
    }

    throw new Error('Expected model-attribute-only relation subfield with mismatched column name to be rejected');
  });

  it('should reject association-valued direct children under relation dimensions', () => {
    const service = createServiceWithCollections();

    try {
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.manager' }],
        },
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect(error.message).toContain("Supported fields under 'department'");
      expect(error.options).toMatchObject({
        path: 'chart query.dimensions[0].field',
        ruleId: 'chart-builder-query-relation-direct-subfield-required',
        details: {
          fieldPath: 'department.manager',
          associationPath: 'department',
          leafFieldName: 'manager',
          selectedSubfieldPath: 'manager',
          supportedFields: expect.arrayContaining([
            expect.objectContaining({ field: 'department.title' }),
            expect.objectContaining({ field: 'department.state' }),
          ]),
          repairHint: expect.stringContaining('chart payload shape problem'),
        },
      });
      expect(error.options.details.supportedFields).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'department.manager' })]),
      );
      return;
    }

    throw new Error('Expected association-valued relation child to be rejected');
  });

  it('should reject multi-hop relation dimensions before chart writes', () => {
    const service = createServiceWithCollections();

    try {
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.manager.title' }],
        },
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect(error.message).toContain("Supported fields under 'department'");
      expect(error.options).toMatchObject({
        path: 'chart query.dimensions[0].field',
        ruleId: 'chart-builder-query-relation-direct-subfield-required',
        details: {
          fieldPath: 'department.manager.title',
          associationPath: 'department',
          leafFieldName: 'manager',
          selectedSubfieldPath: 'manager.title',
          supportedFields: expect.arrayContaining([
            expect.objectContaining({ field: 'department.title' }),
            expect.objectContaining({ field: 'department.state' }),
          ]),
          repairHint: expect.stringContaining('chart payload shape problem'),
        },
      });
      return;
    }

    throw new Error('Expected multi-hop relation dimension to be rejected');
  });

  it('should reject unknown direct children under valid relation dimensions with supported fields', () => {
    const service = createServiceWithCollections();

    try {
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.bogus' }],
        },
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect(error.message).toContain("Supported fields under 'department'");
      expect(error.options).toMatchObject({
        path: 'chart query.dimensions[0].field',
        ruleId: 'chart-builder-query-relation-direct-subfield-required',
        details: {
          fieldPath: 'department.bogus',
          associationPath: 'department',
          leafFieldName: 'bogus',
          selectedSubfieldPath: 'bogus',
          supportedFields: expect.arrayContaining([
            expect.objectContaining({ field: 'department.title' }),
            expect.objectContaining({ field: 'department.state' }),
          ]),
          repairHint: expect.stringContaining('chart payload shape problem'),
        },
      });
      return;
    }

    throw new Error('Expected unknown direct relation child to be rejected with supported fields');
  });

  it('should reject unknown multi-hop children under valid relation dimensions with supported fields', () => {
    const service = createServiceWithCollections();

    try {
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.bogus.title' }],
        },
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect(error.message).toContain("Supported fields under 'department'");
      expect(error.options).toMatchObject({
        path: 'chart query.dimensions[0].field',
        ruleId: 'chart-builder-query-relation-direct-subfield-required',
        details: {
          fieldPath: 'department.bogus.title',
          associationPath: 'department',
          leafFieldName: 'bogus',
          selectedSubfieldPath: 'bogus.title',
          supportedFields: expect.arrayContaining([
            expect.objectContaining({ field: 'department.title' }),
            expect.objectContaining({ field: 'department.state' }),
          ]),
          repairHint: expect.stringContaining('chart payload shape problem'),
        },
      });
      return;
    }

    throw new Error('Expected unknown multi-hop relation child to be rejected with supported fields');
  });

  it('should reject model-attribute-only compatible relation children with supported fields', () => {
    const service = createServiceWithCollections();

    try {
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.managerId' }],
        },
      });
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect(error.message).toContain("Supported fields under 'department'");
      expect(error.options).toMatchObject({
        path: 'chart query.dimensions[0].field',
        ruleId: 'chart-builder-query-relation-direct-subfield-required',
        details: {
          fieldPath: 'department.managerId',
          associationPath: 'department',
          leafFieldName: 'managerId',
          selectedSubfieldPath: 'managerId',
          supportedFields: expect.arrayContaining([
            expect.objectContaining({ field: 'department.title' }),
            expect.objectContaining({ field: 'department.state' }),
          ]),
          repairHint: expect.stringContaining('chart payload shape problem'),
        },
      });
      return;
    }

    throw new Error('Expected model-attribute-only compatible relation child to be rejected with supported fields');
  });

  it('should allow relation subfields whose column names match field names', () => {
    const service = createServiceWithCollections();

    expect(() =>
      (service as any).validateBuilderChartFieldsForRuntime('updateSettings', {
        query: {
          mode: 'builder',
          collectionPath: ['main', 'employees'],
          measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
          dimensions: [{ field: 'department.state' }],
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

  it('should keep count relation authoring error for incompatible relation count measures', async () => {
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
                measures: [{ field: 'department.employerEIN', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.state' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'department.state',
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
            fieldPath: 'department.employerEIN',
            suggestedMeasure: {
              field: 'id',
              aggregation: 'count',
              alias: 'employeeCount',
            },
          }),
        }),
      ]),
    );
    expect(errors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.departmentChart.query.measures[0].field',
          ruleId: 'chart-builder-query-relation-subfield-column-unsupported',
        }),
      ]),
    );
  });

  it('should keep count relation authoring error for model-attribute-only relation count measures', async () => {
    const collections = createFixtureCollections();

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid model attribute relation count chart',
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
                measures: [{ field: 'department.managerId', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.state' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'department.state',
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
            fieldPath: 'department.managerId',
            suggestedMeasure: {
              field: 'id',
              aggregation: 'count',
              alias: 'employeeCount',
            },
          }),
        }),
      ]),
    );
    expect(errors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.departmentChart.query.measures[0].field',
          ruleId: 'chart-builder-query-field-unknown',
        }),
      ]),
    );
  });

  it('should return supported relation subfields for chart assets with incompatible relation dimensions', async () => {
    const collections = createFixtureCollections();

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid relation dimension chart',
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
                measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.employerEIN' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'department.employerEIN',
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
          path: '$.assets.charts.departmentChart.query.dimensions[0].field',
          ruleId: 'chart-builder-query-relation-subfield-column-unsupported',
          message: expect.stringContaining("Supported fields under 'department'"),
          details: expect.objectContaining({
            fieldPath: 'department.employerEIN',
            associationPath: 'department',
            leafFieldName: 'employerEIN',
            columnName: 'employer_e_i_n',
            supportedFields: expect.arrayContaining([
              expect.objectContaining({ field: 'department.title' }),
              expect.objectContaining({ field: 'department.state' }),
            ]),
          }),
        }),
      ]),
    );

    const error = errors.find((item) => item.ruleId === 'chart-builder-query-relation-subfield-column-unsupported');
    expect(error?.details?.supportedFields).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'department.employerEIN' })]),
    );
  });

  it('should return supported relation subfields for model-attribute-only incompatible relation dimensions', async () => {
    const collections = createFixtureCollections();

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid model attribute relation dimension chart',
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
                measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.legacyCode' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'department.legacyCode',
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
          path: '$.assets.charts.departmentChart.query.dimensions[0].field',
          ruleId: 'chart-builder-query-relation-subfield-column-unsupported',
          message: expect.stringContaining("Supported fields under 'department'"),
          details: expect.objectContaining({
            fieldPath: 'department.legacyCode',
            associationPath: 'department',
            leafFieldName: 'legacyCode',
            columnName: 'legacy_code',
            supportedFields: expect.arrayContaining([
              expect.objectContaining({ field: 'department.title' }),
              expect.objectContaining({ field: 'department.state' }),
            ]),
          }),
        }),
      ]),
    );

    const error = errors.find((item) => item.ruleId === 'chart-builder-query-relation-subfield-column-unsupported');
    expect(error?.details?.supportedFields).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'department.legacyCode' })]),
    );
  });

  it('should return supported relation subfields for association-valued relation dimensions', async () => {
    const collections = createFixtureCollections();

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid association-valued relation dimension chart',
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
                measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.manager' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'department.manager',
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
          path: '$.assets.charts.departmentChart.query.dimensions[0].field',
          ruleId: 'chart-builder-query-relation-direct-subfield-required',
          message: expect.stringContaining("Supported fields under 'department'"),
          details: expect.objectContaining({
            fieldPath: 'department.manager',
            associationPath: 'department',
            leafFieldName: 'manager',
            selectedSubfieldPath: 'manager',
            supportedFields: expect.arrayContaining([
              expect.objectContaining({ field: 'department.title' }),
              expect.objectContaining({ field: 'department.state' }),
            ]),
          }),
        }),
      ]),
    );
  });

  it('should return supported relation subfields for multi-hop relation dimensions', async () => {
    const collections = createFixtureCollections();

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid multi-hop relation dimension chart',
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
                measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.manager.title' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'department.manager.title',
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
          path: '$.assets.charts.departmentChart.query.dimensions[0].field',
          ruleId: 'chart-builder-query-relation-direct-subfield-required',
          message: expect.stringContaining("Supported fields under 'department'"),
          details: expect.objectContaining({
            fieldPath: 'department.manager.title',
            associationPath: 'department',
            leafFieldName: 'manager',
            selectedSubfieldPath: 'manager.title',
            supportedFields: expect.arrayContaining([
              expect.objectContaining({ field: 'department.title' }),
              expect.objectContaining({ field: 'department.state' }),
            ]),
          }),
        }),
      ]),
    );
  });

  it('should return supported relation subfields for unknown children under valid relation dimensions', async () => {
    const collections = createFixtureCollections();

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid unknown relation child chart',
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
                measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.bogus' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'department.bogus',
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
          path: '$.assets.charts.departmentChart.query.dimensions[0].field',
          ruleId: 'chart-builder-query-relation-direct-subfield-required',
          message: expect.stringContaining("Supported fields under 'department'"),
          details: expect.objectContaining({
            fieldPath: 'department.bogus',
            associationPath: 'department',
            leafFieldName: 'bogus',
            selectedSubfieldPath: 'bogus',
            supportedFields: expect.arrayContaining([
              expect.objectContaining({ field: 'department.title' }),
              expect.objectContaining({ field: 'department.state' }),
            ]),
          }),
        }),
      ]),
    );
  });

  it('should return supported relation subfields for unknown multi-hop children under valid relation dimensions', async () => {
    const collections = createFixtureCollections();

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid unknown multi-hop relation child chart',
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
                measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.bogus.title' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'department.bogus.title',
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
          path: '$.assets.charts.departmentChart.query.dimensions[0].field',
          ruleId: 'chart-builder-query-relation-direct-subfield-required',
          message: expect.stringContaining("Supported fields under 'department'"),
          details: expect.objectContaining({
            fieldPath: 'department.bogus.title',
            associationPath: 'department',
            leafFieldName: 'bogus',
            selectedSubfieldPath: 'bogus.title',
            supportedFields: expect.arrayContaining([
              expect.objectContaining({ field: 'department.title' }),
              expect.objectContaining({ field: 'department.state' }),
            ]),
          }),
        }),
      ]),
    );
  });

  it('should return supported relation subfields for model-attribute-only compatible relation dimensions', async () => {
    const collections = createFixtureCollections();

    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        navigation: {
          item: {
            title: 'Invalid model attribute compatible relation dimension chart',
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
                measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'department.managerId' }],
              },
              visual: {
                mode: 'basic',
                type: 'bar',
                mappings: {
                  x: 'department.managerId',
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
          path: '$.assets.charts.departmentChart.query.dimensions[0].field',
          ruleId: 'chart-builder-query-relation-direct-subfield-required',
          message: expect.stringContaining("Supported fields under 'department'"),
          details: expect.objectContaining({
            fieldPath: 'department.managerId',
            associationPath: 'department',
            leafFieldName: 'managerId',
            selectedSubfieldPath: 'managerId',
            supportedFields: expect.arrayContaining([
              expect.objectContaining({ field: 'department.title' }),
              expect.objectContaining({ field: 'department.state' }),
            ]),
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
  const departments = createCollection(
    'departments',
    {
      id: { name: 'id', type: 'bigInt', interface: 'id' },
      title: { name: 'title', type: 'string', interface: 'input', uiSchema: { title: 'Title' } },
      state: { name: 'state', type: 'string', interface: 'input', uiSchema: { title: 'State' } },
      employerEIN: {
        name: 'employerEIN',
        type: 'string',
        interface: 'input',
        uiSchema: { title: 'Employer EIN' },
      },
      manager: {
        name: 'manager',
        type: 'belongsTo',
        interface: 'm2o',
        target: 'employees',
        isAssociationField: () => true,
      },
    },
    {
      legacyCode: {
        field: 'legacy_code',
      },
      managerId: {
        field: 'managerId',
      },
    },
  );
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

function createCollection(name: string, fields: Record<string, any>, modelAttributes: Record<string, any> = {}) {
  return {
    dataSourceKey: 'main',
    name,
    getFields: () => Object.values(fields),
    getField: (fieldName: string) => fields[fieldName] || null,
    model: {
      getAttributes: () =>
        Object.fromEntries([
          ...Object.keys(fields).map((fieldName) => [
            fieldName,
            {
              field: fieldName === 'employerEIN' ? 'employer_e_i_n' : fieldName,
            },
          ]),
          ...Object.entries(modelAttributes),
        ]),
    },
    fields: {
      get: (fieldName: string) => fields[fieldName] || null,
    },
  };
}
