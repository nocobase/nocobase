/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { FlowEngine, FlowModel, SingleRecordResource } from '@nocobase/flow-engine';
// 直接从 models 聚合导入，避免局部文件相互引用顺序导致的循环依赖
import { FormBlockContent, FormBlockModel, FormComponent } from '../../../..';
import { Application } from '../../../../../application/Application';
import {
  InputFieldInterface,
  IntegerFieldInterface,
  M2MFieldInterface,
  M2OFieldInterface,
  NumberFieldInterface,
} from '../../../../../collection-manager/interfaces';
import { Form } from 'antd';
// -----------------------------
// Helpers
// -----------------------------

function getByPath(obj: any, namePath: any) {
  const path = Array.isArray(namePath) ? namePath : [namePath];
  return path.reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

async function createTestFormModelSubclass() {
  return class TestFormModel extends FormBlockModel {
    constructor(options: any) {
      super(options);
    }
    createResource(ctx) {
      return ctx.createResource(SingleRecordResource);
    }
    renderComponent(): React.ReactNode {
      return null;
    }
  };
}

async function setupFormModel() {
  const engine = new FlowEngine();
  const app = new Application({
    dataSourceManager: {
      fieldInterfaces: [
        InputFieldInterface,
        IntegerFieldInterface,
        NumberFieldInterface,
        M2OFieldInterface,
        M2MFieldInterface,
      ],
    },
  });
  const dsm = engine.context.dataSourceManager;
  engine.context.defineProperty('app', { value: app });
  const ds = dsm.getDataSource('main');

  // 仿照 flow-engine 的数据源单测创建真实的 collections
  ds.addCollection({
    name: 'users',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'name', type: 'string', interface: 'text' },
      { name: 'org', type: 'belongsTo', target: 'orgs', interface: 'm2o' },
    ],
  });
  ds.addCollection({
    name: 'customers',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'name', type: 'string', interface: 'text' },
      { name: 'level', type: 'belongsTo', target: 'levels', interface: 'm2o' },
    ],
  });
  ds.addCollection({
    name: 'orgs',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'name', type: 'string', interface: 'text' },
    ],
  });
  ds.addCollection({
    name: 'levels',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'name', type: 'string', interface: 'text' },
    ],
  });
  ds.addCollection({
    name: 'orders',
    filterTargetKey: 'id',
    fields: [
      { name: 'customer', type: 'belongsTo', target: 'customers', interface: 'm2o' },
      { name: 'assignees', type: 'belongsToMany', target: 'users', interface: 'm2m' },
      { name: 'note', type: 'string', interface: 'text' },
      { name: 'status', type: 'string', interface: 'text' },
    ],
  });

  const TestFormModel = await createTestFormModelSubclass();
  // 使用引擎注册并创建模型，确保 onInit 等生命周期按真实场景执行
  engine.registerModels({ TestFormModel });
  const model = engine.createModel<any>({
    use: 'TestFormModel',
    uid: 'form-1',
    stepParams: {
      resourceSettings: {
        init: { dataSourceKey: 'main', collectionName: 'orders' },
      },
    },
  });
  return model;
}

function mockFormGridEnabledFields(model: any, fieldPaths: string[]) {
  const items = (fieldPaths || []).map((fieldPath) => ({
    getStepParams: (flowKey: string, stepKey: string) =>
      flowKey === 'fieldSettings' && stepKey === 'init' ? { fieldPath } : undefined,
  }));
  model.subModels = model.subModels || {};
  model.subModels.grid = model.subModels.grid || {};
  model.subModels.grid.subModels = model.subModels.grid.subModels || {};
  model.subModels.grid.subModels.items = items;
}

// -----------------------------
// FlowModel 核心行为（集中到本文件）
// -----------------------------

