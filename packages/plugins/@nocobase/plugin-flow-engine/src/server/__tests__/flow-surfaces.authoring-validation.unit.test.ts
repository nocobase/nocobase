/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowSurfaceAggregateError, FlowSurfaceBadRequestError } from '../flow-surfaces/errors';
import { FlowSurfacesService } from '../flow-surfaces/service';
import { collectFlowSurfaceAuthoringErrors } from '../flow-surfaces/authoring-validation';
import { rethrowInlineConfigurationError, toFlowSurfaceBatchItemError } from '../flow-surfaces/service-utils';

describe('flowSurfaces authoring validation unit', () => {
  const createDefaultFilterValidationContext = (extra: Record<string, any> = {}) => {
    const fields = [
      { name: 'id', type: 'bigInt', interface: 'integer' },
      { name: 'index', type: 'datetime', interface: 'datetime' },
      { name: 'occurDate', interface: 'input' },
      { name: 'lastFollowedAt', type: 'datetime', interface: 'datetime' },
      { name: 'startAt', type: 'datetime', interface: 'datetime' },
      { name: 'workTime', type: 'time', interface: 'time' },
      { name: 'nickname', interface: 'input' },
      { name: 'status', interface: 'select' },
      { name: 'email', interface: 'email' },
      { name: 'manager', type: 'belongsTo', interface: 'm2o', target: 'users' },
    ];
    const fieldsByName = new Map(fields.map((field) => [field.name, field]));
    const collection = {
      name: 'employees',
      getField: (fieldName: string) => fieldsByName.get(fieldName),
      getFields: () => fields,
      fields: fieldsByName,
    };
    const userFields = [
      { name: 'id', type: 'bigInt', interface: 'integer' },
      { name: 'createdAt', type: 'datetime', interface: 'createdAt' },
      { name: 'nickname', interface: 'input' },
    ];
    const userFieldsByName = new Map(userFields.map((field) => [field.name, field]));
    const usersCollection = {
      name: 'users',
      getField: (fieldName: string) => userFieldsByName.get(fieldName),
      getFields: () => userFields,
      fields: userFieldsByName,
    };
    return {
      getCollection: (_dataSourceKey: string, collectionName: string) => {
        if (collectionName === 'employees') {
          return collection;
        }
        if (collectionName === 'users') {
          return usersCollection;
        }
        return null;
      },
      ...extra,
    };
  };

  const buildDefaultFilter = (dateValue: any, operator = '$dateOn') => ({
    logic: '$and',
    items: [
      { path: 'occurDate', operator, value: dateValue },
      { path: 'nickname', operator: '$notEmpty' },
      { path: 'status', operator: '$notEmpty' },
      { path: 'email', operator: '$notEmpty' },
    ],
  });

  const createVisibleFieldValidationContext = () => {
    const fields = ['nickname', 'status', 'email', 'phone', 'title', 'department', 'role', 'location'].map((name) => ({
      name,
      interface: 'input',
      type: 'string',
    }));
    const fieldsByName = new Map(fields.map((field) => [field.name, field]));
    const collection = {
      name: 'employees',
      getField: (fieldName: string) => fieldsByName.get(fieldName),
      getFields: () => fields,
      fields: fieldsByName,
    };
    return {
      getCollection: (_dataSourceKey: string, collectionName: string) =>
        collectionName === 'employees' ? collection : null,
    };
  };

  it('should front-load aggregate authoring repair instructions for agents', () => {
    const error = new FlowSurfaceAggregateError([
      {
        path: '$.tabs[0].blocks[0].fields',
        ruleId: 'data-block-visible-fields-required',
        message: 'list block has no valid business fields',
      },
      {
        path: '$.tabs[0].blocks[1].chart',
        ruleId: 'chart-block-asset-reference-required',
        message: 'chart block requires an asset reference',
        details: {
          requiredBlockType: 'chart',
        },
      },
    ]);

    expect(error.toResponseBody()).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('2 error(s)'),
        errorCount: 2,
        details: expect.objectContaining({
          errorCount: 2,
          mustFixAllErrorsBeforeRetry: true,
          retryPolicy: 'fix_all_errors_before_retry_same_write',
          sameWriteRetryRequired: true,
          agentInstruction: expect.stringContaining('Fix every listed error'),
          requiredBlockPolicy: expect.objectContaining({
            requiredBlockTypes: ['chart'],
            fixStrategy: 'repair_same_block_type',
            doNotReplaceOrDrop: true,
          }),
        }),
        errors: [
          expect.objectContaining({ index: 1, ruleId: 'data-block-visible-fields-required' }),
          expect.objectContaining({ index: 2, ruleId: 'chart-block-asset-reference-required' }),
        ],
      }),
    );
  });

  it('should allow JS field entries without changing action-only visible field errors', async () => {
    const context = createVisibleFieldValidationContext();
    const applyBlueprintErrors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'table',
                collection: 'employees',
                fields: [
                  {
                    key: 'summary',
                    type: 'jsColumn',
                    settings: {
                      code: `ctx.render('Summary');`,
                    },
                  },
                ],
              },
              {
                type: 'table',
                collection: 'employees',
                fields: [
                  {
                    key: 'statusJs',
                    field: 'status',
                    renderer: 'js',
                    settings: {
                      code: `ctx.render(ctx.value || 'No status');`,
                    },
                  },
                ],
              },
              {
                type: 'createForm',
                collection: 'employees',
                fields: [
                  {
                    key: 'preview',
                    type: 'jsItem',
                    settings: {
                      code: `ctx.render('Preview');`,
                    },
                  },
                ],
              },
              {
                type: 'table',
                collection: 'employees',
                actions: [
                  {
                    type: 'jsItem',
                    settings: {
                      code: `ctx.render('Action');`,
                    },
                  },
                ],
              },
              {
                type: 'table',
                collection: 'employees',
                fields: [
                  {
                    key: 'wrongTableItem',
                    type: 'jsItem',
                    settings: {
                      code: `ctx.render('Wrong table item');`,
                    },
                  },
                ],
              },
              {
                type: 'createForm',
                collection: 'employees',
                fields: [
                  {
                    key: 'wrongFormColumn',
                    type: 'jsColumn',
                    settings: {
                      code: `ctx.render('Wrong form column');`,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      context,
    );
    const applyBlueprintVisibleFieldErrors = applyBlueprintErrors.filter(
      (error: any) => error.ruleId === 'data-block-visible-fields-required',
    );

    expect(applyBlueprintVisibleFieldErrors).toHaveLength(3);
    for (const error of applyBlueprintVisibleFieldErrors) {
      expect(error.message).toContain('Add collection field names');
      expect(error.message).toContain('defaults.collections.*.fieldGroups');
      expect(error.message).not.toContain('JS');
    }
    expect(applyBlueprintErrors.map((error: any) => error.ruleId)).not.toContain('data-block-visible-fields-minimum');

    const composeErrors = await collectFlowSurfaceAuthoringErrors(
      'compose',
      {
        blocks: [
          {
            type: 'table',
            collection: 'employees',
            fields: [
              {
                key: 'summary',
                type: 'jsColumn',
                settings: {
                  code: `ctx.render('Summary');`,
                },
              },
            ],
          },
        ],
      },
      context,
    );
    expect(composeErrors.map((error: any) => error.ruleId)).not.toContain('data-block-visible-fields-required');
    expect(composeErrors.map((error: any) => error.ruleId)).not.toContain('data-block-visible-fields-minimum');

    const addBlockErrors = await collectFlowSurfaceAuthoringErrors(
      'addBlock',
      {
        type: 'table',
        resource: {
          collectionName: 'employees',
        },
        fields: [
          {
            key: 'summary',
            type: 'jsColumn',
            settings: {
              code: `ctx.render('Summary');`,
            },
          },
        ],
      },
      context,
    );
    expect(addBlockErrors.map((error: any) => error.ruleId)).not.toContain('data-block-visible-fields-required');
    expect(addBlockErrors.map((error: any) => error.ruleId)).not.toContain('data-block-visible-fields-minimum');

    const addBlocksErrors = await collectFlowSurfaceAuthoringErrors(
      'addBlocks',
      {
        blocks: [
          {
            type: 'table',
            resource: {
              collectionName: 'employees',
            },
            fields: [
              {
                key: 'summary',
                type: 'jsColumn',
                settings: {
                  code: `ctx.render('Summary');`,
                },
              },
            ],
          },
        ],
      },
      context,
    );
    expect(addBlocksErrors.map((error: any) => error.ruleId)).not.toContain('data-block-visible-fields-required');
    expect(addBlocksErrors.map((error: any) => error.ruleId)).not.toContain('data-block-visible-fields-minimum');
  });

  it('should mention showBlockCard in JS block authoring repair hints', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              type: 'jsBlock',
              settings: {
                code: `ctx.render('Summary');`,
                unsupportedSetting: true,
              },
            },
          ],
        },
      ],
    });
    const unsupportedSettingError = errors.find((error: any) => error.ruleId === 'jsBlock-settings-unsupported-key');

    expect(unsupportedSettingError?.details?.repairHint).toContain('settings.showBlockCard');
    expect(unsupportedSettingError?.details?.repairExample?.inlineBlock?.settings?.showBlockCard).toBe(true);
    expect(unsupportedSettingError?.details?.allowedKeys).toContain('showBlockCard');
  });

  it('should preserve aggregate authoring repair instructions through inline and batch wrappers', () => {
    const aggregate = new FlowSurfaceAggregateError([
      {
        path: '$.changes.code',
        ruleId: 'runjs-render-required',
        message: 'jsBlock code must call ctx.render',
        details: {
          requiredBlockType: 'jsBlock',
        },
      },
    ]);

    let inlineError: unknown;
    try {
      rethrowInlineConfigurationError(aggregate, 'flowSurfaces addBlock settings invalid');
    } catch (caught) {
      inlineError = caught;
    }

    expect(inlineError).toBeInstanceOf(FlowSurfaceAggregateError);
    expect((inlineError as FlowSurfaceAggregateError).toResponseBody()).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('flowSurfaces addBlock settings invalid'),
        errorCount: 1,
        details: expect.objectContaining({
          mustFixAllErrorsBeforeRetry: true,
          requiredBlockPolicy: expect.objectContaining({
            requiredBlockTypes: ['jsBlock'],
          }),
        }),
        errors: [expect.objectContaining({ index: 1, ruleId: 'runjs-render-required' })],
      }),
    );

    expect(toFlowSurfaceBatchItemError(aggregate)).toEqual(
      expect.objectContaining({
        code: 'FLOW_SURFACE_AUTHORING_VALIDATION_FAILED',
        status: 400,
        type: 'bad_request',
        errorCount: 1,
        details: expect.objectContaining({
          retryPolicy: 'fix_all_errors_before_retry_same_write',
          requiredBlockPolicy: expect.objectContaining({
            requiredBlockTypes: ['jsBlock'],
          }),
        }),
        errors: [expect.objectContaining({ index: 1, ruleId: 'runjs-render-required' })],
      }),
    );
  });

  it('should preserve chart filter operator repair details on applyBlueprint authoring writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Invalid chart filter operator page',
        },
      },
      assets: {
        charts: {
          pipelineChart: {
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
              filter: {
                logic: '$and',
                items: [
                  {
                    path: 'status',
                    operator: 'notIn',
                    value: ['inactive', 'archived'],
                  },
                ],
              },
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
              key: 'pipelineChart',
              type: 'chart',
              chart: 'pipelineChart',
            },
          ],
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.pipelineChart.query.filter.items[0].operator',
          ruleId: 'filter-group-operator-missing-dollar',
          details: expect.objectContaining({
            invalidOperator: 'notIn',
            suggestedOperator: '$notIn',
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should preserve chart filter operator repair details on configure authoring writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'chart-target' },
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
            dimensions: [{ field: 'status' }],
            filter: {
              status: { notIn: ['inactive', 'archived'] },
            },
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
      {
        hostBlockType: 'ChartBlockModel',
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.query.filter.status.notIn',
          ruleId: 'filter-group-operator-missing-dollar',
          details: expect.objectContaining({
            invalidOperator: 'notIn',
            suggestedOperator: '$notIn',
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should reject invalid chart relative date shorthand on applyBlueprint authoring writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Invalid chart date value page',
        },
      },
      assets: {
        charts: {
          staleChart: {
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
              filter: {
                logic: '$and',
                items: [
                  {
                    path: 'lastFollowupAt',
                    operator: '$dateBefore',
                    value: '-14x',
                  },
                ],
              },
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
              key: 'staleChart',
              type: 'chart',
              chart: 'staleChart',
            },
          ],
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.staleChart.query.filter.items[0].value',
          ruleId: 'filter-group-date-value-invalid',
          details: expect.objectContaining({
            invalidValue: '-14x',
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should reject invalid chart date descriptor objects on applyBlueprint authoring writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Invalid chart date descriptor page',
        },
      },
      assets: {
        charts: {
          staleChart: {
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
              filter: {
                logic: '$and',
                items: [
                  {
                    path: 'lastFollowupAt',
                    operator: '$dateOn',
                    value: { $toNow: 'd', $gt: -7 },
                  },
                ],
              },
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
              key: 'staleChart',
              type: 'chart',
              chart: 'staleChart',
            },
          ],
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.assets.charts.staleChart.query.filter.items[0].value',
          ruleId: 'filter-group-date-value-invalid',
          details: expect.objectContaining({
            invalidValue: { $toNow: 'd', $gt: -7 },
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should guide unsupported chart visual types to supported chart types or jsBlock', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      navigation: {
        item: {
          title: 'Unsupported chart visual type page',
        },
      },
      assets: {
        charts: {
          kpiChart: {
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
              key: 'kpiChart',
              type: 'chart',
              chart: 'kpiChart',
            },
          ],
        },
      ],
    });

    const unsupportedTypeError = errors.find((error: any) => error.ruleId === 'chart-visual-type-unsupported');
    expect(unsupportedTypeError).toMatchObject({
      path: '$.assets.charts.kpiChart.visual.type',
      details: expect.objectContaining({
        type: 'stat',
        supportedVisualTypes: ['line', 'area', 'bar', 'barHorizontal', 'pie', 'doughnut', 'funnel', 'scatter'],
        alternativeBlockType: 'jsBlock',
        fixStrategy: 'use_supported_chart_type_or_jsBlock',
      }),
    });
    expect(unsupportedTypeError?.message).toContain('Supported basic chart visual types');
    expect(unsupportedTypeError?.message).toContain('jsBlock');
    expect(unsupportedTypeError?.message).not.toContain('Do not change this block type');
    expect(unsupportedTypeError?.details?.repairHint).not.toContain('Do not change this block type');
    expect(unsupportedTypeError?.details?.forbiddenFallbacks).not.toContain('jsBlock');
  });

  it('should reject invalid chart date filter values on configure authoring writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'chart-target' },
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
            dimensions: [{ field: 'status' }],
            filter: {
              lastFollowupAt: { $dateBefore: '-14x' },
            },
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
      {
        hostBlockType: 'ChartBlockModel',
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.query.filter.lastFollowupAt.$dateBefore',
          ruleId: 'filter-group-date-value-invalid',
          details: expect.objectContaining({
            invalidValue: '-14x',
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should reject chart date filter values outside the UI contract on configure authoring writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'chart-target' },
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
            dimensions: [{ field: 'status' }],
            filter: {
              lastFollowupAt: { $dateOn: 'thisWeek' },
            },
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
      {
        hostBlockType: 'ChartBlockModel',
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.query.filter.lastFollowupAt.$dateOn',
          ruleId: 'filter-group-date-value-invalid',
          details: expect.objectContaining({
            invalidValue: 'thisWeek',
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should reject invalid defaultFilter date values during authoring validation', async () => {
    const context = createDefaultFilterValidationContext();
    const composeErrors = await collectFlowSurfaceAuthoringErrors(
      'compose',
      {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'blockDefaultFilterDateTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: buildDefaultFilter('thisWeek'),
          },
          {
            key: 'actionSettingsDefaultFilterDateTable',
            type: 'table',
            collection: 'employees',
            actions: [
              {
                key: 'filter',
                type: 'filter',
                settings: {
                  defaultFilter: buildDefaultFilter('-7d'),
                },
              },
            ],
          },
          {
            key: 'defaultActionSettingsDefaultFilterDateTable',
            type: 'table',
            collection: 'employees',
            defaultActionSettings: {
              filter: {
                defaultFilter: buildDefaultFilter('2026-01-01T00:00:00.000Z'),
              },
            },
          },
        ],
      },
      context,
    );
    const configureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'filter-action-target' },
        changes: {
          defaultFilter: buildDefaultFilter({ $toNow: 'd', $gt: -7 }),
        },
      },
      createDefaultFilterValidationContext({
        hostBlockType: 'FilterActionModel',
        hostCollectionName: 'employees',
        hostDataSourceKey: 'main',
      }),
    );

    const errors = [...composeErrors, ...configureErrors];
    expect(errors.map((error: any) => error.ruleId)).toEqual(
      expect.arrayContaining(['filter-group-date-value-invalid']),
    );
    expect(
      errors.filter((error: any) => error.ruleId === 'filter-group-date-value-invalid').map((error: any) => error.path),
    ).toEqual(
      expect.arrayContaining([
        '$.blocks[0].defaultFilter.items[0].value',
        '$.blocks[1].actions[0].settings.defaultFilter.items[0].value',
        '$.blocks[2].defaultActionSettings.filter.defaultFilter.items[0].value',
        '$.changes.defaultFilter.items[0].value',
      ]),
    );
  });

  it('should accept UI-shaped defaultFilter date values during authoring validation', async () => {
    const context = createDefaultFilterValidationContext();
    const composeErrors = await collectFlowSurfaceAuthoringErrors(
      'compose',
      {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'blockDefaultFilterDateTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: buildDefaultFilter({ type: 'thisWeek' }),
          },
          {
            key: 'actionSettingsDefaultFilterDateTable',
            type: 'table',
            collection: 'employees',
            actions: [
              {
                key: 'filter',
                type: 'filter',
                settings: {
                  defaultFilter: buildDefaultFilter('2026-Q1'),
                },
              },
            ],
          },
          {
            key: 'defaultActionSettingsDefaultFilterDateTable',
            type: 'table',
            collection: 'employees',
            defaultActionSettings: {
              filter: {
                defaultFilter: buildDefaultFilter(['2026-01-01', '2026-01-31'], '$dateBetween'),
              },
            },
          },
        ],
      },
      context,
    );
    const configureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'filter-action-target' },
        changes: {
          defaultFilter: buildDefaultFilter({ type: 'past', number: 7, unit: 'day' }),
        },
      },
      createDefaultFilterValidationContext({
        hostBlockType: 'FilterActionModel',
        hostCollectionName: 'employees',
        hostDataSourceKey: 'main',
      }),
    );

    expect([...composeErrors, ...configureErrors].map((error: any) => error.ruleId)).not.toContain(
      'filter-group-date-value-invalid',
    );
  });

  it('should reject dataScope relation fields while allowing scalar relation subfields', async () => {
    const dataScope = {
      logic: '$and',
      items: [
        {
          path: 'manager',
          operator: '$eq',
          value: 1,
          items: [],
        },
        {
          path: 'manager.nickname',
          operator: '$eq',
          value: 'Grace',
        },
      ],
    };
    const expectRelationDataScopeErrors = (errors: any[], path: string) => {
      const relationFieldErrors = errors.filter(
        (error: any) => error.ruleId === 'defaultFilter-relation-field-unsupported',
      );
      expect(relationFieldErrors).toEqual([
        expect.objectContaining({
          path,
          details: expect.objectContaining({
            fieldPath: 'manager',
          }),
        }),
      ]);
      expect(errors.some((error: any) => error.details?.fieldPath === 'manager.nickname')).toBe(false);
    };
    const applyBlueprintErrors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeTableWithRelationDataScope',
                type: 'table',
                collection: 'employees',
                settings: {
                  dataScope,
                },
                fields: ['nickname', 'status', 'email'],
              },
            ],
          },
        ],
      },
      createDefaultFilterValidationContext(),
    );
    const configureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'employee-table-target' },
        changes: {
          dataScope,
        },
      },
      createDefaultFilterValidationContext({
        hostBlockType: 'table',
        hostCollectionName: 'employees',
        hostDataSourceKey: 'main',
      }),
    );

    expectRelationDataScopeErrors(applyBlueprintErrors, '$.tabs[0].blocks[0].settings.dataScope.items[0].path');
    expectRelationDataScopeErrors(configureErrors, '$.changes.dataScope.items[0].path');
  });

  it('should reject UI-incompatible date comparison operators in public dataScope', async () => {
    const dataScope = {
      logic: '$and',
      items: [
        { path: 'lastFollowedAt', operator: '$eq', value: '2026-05-27T00:00:00.000Z' },
        { path: 'startAt', operator: '$gte', value: '2026-05-28T00:00:00.000Z' },
        { path: 'lastFollowedAt', operator: '$exists' },
        { path: 'nickname', operator: '$eq', value: '2026-05-27T00:00:00.000Z' },
      ],
    };

    const applyBlueprintErrors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeTableWithDateDataScope',
                type: 'table',
                collection: 'employees',
                settings: {
                  dataScope,
                },
                fields: ['nickname', 'lastFollowedAt', 'startAt'],
              },
            ],
          },
        ],
      },
      createDefaultFilterValidationContext(),
    );
    const configureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'employee-table-target' },
        changes: {
          dataScope,
        },
      },
      createDefaultFilterValidationContext({
        hostBlockType: 'table',
        hostCollectionName: 'employees',
        hostDataSourceKey: 'main',
      }),
    );

    const expectDateOperatorErrors = (errors: any[], firstPath: string, secondPath: string, thirdPath: string) => {
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: firstPath,
            ruleId: 'dataScope-date-operator-ui-incompatible',
            details: expect.objectContaining({
              fieldPath: 'lastFollowedAt',
              invalidOperator: '$eq',
              suggestedOperator: '$dateOn',
              suggestedValue: '2026-05-27',
            }),
          }),
          expect.objectContaining({
            path: secondPath,
            ruleId: 'dataScope-date-operator-ui-incompatible',
            details: expect.objectContaining({
              fieldPath: 'startAt',
              invalidOperator: '$gte',
              suggestedOperator: '$dateNotBefore',
              suggestedValue: '2026-05-28',
            }),
          }),
          expect.objectContaining({
            path: thirdPath,
            ruleId: 'dataScope-date-operator-ui-incompatible',
            details: expect.objectContaining({
              fieldPath: 'lastFollowedAt',
              invalidOperator: '$exists',
            }),
          }),
        ]),
      );
      expect(errors.some((error: any) => error.details?.fieldPath === 'nickname')).toBe(false);
    };

    expectDateOperatorErrors(
      applyBlueprintErrors,
      '$.tabs[0].blocks[0].settings.dataScope.items[0].operator',
      '$.tabs[0].blocks[0].settings.dataScope.items[1].operator',
      '$.tabs[0].blocks[0].settings.dataScope.items[2].operator',
    );
    expectDateOperatorErrors(
      configureErrors,
      '$.changes.dataScope.items[0].operator',
      '$.changes.dataScope.items[1].operator',
      '$.changes.dataScope.items[2].operator',
    );
  });

  it('should allow UI-compatible date operators in public dataScope', async () => {
    const dataScope = {
      logic: '$and',
      items: [
        { path: 'lastFollowedAt', operator: '$dateOn', value: '2026-05-27' },
        { path: 'startAt', operator: '$dateBetween', value: ['2026-05-01', '2026-05-31'] },
        { path: 'lastFollowedAt', operator: '$notEmpty' },
      ],
    };

    const applyBlueprintErrors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                key: 'employeeTableWithValidDateDataScope',
                type: 'table',
                collection: 'employees',
                settings: {
                  dataScope,
                },
                fields: ['nickname', 'lastFollowedAt', 'startAt'],
              },
            ],
          },
        ],
      },
      createDefaultFilterValidationContext(),
    );
    const configureErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'employee-table-target' },
        changes: {
          dataScope,
        },
      },
      createDefaultFilterValidationContext({
        hostBlockType: 'table',
        hostCollectionName: 'employees',
        hostDataSourceKey: 'main',
      }),
    );

    expect(applyBlueprintErrors.map((error: any) => error.ruleId)).not.toContain(
      'dataScope-date-operator-ui-incompatible',
    );
    expect(configureErrors.map((error: any) => error.ruleId)).not.toContain('dataScope-date-operator-ui-incompatible');
  });

  it('should reject DateTime comparison template arithmetic across authoring condition surfaces', async () => {
    const invalidTemplate = '{{$now - 14 * 24 * 60 * 60 * 1000}}';
    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        assets: {
          charts: {
            staleContacts: {
              query: {
                mode: 'builder',
                resource: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
                },
                measures: [{ field: 'id', aggregation: 'count', alias: 'employeeCount' }],
                dimensions: [{ field: 'status', alias: 'status' }],
                filter: {
                  $and: [
                    {
                      lastFollowedAt: {
                        $lt: invalidTemplate,
                      },
                    },
                  ],
                },
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
            key: 'main',
            title: 'Main',
            blocks: [
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname', 'status', 'email', 'lastFollowedAt'],
                defaultFilter: {
                  logic: '$and',
                  items: [
                    { path: 'lastFollowedAt', operator: '$lt', value: invalidTemplate },
                    { path: 'nickname', operator: '$notEmpty' },
                    { path: 'status', operator: '$notEmpty' },
                    { path: 'email', operator: '$notEmpty' },
                  ],
                },
                settings: {
                  dataScope: {
                    logic: '$and',
                    items: [{ path: 'lastFollowedAt', operator: '$lt', value: invalidTemplate }],
                  },
                },
              },
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['nickname', 'status', 'email', 'lastFollowedAt'],
              },
              {
                key: 'staleContactsChart',
                type: 'chart',
                chart: 'staleContacts',
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: [
                {
                  key: 'staleStatus',
                  targetPath: 'status',
                  when: {
                    logic: '$and',
                    items: [{ path: 'formValues.lastFollowedAt', operator: '$lt', value: invalidTemplate }],
                  },
                  value: {
                    source: 'literal',
                    value: 'stale',
                  },
                },
              ],
            },
          ],
        },
      },
      createDefaultFilterValidationContext(),
    );

    const dateConditionErrors = errors.filter((error: any) => error.ruleId === 'date-condition-value-invalid');
    expect(dateConditionErrors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.assets.charts.staleContacts.query.filter.$and[0].lastFollowedAt.$lt',
        '$.tabs[0].blocks[0].defaultFilter.items[0].value',
        '$.tabs[0].blocks[0].settings.dataScope.items[0].value',
        '$.reaction.items[0].rules[0].when.items[0].value',
      ]),
    );
    expect(
      dateConditionErrors.some((error: any) =>
        String(error.details?.repairHint || '').includes('Do not use template arithmetic'),
      ),
    ).toBe(true);
  });

  it('should allow valid DateTime comparison values without blocking non-date comparisons', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'compose',
      {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'validDateComparisonTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$and',
              items: [
                { path: 'lastFollowedAt', operator: '$lt', value: '2026-05-27T00:00:00.000Z' },
                { path: 'workTime', operator: '$eq', value: '09:30' },
                { path: 'nickname', operator: '$lt', value: '{{$now - 14 * 24 * 60 * 60 * 1000}}' },
                { path: 'status', operator: '$notEmpty' },
                { path: 'email', operator: '$notEmpty' },
              ],
            },
          },
        ],
      },
      createDefaultFilterValidationContext(),
    );

    expect(errors.map((error: any) => error.ruleId)).not.toContain('date-condition-value-invalid');
  });

  it('should reject DateTime comparison shorthand and empty values before database queries', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'compose',
      {
        target: { uid: 'missing-target-never-resolved' },
        blocks: [
          {
            key: 'invalidDateComparisonTable',
            type: 'table',
            collection: 'employees',
            defaultFilter: {
              logic: '$and',
              items: [
                { path: 'lastFollowedAt', operator: '$lt', value: '' },
                { path: 'lastFollowedAt', operator: '$lt', value: '2026' },
                { path: 'lastFollowedAt', operator: '$lt', value: '2026-05' },
                { path: 'lastFollowedAt', operator: '$lt', value: '2026-Q2' },
                { path: 'nickname', operator: '$notEmpty' },
                { path: 'status', operator: '$notEmpty' },
                { path: 'email', operator: '$notEmpty' },
              ],
            },
          },
        ],
      },
      createDefaultFilterValidationContext(),
    );

    const dateConditionErrors = errors.filter((error: any) => error.ruleId === 'date-condition-value-invalid');
    expect(dateConditionErrors.map((error: any) => error.details?.invalidValue)).toEqual([
      '',
      '2026',
      '2026-05',
      '2026-Q2',
    ]);
  });

  it('should allow DateTime reaction conditions bound to context path values on applyBlueprint', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            key: 'main',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['nickname', 'status', 'email', 'lastFollowedAt'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: [
                {
                  key: 'copy-stale-status',
                  targetPath: 'status',
                  when: {
                    logic: '$and',
                    items: [
                      {
                        path: 'formValues.lastFollowedAt',
                        operator: '$dateBefore',
                        value: { source: 'path', path: 'formValues.lastFollowedAt' },
                      },
                    ],
                  },
                  value: {
                    source: 'literal',
                    value: 'stale',
                  },
                },
              ],
            },
          ],
        },
      },
      createDefaultFilterValidationContext(),
    );

    expect(errors.map((error: any) => error.ruleId)).not.toContain('date-condition-value-invalid');
  });

  it('should validate DateTime comparisons across authorable reaction context roots on applyBlueprint', async () => {
    const invalidTemplate = '{{$now - 14 * 24 * 60 * 60 * 1000}}';
    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            key: 'main',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['nickname', 'status', 'email', 'lastFollowedAt', 'startAt'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: [
                {
                  key: 'user-created-at',
                  targetPath: 'status',
                  when: {
                    logic: '$and',
                    items: [{ path: 'user.createdAt', operator: '$lt', value: invalidTemplate }],
                  },
                  value: {
                    source: 'literal',
                    value: 'stale',
                  },
                },
                {
                  key: 'item-start-at',
                  targetPath: 'status',
                  when: {
                    logic: '$and',
                    items: [{ path: 'item.startAt', operator: '$gte', value: invalidTemplate }],
                  },
                  value: {
                    source: 'literal',
                    value: 'active',
                  },
                },
              ],
            },
          ],
        },
      },
      createDefaultFilterValidationContext(),
    );

    const dateConditionErrors = errors.filter((error: any) => error.ruleId === 'date-condition-value-invalid');
    expect(dateConditionErrors.map((error: any) => error.path)).toEqual(
      expect.arrayContaining([
        '$.reaction.items[0].rules[0].when.items[0].value',
        '$.reaction.items[0].rules[1].when.items[0].value',
      ]),
    );
  });

  it('should preserve built-in item context metadata when collection fields have the same names', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'applyBlueprint',
      {
        mode: 'create',
        tabs: [
          {
            key: 'main',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['nickname', 'status', 'email', 'lastFollowedAt'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: [
                {
                  key: 'item-index',
                  targetPath: 'status',
                  when: {
                    logic: '$and',
                    items: [{ path: 'item.index', operator: '$lt', value: 2 }],
                  },
                  value: {
                    source: 'literal',
                    value: 'active',
                  },
                },
              ],
            },
          ],
        },
      },
      createDefaultFilterValidationContext(),
    );

    expect(errors.map((error: any) => error.ruleId)).not.toContain('date-condition-value-invalid');
  });

  it('should reject invalid static date values inside templated chart date ranges on configure writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'chart-target' },
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
            dimensions: [{ field: 'status' }],
            filter: {
              lastFollowupAt: { $dateBetween: ['{{ $vars.start }}', '-14x'] },
            },
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
      {
        hostBlockType: 'ChartBlockModel',
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.query.filter.lastFollowupAt.$dateBetween[1]',
          ruleId: 'filter-group-date-value-invalid',
          details: expect.objectContaining({
            invalidValue: '-14x',
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should reject invalid extra date range array slots on configure writes', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        target: { uid: 'chart-target' },
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
            dimensions: [{ field: 'status' }],
            filter: {
              lastFollowupAt: { $dateBetween: ['{{ $vars.start }}', '2026-01-02', 'junk'] },
            },
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
      {
        hostBlockType: 'ChartBlockModel',
      },
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.query.filter.lastFollowupAt.$dateBetween',
          ruleId: 'filter-group-date-value-invalid',
          details: expect.objectContaining({
            invalidValue: ['{{ $vars.start }}', '2026-01-02', 'junk'],
            requiredBlockType: 'chart',
          }),
        }),
      ]),
    );
  });

  it('should reject malformed linkageRules on configure and action authoring payloads', async () => {
    const configureErrors = await collectFlowSurfaceAuthoringErrors('configure', {
      changes: {
        linkageRules: {},
      },
    });
    const composeErrors = await collectFlowSurfaceAuthoringErrors(
      'compose',
      {
        blocks: [
          {
            type: 'table',
            collection: 'employees',
            fields: ['nickname', 'status', 'email', 'manager'],
            recordActions: [
              {
                type: 'updateRecord',
                settings: {
                  linkageRules: [
                    {
                      key: 'badThen',
                      then: {},
                    },
                    {
                      key: 'badCondition',
                      condition: {
                        logic: '$and',
                        items: [{ path: 'nickname', operator: 'eq', value: 'Alice' }],
                      },
                      actions: [],
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      createDefaultFilterValidationContext(),
    );

    expect(configureErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.changes.linkageRules',
          ruleId: 'linkageRules-invalid-shape',
        }),
      ]),
    );
    expect(composeErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].recordActions[0].settings.linkageRules[0].then',
          ruleId: 'linkageRules-actions-invalid-shape',
        }),
        expect.objectContaining({
          path: '$.blocks[0].recordActions[0].settings.linkageRules[1].condition',
          ruleId: 'linkageRules-condition-invalid-shape',
        }),
      ]),
    );
  });
});

