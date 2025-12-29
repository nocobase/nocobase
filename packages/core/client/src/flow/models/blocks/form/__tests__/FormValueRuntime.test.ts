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
import { get as lodashGet, merge as lodashMerge, set as lodashSet } from 'lodash';
import { FlowContext } from '@nocobase/flow-engine';
import { FormValueRuntime } from '../FormValueRuntime';

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
  ctx.defineMethod('resolveJsonTemplate', async function (this: any, template: any) {
    if (template === '__B__') {
      return this.formValues.b;
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