describe('FlowModel core behaviors (collected)', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getEventFlows(beforeRender) includes explicit and implicit flows, excludes manual or other events', () => {
    class TestModel extends FlowModel {}
    engine.registerModels({ TestModel });
    const model = engine.createModel<TestModel>({ use: 'TestModel', uid: 'm-flow-1' });

    model.flowRegistry.addFlow('A', {
      title: 'ExplicitBefore',
      on: 'beforeRender',
      steps: { s: { title: 'S', handler: () => {} } },
    } as any);
    model.flowRegistry.addFlow('B', {
      title: 'ImplicitBefore',
      steps: { s: { title: 'S', handler: () => {} } },
    } as any);
    model.flowRegistry.addFlow('C', {
      title: 'ManualSkip',
      manual: true,
      steps: { s: { title: 'S', handler: () => {} } },
    } as any);
    model.flowRegistry.addFlow('D', {
      title: 'OtherEvent',
      on: 'formValuesChange',
      steps: { s: { title: 'S', handler: () => {} } },
    } as any);

    const flows = model.getEventFlows('beforeRender');
    const titles = flows.map((f) => f.title);
    expect(titles).toContain('ExplicitBefore');
    expect(titles).toContain('ImplicitBefore');
    expect(titles).not.toContain('ManualSkip');
    expect(titles).not.toContain('OtherEvent');
  });

  it('dispatchEvent defaults for beforeRender; and records last params', async () => {
    const spy = vi.fn().mockResolvedValue([]);
    (engine as any).executor.dispatchEvent = spy;
    const model = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'm-flow-2' });

    await model.dispatchEvent('beforeRender', { foo: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
    const [, e1, i1, o1] = spy.mock.calls[0];
    expect(e1).toBe('beforeRender');
    expect(i1).toEqual({ foo: 1 });
    expect(o1).toMatchObject({ sequential: true, useCache: true });

    await model.dispatchEvent('somethingElse', { bar: 2 });
    const [, e2, i2, o2] = spy.mock.calls[1];
    expect(e2).toBe('somethingElse');
    expect(i2).toEqual({ bar: 2 });
    // 非 beforeRender 事件：默认顺序执行，不强制使用缓存
    expect(o2).toMatchObject({ sequential: true, useCache: undefined });
  });

  it('stepParams change triggers debounced rerun of last beforeRender', async () => {
    vi.useFakeTimers();
    const spy = vi.fn().mockResolvedValue([]);
    (engine as any).executor.dispatchEvent = spy;
    const model = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'm-flow-3' });

    await model.dispatchEvent('beforeRender', { ping: 1 });
    expect(spy).toHaveBeenCalledTimes(1);

    model.setStepParams('anyFlow', 'anyStep', { x: 1 });
    await vi.advanceTimersByTimeAsync(150);
    expect(spy).toHaveBeenCalledTimes(2);
    const [, e2, i2] = spy.mock.calls[1];
    expect(e2).toBe('beforeRender');
    expect(i2).toEqual({ ping: 1 });
  });

  it('applyFlow delegates to executor.runFlow', async () => {
    const spyRun = vi.fn().mockResolvedValue('ok');
    (engine as any).executor.runFlow = spyRun;
    const model = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'm-flow-4' });
    const res = await model.applyFlow('demoFlow', { a: 1 });
    expect(spyRun).toHaveBeenCalledTimes(1);
    const [target, key, args] = spyRun.mock.calls[0];
    expect(target).toBe(model);
    expect(key).toBe('demoFlow');
    expect(args).toEqual({ a: 1 });
    expect(res).toBe('ok');
  });
});

// -----------------------------
// FormBlockModel 行为
// -----------------------------

