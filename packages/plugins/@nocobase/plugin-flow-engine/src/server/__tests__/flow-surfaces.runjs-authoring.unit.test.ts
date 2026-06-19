/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  collectFlowRegistryRunJsAuthoringErrors,
  collectRunJsAuthoringErrors,
  inspectRunJsAuthoringCode,
} from '../flow-surfaces/runjs-authoring';

describe('flowSurfaces RunJS authoring unit validation', () => {
  it('should use AST function body ranges for destructured RunJS component parameters', () => {
    const destructuredDeclarationErrors = inspectRunJsAuthoringCode({
      code: [
        'const React = ctx.React;',
        'function Comp({ label, value } = {}) {',
        '  return <div>{label}:{value}</div>;',
        '}',
        'ctx.render(<Comp label="A" value="B" />);',
      ].join('\n'),
      path: '$.runjs.destructuredDeclaration.code',
      modelUse: 'JSBlockModel',
    });

    expect(destructuredDeclarationErrors).toEqual([]);

    const patternMatrixErrors = inspectRunJsAuthoringCode({
      code: [
        'const React = ctx.React;',
        'const A = ([first]) => <span>{first}</span>;',
        'const B = function ({ label, ...rest }) { return <span>{label}</span>; };',
        'const C = async ({ label } = {}) => { return label; };',
        'function outer() {',
        '  function inner({ label }) { return <span>{label}</span>; }',
        '  return inner;',
        '}',
        'ctx.render(<div><A {...["x"]} /><B label="y" /></div>);',
      ].join('\n'),
      path: '$.runjs.patternMatrix.code',
      modelUse: 'JSBlockModel',
    });

    expect(patternMatrixErrors).toEqual([]);
  });

  it('should keep React Hook top-level validation after switching to AST function ranges', () => {
    const componentHookErrors = inspectRunJsAuthoringCode({
      code: [
        'const React = ctx.React;',
        'function Comp({ label }) {',
        '  const normalized = React.useMemo(() => label || "A", [label]);',
        '  return <div>{normalized}</div>;',
        '}',
        'ctx.render(<Comp label="A" />);',
      ].join('\n'),
      path: '$.runjs.componentHook.code',
      modelUse: 'JSBlockModel',
    });

    expect(componentHookErrors).toEqual([]);

    const topLevelHookErrors = inspectRunJsAuthoringCode({
      code: [
        'const React = ctx.React;',
        'const value = React.useMemo(() => "A", []);',
        'ctx.render(<div>{value}</div>);',
      ].join('\n'),
      path: '$.runjs.topLevelHook.code',
      modelUse: 'JSBlockModel',
    });

    expect(topLevelHookErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-react-hook-top-level-forbidden',
        }),
      ]),
    );
  });

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
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'renderApp',
          }),
        }),
        expect.objectContaining({
          ruleId: 'runjs-render-top-level-wrapper-forbidden',
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

    const emptyAvailableErrors = inspectRunJsAuthoringCode(
      {
        code: [
          'ctx.render(null);',
          "await ctx.api.resource('no_actions', 'list');",
          "await ctx.api.resource('empty_unavailable', 'destroy');",
        ].join('\n'),
        path: '$.runjs.emptyActionMetadata.code',
        modelUse: 'JSBlockModel',
      },
      {
        getCollection: (_dataSourceKey: string, collectionName: string) =>
          collectionName === 'no_actions'
            ? { name: collectionName, options: { availableActions: [] } }
            : collectionName === 'empty_unavailable'
              ? { name: collectionName, options: { unavailableActions: [] } }
              : { name: collectionName },
      },
    );
    expect(
      emptyAvailableErrors.some(
        (error: any) =>
          error.ruleId === 'runjs-resource-action-invalid' && error.details?.collectionName === 'no_actions',
      ),
    ).toBe(false);
    expect(
      emptyAvailableErrors.some(
        (error: any) =>
          error.ruleId === 'runjs-resource-action-invalid' && error.details?.collectionName === 'empty_unavailable',
      ),
    ).toBe(false);

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
        code: "const req = { resource: 'tasks', action: 'refresh' };\nctx.render(null);\nawait ctx.request(req);",
        path: '$.runjs.requestAliasedResourceActionRefresh.code',
      },
      {
        code: "const reqs = { refresh: { url: '/api/tasks:refresh' } };\nctx.render(null);\nawait ctx.api.request(reqs.refresh);",
        path: '$.runjs.apiRequestMemberAliasedUrlRefresh.code',
      },
      {
        code: "const reqs = { refresh: { resource: 'tasks', action: 'refresh' } };\nctx.render(null);\nawait ctx.request(reqs['refresh']);",
        path: '$.runjs.requestMemberAliasedResourceActionRefresh.code',
      },
      {
        code: "const reqs = { refresh: { url: '/api/tasks:refresh' } };\nconst { refresh } = reqs;\nctx.render(null);\nawait ctx.api.request(refresh);",
        path: '$.runjs.apiRequestDestructuredConfigRefresh.code',
      },
      {
        code: "const names = { tasks: 'tasks' };\nctx.render(null);\nawait ctx.api.resource(names.tasks).refresh();",
        path: '$.runjs.apiResourceMemberNameRefresh.code',
      },
      {
        code: "const names = { tasks: 'tasks' };\nconst actions = { refresh: 'refresh' };\nctx.render(null);\nawait ctx.api.resource(names.tasks, actions.refresh);",
        path: '$.runjs.apiResourceMemberActionRefresh.code',
      },
      {
        code: "const maps = { names: { tasks: 'tasks' }, actions: { refresh: 'refresh' } };\nconst resource = ctx.makeResource('MultiRecordResource');\nresource.setResourceName(maps.names.tasks);\nawait resource.runAction(maps.actions.refresh);\nctx.render(null);",
        path: '$.runjs.flowResourceMemberActionRefresh.code',
      },
      {
        code: "const maps = { names: { tasks: 'tasks' } };\nconst names = maps.names;\nctx.render(null);\nawait ctx.api.resource(names.tasks).refresh();",
        path: '$.runjs.apiResourceObjectAliasMemberRefresh.code',
      },
      {
        code: "const maps = { names: { tasks: 'tasks' } };\nconst { names } = maps;\nctx.render(null);\nawait ctx.api.resource(names.tasks).refresh();",
        path: '$.runjs.apiResourceDestructuredObjectAliasRefresh.code',
      },
      {
        code: "const actions = { refresh: 'refresh' };\nconst { refresh } = actions;\nctx.render(null);\nawait ctx.api.resource('tasks', refresh);",
        path: '$.runjs.apiResourceDestructuredActionRefresh.code',
      },
      {
        code: "const names = { tasks: 'tasks' };\nif (condition) names.tasks = selectedResource;\nctx.render(null);\nawait ctx.api.resource(names.tasks).refresh();",
        path: '$.runjs.conditionalMemberWriteRefresh.code',
      },
      {
        code: "const names = { tasks: 'tasks' };\nfunction mutateName() { names.tasks = selectedResource; }\nctx.render(null);\nawait ctx.api.resource(names.tasks).refresh();",
        path: '$.runjs.nestedMemberWriteRefresh.code',
      },
      {
        code: "const urls = { refresh: '/api/tasks:refresh' };\nctx.render(null);\nawait ctx.api.request({ url: urls.refresh });",
        path: '$.runjs.apiRequestMemberUrlRefresh.code',
      },
      {
        code: "const req = { url: '/api/tasks:refresh' };\nif (condition) req.url = selectedUrl;\nctx.render(null);\nawait ctx.api.request(req);",
        path: '$.runjs.conditionalRequestConfigWriteRefresh.code',
      },
      {
        code: "ctx.render(null);\nawait ctx.api.request({ url: '/app:getInfo', url: '/api/tasks:refresh' });",
        path: '$.runjs.apiRequestDuplicateUrlRefresh.code',
      },
      {
        code: "const req = { url: '/api/tasks:refresh' };\nctx.render(null);\nawait ctx.api.request({ ...req });",
        path: '$.runjs.apiRequestSpreadUrlRefresh.code',
      },
      {
        code: "const req = { url: '/api/tasks:refresh' };\nctx.render(null);\nawait ctx.request({ ...req });",
        path: '$.runjs.requestSpreadUrlRefresh.code',
      },
      {
        code: "const req = { resource: 'tasks', action: 'refresh' };\nctx.render(null);\nawait ctx.api.request({ ...req });",
        path: '$.runjs.apiRequestSpreadResourceActionRefresh.code',
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
      inspectRunJsAuthoringCode({
        code: "const req = { url: '/api/tasks:refresh' };\nctx.render(null);\nawait ctx.api.request({ ...req, url: '/app:getInfo' });",
        path: '$.runjs.spreadUrlOverrideSafe.code',
        modelUse: 'JSBlockModel',
      }).map((error: any) => error.ruleId),
    ).not.toContain('runjs-resource-action-invalid');

    expect(
      inspectRunJsAuthoringCode(
        {
          code: "ctx.render(null);\nawait ctx.api.request({ url: '/api/tasks/1:refresh?pageSize=1#detail' });",
          path: '$.runjs.apiRequestRecordRefresh.code',
          modelUse: 'JSBlockModel',
        },
        context,
      ).map((error: any) => error.ruleId),
    ).not.toContain('runjs-resource-action-invalid');

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

    expect(
      inspectRunJsAuthoringCode(
        {
          code: [
            "const maps = { names: { tasks: 'readonly_tasks' } };",
            'const names = maps.names;',
            'names.tasks = selectedResource;',
            'ctx.render(null);',
            'await ctx.api.resource(maps.names.tasks).destroy({ filterByTk: 1 });',
          ].join('\n'),
          path: '$.runjs.aliasedMemberMutationResourceUnknown.code',
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
            "const maps = { names: { tasks: 'readonly_tasks' } };",
            'const names = maps.names;',
            '{',
            "  const maps = { names: { tasks: 'tasks' } };",
            '  maps.names.tasks = selectedResource;',
            '}',
            'ctx.render(null);',
            'await ctx.api.resource(names.tasks).destroy({ filterByTk: 1 });',
          ].join('\n'),
          path: '$.runjs.shadowedSourceMutationDoesNotInvalidateAlias.code',
          modelUse: 'JSBlockModel',
        },
        {
          getCollection: (_dataSourceKey: string, collectionName: string) =>
            collectionName === 'readonly_tasks'
              ? { name: collectionName, options: { availableActions: ['view'] } }
              : { name: collectionName },
        },
      ).map((error: any) => error.ruleId),
    ).toContain('runjs-resource-action-invalid');

    expect(
      inspectRunJsAuthoringCode(
        {
          code: [
            "const req = { url: '/api/tasks:refresh' };",
            'const same = req;',
            'same.url = selectedUrl;',
            'ctx.render(null);',
            'await ctx.api.request({ ...req });',
          ].join('\n'),
          path: '$.runjs.aliasedRequestMutationEndpointUnknown.code',
          modelUse: 'JSBlockModel',
        },
        {
          getCollection: (_dataSourceKey: string, collectionName: string) =>
            collectionName === 'tasks' ? { name: collectionName } : null,
        },
      ).map((error: any) => error.ruleId),
    ).not.toContain('runjs-resource-action-invalid');

    expect(
      inspectRunJsAuthoringCode(
        {
          code: [
            "const maps = { names: { tasks: 'readonly_tasks' } };",
            'const names = maps.names;',
            'maps.names.tasks = selectedResource;',
            'ctx.render(null);',
            'await ctx.api.resource(names.tasks).destroy({ filterByTk: 1 });',
          ].join('\n'),
          path: '$.runjs.sourceSideMutationAliasResourceUnknown.code',
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
            "const req = { url: '/api/tasks:refresh' };",
            'const same = req;',
            'req.url = selectedUrl;',
            'ctx.render(null);',
            'await ctx.api.request(same);',
          ].join('\n'),
          path: '$.runjs.sourceSideMutationRequestUnknown.code',
          modelUse: 'JSBlockModel',
        },
        {
          getCollection: (_dataSourceKey: string, collectionName: string) =>
            collectionName === 'tasks' ? { name: collectionName } : null,
        },
      ).map((error: any) => error.ruleId),
    ).not.toContain('runjs-resource-action-invalid');

    expect(
      inspectRunJsAuthoringCode(
        {
          code: [
            "const req = { url: '/api/tasks:refresh' };",
            'req.url = selectedUrl;',
            'const same = req;',
            'ctx.render(null);',
            'await ctx.api.request(same);',
          ].join('\n'),
          path: '$.runjs.preAliasSourceMutationRequestUnknown.code',
          modelUse: 'JSBlockModel',
        },
        {
          getCollection: (_dataSourceKey: string, collectionName: string) =>
            collectionName === 'tasks' ? { name: collectionName } : null,
        },
      ).map((error: any) => error.ruleId),
    ).not.toContain('runjs-resource-action-invalid');

    expect(
      inspectRunJsAuthoringCode(
        {
          code: [
            "const maps = { names: { tasks: 'readonly_tasks' } };",
            'const { names } = maps;',
            'names.tasks = selectedResource;',
            'ctx.render(null);',
            'await ctx.api.resource(maps.names.tasks).destroy({ filterByTk: 1 });',
          ].join('\n'),
          path: '$.runjs.destructuredAliasMutationResourceUnknown.code',
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

    const dynamicApiResourceHandleErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = condition ? ctx.api.resource('readonly_tasks') : ctx.api.resource('tasks');",
          "const destroy = condition ? ctx.api.resource('readonly_tasks').destroy : ctx.api.resource('tasks').destroy;",
          "const logicalResource = condition && ctx.api.resource('readonly_tasks') || ctx.api.resource('tasks');",
          "const logicalDestroy = condition && ctx.api.resource('readonly_tasks').destroy || ctx.api.resource('tasks').destroy;",
          'ctx.render(null);',
          'await resource.destroy({ filterByTk: 1 });',
          "await (condition ? ctx.api.resource('readonly_tasks') : ctx.api.resource('tasks')).destroy({ filterByTk: 1 });",
          'await destroy({ filterByTk: 1 });',
          'await logicalResource.destroy({ filterByTk: 1 });',
          "await (condition && ctx.api.resource('readonly_tasks') || ctx.api.resource('tasks')).destroy({ filterByTk: 1 });",
          'await logicalDestroy({ filterByTk: 1 });',
        ].join('\n'),
        path: '$.runjs.dynamicApiResourceHandleAction.code',
        modelUse: 'JSBlockModel',
      },
      {
        getCollection: (_dataSourceKey: string, collectionName: string) =>
          collectionName === 'readonly_tasks'
            ? { name: collectionName, options: { availableActions: ['view'] } }
            : { name: collectionName },
      },
    );
    expect(dynamicApiResourceHandleErrors.map((error: any) => error.ruleId)).not.toContain(
      'runjs-resource-action-invalid',
    );

    const sameApiResourceHandleErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = condition ? ctx.api.resource('readonly_tasks') : ctx.api.resource('readonly_tasks');",
          "const logicalResource = condition && ctx.api.resource('readonly_tasks') || ctx.api.resource('readonly_tasks');",
          "const collectionName = 'readonly_tasks';",
          'ctx.render(null);',
          'await resource.destroy({ filterByTk: 1 });',
          'await logicalResource.destroy({ filterByTk: 1 });',
          "await (condition ? ctx.api.resource(collectionName) : ctx.api.resource('readonly_tasks')).destroy({ filterByTk: 1 });",
        ].join('\n'),
        path: '$.runjs.sameApiResourceHandleAction.code',
        modelUse: 'JSBlockModel',
      },
      {
        getCollection: (_dataSourceKey: string, collectionName: string) =>
          collectionName === 'readonly_tasks'
            ? { name: collectionName, options: { availableActions: ['view'] } }
            : { name: collectionName },
      },
    );
    expect(sameApiResourceHandleErrors.map((error: any) => error.ruleId)).toContain('runjs-resource-action-invalid');

    const apiResourceActionParamsErrors = inspectRunJsAuthoringCode(
      {
        code: [
          'const params = { ...options };',
          "const paramsWithMutableDataSource = { 'x-data-source': 'external' };",
          "paramsWithMutableDataSource['x-data-source'] = selectedDataSource;",
          'ctx.render(null);',
          "await ctx.api.resource('readonly_tasks', 'destroy', params);",
          "await ctx.api.resource('readonly_tasks', 'destroy', { ...options, 'x-data-source': 'external' });",
          "await ctx.api.resource('readonly_tasks', 'destroy', { 'x-data-source': 'external', ...options });",
          "await ctx.api.resource('readonly_tasks', 'destroy', paramsWithMutableDataSource);",
        ].join('\n'),
        path: '$.runjs.apiResourceActionParams.code',
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
    expect(
      apiResourceActionParamsErrors.filter(
        (error: any) =>
          error.ruleId === 'runjs-resource-action-invalid' &&
          error.details?.collectionName === 'readonly_tasks' &&
          error.details?.dataSourceKey === 'main',
      ),
    ).toHaveLength(1);
    expect(
      apiResourceActionParamsErrors.some(
        (error: any) =>
          error.ruleId === 'runjs-resource-action-invalid' &&
          error.details?.collectionName === 'readonly_tasks' &&
          error.details?.dataSourceKey === 'external',
      ),
    ).toBe(false);

    const externalHeaderAllowedErrors = inspectRunJsAuthoringCode(
      {
        code: [
          'ctx.render(null);',
          "await ctx.request({ resource: 'readonly_tasks', action: 'destroy', headers: { 'x-data-source': 'external' } });",
          "await ctx.api.resource('readonly_tasks', undefined, { 'x-data-source': 'external' }).destroy({ filterByTk: 1 });",
        ].join('\n'),
        path: '$.runjs.externalHeaderAllowed.code',
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
    expect(externalHeaderAllowedErrors.map((error: any) => error.ruleId)).not.toContain(
      'runjs-resource-action-invalid',
    );

    const externalHeaderReadonlyErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const headers = { 'x-data-source': 'external' };",
          'ctx.render(null);',
          "await ctx.api.request({ resource: 'readonly_tasks', action: 'destroy', headers });",
          "await ctx.api.resource('readonly_tasks', undefined, headers).destroy({ filterByTk: 1 });",
        ].join('\n'),
        path: '$.runjs.externalHeaderReadonly.code',
        modelUse: 'JSBlockModel',
      },
      {
        currentDataSourceKey: 'main',
        getCollection: (dataSourceKey: string, collectionName: string) =>
          dataSourceKey === 'external' && collectionName === 'readonly_tasks'
            ? { name: collectionName, options: { availableActions: ['view'] } }
            : { name: collectionName },
      },
    );
    expect(externalHeaderReadonlyErrors.map((error: any) => error.ruleId)).toContain('runjs-resource-action-invalid');

    const externalMemberHeaderReadonlyErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const headersByDs = { external: { 'x-data-source': 'external' } };",
          'ctx.render(null);',
          "await ctx.api.request({ resource: 'readonly_tasks', action: 'destroy', headers: headersByDs.external });",
          "await ctx.api.resource('readonly_tasks', undefined, headersByDs['external']).destroy({ filterByTk: 1 });",
        ].join('\n'),
        path: '$.runjs.externalMemberHeaderReadonly.code',
        modelUse: 'JSBlockModel',
      },
      {
        currentDataSourceKey: 'main',
        getCollection: (dataSourceKey: string, collectionName: string) =>
          dataSourceKey === 'external' && collectionName === 'readonly_tasks'
            ? { name: collectionName, options: { availableActions: ['view'] } }
            : { name: collectionName },
      },
    );
    expect(externalMemberHeaderReadonlyErrors.map((error: any) => error.ruleId)).toContain(
      'runjs-resource-action-invalid',
    );

    const dynamicHeaderErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const headers = { 'x-data-source': selectedDataSource };",
          "const externalHeaders = { 'x-data-source': 'external' };",
          "const mainHeaders = { 'x-data-source': 'main' };",
          'ctx.render(null);',
          "await ctx.api.request({ resource: 'readonly_tasks', action: 'destroy', headers });",
          "await ctx.api.request({ resource: 'readonly_tasks', action: 'destroy', headers: condition ? externalHeaders : mainHeaders });",
          "await ctx.api.resource('readonly_tasks', undefined, condition ? externalHeaders : mainHeaders).destroy({ filterByTk: 1 });",
        ].join('\n'),
        path: '$.runjs.dynamicHeaderAction.code',
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
    expect(dynamicHeaderErrors.map((error: any) => error.ruleId)).not.toContain('runjs-resource-action-invalid');

    const spreadOverrideErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const overrides = { action: 'list' };",
          "const requestConfig = { resource: 'tasks', action: 'refresh', ...overrides };",
          "const headers = { 'x-data-source': 'main', ...headerOverrides };",
          'ctx.render(null);',
          'await ctx.request(requestConfig);',
          "await ctx.api.request({ resource: 'readonly_tasks', action: 'destroy', headers });",
        ].join('\n'),
        path: '$.runjs.spreadOverrideAction.code',
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
    expect(spreadOverrideErrors.map((error: any) => error.ruleId)).not.toContain('runjs-resource-action-invalid');

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

    const associationObjectRefreshErrors = inspectRunJsAuthoringCode(
      {
        code: "ctx.render(null);\nawait ctx.request({ resource: 'tasks.assignees', resourceOf: 1, action: 'refresh' });",
        path: '$.runjs.associationObjectRefresh.code',
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
    );
    expect(associationObjectRefreshErrors.map((error: any) => error.ruleId)).toContain('runjs-resource-action-invalid');

    expect(
      inspectRunJsAuthoringCode(
        {
          code: "ctx.render(null);\nawait ctx.api.request({ url: '/api/projects/1/tasks/2/assignees:refresh' });",
          path: '$.runjs.multiHopAssociationRefresh.code',
          modelUse: 'JSBlockModel',
        },
        {
          getCollection: (_dataSourceKey: string, collectionName: string) =>
            collectionName === 'projects'
              ? {
                  name: collectionName,
                  getField: (fieldName: string) =>
                    fieldName === 'tasks' ? { name: fieldName, target: 'tasks' } : null,
                }
              : collectionName === 'tasks'
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
    ).not.toContain('runjs-resource-action-invalid');

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

    const aliasedAssociationHandleRefreshErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.api.resource('tasks.assignees');",
          'ctx.render(null);',
          'await resource.refresh();',
        ].join('\n'),
        path: '$.runjs.aliasedAssociationHandleRefresh.code',
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
    );
    expect(aliasedAssociationHandleRefreshErrors.map((error: any) => error.ruleId)).toContain(
      'runjs-resource-action-invalid',
    );

    const aliasedAssociationHandleDestroyErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.api.resource('tasks.assignees');",
          'ctx.render(null);',
          'await resource.destroy({ filterByTk: 1 });',
        ].join('\n'),
        path: '$.runjs.aliasedAssociationHandleDestroy.code',
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
              ? { name: collectionName, options: { availableActions: ['view'] } }
              : null,
      },
    );
    expect(aliasedAssociationHandleDestroyErrors.map((error: any) => error.ruleId)).toContain(
      'runjs-resource-action-invalid',
    );
  });

  it('should reject calls to known non-function ctx root values', () => {
    [
      {
        code: [
          "const total = ctx.collection('customers');",
          'await total.refresh({ params: { pageSize: 1 } });',
          "ctx.render('<div>' + (total.getMeta().count || 0) + '</div>');",
        ].join('\n'),
        member: 'collection',
        path: '$.runjs.collectionCall.code',
      },
      {
        code: 'const record = ctx.record();\nctx.render(String(record?.id ?? ""));',
        member: 'record',
        path: '$.runjs.recordCall.code',
      },
      {
        code: "const total = ctx['collection']('customers');\nctx.render(String(total));",
        member: 'collection',
        path: '$.runjs.bracketCollectionCall.code',
      },
      {
        code: 'const record = ctx?.record?.();\nctx.render(String(record));',
        member: 'record',
        path: '$.runjs.optionalRecordCall.code',
      },
      {
        code: "const collection = ctx.collection;\nconst total = collection('customers');\nctx.render(String(total));",
        member: 'collection',
        path: '$.runjs.collectionAliasCall.code',
      },
      {
        code: 'const { record } = ctx;\nconst current = record();\nctx.render(String(current));',
        member: 'record',
        path: '$.runjs.destructuredRecordCall.code',
      },
      {
        code: "const runCtx = ctx;\nconst total = runCtx.collection('customers');\nctx.render(String(total));",
        member: 'collection',
        path: '$.runjs.ctxRootAliasCollectionCall.code',
      },
      {
        code: "let collection = () => 1;\ncollection &&= ctx.collection;\nconst total = collection('customers');\nctx.render(String(total));",
        member: 'collection',
        path: '$.runjs.definiteCollectionAliasCall.code',
      },
    ].forEach(({ code, member, path }) => {
      const errors = inspectRunJsAuthoringCode({
        code,
        path,
        modelUse: 'JSBlockModel',
      });

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path,
            ruleId: 'runjs-ctx-member-not-callable',
            details: expect.objectContaining({
              capability: `ctx.${member}`,
              member,
              repairClass: 'ctx-root-mismatch-stop',
            }),
          }),
        ]),
      );
    });

    const chartDataErrors = inspectRunJsAuthoringCode({
      code: 'ctx.data();',
      path: '$.runjs.chartDataCall.code',
      modelUse: 'ChartEventsModel',
    });
    expect(chartDataErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.runjs.chartDataCall.code',
          ruleId: 'runjs-ctx-member-not-callable',
          details: expect.objectContaining({
            capability: 'ctx.data',
            member: 'data',
            repairClass: 'ctx-root-mismatch-stop',
          }),
        }),
      ]),
    );
  });

  it('should allow reading non-function ctx root values and calling methods below them', () => {
    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const collectionName = ctx.collection?.name || "customers";',
          'const recordId = ctx.record?.id;',
          'const resource = ctx.makeResource("MultiRecordResource");',
          'resource.setResourceName(collectionName);',
          'await resource.refresh({ params: { pageSize: 1 } });',
          'ctx.message.info("Loaded");',
          'ctx.render(String(recordId ?? resource.getMeta()?.count ?? ""));',
        ].join('\n'),
        path: '$.runjs.readCtxValues.code',
        modelUse: 'JSBlockModel',
      }).map((error: any) => error.ruleId),
    ).not.toContain('runjs-ctx-member-not-callable');

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'let collection = () => 1;',
          'collection ||= ctx.collection;',
          "const total = collection('customers');",
          'ctx.render(String(total));',
        ].join('\n'),
        path: '$.runjs.logicalOrCollectionAliasCall.code',
        modelUse: 'JSBlockModel',
      }).map((error: any) => error.ruleId),
    ).not.toContain('runjs-ctx-member-not-callable');

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'let runCtx = { collection: () => 1 };',
          'runCtx ??= ctx;',
          "const total = runCtx.collection('customers');",
          'ctx.render(String(total));',
        ].join('\n'),
        path: '$.runjs.nullishCtxRootAliasCollectionCall.code',
        modelUse: 'JSBlockModel',
      }).map((error: any) => error.ruleId),
    ).not.toContain('runjs-ctx-member-not-callable');

    expect(
      inspectRunJsAuthoringCode({
        code: 'ctx.data();\nctx.render(null);',
        path: '$.runjs.jsBlockDataCall.code',
        modelUse: 'JSBlockModel',
      }).map((error: any) => error.ruleId),
    ).not.toContain('runjs-ctx-member-not-callable');

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'function readExternal(ctx) {',
          "  return ctx.collection('customers');",
          '}',
          'const total = readExternal({ collection: () => 1 });',
          'ctx.render(String(total));',
        ].join('\n'),
        path: '$.runjs.shadowedCtxCollectionCall.code',
        modelUse: 'JSBlockModel',
      }).map((error: any) => error.ruleId),
    ).not.toContain('runjs-ctx-member-not-callable');
  });

  it('should reject FlowResource filter item arrays and FilterGroup shapes with repair details', () => {
    const fields = [
      { name: 'stage', type: 'string', interface: 'select' },
      { name: 'status', type: 'string', interface: 'select' },
      { name: 'tier', type: 'string', interface: 'select' },
    ];
    const fieldsByName = new Map(fields.map((field) => [field.name, field]));
    const context = {
      getCollection: (_dataSourceKey, collectionName) =>
        collectionName === 'customers'
          ? {
              dataSourceKey: 'main',
              name: 'customers',
              fields: fieldsByName,
              getField: (fieldName: string) => fieldsByName.get(fieldName),
              getFields: () => fields,
            }
          : null,
    };

    const directArrayErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('customers');",
          "resource.setFilter([{ field: 'stage', operator: 'eq', value: '新线索' }]);",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.filterItemArray.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(directArrayErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-shape-invalid',
          details: expect.objectContaining({
            collectionName: 'customers',
            invalidShape: 'array',
            suggestedOperator: '$eq',
            repairExample: {
              stage: {
                $eq: '新线索',
              },
            },
          }),
        }),
      ]),
    );

    const aliasAndAddFilterGroupErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('customers');",
          "const filter = [{ path: 'status', operator: 'in', value: ['open', 'new'] }];",
          'resource.addFilterGroup("dashboard", filter);',
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.filterItemAliasArray.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(aliasAndAddFilterGroupErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-shape-invalid',
          details: expect.objectContaining({
            invalidShape: 'array',
            suggestedOperator: '$in',
            repairExample: {
              status: {
                $in: ['open', 'new'],
              },
            },
          }),
        }),
      ]),
    );

    const helperForwardedErrors = inspectRunJsAuthoringCode(
      {
        code: [
          'async function countRecords(collectionName, filter) {',
          "  const resource = ctx.makeResource('MultiRecordResource');",
          '  resource.setResourceName(collectionName);',
          '  resource.setFilter(filter);',
          '  await resource.refresh();',
          '  return resource.getMeta?.()?.count ?? 0;',
          '}',
          "await countRecords('customers', [{ field: 'tier', operator: 'eq', value: 'A' }]);",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.helperForwardedFilterItemArray.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(helperForwardedErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-shape-invalid',
          details: expect.objectContaining({
            collectionName: 'customers',
            invalidShape: 'array',
            repairExample: {
              tier: {
                $eq: 'A',
              },
            },
          }),
        }),
      ]),
    );

    const filterGroupErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('customers');",
          'resource.setFilter({',
          "  logic: '$or',",
          "  items: [{ path: 'stage', operator: 'eq', value: '新线索' }, { path: 'status', operator: 'eq', value: 'open' }],",
          '});',
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.filterGroupShape.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(filterGroupErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-shape-invalid',
          details: expect.objectContaining({
            invalidShape: 'filter-group',
            repairExample: {
              $or: [
                {
                  stage: {
                    $eq: '新线索',
                  },
                },
                {
                  status: {
                    $eq: 'open',
                  },
                },
              ],
            },
          }),
        }),
      ]),
    );

    const aliasedFilterGroupItemsErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('customers');",
          "const items = [{ path: 'stage', operator: 'eq', value: '新线索' }];",
          "resource.setFilter({ logic: '$or', items });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.aliasedFilterGroupItems.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(aliasedFilterGroupItemsErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-shape-invalid',
          details: expect.objectContaining({
            invalidShape: 'filter-group',
            repairExample: {
              stage: {
                $eq: '新线索',
              },
            },
          }),
        }),
      ]),
    );

    const aliasedAddFilterGroupItemsErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('customers');",
          "const items = [{ path: 'status', operator: 'eq', value: 'open' }];",
          "resource.addFilterGroup('dashboard', { logic: '$and', items });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.aliasedAddFilterGroupItems.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(aliasedAddFilterGroupItemsErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-shape-invalid',
          details: expect.objectContaining({
            invalidShape: 'filter-group',
            repairExample: {
              status: {
                $eq: 'open',
              },
            },
          }),
        }),
      ]),
    );

    const dynamicValueErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('customers');",
          'const stageValue = ctx.record?.stage;',
          "resource.setFilter([{ field: 'stage', operator: 'eq', value: stageValue }]);",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.dynamicFilterItemValue.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(dynamicValueErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-shape-invalid',
          details: expect.objectContaining({
            invalidShape: 'array',
            suggestedOperator: '$eq',
            repairExample: {
              stage: {
                $eq: '<value>',
              },
            },
          }),
        }),
      ]),
    );

    const validErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('customers');",
          "resource.setFilter({ stage: { $eq: '新线索' } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.validBackendFilterObject.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(validErrors.map((error: any) => error.ruleId)).not.toContain('runjs-resource-filter-shape-invalid');
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

    const bareRelativeErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "resource.setFilter({ createdAt: { $dateOn: 'thisWeek' } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.bareRelativeDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(bareRelativeErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-value-invalid',
          details: expect.objectContaining({
            fieldPath: 'createdAt',
            invalidValue: 'thisWeek',
            operator: '$dateOn',
          }),
        }),
      ]),
    );

    const shorthandRelativeErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "resource.setFilter({ createdAt: { $dateOn: '-7d' } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.shorthandRelativeDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(shorthandRelativeErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-value-invalid',
          details: expect.objectContaining({
            fieldPath: 'createdAt',
            invalidValue: '-7d',
            operator: '$dateOn',
          }),
        }),
      ]),
    );

    const timestampErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "resource.setFilter({ createdAt: { $dateOn: '2026-01-01T00:00:00.000Z' } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.timestampDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(timestampErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-resource-filter-date-value-invalid',
          details: expect.objectContaining({
            fieldPath: 'createdAt',
            invalidValue: '2026-01-01T00:00:00.000Z',
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

    const validNamedRangeErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "resource.setFilter({ createdAt: { $dateOn: { type: 'thisWeek' } } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.validNamedRangeDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(validNamedRangeErrors).toEqual([]);

    const validExactErrors = inspectRunJsAuthoringCode(
      {
        code: [
          "const resource = ctx.makeResource('MultiRecordResource');",
          "resource.setResourceName('intelligenceItems');",
          "resource.setFilter({ createdAt: { $dateOn: '2026-Q1' } });",
          'ctx.render(null);',
        ].join('\n'),
        path: '$.runjs.validExactDateFilter.code',
        modelUse: 'JSBlockModel',
      },
      context,
    );
    expect(validExactErrors).toEqual([]);

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

  it('should collect RunJS authoring errors from blocks and nested flowRegistry entries', () => {
    const errors = collectRunJsAuthoringErrors('compose', {
      target: {
        uid: 'grid',
      },
      blocks: [
        {
          type: 'jsBlock',
          settings: {
            code: 'await fetch("/blocked");',
          },
          flowRegistry: {
            unsafeBeforeRender: {
              steps: {
                runUnsafe: {
                  use: 'runjs',
                  params: {
                    code: 'localStorage.getItem("blocked");',
                  },
                },
                ignoredRequest: {
                  use: 'request',
                  params: {
                    code: 'await fetch("/ignored");',
                  },
                },
              },
            },
          },
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].settings.code',
          ruleId: 'runjs-global-unknown',
        }),
        expect.objectContaining({
          path: '$.blocks[0].flowRegistry.unsafeBeforeRender.steps.runUnsafe.params.code',
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({ global: 'localStorage' }),
        }),
      ]),
    );
    expect(errors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].flowRegistry.unsafeBeforeRender.steps.ignoredRequest.params.code',
        }),
      ]),
    );
  });

  it('should collect RunJS authoring errors from flowRegistry step source variants', () => {
    const errors = collectFlowRegistryRunJsAuthoringErrors(
      {
        submitFlow: {
          steps: {
            defaultRun: {
              use: 'runjs',
              defaultParams: {
                code: 'await fetch("/blocked");',
              },
            },
            scriptRun: {
              type: 'runjs',
              params: {
                value: {
                  script: 'process.exit(1);',
                },
              },
            },
          },
        },
      },
      '$.customFlowRegistry',
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.customFlowRegistry.submitFlow.steps.defaultRun.defaultParams.code',
          ruleId: 'runjs-global-unknown',
        }),
        expect.objectContaining({
          path: '$.customFlowRegistry.submitFlow.steps.scriptRun.params.value.script',
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({ global: 'process' }),
        }),
      ]),
    );
  });

  it('should enforce RunJS source budget limits while collecting flowRegistry errors', () => {
    const oversizedSource = 'x'.repeat(64 * 1024 + 1);
    const paddedValidSource = `const value = 1;\n// ${'x'.repeat(2800)}`;
    const flowRegistry = Object.fromEntries(
      Array.from({ length: 101 }, (_item, index) => [
        `flow${index}`,
        {
          steps: {
            run: {
              use: 'runjs',
              params: {
                code: index === 0 ? oversizedSource : paddedValidSource,
              },
            },
          },
        },
      ]),
    );

    const errors = collectFlowRegistryRunJsAuthoringErrors(flowRegistry);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.flowRegistry.flow0.steps.run.params.code',
          ruleId: 'runjs-source-too-large',
        }),
        expect.objectContaining({
          ruleId: 'runjs-total-source-too-large',
        }),
        expect.objectContaining({
          ruleId: 'runjs-too-many-sources',
        }),
      ]),
    );
  });
});
