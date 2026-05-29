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
  it('should reject ctx.render inside React component render functions but allow top-level helper render calls', () => {
    const invalidErrors = inspectRunJsAuthoringCode({
      code: [
        'function KPIDashboard() {',
        '  return ctx.render(<div>Broken</div>);',
        '}',
        'ctx.render(<KPIDashboard />);',
      ].join('\n'),
      path: '$.runjs.kpi.code',
      modelUse: 'JSBlockModel',
    });

    expect(invalidErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-component-ctx-render-forbidden',
          details: expect.objectContaining({
            component: 'KPIDashboard',
          }),
        }),
      ]),
    );

    const indirectInvalidErrors = inspectRunJsAuthoringCode({
      code: [
        'function renderMetric() {',
        '  ctx.render(<div>Broken</div>);',
        '}',
        'function KPIDashboard() {',
        '  return renderMetric();',
        '}',
        'ctx.render(<KPIDashboard />);',
      ].join('\n'),
      path: '$.runjs.indirectKpi.code',
      modelUse: 'JSBlockModel',
    });

    expect(indirectInvalidErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-component-ctx-render-forbidden',
          details: expect.objectContaining({
            component: 'KPIDashboard',
          }),
        }),
      ]),
    );

    const laterHelperInvalidErrors = inspectRunJsAuthoringCode({
      code: [
        'function KPIDashboard() {',
        '  return renderMetric();',
        '}',
        'const renderMetric = () => {',
        '  ctx.render(<div>Broken</div>);',
        '};',
        'ctx.render(<KPIDashboard />);',
      ].join('\n'),
      path: '$.runjs.laterHelperKpi.code',
      modelUse: 'JSBlockModel',
    });

    expect(laterHelperInvalidErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-component-ctx-render-forbidden',
          details: expect.objectContaining({
            component: 'KPIDashboard',
          }),
        }),
      ]),
    );

    const helperReturnedComponentInvalidErrors = inspectRunJsAuthoringCode({
      code: [
        'function Broken() {',
        '  ctx.render(<div>Broken</div>);',
        '}',
        'function buildMetric() {',
        '  return <Broken />;',
        '}',
        'function KPIDashboard() {',
        '  return buildMetric();',
        '}',
        'ctx.render(<KPIDashboard />);',
      ].join('\n'),
      path: '$.runjs.helperReturnedComponent.code',
      modelUse: 'JSBlockModel',
    });

    expect(helperReturnedComponentInvalidErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-component-ctx-render-forbidden',
          details: expect.objectContaining({
            component: 'Broken',
          }),
        }),
      ]),
    );

    const renderedHelperReturnInvalidErrors = inspectRunJsAuthoringCode({
      code: [
        'function Broken() {',
        '  ctx.render(<div>Broken</div>);',
        '}',
        'function buildMetric() {',
        '  return <Broken />;',
        '}',
        'ctx.render(buildMetric());',
      ].join('\n'),
      path: '$.runjs.renderedHelperReturn.code',
      modelUse: 'JSBlockModel',
    });

    expect(renderedHelperReturnInvalidErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-component-ctx-render-forbidden',
          details: expect.objectContaining({
            component: 'Broken',
          }),
        }),
      ]),
    );

    const validErrors = inspectRunJsAuthoringCode({
      code: [
        'function App() {',
        '  return <div>OK</div>;',
        '}',
        'function renderApp() {',
        '  ctx.render(<App />);',
        '}',
        'renderApp();',
      ].join('\n'),
      path: '$.runjs.helperRender.code',
      modelUse: 'JSBlockModel',
    });

    expect(validErrors).toEqual([]);

    const tryFinallyDirectErrors = inspectRunJsAuthoringCode({
      code: [
        'function App() {',
        '  return <div>OK</div>;',
        '}',
        'try {',
        '  ctx.render(<App />);',
        '} finally {',
        '  ctx.message.info("Rendered");',
        '}',
      ].join('\n'),
      path: '$.runjs.tryFinallyDirect.code',
      modelUse: 'JSBlockModel',
    });

    expect(tryFinallyDirectErrors).toEqual([]);

    const tryFinallyHelperErrors = inspectRunJsAuthoringCode({
      code: [
        'function App() {',
        '  return <div>OK</div>;',
        '}',
        'function renderApp() {',
        '  ctx.render(<App />);',
        '}',
        'try {',
        '  renderApp();',
        '} finally {',
        '  ctx.message.info("Rendered");',
        '}',
      ].join('\n'),
      path: '$.runjs.tryFinallyHelper.code',
      modelUse: 'JSBlockModel',
    });

    expect(tryFinallyHelperErrors).toEqual([]);

    const shadowedComponentErrors = inspectRunJsAuthoringCode({
      code: [
        'function App() {',
        '  return <div>OK</div>;',
        '}',
        'function defineOtherApp() {',
        '  function App() {',
        '    ctx.render(<div>Shadowed</div>);',
        '  }',
        '  void App;',
        '}',
        'ctx.render(<App />);',
      ].join('\n'),
      path: '$.runjs.shadowedComponent.code',
      modelUse: 'JSBlockModel',
    });

    expect(shadowedComponentErrors).toEqual([]);

    const unusedComponentErrors = inspectRunJsAuthoringCode({
      code: [
        'function App() {',
        '  return <div>OK</div>;',
        '}',
        'function Broken() {',
        '  ctx.render(<div>Unused</div>);',
        '}',
        'function unused() {',
        '  return <Broken />;',
        '}',
        'ctx.render(<App />);',
      ].join('\n'),
      path: '$.runjs.unusedComponent.code',
      modelUse: 'JSBlockModel',
    });

    expect(unusedComponentErrors).toEqual([]);

    const nestedHelperErrors = inspectRunJsAuthoringCode({
      code: [
        'function setup() {',
        '  function renderApp() {',
        '    ctx.render(<div>Nested</div>);',
        '  }',
        '}',
        'renderApp();',
      ].join('\n'),
      path: '$.runjs.nestedHelper.code',
      modelUse: 'JSBlockModel',
    });

    expect(nestedHelperErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-render-unreachable',
        }),
      ]),
    );

    const uninitializedNestedHelperErrors = inspectRunJsAuthoringCode({
      code: [
        'function App() {',
        '  return <div>OK</div>;',
        '}',
        'function renderApp() {',
        '  renderInner();',
        '  const renderInner = () => {',
        '    ctx.render(<App />);',
        '  };',
        '}',
        'renderApp();',
      ].join('\n'),
      path: '$.runjs.uninitializedNestedHelper.code',
      modelUse: 'JSBlockModel',
    });

    expect(uninitializedNestedHelperErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-render-top-level-wrapper-forbidden',
        }),
      ]),
    );

    const conditionalHelperErrors = inspectRunJsAuthoringCode({
      code: [
        'function App() {',
        '  return <div>OK</div>;',
        '}',
        'function renderApp() {',
        '  ctx.render(<App />);',
        '}',
        'if (shouldRender) {',
        '  renderApp();',
        '}',
      ].join('\n'),
      path: '$.runjs.conditionalHelper.code',
      modelUse: 'JSBlockModel',
    });

    expect(conditionalHelperErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-render-top-level-wrapper-forbidden',
        }),
      ]),
    );

    const outOfScopeHelperErrors = inspectRunJsAuthoringCode({
      code: [
        '{',
        '  const renderApp = () => {',
        '    ctx.render(<div>Scoped</div>);',
        '  };',
        '}',
        'renderApp();',
      ].join('\n'),
      path: '$.runjs.outOfScopeHelper.code',
      modelUse: 'JSBlockModel',
    });

    expect(outOfScopeHelperErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-render-unreachable',
        }),
      ]),
    );
  });

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