describe('FormBlockModel (form/formValues injection & server resolve anchors)', () => {
  it('injects form & formValues; resolveOnServer guard; buildVariablesParams anchors by selected associations', async () => {
    const model = await setupFormModel();

    function HookCaller() {
      model.useHooksBeforeRender();
      return null;
    }
    render(React.createElement(HookCaller));

    // 使用一个简易的 FakeForm，避免未挂载 Form 的限制
    const store: Record<string, any> = {};
    const fakeForm = {
      setFieldsValue: (values: Record<string, any>) => Object.assign(store, values),
      getFieldsValue: () => ({ ...store }),
      getFieldValue: (namePath: any) => getByPath(store, namePath),
      setFieldValue: (k: string, v: any) => (store[k] = v),
    };
    (model.context as any).defineProperty('form', { value: fakeForm });
    fakeForm.setFieldsValue({ customer: 9, assignees: [{ id: 3 }, { id: 5 }], note: 'hello' });
    mockFormGridEnabledFields(model, ['customer', 'assignees', 'note']);

    // cache=false check
    const v1 = (model.context as any).formValues;
    expect(v1.customer).toBe(9);
    fakeForm.setFieldsValue({ customer: 11 });
    const v2 = (model.context as any).formValues;
    expect(v2.customer).toBe(11);

    const opt = (model.context as any).getPropertyOptions('formValues');
    expect(typeof opt.resolveOnServer).toBe('function');
    expect(opt.resolveOnServer('')).toBe(false);
    expect(opt.resolveOnServer('customer')).toBe(false);
    // 二级关联字段
    expect(opt.resolveOnServer('customer.level.name')).toBe(true);
    expect(opt.resolveOnServer('assignees.org.name')).toBe(true);

    const metaFactory = opt.meta as () => Promise<any>;
    const meta = await metaFactory();
    expect(typeof meta.buildVariablesParams).toBe('function');
    fakeForm.setFieldsValue({ customer: 9, assignees: [{ id: 3 }, { id: 5 }], note: 'hello' });
    const params = await meta.buildVariablesParams(model.context);

    expect(params.customer).toMatchObject({ collection: 'customers', dataSourceKey: 'main', filterByTk: 9 });
    expect(params.assignees).toMatchObject({ collection: 'users', dataSourceKey: 'main' });
    expect(Array.isArray(params.assignees.filterByTk)).toBe(true);
    expect(params.assignees.filterByTk).toEqual([3, 5]);
    expect(params.note).toBeUndefined();
  });

  it('registers formValuesChange event and eventSettings flow', async () => {
    const engine = new FlowEngine();
    const TestFormModel = await createTestFormModelSubclass();
    const model = new TestFormModel({ uid: 'form-2', flowEngine: engine } as any);

    // event registered
    const ev = model.getEvent('formValuesChange');
    expect(ev?.name).toBe('formValuesChange');

    // flow registered (eventSettings)
    const flows = model.getFlows();
    expect(flows.has('eventSettings')).toBe(true);
  });

  it('delegates layout/assignRules/linkageRules stepParams to grid model', async () => {
    const model = await setupFormModel();
    const engine = model.flowEngine as FlowEngine;

    const save = vi.fn(async (m: any) => ({ uid: m.uid }));
    engine.setModelRepository({
      findOne: vi.fn(async () => null),
      save,
      destroy: vi.fn(async () => true),
      move: vi.fn(async () => {}),
      duplicate: vi.fn(async () => null),
    } as any);

    const grid = engine.createModel({
      uid: 'grid-1',
      use: 'FlowModel',
      parentId: model.uid,
      subKey: 'grid',
      subType: 'object',
    });
    model.setSubModel('grid', grid as any);

    const layoutParams = {
      layout: 'horizontal',
      labelAlign: 'right',
      labelWidth: 160,
      labelWrap: false,
      colon: false,
    };
    const assignRulesParams = { value: [{ key: 'a1', targetPath: 'title', value: 'hello' }] };
    model.setStepParams('formModelSettings', 'layout', layoutParams);
    model.setStepParams('formModelSettings', 'assignRules', assignRulesParams);
    model.setStepParams('eventSettings', 'linkageRules', { value: [{ key: 'r1' }] });

    expect(grid.getStepParams('formModelSettings', 'layout')).toEqual(layoutParams);
    expect(grid.getStepParams('formModelSettings', 'assignRules')).toEqual(assignRulesParams);
    expect(grid.getStepParams('eventSettings', 'linkageRules')).toEqual({ value: [{ key: 'r1' }] });

    // model reads delegated params from grid first
    expect(model.getStepParams('formModelSettings', 'layout')).toEqual(layoutParams);
    expect(model.getStepParams('formModelSettings', 'assignRules')).toEqual(assignRulesParams);
    expect(model.getStepParams('eventSettings', 'linkageRules')).toEqual({ value: [{ key: 'r1' }] });

    // model no longer stores these params locally
    expect((model.stepParams as any)?.formModelSettings?.layout).toBeUndefined();
    expect((model.stepParams as any)?.formModelSettings?.assignRules).toBeUndefined();
    expect((model.stepParams as any)?.eventSettings?.linkageRules).toBeUndefined();

    await model.saveStepParams();
    const savedUids = save.mock.calls.map((c) => c[0]?.uid).sort();
    expect(savedUids).toContain('form-1');
    expect(savedUids).toContain('grid-1');
  });

  it('builds non-empty contextParams for ctx.formValues.* deep association path', async () => {
    const model = await setupFormModel();
    // 注入 api mock 到引擎上下文，拦截 variables:resolve 的请求
    const api = {
      request: vi.fn(async (config: any) => {
        const payload = config?.data?.values || {};
        const batch = payload.batch || [];
        const cp = batch[0]?.contextParams || {};
        const keys = Object.keys(cp).sort();
        // 聚合为单键，不再使用索引键
        expect(keys).toEqual(['formValues.assignees']);
        expect(cp['formValues.assignees']).toMatchObject({ collection: 'users' });
        expect(Array.isArray(cp['formValues.assignees'].filterByTk)).toBe(true);
        expect(cp['formValues.assignees'].filterByTk).toEqual([3, 5]);
        return { data: { ok: true } } as any;
      }),
    } as any;
    (model.flowEngine.context as any).defineProperty('api', { value: api });

    function HookCaller() {
      model.useHooksBeforeRender();
      return null;
    }
    render(React.createElement(HookCaller));

    // 设置 form 值，包含对多关联 assignees（数组）
    const mem: Record<string, any> = {};
    const fakeForm = {
      setFieldsValue: (v: any) => Object.assign(mem, v),
      getFieldsValue: () => ({ ...mem }),
      getFieldValue: (namePath: any) => getByPath(mem, namePath),
      setFieldValue: (k: string, v: any) => (mem[k] = v),
    };
    (model.context as any).defineProperty('form', { value: fakeForm });
    fakeForm.setFieldsValue({ assignees: [{ id: 3 }, { id: 5 }] });
    mockFormGridEnabledFields(model, ['assignees']);

    // 解析一个会触发服务端解析的变量模板
    const tpl = { who: '{{ ctx.formValues.assignees.org.name }}' } as any;
    await (model.context as any).resolveJsonTemplate(tpl);
    expect(api.request).toHaveBeenCalledTimes(1);
  });

  it('builds contextParams for single association (no index at top level)', async () => {
    const model = await setupFormModel();
    const api = {
      request: vi.fn(async (config: any) => {
        const payload = config?.data?.values || {};
        const batch = payload.batch || [];
        const cp = batch[0]?.contextParams || {};
        const keys = Object.keys(cp).sort();
        expect(keys).toEqual(['formValues.customer']);
        expect(cp['formValues.customer']).toMatchObject({ collection: 'customers', filterByTk: 9 });
        return { data: { ok: true } } as any;
      }),
    } as any;
    (model.flowEngine.context as any).defineProperty('api', { value: api });

    function HookCaller2() {
      model.useHooksBeforeRender();
      return null;
    }
    render(React.createElement(HookCaller2));

    const mem2: Record<string, any> = {};
    const fakeForm2 = {
      setFieldsValue: (v: any) => Object.assign(mem2, v),
      getFieldsValue: () => ({ ...mem2 }),
      getFieldValue: (namePath: any) => getByPath(mem2, namePath),
      setFieldValue: (k: string, v: any) => (mem2[k] = v),
    };
    (model.context as any).defineProperty('form', { value: fakeForm2 });
    fakeForm2.setFieldsValue({ customer: { id: 9 } });
    mockFormGridEnabledFields(model, ['customer']);

    const tpl2 = { who: '{{ ctx.formValues.customer.level.name }}' } as any;
    await (model.context as any).resolveJsonTemplate(tpl2);
    expect(api.request).toHaveBeenCalledTimes(1);
  });

  it('configured toMany dot aggregation path uses local value and skips server', async () => {
    const model = await setupFormModel();

    const api = {
      request: vi.fn(async () => {
        return { data: { ok: true } } as any;
      }),
    } as any;
    (model.flowEngine.context as any).defineProperty('api', { value: api });

    function HookCaller() {
      model.useHooksBeforeRender();
      return null;
    }
    render(React.createElement(HookCaller));

    const mem: Record<string, any> = {};
    const fakeForm = {
      setFieldsValue: (v: any) => Object.assign(mem, v),
      getFieldsValue: () => ({ ...mem }),
      getFieldValue: (namePath: any) => getByPath(mem, namePath),
      setFieldValue: (k: string, v: any) => (mem[k] = v),
    };
    (model.context as any).defineProperty('form', { value: fakeForm });
    fakeForm.setFieldsValue({
      assignees: [
        { id: 3, name: 'A' },
        { id: 5, name: 'B' },
      ],
    });
    mockFormGridEnabledFields(model, ['assignees']);

    const tpl = { names: '{{ ctx.formValues.assignees.name }}' } as any;
    const out = await (model.context as any).resolveJsonTemplate(tpl);
    expect(out).toEqual({ names: ['A', 'B'] });
    expect(api.request).toHaveBeenCalledTimes(0);

    const names = await (model.context as any).getVar('ctx.formValues.assignees.name');
    expect(names).toEqual(['A', 'B']);
    expect(api.request).toHaveBeenCalledTimes(0);
  });

  it('unconfigured field: new record returns undefined and does not call server', async () => {
    const model = await setupFormModel();

    const api = { request: vi.fn(async () => ({ data: {} }) as any) } as any;
    (model.flowEngine.context as any).defineProperty('api', { value: api });

    function HookCaller() {
      model.useHooksBeforeRender();
      return null;
    }
    render(React.createElement(HookCaller));

    // 新建表单：没有 currentFilterByTk / filterByTk 锚点
    const mem: Record<string, any> = {};
    const fakeForm = {
      setFieldsValue: (v: any) => Object.assign(mem, v),
      getFieldsValue: () => ({ ...mem }),
      getFieldValue: (k: string) => mem[k],
      setFieldValue: (k: string, v: any) => (mem[k] = v),
    };
    (model.context as any).defineProperty('form', { value: fakeForm });
    // 仅配置 customer / assignees，不包含 status
    mockFormGridEnabledFields(model, ['customer', 'assignees', 'note']);
    fakeForm.setFieldsValue({ note: 'hello' });

    const tpl = { status: '{{ ctx.formValues.status }}' } as any;
    const out = await (model.context as any).resolveJsonTemplate(tpl);
    expect(api.request).toHaveBeenCalledTimes(0);
    expect(out).toEqual({ status: undefined });
  });

  it('unconfigured field: edit record triggers server resolve with selective formValues record ref', async () => {
    const model = await setupFormModel();

    const api = {
      request: vi.fn(async (config: any) => {
        const batch = config?.data?.values?.batch || [];
        const item = batch[0] || {};
        const cp = item?.contextParams || {};
        const keys = Object.keys(cp).sort();
        expect(keys).toEqual(['formValues']);
        expect(cp.formValues).toMatchObject({
          dataSourceKey: 'main',
          collection: 'orders',
          filterByTk: 1,
        });
        expect(cp.formValues.fields).toEqual(['status']);
        expect(cp.formValues.appends).toBeUndefined();
        return {
          data: {
            data: {
              results: [{ id: item.id, data: { status: 'PAID', note: '{{ ctx.formValues.note }}' } }],
            },
          },
        } as any;
      }),
    } as any;
    (model.flowEngine.context as any).defineProperty('api', { value: api });

    function HookCaller() {
      model.useHooksBeforeRender();
      return null;
    }
    render(React.createElement(HookCaller));

    // 模拟编辑表单：设置 currentFilterByTk
    (model.context as any).resource?.setMeta?.({ currentFilterByTk: 1 });

    const mem: Record<string, any> = {};
    const fakeForm = {
      setFieldsValue: (v: any) => Object.assign(mem, v),
      getFieldsValue: () => ({ ...mem }),
      getFieldValue: (k: string) => mem[k],
      setFieldValue: (k: string, v: any) => (mem[k] = v),
    };
    (model.context as any).defineProperty('form', { value: fakeForm });
    // status 未配置在表单中（仅配置其他字段）
    mockFormGridEnabledFields(model, ['customer', 'assignees', 'note']);
    fakeForm.setFieldsValue({ note: 'LOCAL_NOTE' });

    const tpl = { status: '{{ ctx.formValues.status }}', note: '{{ ctx.formValues.note }}' } as any;
    const out = await (model.context as any).resolveJsonTemplate(tpl);
    expect(api.request).toHaveBeenCalledTimes(1);
    expect(out).toEqual({ status: 'PAID', note: 'LOCAL_NOTE' });
  });

  it('unconfigured association subpath (edit record): injects top-level formValues record ref with appends/fields', async () => {
    const model = await setupFormModel();

    const api = {
      request: vi.fn(async (config: any) => {
        const batch = config?.data?.values?.batch || [];
        const item = batch[0] || {};
        const cp = item?.contextParams || {};
        const keys = Object.keys(cp).sort();
        expect(keys).toEqual(['formValues']);
        expect(cp.formValues).toMatchObject({
          dataSourceKey: 'main',
          collection: 'orders',
          filterByTk: 1,
        });
        expect(cp.formValues.fields).toEqual(['customer.level.name']);
        expect(cp.formValues.appends).toEqual(['customer', 'customer.level']);
        return { data: { data: { results: [{ id: item.id, data: { who: 'L1' } }] } } } as any;
      }),
    } as any;
    (model.flowEngine.context as any).defineProperty('api', { value: api });

    function HookCaller() {
      model.useHooksBeforeRender();
      return null;
    }
    render(React.createElement(HookCaller));

    (model.context as any).resource?.setMeta?.({ currentFilterByTk: 1 });

    const mem: Record<string, any> = {};
    const fakeForm = {
      setFieldsValue: (v: any) => Object.assign(mem, v),
      getFieldsValue: () => ({ ...mem }),
      getFieldValue: (k: string) => mem[k],
      setFieldValue: (k: string, v: any) => (mem[k] = v),
    };
    (model.context as any).defineProperty('form', { value: fakeForm });
    // customer 未配置在表单中：只能基于当前记录（DB）解析 customer.level.name
    mockFormGridEnabledFields(model, ['note']);
    fakeForm.setFieldsValue({ note: 'hello' });

    const tpl = { who: '{{ ctx.formValues.customer.level.name }}' } as any;
    const out = await (model.context as any).resolveJsonTemplate(tpl);
    expect(api.request).toHaveBeenCalledTimes(1);
    expect(out).toEqual({ who: 'L1' });
  });
});

