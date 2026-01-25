/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { EventEmitter } from 'events';
import { observable } from '@formily/reactive';
import { get as lodashGet, merge as lodashMerge, set as lodashSet } from 'lodash';
import { FlowContext, JSRunner } from '@nocobase/flow-engine';
import { FormValueRuntime } from '..';

function createFormStub(initialValues: any = {}) {
  const store: any = JSON.parse(JSON.stringify(initialValues || {}));
  return {
    __store: store,
    getFieldValue: (namePath: any) => lodashGet(store, namePath),
    setFieldValue: (namePath: any, value: any) => lodashSet(store, namePath, value),
    getFieldsValue: () => JSON.parse(JSON.stringify(store)),
    setFieldsValue: (patch: any) => lodashMerge(store, patch),
  };
}

function createFieldContext(runtime: FormValueRuntime) {
  const ctx: any = new FlowContext();
  ctx.defineProperty('formValues', { get: () => runtime.formValues, cache: false });
  ctx.defineProperty('app', {
    value: {
      jsonLogic: {
        apply: (logic: any) => {
          try {
            const op = logic && typeof logic === 'object' ? Object.keys(logic)[0] : '';
            const args = op ? (logic as any)[op] : [];
            const left = Array.isArray(args) ? args[0] : undefined;
            const right = Array.isArray(args) ? args[1] : undefined;

            switch (op) {
              case '$eq':
                return left === right;
              case '$ne':
                return left !== right;
              case '$gt':
                return left > right;
              case '$lt':
                return left < right;
              case '$includes':
                return String(left ?? '').includes(String(right ?? ''));
              case '$notIncludes':
                return !String(left ?? '').includes(String(right ?? ''));
              case '$empty':
                return left == null || left === '' || (Array.isArray(left) && left.length === 0);
              case '$notEmpty':
                return !(left == null || left === '' || (Array.isArray(left) && left.length === 0));
              default:
                return false;
            }
          } catch {
            return false;
          }
        },
      },
    },
  });
  ctx.defineMethod('runjs', async function (this: any, code: string, variables?: Record<string, any>, options?: any) {
    const runner = new JSRunner({ globals: { ctx: this, ...(variables || {}) }, timeoutMs: options?.timeoutMs });
    return runner.run(code);
  });
  ctx.defineMethod('resolveJsonTemplate', async function (this: any, template: any) {
    const resolveAny = (val: any): any => {
      if (typeof val === 'string') {
        if (val === '__B__') return this.formValues.b;
        if (val === '__DYNAMIC__') {
          const key = this.formValues.selector;
          return this.formValues[key];
        }

        const trimmed = val.trim();
        const match = trimmed.match(/^\{\{\s*ctx(?:\.(.+?))?\s*\}\}$/);
        if (match) {
          const pathString = match[1];
          if (!pathString) return this;
          const segs = pathString.split('.').filter(Boolean);
          return lodashGet(this, segs);
        }
        return val;
      }

      if (Array.isArray(val)) {
        return val.map((v) => resolveAny(v));
      }

      if (val && typeof val === 'object') {
        const next: any = {};
        for (const [k, v] of Object.entries(val)) {
          next[k] = resolveAny(v);
        }
        return next;
      }

      return val;
    };

    return resolveAny(template);
  });
  return ctx;
}

