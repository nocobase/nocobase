/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { inspectRunJsAuthoringCode } from '../flow-surfaces/runjs-authoring';

describe('flowSurfaces RunJS authoring unit validation', () => {
  it('should reject MultiRecordResource getCount in KPI blocks', () => {
    const errors = inspectRunJsAuthoringCode({
      code: [
        'const React = ctx.React || ctx.libs.React;',
        "const resource = ctx.makeResource('MultiRecordResource');",
        "resource.setResourceName('claims');",
        'resource.refresh();',
        "ctx.render(React.createElement('div', null, resource.getCount() || 0));",
      ].join('\n'),
      path: '$.runjs.resourceCount.code',
      modelUse: 'JSBlockModel',
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.runjs.resourceCount.code',
          ruleId: 'runjs-flow-resource-method-invalid',
          details: expect.objectContaining({
            method: 'getCount',
            repairClass: 'resource-runtime-contract-stop',
            suggestedMethod: 'getData',
          }),
        }),
      ]),
    );
  });

  it('should reject helper-forwarded date range objects in resource filters', () => {
    const fields = [{ name: 'occurDate', type: 'date', interface: 'datetime' }];
    const fieldsByName = new Map(fields.map((field) => [field.name, field]));
    const context = {
      getCollection: (_dataSourceKey, collectionName) =>
        collectionName === 'intelligenceItems'
          ? {
              dataSourceKey: 'main',
              name: 'intelligenceItems',
              fields: fieldsByName,
              getField: (fieldName: string) => fieldsByName.get(fieldName),
              getFields: () => fields,
            }
          : null,
    };

    const directErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "resource.setFilter({ occurDate: { $dateOn: { $dateTo: 'now', $dateFrom: '-7d' } } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.directDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(directErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-range-object-invalid',
        }),
      ]),
    );

    const unrelatedErrors = inspectRunJsAuthoringCode(
      {
        code: [
          'function configureWidget(collectionName, filter) {',
          '  const widget = { setResourceName() {}, setFilter() {} };',
          '  widget.setResourceName(collectionName);',
          '  widget.setFilter(filter);',
          '}',
          "configureWidget('intelligenceItems', { occurDate: { $dateOn: { $dateTo: 'now', $dateFrom: '-7d' } } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.unrelatedWidgetFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(unrelatedErrors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-range-object-invalid',
        }),
      ]),
    );

    const errors = inspectRunJsAuthoringCode(
      {
        code: [
          'async function countRecords(collectionName, filter) {',
          "  const resource = ctx.makeResource('MultiRecordResource');",
          '  resource.setResourceName(collectionName);',
          '  if (filter) resource.setFilter(filter);',
          '  await resource.refresh();',
          '  return resource.getMeta?.()?.count ?? 0;',
          '}',
          "await countRecords('intelligenceItems', { occurDate: { $dateOn: { $dateTo: 'now', $dateFrom: '-7d' } } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.dateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-range-object-invalid',
          details: expect.objectContaining({
            collectionName: 'intelligenceItems',
            fieldPath: 'occurDate',
            operator: '$dateOn',
            unsupportedKeys: ['$dateTo', '$dateFrom'],
            suggestedValue: { type: 'past', number: 7, unit: 'day' },
          }),
        }),
      ]),
    );
  });
});