const createRect = (height: number) => ({
  x: 0,
  y: 0,
  width: 100,
  height,
  top: 0,
  left: 0,
  right: 100,
  bottom: height,
  toJSON: () => {},
});

const setRect = (node: HTMLElement | null, height: number) => {
  if (!node) return;
  node.getBoundingClientRect = () => createRect(height);
};

const FormContentHarness = ({
  heightMode,
  height,
  gridModel,
}: {
  heightMode?: string;
  height?: number;
  gridModel: any;
}) => {
  const [form] = Form.useForm();
  const modelRef = useRef<any>();
  if (!modelRef.current) {
    modelRef.current = {
      form,
      context: { view: { inputArgs: {} }, record: {} },
      markUserModifiedFields: vi.fn(),
      dispatchEvent: vi.fn(),
      emitter: { emit: vi.fn() },
    };
  }

  return (
    <FormBlockContent
      model={modelRef.current}
      gridModel={gridModel}
      heightMode={heightMode}
      height={height}
      grid={<div data-testid="grid" />}
      actions={<div data-testid="actions" />}
      footer={<div data-testid="footer" />}
    />
  );
};

describe('FormBlockModel block height', () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    if (typeof globalThis.ResizeObserver === 'undefined') {
      globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as any;
    }
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('updates grid height when heightMode is fixed', async () => {
    const gridModel: any = {
      props: {},
      setProps: vi.fn(),
    };
    gridModel.setProps = vi.fn((next) => Object.assign(gridModel.props, next));

    const { container, rerender } = render(
      <FormContentHarness heightMode="specifyValue" height={200} gridModel={gridModel} />,
    );

    gridModel.setProps.mockClear();

    const gridEl = container.querySelector('[data-testid="grid"]') as HTMLElement;
    const containerEl = gridEl?.parentElement as HTMLElement;
    const actionsWrapper = container.querySelector('[data-testid="actions"]')?.parentElement as HTMLElement;
    const footerWrapper = container.querySelector('[data-testid="footer"]')?.parentElement as HTMLElement;

    setRect(containerEl, 400);
    setRect(actionsWrapper, 40);
    setRect(footerWrapper, 20);

    rerender(<FormContentHarness heightMode="specifyValue" height={201} gridModel={gridModel} />);

    await waitFor(() => {
      expect(gridModel.setProps).toHaveBeenLastCalledWith({ height: 340 });
    });
  });

  it('clears grid height when heightMode is not fixed', async () => {
    const gridModel: any = {
      props: { height: 120 },
      setProps: vi.fn(),
    };
    gridModel.setProps = vi.fn((next) => Object.assign(gridModel.props, next));

    render(<FormContentHarness heightMode="default" height={200} gridModel={gridModel} />);

    await waitFor(() => {
      expect(gridModel.setProps).toHaveBeenCalledWith({ height: undefined });
    });
  });
});