describe('FormValueRuntime (default rules)', () => {
  it('recomputes default on dependency change when current equals last default; user change disables default permanently', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ b: 'X' });

    const blockModel: any = {
      uid: 'form-1',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const fieldCtx = createFieldContext(runtime);
    fieldCtx.defineProperty('blockModel', { value: blockModel });
    fieldCtx.defineProperty('fieldPathArray', { value: ['a'] });

    const fieldModel: any = {
      uid: 'field-a',
      context: fieldCtx,
      props: { initialValue: '__B__' },
      getProps: function () {
        return this.props;
      },
    };
    fieldCtx.defineProperty('model', { value: fieldModel });

    engineEmitter.emit('model:mounted', { model: fieldModel });

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));

    // change dependency -> default updates
    await runtime.setFormValues(fieldCtx, [{ path: ['b'], value: 'Y' }], { source: 'user' });
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('Y'));

    // user changes target -> default should be disabled permanently
    await runtime.setFormValues(fieldCtx, [{ path: ['a'], value: 'user' }], { source: 'user' });
    await runtime.setFormValues(fieldCtx, [{ path: ['b'], value: 'Z' }], { source: 'user' });
    expect(formStub.getFieldValue(['a'])).toBe('user');
  });

  it('handles onFieldsChange name as string and triggers default recompute', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ b: 'X' });

    const blockModel: any = {
      uid: 'form-3',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const fieldCtx = createFieldContext(runtime);
    fieldCtx.defineProperty('blockModel', { value: blockModel });
    fieldCtx.defineProperty('fieldPathArray', { value: ['a'] });

    const fieldModel: any = {
      uid: 'field-a3',
      context: fieldCtx,
      props: { initialValue: '__B__' },
      getProps: function () {
        return this.props;
      },
    };
    fieldCtx.defineProperty('model', { value: fieldModel });

    engineEmitter.emit('model:mounted', { model: fieldModel });
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));

    // 模拟 antd onFieldsChange: name 可能是 string
    lodashSet((formStub as any).__store, ['b'], 'Y');
    runtime.handleFormFieldsChange([{ name: 'b', touched: true } as any]);

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('Y'));
  });

  it('tracks dynamic deps (formValues[selector]) and updates subscriptions', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ selector: 'x', x: 1, y: 2 });

    const blockModel: any = {
      uid: 'form-2',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const fieldCtx = createFieldContext(runtime);
    fieldCtx.defineProperty('blockModel', { value: blockModel });
    fieldCtx.defineProperty('fieldPathArray', { value: ['a'] });

    const fieldModel: any = {
      uid: 'field-a2',
      context: fieldCtx,
      props: { initialValue: '__DYNAMIC__' },
      getProps: function () {
        return this.props;
      },
    };
    fieldCtx.defineProperty('model', { value: fieldModel });

    engineEmitter.emit('model:mounted', { model: fieldModel });
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe(1));

    // subscribed to x
    await runtime.setFormValues(fieldCtx, [{ path: ['x'], value: 10 }], { source: 'user' });
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe(10));

    // selector changes -> deps should shift to y
    await runtime.setFormValues(fieldCtx, [{ path: ['selector'], value: 'y' }], { source: 'user' });
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe(2));

    // x changes should no longer affect a
    await runtime.setFormValues(fieldCtx, [{ path: ['x'], value: 20 }], { source: 'user' });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(formStub.getFieldValue(['a'])).toBe(2);

    // y changes should update a
    await runtime.setFormValues(fieldCtx, [{ path: ['y'], value: 30 }], { source: 'user' });
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe(30));
  });
});

