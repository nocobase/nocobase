/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { FormBlockModel } from '@nocobase/client-v2';
import { FlowEngine, FlowModel, FlowRuntimeContext } from '@nocobase/flow-engine';
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

  it('restores an existing non-empty draft before rendering the form', async () => {
    const engine = new FlowEngine();
    const model = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'form-uid' });
    const ctx = new FlowRuntimeContext(model, 'draftCreateFlow');
    const draftCreateFlow = FormBlockModel.globalFlowRegistry.getFlow('draftCreateFlow');
    const restoredValues = { title: 'Restored title' };
    const setDecoratorProps = vi.fn();
    const setFormValues = vi.fn();

    Object.assign(model, { setDecoratorProps });
    store.set('form-uid:123', { uid: 'form-uid:123', values: restoredValues });
    model.context.defineProperty('resource', {
      value: {
        getFilterByTk: () => 123,
      },
    });
    model.context.defineProperty('form', {
      value: {
        getFieldsValue: () => restoredValues,
        resetFields: vi.fn(),
      },
    });
    model.context.defineMethod('setFormValues', setFormValues);
    model.context.defineMethod('t', (key: string) => key);

    await draftCreateFlow?.steps.createDraft.handler?.(ctx, { enabled: true });

    expect(setFormValues).toHaveBeenCalledWith(restoredValues);
    expect(setDecoratorProps).toHaveBeenCalledWith({ beforeContent: expect.anything() });
    expect(await ctx.draftRepository.get()).toEqual({ uid: 'form-uid:123', values: restoredValues });
  });
});
