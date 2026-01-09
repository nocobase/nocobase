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
  ctx.defineMethod('runjs', async function (this: any, code: string, variables?: Record<string, any>, options?: any) {
    const runner = new JSRunner({ globals: { ctx: this, ...(variables || {}) }, timeoutMs: options?.timeoutMs });
    return runner.run(code);
  });
  ctx.defineMethod('resolveJsonTemplate', async function (this: any, template: any) {
    if (template === '__B__') {
      return this.formValues.b;
    }
    if (template === '{{ ctx.someVar }}') {
      return this.someVar;
    }
    if (template === '__DYNAMIC__') {
      const key = this.formValues.selector;
      return this.formValues[key];
    }
    return template;
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
        field: 'field-a-runjs-1',
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
        field: 'field-a-runjs-ctx',
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
        field: 'field-a-runjs-error',
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
        field: 'field-a',
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
        field: 'field-a2',
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
        field: 'field-a-ctx',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: '{{ ctx.someVar }}',
      },
    ]);

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));

    store.someVar = 'Y';
    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('Y'));
  });

  it('runs rule after target model becomes available (model:mounted)', async () => {
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
        field: 'field-a-mount',
        mode: 'assign',
        condition: { logic: '$and', items: [] },
        value: '__B__',
      },
    ]);

    // target not ready yet
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(formStub.getFieldValue(['a'])).toBeUndefined();

    // model mounts later with resolved fieldPathArray
    fieldModel.context.fieldPathArray = ['a'];
    engineEmitter.emit('model:mounted', { model: fieldModel, uid: fieldModel.uid });

    await waitFor(() => expect(formStub.getFieldValue(['a'])).toBe('X'));
  });
});