describe('FormValueRuntime (form assign rules)', () => {
  it('supports RunJSValue and updates on formValues dependency change', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ b: 'X' });

    const blockModel: any = {
      uid: 'form-assign-runjs-1',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    const fieldModel: any = {
      uid: 'field-a-runjs-1',
      context: { fieldPathArray: ['a'] },
    };
    blockCtx.defineProperty('engine', {
      value: {
        getModel: (id: string) => (id === 'field-a-runjs-1' ? fieldModel : null),
      },
    });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'a',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: { code: 'return ctx.formValues.b', version: 'v1' },
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));

    await runtime.setFormValues(blockCtx, [{ path: ['b'], value: 'Y' }], { source: 'user' });
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('Y'));
  });

  it('supports RunJSValue and tracks ctx var deps from code', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({});

    const blockModel: any = {
      uid: 'form-assign-runjs-ctx',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const store = observable({ someVar: 'X' });

    const blockCtx = createFieldContext(runtime);
    blockCtx.defineProperty('someVar', { get: () => store.someVar, cache: false });

    const fieldModel: any = {
      uid: 'field-a-runjs-ctx',
      context: { fieldPathArray: ['a'] },
    };
    blockCtx.defineProperty('engine', {
      value: {
        getModel: (id: string) => (id === 'field-a-runjs-ctx' ? fieldModel : null),
      },
    });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'a',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: { code: 'return ctx.someVar', version: 'v1' },
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));

    store.someVar = 'Y';
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('Y'));
  });

  it('does not write when RunJS execution fails', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ a: 'INIT' });

    const blockModel: any = {
      uid: 'form-assign-runjs-error',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    const fieldModel: any = {
      uid: 'field-a-runjs-error',
      context: { fieldPathArray: ['a'] },
    };
    blockCtx.defineProperty('engine', {
      value: {
        getModel: (id: string) => (id === 'field-a-runjs-error' ? fieldModel : null),
      },
    });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'a',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: { code: 'throw new Error("bad")', version: 'v1' },
      },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(formStub.getFieldValue(['a'])).toBe('INIT');
  });

  it('mode=assign keeps overriding after user change', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ b: 'X' });

    const blockModel: any = {
      uid: 'form-assign-1',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    const fieldModel: any = {
      uid: 'field-a',
      context: { fieldPathArray: ['a'] },
    };
    blockCtx.defineProperty('engine', {
      value: {
        getModel: (id: string) => (id === 'field-a' ? fieldModel : null),
      },
    });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'a',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: '__B__',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));

    // user writes to target; assign rule MUST NOT stop（可能会被规则立即回写覆盖）
    await runtime.setFormValues(blockCtx, [{ path: ['a'], value: 'user' }], { source: 'user' });

    // dependency change triggers overwrite again
    await runtime.setFormValues(blockCtx, [{ path: ['b'], value: 'Y' }], { source: 'user' });
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('Y'));
  });

  it('mode=default follows explicit semantics and stops after user change', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ b: 'X' });

    const blockModel: any = {
      uid: 'form-assign-2',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    const fieldModel: any = {
      uid: 'field-a2',
      context: { fieldPathArray: ['a'] },
    };
    blockCtx.defineProperty('engine', {
      value: {
        getModel: (id: string) => (id === 'field-a2' ? fieldModel : null),
      },
    });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'a',
        mode: 'default',
        condition: { logic: '$and', items: [] },
        value: '__B__',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));

    // user writes to target; default mode MUST stop permanently
    await runtime.setFormValues(blockCtx, [{ path: ['a'], value: 'user' }], { source: 'user' });
    expect(formStub.getFieldValue(['a'])).toBe('user');

    await runtime.setFormValues(blockCtx, [{ path: ['b'], value: 'Y' }], { source: 'user' });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(formStub.getFieldValue(['a'])).toBe('user');
  });

  it('linkage assignment takes precedence over mode=assign form assignment', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ b: 'X' });

    const blockModel: any = {
      uid: 'form-assign-linkage-precedence',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'a',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: '__B__',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));

    // linkage writes to target; form assignment should NOT immediately write back and override
    await runtime.setFormValues(blockCtx, [{ path: ['a'], value: 'LINK' }], { source: 'linkage' });
    expect(formStub.getFieldValue(['a'])).toBe('LINK');
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(formStub.getFieldValue(['a'])).toBe('LINK');

    // dependency change should still update via form assignment (if linkage doesn't re-run)
    await runtime.setFormValues(blockCtx, [{ path: ['b'], value: 'Y' }], { source: 'user' });
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('Y'));
  });

  it('linkage default value takes precedence over mode=default form assignment', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ b: 'X' });

    const blockModel: any = {
      uid: 'form-assign-linkage-default-precedence',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    blockModel.context = blockCtx;

    const fieldCtx = createFieldContext(runtime);
    fieldCtx.defineProperty('blockModel', { value: blockModel });
    fieldCtx.defineProperty('fieldPathArray', { value: ['a'] });

    const fieldModel: any = {
      uid: 'field-a-linkage-default-precedence',
      context: fieldCtx,
      props: observable({ initialValue: undefined }),
      getProps: function () {
        return this.props;
      },
    };
    fieldCtx.defineProperty('model', { value: fieldModel });

    engineEmitter.emit('model:mounted', { model: fieldModel });

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'a',
        mode: 'default',
        condition: { logic: '$and', items: [] },
        value: '__B__',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));

    // linkage writes initialValue (default semantics) and SHOULD override form assignment default
    fieldModel.props.initialValue = '__LINK__';

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('__LINK__'));

    // dependency change triggers form assignment default recompute, but linkage default still wins
    await runtime.setFormValues(blockCtx, [{ path: ['b'], value: 'Y' }], { source: 'user' });
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('__LINK__'));

    // linkage default removed -> form assignment default takes effect again
    fieldModel.props.initialValue = undefined;

    await runtime.setFormValues(blockCtx, [{ path: ['b'], value: 'Z' }], { source: 'user' });
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('Z'));
  });

  it('tracks ctx var deps and updates when ctx var changes', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({});

    const blockModel: any = {
      uid: 'form-assign-ctx-deps',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const store = observable({ someVar: 'X' });

    const blockCtx = createFieldContext(runtime);
    blockCtx.defineProperty('someVar', { get: () => store.someVar, cache: false });

    const fieldModel: any = {
      uid: 'field-a-ctx',
      context: { fieldPathArray: ['a'] },
    };
    blockCtx.defineProperty('engine', {
      value: {
        getModel: (id: string) => (id === 'field-a-ctx' ? fieldModel : null),
      },
    });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'a',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: '{{ ctx.someVar }}',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));

    store.someVar = 'Y';
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('Y'));
  });

  it('runs assign rule even when target model is not mounted yet', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ b: 'X' });

    const blockModel: any = {
      uid: 'form-assign-mount',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    const fieldModel: any = {
      uid: 'field-a-mount',
      context: { blockModel, fieldPathArray: undefined },
    };
    blockCtx.defineProperty('engine', {
      value: {
        getModel: (id: string) => (id === 'field-a-mount' ? fieldModel : null),
      },
    });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'a',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: '__B__',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));
  });

  it('only exposes ctx.item under association target paths', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({});

    const blockModel: any = {
      uid: 'form-assign-item-scope',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    // 提供集合元信息，避免因 collection 缺失导致 item 直接为 undefined 的短路逻辑误判。
    blockCtx.defineProperty('collection', { value: { getField: () => null } });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'a',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: {
          code: "return typeof ctx.item === 'undefined' ? 'YES' : 'NO'",
          version: 'v1',
        },
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('YES'));
  });

  it('supports ctx.item.index in condition for to-many subform list (fork models)', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ users: [{ nickname: 'A' }, { nickname: 'B' }] });

    const blockModel: any = {
      uid: 'form-assign-index',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    // 提供集合元信息：RuleEngine 需要依赖 rootCollection 来识别对多关联并计算 ctx.item.index
    const userRowCollection: any = { getField: () => null };
    const usersField: any = { type: 'hasMany', isAssociationField: () => true, targetCollection: userRowCollection };
    const rootCollection: any = { getField: (name: string) => (name === 'users' ? usersField : null) };
    blockCtx.defineProperty('collection', { value: rootCollection });
    blockModel.context = blockCtx;

    const masterModel: any = {
      uid: 'users.nickname',
      subModels: { field: {} },
      getStepParams(flowKey: string, stepKey: string) {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'users.nickname' };
        }
        return undefined;
      },
    };
    const masterCtx = createFieldContext(runtime);
    masterCtx.defineProperty('blockModel', { value: blockModel });
    masterCtx.defineProperty('model', { value: masterModel });
    masterModel.context = masterCtx;

    const createRowModel = (forkId: string) => {
      const rowModel: any = {
        uid: 'users.nickname',
        isFork: true,
        forkId,
        subModels: { field: {} },
        getStepParams(flowKey: string, stepKey: string) {
          if (flowKey === 'fieldSettings' && stepKey === 'init') {
            return { fieldPath: 'users.nickname' };
          }
          return undefined;
        },
      };
      const rowCtx = createFieldContext(runtime);
      rowCtx.defineProperty('blockModel', { value: blockModel });
      rowCtx.defineProperty('fieldIndex', { value: [forkId] });
      rowCtx.defineProperty('model', { value: rowModel });
      rowModel.context = rowCtx;
      return rowModel;
    };

    const row0 = createRowModel('users:0');
    const row1 = createRowModel('users:1');

    // 在真实 FlowEngine 中，fork models 不会出现在 engine.forEachModel 的遍历里；
    // 需要从 master.forks 中补齐，确保 syncAssignRules 后仍能覆盖已挂载的子表单行。
    masterModel.forks = new Set([row0, row1]);

    blockCtx.defineProperty('engine', {
      value: {
        forEachModel: (cb: any) => {
          cb(masterModel);
        },
      },
    });

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'users.nickname',
        mode: 'assign',
        condition: {
          logic: '$and',
          items: [{ path: '{{ ctx.item.index }}', operator: '$eq', value: 1 }],
        },
        value: 'Z',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['users', 1, 'nickname'])).toBe('Z'));
    expect(formStub.getFieldValue(['users', 0, 'nickname'])).toBe('A');

    // 重新同步规则（模拟保存后生效）：fork 行上的规则也应被重新注册并生效
    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'users.nickname',
        mode: 'assign',
        condition: {
          logic: '$and',
          items: [{ path: '{{ ctx.item.index }}', operator: '$eq', value: 1 }],
        },
        value: 'Q',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['users', 1, 'nickname'])).toBe('Q'));
  });

  it('supports ctx.item.value.* in assign rule value and updates on row value changes (to-many fork models)', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({
      users: [
        { nickname: 'A', display: '' },
        { nickname: 'B', display: '' },
      ],
    });

    const blockModel: any = {
      uid: 'form-assign-item-value',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    // 提供集合元信息：RuleEngine 需要依赖 rootCollection 来识别对多关联并计算 ctx.item.value
    const userRowCollection: any = { getField: () => null };
    const usersField: any = { type: 'hasMany', isAssociationField: () => true, targetCollection: userRowCollection };
    const rootCollection: any = { getField: (name: string) => (name === 'users' ? usersField : null) };
    blockCtx.defineProperty('collection', { value: rootCollection });
    blockModel.context = blockCtx;

    const masterModel: any = {
      uid: 'users.display',
      subModels: { field: {} },
      getStepParams(flowKey: string, stepKey: string) {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'users.display' };
        }
        return undefined;
      },
    };
    const masterCtx = createFieldContext(runtime);
    masterCtx.defineProperty('blockModel', { value: blockModel });
    masterCtx.defineProperty('model', { value: masterModel });
    masterModel.context = masterCtx;

    const createRowModel = (forkId: string) => {
      const rowModel: any = {
        uid: 'users.display',
        isFork: true,
        forkId,
        subModels: { field: {} },
        getStepParams(flowKey: string, stepKey: string) {
          if (flowKey === 'fieldSettings' && stepKey === 'init') {
            return { fieldPath: 'users.display' };
          }
          return undefined;
        },
      };
      const rowCtx = createFieldContext(runtime);
      rowCtx.defineProperty('blockModel', { value: blockModel });
      rowCtx.defineProperty('fieldIndex', { value: [forkId] });
      rowCtx.defineProperty('model', { value: rowModel });
      rowModel.context = rowCtx;
      return rowModel;
    };

    const row0 = createRowModel('users:0');
    const row1 = createRowModel('users:1');
    masterModel.forks = new Set([row0, row1]);

    blockCtx.defineProperty('engine', {
      value: {
        forEachModel: (cb: any) => {
          cb(masterModel);
        },
      },
    });

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'users.display',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: '{{ ctx.item.value.nickname }}',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['users', 0, 'display'])).toBe('A'));
    await waitFor(() => expect(formStub.getFieldValue(['users', 1, 'display'])).toBe('B'));

    await runtime.setFormValues(blockCtx, [{ path: ['users', 1, 'nickname'], value: 'C' }], { source: 'user' });

    await waitFor(() => expect(formStub.getFieldValue(['users', 1, 'display'])).toBe('C'));
    expect(formStub.getFieldValue(['users', 0, 'display'])).toBe('A');
  });

  it('applies default assign rules in update mode for to-many row even if list container became explicit', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ users: [{ name: '' }, { name: '' }] });

    const blockModel: any = {
      uid: 'form-assign-default-update',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'update',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    // 提供集合元信息：识别对多关联，并计算 ctx.item.index
    const userRowCollection: any = { getField: () => null };
    const usersField: any = { type: 'hasMany', isAssociationField: () => true, targetCollection: userRowCollection };
    const rootCollection: any = { getField: (name: string) => (name === 'users' ? usersField : null) };
    blockCtx.defineProperty('collection', { value: rootCollection });
    blockModel.context = blockCtx;

    // 模拟：用户在子表单列表中“增删项/添加行”时，外部系统会触发 users 的 onValuesChange，导致 users 被标记为 explicit。
    runtime.handleFormValuesChange({ users: [{ name: '' }, { name: '' }] }, formStub.getFieldsValue());

    const masterModel: any = {
      uid: 'users.name',
      subModels: { field: {} },
      getStepParams(flowKey: string, stepKey: string) {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'users.name' };
        }
        return undefined;
      },
    };
    const masterCtx = createFieldContext(runtime);
    masterCtx.defineProperty('blockModel', { value: blockModel });
    masterCtx.defineProperty('model', { value: masterModel });
    masterModel.context = masterCtx;

    const createRowModel = (forkId: string) => {
      const rowModel: any = {
        uid: 'users.name',
        isFork: true,
        forkId,
        subModels: { field: {} },
        getStepParams(flowKey: string, stepKey: string) {
          if (flowKey === 'fieldSettings' && stepKey === 'init') {
            return { fieldPath: 'users.name' };
          }
          return undefined;
        },
      };
      const rowCtx = createFieldContext(runtime);
      rowCtx.defineProperty('blockModel', { value: blockModel });
      rowCtx.defineProperty('fieldIndex', { value: [forkId] });
      rowCtx.defineProperty('model', { value: rowModel });
      rowModel.context = rowCtx;
      return rowModel;
    };

    const row0 = createRowModel('users:0');
    const row1 = createRowModel('users:1');
    masterModel.forks = new Set([row0, row1]);

    blockCtx.defineProperty('engine', {
      value: {
        forEachModel: (cb: any) => {
          cb(masterModel);
        },
      },
    });

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'users.name',
        mode: 'default',
        condition: {
          logic: '$and',
          items: [{ path: '{{ ctx.item.index }}', operator: '$eq', value: 1 }],
        },
        value: 'Z',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['users', 1, 'name'])).toBe('Z'));
    expect(formStub.getFieldValue(['users', 0, 'name'])).toBe('');
  });

  it('assigns to unconfigured field under to-many association using row grid context', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ users: [{ nickname: 'A' }, { nickname: 'B' }] });

    const blockModel: any = {
      uid: 'form-assign-grid-row',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    // 提供集合元信息：需要识别 users 为对多关联，并允许解析 users.age 的字段元信息
    const userRowCollection: any = {
      getField: (name: string) => ({ name, isAssociationField: () => false }),
    };
    const usersField: any = { type: 'hasMany', isAssociationField: () => true, targetCollection: userRowCollection };
    const rootCollection: any = { getField: (name: string) => (name === 'users' ? usersField : null) };
    blockCtx.defineProperty('collection', { value: rootCollection });
    blockModel.context = blockCtx;

    // 已配置到 UI 的字段（用于让 RuleEngine 识别哪些 targetPath 已有 FormItemModel，避免重复挂载到 row grid）
    const configuredFieldModel: any = {
      uid: 'users.nickname',
      subModels: { field: {} },
      getStepParams(flowKey: string, stepKey: string) {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'users.nickname' };
        }
        return undefined;
      },
    };
    const configuredCtx = createFieldContext(runtime);
    configuredCtx.defineProperty('blockModel', { value: blockModel });
    configuredCtx.defineProperty('model', { value: configuredFieldModel });
    configuredFieldModel.context = configuredCtx;

    // row grid fork models（每行一个），用于承载未配置字段的赋值规则
    const gridMaster: any = {
      uid: 'users.grid',
      subModels: { items: [] },
    };
    const gridMasterCtx = createFieldContext(runtime);
    gridMasterCtx.defineProperty('blockModel', { value: blockModel });
    gridMasterCtx.defineProperty('model', { value: gridMaster });
    gridMaster.context = gridMasterCtx;

    const createGridRow = (forkId: string, rowIndex: number) => {
      const row: any = {
        uid: 'users.grid',
        isFork: true,
        forkId,
        subModels: { items: [] },
      };
      const ctx = createFieldContext(runtime);
      ctx.defineProperty('blockModel', { value: blockModel });
      ctx.defineProperty('fieldIndex', { value: [`users:${rowIndex}`] });
      ctx.defineProperty('model', { value: row });
      row.context = ctx;
      return row;
    };

    const row0 = createGridRow('row0', 0);
    const row1 = createGridRow('row1', 1);
    gridMaster.forks = new Set([row0, row1]);

    blockCtx.defineProperty('engine', {
      value: {
        forEachModel: (cb: any) => {
          cb(configuredFieldModel);
          cb(gridMaster);
        },
      },
    });

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'users.age',
        mode: 'assign',
        condition: {
          logic: '$and',
          items: [{ path: '{{ ctx.item.index }}', operator: '$eq', value: 1 }],
        },
        value: 99,
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['users', 1, 'age'])).toBe(99));
    expect(formStub.getFieldValue(['users', 0, 'age'])).toBeUndefined();
  });

  it('supports ctx.item.parentItem.index for nested association under to-many', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({
      users: [{ user: { id: 1, name: 'Old0' } }, { user: { id: 2, name: 'Old1' } }],
    });

    const blockModel: any = {
      uid: 'form-assign-current-parent',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);

    const userCollection: any = { getField: () => null };
    const userField: any = { isAssociationField: () => true, type: 'belongsTo', targetCollection: userCollection };
    const usersItemCollection: any = { getField: (name: string) => (name === 'user' ? userField : null) };
    const usersField: any = { isAssociationField: () => true, type: 'hasMany', targetCollection: usersItemCollection };
    const collection: any = { getField: (name: string) => (name === 'users' ? usersField : null) };

    blockCtx.defineProperty('collection', { value: collection });

    const createRowModel = (forkId: string) => {
      const rowModel: any = {
        uid: `users.user:${forkId}`,
        isFork: true,
        forkId,
        subModels: { field: { context: { collectionField: userField } } },
        getStepParams(flowKey: string, stepKey: string) {
          if (flowKey === 'fieldSettings' && stepKey === 'init') {
            return { fieldPath: 'users.user' };
          }
          return undefined;
        },
      };
      const rowCtx = createFieldContext(runtime);
      rowCtx.defineProperty('blockModel', { value: blockModel });
      rowCtx.defineProperty('collection', { value: collection });
      rowCtx.defineProperty('fieldIndex', { value: [forkId] });
      rowCtx.defineProperty('model', { value: rowModel });
      rowModel.context = rowCtx;
      return rowModel;
    };

    const row0 = createRowModel('users:0');
    const row1 = createRowModel('users:1');

    blockCtx.defineProperty('engine', {
      value: {
        forEachModel: (cb: any) => {
          cb(row0);
          cb(row1);
        },
      },
    });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'users.user.name',
        mode: 'assign',
        condition: {
          logic: '$and',
          items: [{ path: '{{ ctx.item.parentItem.index }}', operator: '$eq', value: 1 }],
        },
        value: 'Z',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['users', 1, 'user', 'name'])).toBe('Z'));
    expect(formStub.getFieldValue(['users', 0, 'user', 'name'])).toBe('Old0');
  });

  it('skips nested association write when association value is empty', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ user: null });

    const blockModel: any = {
      uid: 'form-assign-assoc-skip-1',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    const userCollection: any = { getField: () => null };
    const userField: any = { isAssociationField: () => true, targetCollection: userCollection };
    const collection: any = { getField: (name: string) => (name === 'user' ? userField : null) };
    blockCtx.defineProperty('collection', { value: collection });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'user.name',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: 'Alice',
      },
    ]);

    // user 为空时不应隐式创建关联对象
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(formStub.getFieldValue(['user'])).toBeNull();

    // 当 user 从 null -> {id} 时，应触发重新计算并写入 user.name
    await runtime.setFormValues(blockCtx, [{ path: ['user'], value: { id: 1 } }], { source: 'user' });
    await waitFor(() => expect(formStub.getFieldValue(['user', 'name'])).toBe('Alice'));
    expect(formStub.getFieldValue(['user', 'id'])).toBe(1);
  });

  it('supports nested association assign under to-many using row context', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({ users: [{ user: null }] });

    const blockModel: any = {
      uid: 'form-assign-assoc-to-many-nested',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);

    const userCollection: any = { getField: () => null };
    const userField: any = { isAssociationField: () => true, type: 'belongsTo', targetCollection: userCollection };
    const usersItemCollection: any = { getField: (name: string) => (name === 'user' ? userField : null) };
    const usersField: any = { isAssociationField: () => true, type: 'hasMany', targetCollection: usersItemCollection };
    const collection: any = { getField: (name: string) => (name === 'users' ? usersField : null) };

    blockCtx.defineProperty('collection', { value: collection });

    const createRowModel = (forkId: string) => {
      const rowModel: any = {
        uid: `users.user:${forkId}`,
        isFork: true,
        forkId,
        subModels: { field: { context: { collectionField: userField } } },
        getStepParams(flowKey: string, stepKey: string) {
          if (flowKey === 'fieldSettings' && stepKey === 'init') {
            return { fieldPath: 'users.user' };
          }
          return undefined;
        },
      };
      const rowCtx = createFieldContext(runtime);
      rowCtx.defineProperty('blockModel', { value: blockModel });
      rowCtx.defineProperty('collection', { value: collection });
      rowCtx.defineProperty('fieldIndex', { value: [forkId] });
      rowCtx.defineProperty('model', { value: rowModel });
      rowModel.context = rowCtx;
      return rowModel;
    };

    const row0 = createRowModel('users:0');

    blockCtx.defineProperty('engine', {
      value: {
        forEachModel: (cb: any) => {
          cb(row0);
        },
      },
    });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'users.user.name',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: 'Alice',
      },
    ]);

    // user 为空时不应隐式创建关联对象（users[0].user 仍为 null）
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(formStub.getFieldValue(['users', 0, 'user'])).toBeNull();

    // 当 users[0].user 从 null -> {id} 时，应触发重新计算并写入 users[0].user.name
    await runtime.setFormValues(blockCtx, [{ path: ['users', 0, 'user'], value: { id: 1 } }], { source: 'user' });
    await waitFor(() => expect(formStub.getFieldValue(['users', 0, 'user', 'name'])).toBe('Alice'));
    expect(formStub.getFieldValue(['users', 0, 'user', 'id'])).toBe(1);
  });

  it('does not write to to-many nested path without row index', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({});

    const blockModel: any = {
      uid: 'form-assign-to-many-skip',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const blockCtx = createFieldContext(runtime);
    const userCollection: any = { getField: () => null };
    const usersField: any = { isAssociationField: () => true, type: 'hasMany', targetCollection: userCollection };
    const collection: any = { getField: (name: string) => (name === 'users' ? usersField : null) };
    blockCtx.defineProperty('collection', { value: collection });
    blockModel.context = blockCtx;

    runtime.syncAssignRules([
      {
        key: 'r1',
        enable: true,
        targetPath: 'users.nickname',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: 'Z',
      },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(formStub.getFieldValue(['users'])).toBeUndefined();
  });

  it('resolves nested to-many indices in order when list field names repeat', async () => {
    const engineEmitter = new EventEmitter();
    const blockEmitter = new EventEmitter();
    const formStub = createFormStub({});

    const blockModel: any = {
      uid: 'form-resolve-repeated-list-name',
      flowEngine: { emitter: engineEmitter },
      emitter: blockEmitter,
      dispatchEvent: vi.fn(),
      getAclActionName: () => 'create',
    };

    const runtime = new FormValueRuntime({ model: blockModel, getForm: () => formStub as any });
    runtime.mount({ sync: true });

    const ctx = createFieldContext(runtime);
    ctx.defineProperty('fieldIndex', { value: ['products:1', 'products:0'] });

    const resolved = (runtime as any).tryResolveNamePath(ctx, 'products.products.id');
    expect(resolved).toEqual(['products', 1, 'products', 0, 'id']);

    const resolvedWithExplicit = (runtime as any).tryResolveNamePath(ctx, 'products[0].products.id');
    expect(resolvedWithExplicit).toEqual(['products', 0, 'products', 0, 'id']);
  });
});
