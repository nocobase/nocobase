/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { CreateFormModel, FormBlockModel } from '@nocobase/client-v2';
import { FlowEngine, FlowModel, FlowRuntimeContext } from '@nocobase/flow-engine';
import { act, fireEvent, render, renderHook } from '@testing-library/react';
import { Form } from 'antd';
import React, { type ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PluginFormDraftsClient } from '../plugin';

const { db, openDB, store } = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const db = {
    createObjectStore: vi.fn(),
    put: vi.fn(async (_storeName: string, value: { uid: string }) => {
      store.set(value.uid, value);
    }),
    get: vi.fn(async (_storeName: string, uid: string) => store.get(uid)),
    delete: vi.fn(async (_storeName: string, uid: string) => {
      store.delete(uid);
    }),
  };
  return {
    db,
    openDB: vi.fn(async (_name: string, _version: number, options?: { upgrade?: (database: typeof db) => void }) => {
      options?.upgrade?.(db);
      return db;
    }),
    store,
  };
});

vi.mock('idb', () => ({ openDB }));

function quotaError() {
  return new DOMException('Storage quota exceeded', 'QuotaExceededError');
}

async function openDraftForm() {
  const engine = new FlowEngine();
  const request = vi.fn().mockResolvedValue({ data: { data: { id: 1 } } });
  engine.context.defineProperty('api', { value: { request } });
  engine.registerModels({ CreateFormModel });
  engine.context.dataSourceManager.getDataSource('main').addCollection({ name: 'posts', fields: [] });
  const model = engine.createModel<CreateFormModel>({
    use: 'CreateFormModel',
    stepParams: {
      resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'posts' } },
      draftCreateFlow: { createDraft: { enabled: true } },
    },
  });
  const { result } = renderHook(() => Form.useForm());
  const [form] = result.current;
  const warning = vi.fn();
  model.context.defineProperty('form', { value: form });
  model.context.defineProperty('view', { value: { inputArgs: {} } });
  model.context.defineProperty('message', { value: { warning } });
  model.context.defineMethod('t', (key: string) => key);
  await model.applyFlow('draftCreateFlow');
  const view = render(
    <Form form={form} initialValues={{ title: '' }}>
      <Form.Item name="title" label="Title">
        <input />
      </Form.Item>
    </Form>,
  );
  const enterTitle = (value: string) =>
    fireEvent.change(view.getByRole('textbox', { name: 'Title' }), { target: { value } });
  const submit = () =>
    act(async () => {
      await model.submit({ requestConfig: { refresh: false } });
    });
  return { model, form, request, warning, enterTitle, submit };
}