describe('FormComponent mobile horizontal layout class', () => {
  const createModel = (isMobileLayout: boolean) => {
    return {
      form: undefined,
      context: {
        isMobileLayout,
        view: { inputArgs: {} },
        record: {},
      },
      markUserModifiedFields: vi.fn(),
      dispatchEvent: vi.fn(),
      emitter: { emit: vi.fn() },
    } as any;
  };

  it('adds mobile horizontal keep class when mobile + horizontal', () => {
    const model = createModel(true);
    const { container } = render(
      <FormComponent model={model} layoutProps={{ layout: 'horizontal' }}>
        <div data-testid="content">content</div>
      </FormComponent>,
    );
    const formEl = container.querySelector('form.ant-form');
    expect(formEl?.className).toContain('nb-flow-keep-mobile-horizontal');
  });

  it('does not add keep class when layout is vertical', () => {
    const model = createModel(true);
    const { container } = render(
      <FormComponent model={model} layoutProps={{ layout: 'vertical' }}>
        <div data-testid="content">content</div>
      </FormComponent>,
    );
    const formEl = container.querySelector('form.ant-form');
    expect(formEl?.className || '').not.toContain('nb-flow-keep-mobile-horizontal');
  });

  it('does not add keep class when desktop + horizontal', () => {
    const model = createModel(false);
    const { container } = render(
      <FormComponent model={model} layoutProps={{ layout: 'horizontal' }}>
        <div data-testid="content">content</div>
      </FormComponent>,
    );
    const formEl = container.querySelector('form.ant-form');
    expect(formEl?.className || '').not.toContain('nb-flow-keep-mobile-horizontal');
  });
});