describe('flowSurfaces chart repair wrapping unit', () => {
  it('should preserve chart filter repair options when chart configure repair wrapper rethrows', async () => {
    const service = new FlowSurfacesService({} as any);
    const resolve = vi.fn().mockResolvedValue({ kind: 'block', uid: 'chart-block' });
    const updateSettings = vi.spyOn(service as any, 'updateSettings').mockResolvedValue({});
    vi.spyOn(service as any, 'locator', 'get').mockReturnValue({ resolve });
    vi.spyOn(service as any, 'loadResolvedNode').mockResolvedValue({
      use: 'ChartBlockModel',
      stepParams: {
        chartSettings: {
          configure: {},
        },
      },
    });

    let error: FlowSurfaceBadRequestError | undefined;
    try {
      await (service as any).configureChartBlock(
        { uid: 'chart-block' },
        {
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
            filter: {
              logic: '$and',
              items: [
                {
                  path: 'lastFollowupAt',
                  operator: 'dateBefore',
                  value: '2026-05-16',
                },
              ],
            },
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
        {},
      );
    } catch (caught) {
      error = caught as FlowSurfaceBadRequestError;
    }

    expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect(error?.options).toMatchObject({
      path: 'chart query.filter.items[0].operator',
      ruleId: 'filter-group-operator-missing-dollar',
      details: {
        invalidOperator: 'dateBefore',
        suggestedOperator: '$dateBefore',
        requiredBlockType: 'chart',
      },
    });
    expect(updateSettings).not.toHaveBeenCalled();
  });
});
