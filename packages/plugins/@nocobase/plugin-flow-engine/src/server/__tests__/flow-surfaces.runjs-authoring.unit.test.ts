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

  it('should reject invalid collection resource actions before RunJS is persisted', () => {
    const context = {
      getCollection: (_dataSourceKey: string, collectionName: string) =>
        collectionName === 'readonly_tasks'
          ? { name: collectionName, options: { availableActions: ['view'] } }
          : { name: collectionName },
    };

    const refreshErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const actionName = 'refresh';",
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('tasks');",
          'await resource.runAction(actionName, { method: "get" });',
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.invalidAction.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );

    expect(refreshErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-action-invalid',
          details: expect.objectContaining({
            actionName: 'refresh',
            collectionName: 'tasks',
            invalidReason: 'refresh-is-flow-resource-method',
            repairClass: 'resource-runtime-contract-stop',
            suggestedMethod: 'refresh',
          }),
        }),
      ]),
    );

    const chainedRefreshErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "await ctx.makeResource('MultiRecordResource')",
          "  .setResourceName('tasks')",
          "  .runAction('refresh', { method: 'get' });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.chainedInvalidAction.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(chainedRefreshErrors.map((error: any) => error.ruleId)).toContain('runjs-resource-action-invalid');

    const setRefreshActionErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('tasks');",
          "resource.setRefreshAction('refresh');",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.invalidRefreshAction.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(setRefreshActionErrors.map((error: any) => error.ruleId)).toContain('runjs-resource-action-invalid');

    const readonlyErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('readonly_tasks');",
          "await resource.runAction('destroy', { filterByTk: 1 });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.readonlyAction.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );

    expect(readonlyErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-action-invalid',
          details: expect.objectContaining({
            actionName: 'destroy',
            collectionName: 'readonly_tasks',
            invalidReason: 'collection-action-unavailable',
          }),
        }),
      ]),
    );

    const validErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('tasks');",
          "await resource.runAction('list', { method: 'get' });",
          "await resource.runAction('updateOrCreate', { values: { title: 'Done' } });",
          "await resource.runAction('move', { sourceId: 1, targetId: 2 });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.validActions.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(validErrors.map((error: any) => error.ruleId)).not.toContain('runjs-resource-action-invalid');

    const sqlErrors = inspectRunJsAuthoringCode({
      code: [
        "const resource = ctx.makeResource('SQLResource');",
        "await resource.runAction('run', { params: {} });",
        'ctx.render(null);',
      ].join('\n'),
      path: '$.runjs.sqlAction.code',
      modelUse: 'JSBlockModel',
    });
    expect(sqlErrors.map((error: any) => error.ruleId)).not.toContain('runjs-resource-action-invalid');
  });

  it('should reject invalid collection actions in request and ctx.api.resource calls', () => {
    const context = {
      getCollection: (_dataSourceKey: string, collectionName: string) =>
        collectionName === 'tasks' ? { name: collectionName } : null,
    };

    [
      {
        code: "ctx.render(null);\nawait ctx.runjs('collection:refresh', {});",
        path: '$.runjs.collectionRefresh.code',
      },
      {
        code: "ctx.render(null);\nawait ctx.request('collection:refresh');",
        path: '$.runjs.requestCollectionRefresh.code',
      },
      {
        code: "ctx.render(null);\nawait ctx.api.request({ url: 'collection:refresh' });",
        path: '$.runjs.apiRequestCollectionRefresh.code',
      },
      {
        code: "ctx.render(null);\nawait ctx.api.request({ url: '/api/tasks:refresh' });",
        path: '$.runjs.apiRequestNamedCollectionRefresh.code',
      },
      {
        code: "ctx.render(null);\nawait ctx.api.request({ resource: 'tasks', action: 'refresh' });",
        path: '$.runjs.apiRequestResourceActionRefresh.code',
      },
      {
        code: "ctx.render(null);\nawait ctx.request({ resource: 'tasks', action: 'refresh' });",
        path: '$.runjs.requestResourceActionRefresh.code',
      },
      {
        code: "const resource = 'tasks';\nconst action = 'refresh';\nctx.render(null);\nawait ctx.api.request({ resource, action });",
        path: '$.runjs.apiRequestConstResourceActionRefresh.code',
      },
      {
        code: "const resource = 'tasks';\nconst action = 'refresh';\nctx.render(null);\nawait ctx.request({ resource, action });",
        path: '$.runjs.requestConstResourceActionRefresh.code',
      },
      {
        code: "ctx.render(null);\nawait ctx.api.resource('tasks', 'refresh');",
        path: '$.runjs.apiResourceActionRefresh.code',
      },
      {
        code: "ctx.render(null);\nawait ctx.api.resource('tasks').refresh();",
        path: '$.runjs.apiResourceMethodRefresh.code',
      },
      {
        code: "ctx.render(null);\nawait (true && ctx.api.resource('tasks').refresh)();",
        path: '$.runjs.apiResourceLogicalRefresh.code',
      },
      {
        code: "const collectionName = 'tasks';\nctx.render(null);\nawait ctx.api.resource(collectionName, 'refresh');",
        path: '$.runjs.apiResourceConstActionRefresh.code',
      },
      {
        code: "const refresh = cond ? ctx.api.resource('tasks').refresh : ctx.api.resource('tasks').refresh;\nctx.render(null);\nawait refresh();",
        path: '$.runjs.apiResourceConditionalAliasRefresh.code',
      },
      {
        code: "const collectionName = 'tasks';\nctx.render(null);\nawait ctx.api.request({ url: `/api/${collectionName}:refresh` });",
        path: '$.runjs.apiRequestTemplateRefresh.code',
      },
      {
        code: "const collectionName = 'tasks';\nconst endpoint = `/api/${collectionName}:refresh`;\nctx.render(null);\nawait ctx.api.request({ url: endpoint });",
        path: '$.runjs.apiRequestTemplateBindingRefresh.code',
      },
      {
        code: "const collectionName = 'tasks';\nctx.render(null);\nawait ctx.request({ url: `${collectionName}:refresh` });",
        path: '$.runjs.requestTemplateRefresh.code',
      },
      {
        code: "const collectionName = 'tasks';\nctx.render(null);\nawait ctx.runjs(`${collectionName}:refresh`, {});",
        path: '$.runjs.runjsTemplateRefresh.code',
      },
      {
        code: "const collectionName = 'tasks';\nconst resource = ctx.api.resource(collectionName);\nctx.render(null);\nawait resource.refresh();",
        path: '$.runjs.apiResourceConstAliasRefresh.code',
      },
      {
        code: "const refresh = ctx.api.resource('tasks').refresh;\nctx.render(null);\nawait refresh();",
        path: '$.runjs.apiResourceAssignedRefresh.code',
      },
      {
        code: "const { refresh } = ctx.api.resource('tasks');\nctx.render(null);\nawait refresh();",
        path: '$.runjs.apiResourceDestructuredRefresh.code',
      },
      {
        code: "ctx.render(null);\nawait ctx.api.resource('tasks').refresh.call(null);",
        path: '$.runjs.apiResourceRefreshCall.code',
      },
    ].forEach(({ code, path }) => {
      const errors = inspectRunJsAuthoringCode(
        {
          code,
          path,
          modelUse: 'JSBlockModel',
        },
        context,
      );

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path,
            ruleId: 'runjs-resource-action-invalid',
            details: expect.objectContaining({
              actionName: 'refresh',
              repairClass: 'resource-runtime-contract-stop',
            }),
          }),
        ]),
      );
    });

    expect(
      inspectRunJsAuthoringCode({
        code: "ctx.render(null);\nawait ctx.api.request({ url: '/app:getInfo', method: 'get' });",
        path: '$.runjs.customEndpoint.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode(
        {
          code: [
            "let collectionName = 'readonly_tasks';",
            "collectionName = 'tasks';",
            'ctx.render(null);',
            'await ctx.api.resource(collectionName).destroy({ filterByTk: 1 });',
          ].join('\n'),
          path: '$.runjs.mutableCollectionName.code',
          modelUse: 'JSBlockModel',
        },
        {
          getCollection: (_dataSourceKey: string, collectionName: string) =>
            collectionName === 'readonly_tasks'
              ? { name: collectionName, options: { availableActions: ['view'] } }
              : { name: collectionName },
        },
      ).map((error: any) => error.ruleId),
    ).not.toContain('runjs-resource-action-invalid');

    expect(
      inspectRunJsAuthoringCode(
        {
          code: [
            "let resourceName = 'flowSurfaces';",
            'ctx.render(null);',
            "await ctx.api.resource(resourceName).compose({ target: { uid: 'root' } });",
          ].join('\n'),
          path: '$.runjs.mutableNonCollectionApiResource.code',
          modelUse: 'JSBlockModel',
        },
        {
          getCollection: (_dataSourceKey: string, collectionName: string) =>
            collectionName === 'tasks' ? { name: collectionName } : null,
        },
      ).map((error: any) => error.ruleId),
    ).not.toContain('runjs-resource-action-invalid');

    const externalDataSourceErrors = inspectRunJsAuthoringCode(
      {
        code: "ctx.render(null);\nawait ctx.api.request({ url: '/api/tasks:refresh' });\nawait ctx.api.resource('tasks').refresh();",
        path: '$.runjs.externalDataSourceRefresh.code',
        modelUse: 'JSBlockModel',
      },
      {
        currentDataSourceKey: 'external',
        getCollection: (dataSourceKey: string, collectionName: string) =>
          dataSourceKey === 'external' && collectionName === 'tasks' ? { name: collectionName } : null,
      },
    );
    expect(externalDataSourceErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-action-invalid',
          details: expect.objectContaining({
            actionName: 'refresh',
            dataSourceKey: 'external',
          }),
        }),
      ]),
    );

    const dynamicDataSourceErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const dataSourceKey = Math.random() > 0.5 ? 'main' : 'external';",
          "const resource = ctx.makeResource('MultiRecordResource');",
          'resource.setDataSourceKey(dataSourceKey);',
          "resource.setResourceName('readonly_tasks');",
          "await resource.runAction('destroy', { filterByTk: 1 });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.dynamicDataSourceAction.code',
        modelUse: 'JSBlockModel',
      },
      {
        currentDataSourceKey: 'main',
        getCollection: (dataSourceKey: string, collectionName: string) =>
          dataSourceKey === 'main' && collectionName === 'readonly_tasks'
            ? { name: collectionName, options: { availableActions: ['view'] } }
            : { name: collectionName },
      },
    );
    expect(dynamicDataSourceErrors.map((error: any) => error.ruleId)).not.toContain('runjs-resource-action-invalid');

    const dynamicDataSourceRefreshErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const dataSourceKey = Math.random() > 0.5 ? 'main' : 'external';",
          "const resource = ctx.makeResource('MultiRecordResource');",
          'resource.setDataSourceKey(dataSourceKey);',
          "resource.setResourceName('tasks');",
          "await resource.runAction('refresh');",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.dynamicDataSourceRefresh.code',
        modelUse: 'JSBlockModel',
      },
      {
        currentDataSourceKey: 'main',
        getCollection: (dataSourceKey: string, collectionName: string) =>
          dataSourceKey === 'main' && collectionName === 'tasks' ? { name: collectionName } : null,
      },
    );
    expect(dynamicDataSourceRefreshErrors.map((error: any) => error.ruleId)).toContain('runjs-resource-action-invalid');

    expect(
      inspectRunJsAuthoringCode({
        code: "ctx.render(null);\nawait ctx.api.resource('flowSurfaces').compose({ target: { uid: 'root' } });",
        path: '$.runjs.nonCollectionApiResource.code',
        modelUse: 'JSBlockModel',
      }).map((error: any) => error.ruleId),
    ).not.toContain('runjs-resource-action-invalid');

    expect(
      inspectRunJsAuthoringCode(
        {
          code: "ctx.render(null);\nawait ctx.request({ url: '/api/tasks/1/assignees:refresh' });",
          path: '$.runjs.associationRefresh.code',
          modelUse: 'JSBlockModel',
        },
        {
          getCollection: (_dataSourceKey: string, collectionName: string) =>
            collectionName === 'tasks'
              ? {
                  name: collectionName,
                  getField: (fieldName: string) =>
                    fieldName === 'assignees' ? { name: fieldName, target: 'users' } : null,
                }
              : collectionName === 'users'
                ? { name: collectionName }
                : null,
        },
      ).map((error: any) => error.ruleId),
    ).toContain('runjs-resource-action-invalid');

    expect(
      inspectRunJsAuthoringCode(
        {
          code: "ctx.render(null);\nawait ctx.request({ url: '/api/tasks/1/assignees:set' });",
          path: '$.runjs.associationSet.code',
          modelUse: 'JSBlockModel',
        },
        {
          getCollection: (_dataSourceKey: string, collectionName: string) =>
            collectionName === 'tasks'
              ? {
                  name: collectionName,
                  getField: (fieldName: string) =>
                    fieldName === 'assignees' ? { name: fieldName, target: 'users' } : null,
                }
              : collectionName === 'users'
                ? { name: collectionName, options: { availableActions: ['update'] } }
                : null,
        },
      ).map((error: any) => error.ruleId),
    ).not.toContain('runjs-resource-action-invalid');
  });

  it('should reject helper-forwarded date range objects in resource filters', () => {
    const fields = [
      { name: 'occurDate', type: 'date', interface: 'datetime' },
      { name: 'createdAt', type: 'date', interface: 'datetime' },
    ];
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

  it('should reject statically invalid RunJS date filter values', () => {
    const fields = [{ name: 'createdAt', type: 'date', interface: 'datetime' }];
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

    const helperForwardedErrors = inspectRunJsAuthoringCode(
      {
        code: [
          'async function countRecords(collectionName, filter) {',
          "  const resource = ctx.makeResource('MultiRecordResource');",
          '  resource.setResourceName(collectionName);',
          '  if (filter) resource.setFilter(filter);',
          '  await resource.refresh();',
          '  return resource.getMeta?.()?.count ?? 0;',
          '}',
          "await countRecords('intelligenceItems', { createdAt: { $dateOn: { $toNow: 'd', $gt: -7 } } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.strictDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(helperForwardedErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-value-invalid',
          details: expect.objectContaining({
            collectionName: 'intelligenceItems',
            fieldPath: 'createdAt',
            invalidValue: { $toNow: 'd', $gt: -7 },
            operator: '$dateOn',
          }),
        }),
      ]),
    );

    const undefinedErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          'resource.setFilter({ createdAt: { $dateOn: undefined } });',
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.undefinedDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(undefinedErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-value-invalid',
          details: expect.objectContaining({
            fieldPath: 'createdAt',
            invalidReason: 'date filter value is required',
            operator: '$dateOn',
          }),
        }),
      ]),
    );

    const addFilterGroupErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "resource.addFilterGroup('dashboard', { createdAt: { $dateBetween: ['2026-01-01', '2026-01-02', 'x'] } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.addFilterGroupDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(addFilterGroupErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-value-invalid',
          details: expect.objectContaining({
            fieldPath: 'createdAt',
            operator: '$dateBetween',
          }),
        }),
      ]),
    );

    const constFilterErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          'const filter = { createdAt: { $dateOn: undefined } };',
          'resource.setFilter(filter);',
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.constFilterDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(constFilterErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-value-invalid',
          details: expect.objectContaining({
            fieldPath: 'createdAt',
            invalidReason: 'date filter value is required',
            operator: '$dateOn',
          }),
        }),
      ]),
    );

    const constAddFilterGroupErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "const filter = { createdAt: { $dateOn: { $toNow: 'd', $gt: -7 } } };",
          "resource.addFilterGroup('dashboard', filter);",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.constAddFilterGroupDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(constAddFilterGroupErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-value-invalid',
          details: expect.objectContaining({
            fieldPath: 'createdAt',
            invalidValue: { $toNow: 'd', $gt: -7 },
            operator: '$dateOn',
          }),
        }),
      ]),
    );

    const nestedAliasErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "const bad = ['2026-01-01', '2026-01-02', 'x'];",
          'resource.setFilter({ createdAt: { $dateBetween: bad } });',
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.nestedAliasDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(nestedAliasErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-value-invalid',
          details: expect.objectContaining({
            fieldPath: 'createdAt',
            operator: '$dateBetween',
          }),
        }),
      ]),
    );

    const typoErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "resource.setFilter({ createdAt: { $dataOn: '2026-01-01' } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.dateOperatorTypo.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(typoErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-operator-invalid',
          details: expect.objectContaining({
            operator: '$dataOn',
            suggestedOperator: '$dateOn',
          }),
        }),
      ]),
    );

    const validErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "resource.setFilter({ createdAt: { $dateOn: { type: 'past', number: 7, unit: 'day' } } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.validDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(validErrors).toEqual([]);

    const validAliasErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "const period = { type: 'past', number: 7, unit: 'day' };",
          'resource.setFilter({ createdAt: { $dateOn: period } });',
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.validAliasDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(validAliasErrors).toEqual([]);

    const mutatedAliasErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          'const filter = { createdAt: { $dateOn: undefined } };',
          "(() => { filter.createdAt.$dateOn = '2026-01-01'; })();",
          'resource.setFilter(filter);',
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.mutatedAliasDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(mutatedAliasErrors).toEqual([]);

    const computedMutationErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "const key = 'createdAt';",
          'const filter = { createdAt: { $dateOn: undefined } };',
          "filter[key].$dateOn = '2026-01-01';",
          'resource.setFilter(filter);',
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.computedMutationDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(computedMutationErrors).toEqual([]);

    const computedInvalidMutationErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "const key = 'createdAt';",
          "const filter = { createdAt: { $dateOn: '2026-01-01' } };",
          'filter[key].$dateOn = undefined;',
          'resource.setFilter(filter);',
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.computedInvalidMutationDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(computedInvalidMutationErrors).toEqual([]);

    const shadowedUndefinedErrors = inspectRunJsAuthoringCode(
      {
        code: [
          'function renderWithDate(undefined) {',
          "  const resource = ctx.makeResource('MultiRecordResource');",
          "  resource.setResourceName('intelligenceItems');",
          '  resource.setFilter({ createdAt: { $dateOn: undefined } });',
          '  ctx.render(null);',
          '}',
          "renderWithDate('2026-01-01');",
        ].join('\n'),
        path: '$.runjs.shadowedUndefinedDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(shadowedUndefinedErrors).toEqual([]);
  });
});