describe('PluginFormDraftsClient v2', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it('registers form draft flows on FormBlockModel', () => {
    const draftCreateFlow = FormBlockModel.globalFlowRegistry.getFlow('draftCreateFlow');
    const draftSaveFlow = FormBlockModel.globalFlowRegistry.getFlow('draftSaveFlow');
    const deleteDraftFlow = FormBlockModel.globalFlowRegistry.getFlow('deleteDraftFlow');

    expect(draftCreateFlow?.on).toBe('beforeRender');
    expect(draftCreateFlow?.sort).toBe(10000);
    expect(draftCreateFlow?.steps.createDraft.defaultParams).toEqual({ enabled: false });
    expect(draftCreateFlow?.steps.createDraft.uiMode).toEqual({ type: 'switch', key: 'enabled' });
    expect(draftCreateFlow?.steps.createDraft.uiSchema).toEqual({
      enabled: {
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
      },
    });

    expect(draftSaveFlow?.on).toBe('formValuesChange');
    expect(draftSaveFlow?.steps.saveDraft.handler).toEqual(expect.any(Function));
    expect(deleteDraftFlow?.on).toBe('formSubmitSuccess');
    expect(deleteDraftFlow?.steps.deleteDraft.handler).toEqual(expect.any(Function));
  });

  it('does not eagerly register models in load', async () => {
    const app = {
      flowEngine: {
        registerModels: vi.fn(),
        registerModelLoaders: vi.fn(),
      },
    } as unknown as Application;
    const plugin = new PluginFormDraftsClient({}, app);

    await plugin.load();

    expect(app.flowEngine.registerModels).not.toHaveBeenCalled();
    expect(app.flowEngine.registerModelLoaders).not.toHaveBeenCalled();
  });

  it('creates, saves, and deletes drafts through v2 flow handlers', async () => {
    const engine = new FlowEngine();
    const model = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'form-uid' });
    const ctx = new FlowRuntimeContext(model, 'draftCreateFlow');
    const draftCreateFlow = FormBlockModel.globalFlowRegistry.getFlow('draftCreateFlow');
    const draftSaveFlow = FormBlockModel.globalFlowRegistry.getFlow('draftSaveFlow');
    const deleteDraftFlow = FormBlockModel.globalFlowRegistry.getFlow('deleteDraftFlow');
    const formValues = { title: 'Draft title' };
    const resetFields = vi.fn();
    const setFormValues = vi.fn();

    model.context.defineProperty('resource', {
      value: {
        getFilterByTk: () => 123,
      },
    });
    model.context.defineProperty('form', {
      value: {
        getFieldsValue: () => formValues,
        resetFields,
      },
    });
    model.context.defineMethod('setFormValues', setFormValues);
    model.context.defineMethod('t', (key: string) => key);

    await draftCreateFlow?.steps.createDraft.handler?.(ctx, { enabled: true });
    expect(await ctx.draftRepository.get()).toEqual({ uid: 'form-uid:123', values: {} });

    await draftSaveFlow?.steps.saveDraft.handler?.(ctx, {});
    expect(await ctx.draftRepository.get()).toEqual({ uid: 'form-uid:123', values: formValues });

    await deleteDraftFlow?.steps.deleteDraft.handler?.(ctx, {});
    expect(await ctx.draftRepository.get()).toBeUndefined();
    expect(setFormValues).not.toHaveBeenCalled();
    expect(resetFields).not.toHaveBeenCalled();
    expect(openDB).toHaveBeenCalledWith('FormDraftsDB', 1, { upgrade: expect.any(Function) });
    expect(db.createObjectStore).toHaveBeenCalledWith('drafts', { keyPath: 'uid' });
  });

  it.each([
    [
      'opening storage',
      () => openDB.mockRejectedValueOnce(new DOMException('Cannot open backing store', 'UnknownError')),
    ],
    ['reading the draft', () => db.get.mockRejectedValueOnce(quotaError())],
    ['creating an empty draft', () => db.put.mockRejectedValueOnce(quotaError())],
  ] as const)('still submits the entered values after a failure %s', async (_operation, injectFailure) => {
    injectFailure();
    const { model, enterTitle, warning, request, submit } = await openDraftForm();
    enterTitle('Entered after the warning');
    await model.applyFlow('draftSaveFlow');
    await submit();

    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      'Drafts cannot be saved this time. You can still fill out and submit the form.',
    );
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'post', url: 'posts:create', data: { title: 'Entered after the warning' } }),
    );
    expect(openDB).toHaveBeenCalledTimes(1);
    expect(model.context.draftRepository.disabled).toBe(true);
    expect(store.size).toBe(0);
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('clears a stale draft notice and retries storage when the form is reopened', async () => {
    const { model, enterTitle } = await openDraftForm();
    expect(db.put).toHaveBeenCalledTimes(1);
    enterTitle('Another entry');
    await model.applyFlow('draftSaveFlow');
    expect(model.decoratorProps.beforeContent).toBeTruthy();
    openDB.mockRejectedValueOnce(new DOMException('Cannot open backing store', 'UnknownError'));
    await model.applyFlow('draftCreateFlow');
    expect(model.decoratorProps.beforeContent).toBeNull();
    const setFormValues = vi.fn();
    model.context.defineMethod('setFormValues', setFormValues);
    await model.applyFlow('draftCreateFlow');
    expect(setFormValues).toHaveBeenCalledWith([{ path: ['title'], value: 'Another entry' }], {
      source: 'user',
      triggerEvent: false,
    });
  });

  it('submits the latest edit after autosave fails and does not restore the earlier draft on reopen', async () => {
    const { model, form, enterTitle, request, warning, submit } = await openDraftForm();
    enterTitle('First edit');
    await model.applyFlow('draftSaveFlow');
    expect(model.decoratorProps.beforeContent).toBeTruthy();

    db.put.mockRejectedValueOnce(quotaError());
    enterTitle('Unsaved edit');
    await model.applyFlow('draftSaveFlow');
    expect(form.getFieldValue('title')).toBe('Unsaved edit');
    expect(model.decoratorProps.beforeContent).toBeNull();
    enterTitle('Final edit');
    await model.applyFlow('draftSaveFlow');
    await submit();

    expect(db.put).toHaveBeenCalledTimes(3);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'post', url: 'posts:create', data: { title: 'Final edit' } }),
    );
    const uid = model.context.draftRepository.uid;
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.delete).toHaveBeenCalledWith('drafts', uid);
    expect(store.has(uid)).toBe(false);

    const setFormValues = vi.fn();
    model.context.defineMethod('setFormValues', setFormValues);
    await model.applyFlow('draftCreateFlow');
    expect(db.get).toHaveBeenLastCalledWith('drafts', uid);
    expect(setFormValues).not.toHaveBeenCalled();
    expect(store.get(uid)).toEqual({ uid, values: {} });
  });

  it('keeps a successful submission when autosave and subsequent cleanup both fail', async () => {
    const { model, enterTitle, request, warning, submit } = await openDraftForm();
    enterTitle('Earlier draft');
    await model.applyFlow('draftSaveFlow');
    const uid = model.context.draftRepository.uid;
    const earlierDraft = store.get(uid);
    expect(earlierDraft).toMatchObject({ values: { title: 'Earlier draft' } });

    db.put.mockRejectedValueOnce(quotaError());
    enterTitle('Submitted value');
    await model.applyFlow('draftSaveFlow');
    db.delete.mockRejectedValueOnce(quotaError());
    await submit();

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'post', url: 'posts:create', data: { title: 'Submitted value' } }),
    );
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith('The local draft could not be deleted.');
    expect(store.get(uid)).toEqual(earlierDraft);
  });

  it('preserves the earlier draft when autosave fails and the submission is rejected', async () => {
    const { model, enterTitle, request, submit } = await openDraftForm();
    enterTitle('Earlier draft');
    await model.applyFlow('draftSaveFlow');
    db.put.mockRejectedValueOnce(quotaError());
    enterTitle('Rejected value');
    await model.applyFlow('draftSaveFlow');

    request.mockRejectedValueOnce(new Error('Submission failed'));
    await expect(Promise.resolve(submit())).rejects.toThrow('Submission failed');
    expect(db.delete).not.toHaveBeenCalled();
    expect(store.get(model.context.draftRepository.uid)).toMatchObject({ values: { title: 'Earlier draft' } });
  });

  it('preserves the entered values when discarding a draft fails', async () => {
    const { model, form, enterTitle, warning } = await openDraftForm();
    enterTitle('Keep this value');
    await model.applyFlow('draftSaveFlow');
    const alert = model.decoratorProps.beforeContent as ReactElement<{ onDelete: () => Promise<void> }>;
    db.delete.mockRejectedValueOnce(quotaError());
    await alert.props.onDelete();

    expect(form.getFieldValue('title')).toBe('Keep this value');
    expect(store.size).toBe(1);
    expect(warning).toHaveBeenCalledWith('The local draft could not be deleted.');
  });

  it('completes submission when local draft cleanup fails', async () => {
    const { enterTitle, request, warning, submit } = await openDraftForm();
    enterTitle('Submit once');
    db.delete.mockRejectedValueOnce(quotaError());
    await submit();
    expect(request).toHaveBeenCalledTimes(1);
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith('The local draft could not be deleted.');
  });

  it('saves only runtime user-edited values when runtime is available', async () => {
    const engine = new FlowEngine();
    const model = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'form-uid' });
    const ctx = new FlowRuntimeContext(model, 'draftCreateFlow');
    const draftCreateFlow = FormBlockModel.globalFlowRegistry.getFlow('draftCreateFlow');
    const draftSaveFlow = FormBlockModel.globalFlowRegistry.getFlow('draftSaveFlow');
    const formValues = {
      title: 'Manual title',
      fixed: 'Fixed auto value',
      roles: [{ roleName: 'Manual role', fixedRoleName: 'Fixed role' }],
    };
    const userEditedValues = {
      title: 'Manual title',
      roles: [{ roleName: 'Manual role' }],
    };
    const userEditedPatches = [
      { path: ['title'], value: 'Manual title' },
      { path: ['roles', 0, 'roleName'], value: 'Manual role' },
    ];
    const getFieldsValue = vi.fn(() => formValues);
    const getUserEditedValuePatches = vi.fn(() => userEditedPatches);

    Object.assign(model, { formValueRuntime: { getUserEditedValuePatches } });
    model.context.defineProperty('resource', {
      value: {
        getFilterByTk: () => 123,
      },
    });
    model.context.defineProperty('form', {
      value: {
        getFieldsValue,
        resetFields: vi.fn(),
      },
    });
    model.context.defineMethod('setFormValues', vi.fn());
    model.context.defineMethod('t', (key: string) => key);

    await draftCreateFlow?.steps.createDraft.handler?.(ctx, { enabled: true });
    await draftSaveFlow?.steps.saveDraft.handler?.(ctx, {});

    expect(getUserEditedValuePatches).toHaveBeenCalled();
    expect(getFieldsValue).not.toHaveBeenCalled();
    expect(await ctx.draftRepository.get()).toEqual({
      uid: 'form-uid:123',
      values: userEditedValues,
      patches: userEditedPatches,
    });
  });

  it('saves an empty draft without showing a saved alert when there are no runtime user edits', async () => {
    const engine = new FlowEngine();
    const model = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'form-uid' });
    const ctx = new FlowRuntimeContext(model, 'draftCreateFlow');
    const draftCreateFlow = FormBlockModel.globalFlowRegistry.getFlow('draftCreateFlow');
    const draftSaveFlow = FormBlockModel.globalFlowRegistry.getFlow('draftSaveFlow');
    const setDecoratorProps = vi.fn();
    const getFieldsValue = vi.fn(() => ({ fixed: 'Fixed auto value' }));
    const getUserEditedValuePatches = vi.fn(() => []);

    Object.assign(model, { setDecoratorProps, formValueRuntime: { getUserEditedValuePatches } });
    model.context.defineProperty('resource', {
      value: {
        getFilterByTk: () => 123,
      },
    });
    model.context.defineProperty('form', {
      value: {
        getFieldsValue,
        resetFields: vi.fn(),
      },
    });
    model.context.defineMethod('setFormValues', vi.fn());
    model.context.defineMethod('t', (key: string) => key);

    await draftCreateFlow?.steps.createDraft.handler?.(ctx, { enabled: true });
    setDecoratorProps.mockClear();
    await draftSaveFlow?.steps.saveDraft.handler?.(ctx, {});

    expect(await ctx.draftRepository.get()).toEqual({ uid: 'form-uid:123', values: {}, patches: [] });
    expect(getFieldsValue).not.toHaveBeenCalled();
    expect(setDecoratorProps).not.toHaveBeenCalled();
  });

  it('restores persisted draft patches without expanding parent containers', async () => {
    const engine = new FlowEngine();
    const model = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'form-uid' });
    const ctx = new FlowRuntimeContext(model, 'draftCreateFlow');
    const draftCreateFlow = FormBlockModel.globalFlowRegistry.getFlow('draftCreateFlow');
    const draftValues = {
      roles: [{ id: 1, roleName: 'Draft role', fixedRoleName: 'Fixed role' }],
    };
    const draftPatches = [{ path: ['roles', 0, 'roleName'], value: 'Draft role' }];
    const setDecoratorProps = vi.fn();
    const setFormValues = vi.fn();

    Object.assign(model, { setDecoratorProps });
    store.set('form-uid:123', { uid: 'form-uid:123', values: draftValues, patches: draftPatches });
    model.context.defineProperty('resource', {
      value: {
        getFilterByTk: () => 123,
      },
    });
    model.context.defineProperty('form', {
      value: {
        getFieldsValue: () => draftValues,
        resetFields: vi.fn(),
      },
    });
    model.context.defineMethod('setFormValues', setFormValues);
    model.context.defineMethod('t', (key: string) => key);

    await draftCreateFlow?.steps.createDraft.handler?.(ctx, { enabled: true });

    expect(setFormValues).toHaveBeenCalledWith(draftPatches, { source: 'user', triggerEvent: false });
    expect(setDecoratorProps).toHaveBeenCalledWith({ beforeContent: expect.anything() });
  });

  it('restores an existing non-empty draft as user-edited form values', async () => {
    const engine = new FlowEngine();
    const model = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'form-uid' });
    const ctx = new FlowRuntimeContext(model, 'draftCreateFlow');
    const draftCreateFlow = FormBlockModel.globalFlowRegistry.getFlow('draftCreateFlow');
    const restoredValues = { title: 'Restored title', roles: [{ roleName: 'Draft role' }] };
    const setDecoratorProps = vi.fn();
    const setFormValues = vi.fn();
    const resetFields = vi.fn();
    const resetAfterFormReset = vi.fn();

    Object.assign(model, { setDecoratorProps, formValueRuntime: { resetAfterFormReset } });
    store.set('form-uid:123', { uid: 'form-uid:123', values: restoredValues });
    model.context.defineProperty('resource', {
      value: {
        getFilterByTk: () => 123,
      },
    });
    model.context.defineProperty('form', {
      value: {
        getFieldsValue: () => restoredValues,
        resetFields,
      },
    });
    model.context.defineMethod('setFormValues', setFormValues);
    model.context.defineMethod('t', (key: string) => key);

    await draftCreateFlow?.steps.createDraft.handler?.(ctx, { enabled: true });

    expect(setFormValues).toHaveBeenCalledWith(
      [
        { path: ['title'], value: 'Restored title' },
        { path: ['roles', 0, 'roleName'], value: 'Draft role' },
      ],
      { source: 'user', triggerEvent: false },
    );
    expect(setDecoratorProps).toHaveBeenCalledWith({ beforeContent: expect.anything() });
    expect(await ctx.draftRepository.get()).toEqual({ uid: 'form-uid:123', values: restoredValues });

    const beforeContent = setDecoratorProps.mock.calls[0][0].beforeContent as ReactElement<{
      onDelete: () => Promise<void>;
    }>;
    await beforeContent.props.onDelete();

    expect(await ctx.draftRepository.get()).toBeUndefined();
    expect(resetFields).toHaveBeenCalled();
    expect(resetAfterFormReset).toHaveBeenCalled();
    expect(setDecoratorProps).toHaveBeenLastCalledWith({ beforeContent: null });
  });
});
