/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuplicateActionModel } from '../DuplicateActionModel';
import { PluginActionDuplicateClient } from '../index';

describe('DuplicateActionModel', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.context.defineProperty('t', {
      value: (key: string) => `t:${key}`,
    });
    engine.registerModels({ DuplicateActionModel });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createModel = (props: Record<string, any> = {}) =>
    engine.createModel<DuplicateActionModel>({
      uid: 'duplicate-model',
      use: 'DuplicateActionModel',
      props,
    });

  it('registers the duplicate action model loader', async () => {
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginActionDuplicateClient.prototype) as PluginActionDuplicateClient & {
      app: {
        flowEngine: {
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.app = {
      flowEngine: {
        registerModelLoaders,
      },
    };

    await plugin.load();

    expect(registerModelLoaders).toHaveBeenCalledWith({
      DuplicateActionModel: {
        extends: 'ActionModel',
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.DuplicateActionModel.loader()).resolves.toHaveProperty(
      'DuplicateActionModel',
      DuplicateActionModel,
    );
  });

  it('dispatches quickCreateClick or openDuplicatePopup on click', () => {
    const model = createModel({ duplicateMode: 'quickDulicate' });
    const event = { type: 'click' } as any;

    const dispatchEvent = vi.spyOn(model, 'dispatchEvent').mockResolvedValue(undefined as any);
    vi.spyOn(model, 'getInputArgs').mockReturnValue({ foo: 'bar' });

    model.onClick(event);

    expect(dispatchEvent).toHaveBeenCalledWith(
      'quickCreateClick',
      {
        event,
        foo: 'bar',
      },
      { debounce: true },
    );

    model.setProps({ duplicateMode: 'continueduplicate' });
    model.onClick(event);

    expect(dispatchEvent).toHaveBeenLastCalledWith(
      'openDuplicatePopup',
      {
        event,
        foo: 'bar',
      },
      { debounce: true },
    );
  });

  it('returns translated title while duplicating and falls back to default label', () => {
    const model = createModel({ title: 'Custom title' });

    expect(model.getTitle()).toBe('Custom title');

    model.duplicateLoading = true;
    expect(model.getTitle()).toBe('t:Duplicating');

    model.duplicateLoading = false;
    model.setProps({ title: '' });
    expect(model.getTitle()).toBe('t:Duplicate');
  });

  it('stores duplicate mode settings with normalized field selection', async () => {
    const model = createModel();
    const flow: any = model.getFlow('duplicateModeSettings');
    const step: any = flow.getStep('duplicateMode');
    const handler = step.serialize().handler;
    const defaultParams = step.serialize().defaultParams;

    const setProps = vi.fn();
    const ctx: any = {
      model: {
        setProps,
      },
      record: {
        __collection: 'archivedPosts',
      },
      blockModel: {
        collection: {
          name: 'posts',
        },
      },
    };

    const params = {
      duplicateMode: 'continueduplicate',
      duplicateFields: { checked: ['title', 'status'] },
      collection: 'posts',
      treeData: [{ key: 'title' }],
    };

    await handler(ctx, params);

    expect(defaultParams(ctx)).toEqual({
      duplicateMode: 'quickDulicate',
      collection: 'archivedPosts',
    });
    expect(
      defaultParams({
        blockModel: {
          collection: {
            name: 'posts',
          },
        },
      }),
    ).toEqual({
      duplicateMode: 'quickDulicate',
      collection: 'posts',
    });
    expect(setProps).toHaveBeenCalledWith({
      duplicateMode: 'continueduplicate',
      duplicateFields: ['title', 'status'],
      duplicateCollection: 'posts',
      treeData: params.treeData,
    });
  });

  it('exposes duplicate mode ui schema and registers flow scopes', () => {
    const model = createModel({ duplicateFields: ['title'] });
    const step: any = model.getFlow('duplicateModeSettings')?.getStep('duplicateMode');
    const uiSchema = step.serialize().uiSchema;
    const registerScopes = vi.fn();
    const getAllCollectionsInheritChain = vi.fn(() => ['posts', 'archivedPosts']);
    const getCollection = vi.fn((name: string) => ({ title: `${name} title` }));
    const ctx: any = {
      t: (key: string) => key,
      record: undefined,
      model: {
        uid: 'duplicate-action',
        props: model.props,
        flowEngine: {
          flowSettings: {
            registerScopes,
          },
        },
        getStepParams: vi.fn(() => undefined),
      },
      blockModel: {
        collection: {
          name: 'posts',
          dataSourceKey: 'main',
        },
      },
      dataSourceManager: {
        getDataSource: vi.fn(() => ({
          collectionManager: {
            getAllCollectionsInheritChain,
            getCollection,
          },
        })),
        getCollection: vi.fn(() => ({
          fields: new Map(),
        })),
      },
    };

    const schema = uiSchema(ctx);

    expect(registerScopes).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionName: 'posts',
        currentCollection: 'posts',
        duplicateValues: ['title'],
        getOnLoadData: expect.any(Function),
        getOnCheck: expect.any(Function),
      }),
    );
    expect(schema.collection['x-component-props'].options).toEqual([
      { label: 'posts title', value: 'posts' },
      { label: 'archivedPosts title', value: 'archivedPosts' },
    ]);
    expect(schema.duplicateFields['x-component-props']).toMatchObject({
      defaultCheckedKeys: ['title'],
      checkable: true,
      checkStrictly: true,
      selectable: false,
    });

    const quickDuplicateReaction = schema.collection['x-reactions'][1];
    const field = {
      form: {
        values: {
          duplicateMode: 'quickDulicate',
        },
        setValuesIn: vi.fn(),
      },
    };
    quickDuplicateReaction(field);
    expect(field.form.setValuesIn).toHaveBeenCalledWith('collection', 'posts');
  });

  it('toggles confirm visibility by duplicate mode', () => {
    const model = createModel();
    const quickCtx: any = {
      model: {
        getStepParams: vi.fn(() => ({ duplicateMode: 'quickDulicate' })),
      },
    };
    const continueCtx: any = {
      model: {
        getStepParams: vi.fn(() => ({ duplicateMode: 'continueduplicate' })),
      },
    };
    const quickConfirm = model.getFlow('duplicateSettings')?.getStep('confirm')?.serialize() as any;
    const popupConfirm = model.getFlow('popupSettings')?.getStep('confirm')?.serialize() as any;
    const popupOpenView = model.getFlow('popupSettings')?.getStep('openView')?.serialize() as any;

    expect(quickConfirm.hideInSettings(quickCtx)).toBe(false);
    expect(quickConfirm.hideInSettings(continueCtx)).toBe(true);
    expect(popupConfirm.hideInSettings(quickCtx)).toBe(true);
    expect(popupConfirm.hideInSettings(continueCtx)).toBe(false);
    expect(popupOpenView.hideInSettings(quickCtx)).toBe(true);
    expect(popupOpenView.hideInSettings(continueCtx)).toBe(false);
    expect(quickConfirm.hideInSettings({ model: {} })).toBe(true);
    expect(popupConfirm.hideInSettings({ model: {} })).toBe(false);
    expect(popupOpenView.hideInSettings({ model: {} })).toBe(false);
    expect(quickConfirm.hideInSettings({ model: { getStepParams: vi.fn(() => undefined) } })).toBe(true);
    expect(popupConfirm.hideInSettings({ model: { getStepParams: vi.fn(() => undefined) } })).toBe(false);
    expect(popupOpenView.hideInSettings({ model: { getStepParams: vi.fn(() => undefined) } })).toBe(false);
  });

  it('stores duplicate mode settings when duplicate fields are already an array', async () => {
    const model = createModel();
    const step: any = model.getFlow('duplicateModeSettings')?.getStep('duplicateMode');
    const handler = step.serialize().handler;
    const setProps = vi.fn();

    await handler(
      {
        model: {
          setProps,
        },
      },
      {
        duplicateMode: 'quickDulicate',
        duplicateFields: ['title', 'author.name'],
        collection: 'posts',
      },
    );

    expect(setProps).toHaveBeenCalledWith({
      duplicateMode: 'quickDulicate',
      duplicateFields: ['title', 'author.name'],
      duplicateCollection: 'posts',
      treeData: undefined,
    });
  });

  it('shows an error when duplicate fields are not configured', async () => {
    const model = createModel();
    const flow: any = model.getFlow('duplicateSettings');
    const step: any = flow.getStep('duplicate');
    const handler = step.serialize().handler;

    const ctx: any = {
      model: {
        props: {
          duplicateFields: [],
        },
        duplicateLoading: false,
        rerender: vi.fn(),
      },
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    await handler(ctx, {});

    expect(ctx.message.error).toHaveBeenCalled();
    expect(String(ctx.message.error.mock.calls[0][0])).toContain(
      'Please configure the duplicate fields in duplicate mode configuration',
    );
  });

  it('creates a record from template data and toggles loading state', async () => {
    const flow: any = createModel({ duplicateFields: ['title', 'unknown'] }).getFlow('duplicateSettings');
    const step: any = flow.getStep('duplicate');
    const handler = step.serialize().handler;

    const runAction = vi.fn(async () => ({ data: { title: 'Copy' } }));
    const resource = {
      setDataSourceKey: vi.fn(),
      setResourceName: vi.fn(),
      runAction,
    };
    const blockResource = {
      create: vi.fn(async () => undefined),
    };

    const ctx: any = {
      model: {
        props: {
          duplicateFields: ['title', 'unknown'],
        },
        duplicateLoading: false,
        rerender: vi.fn(),
      },
      blockModel: {
        collection: {
          filterTargetKey: 'id',
          dataSourceKey: 'main',
          name: 'posts',
        },
        resource: blockResource,
      },
      record: {
        id: 100,
        __collection: 'posts',
        title: 'Origin',
      },
      collection: {
        fields: new Map([
          ['title', { name: 'title' }],
          ['status', { name: 'status' }],
        ]),
      },
      createResource: vi.fn(() => resource),
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    const requestConfig = { headers: { 'x-test': '1' } };
    await handler(ctx, { requestConfig });

    expect(ctx.createResource).toHaveBeenCalled();
    expect(resource.setDataSourceKey).toHaveBeenCalledWith('main');
    expect(resource.setResourceName).toHaveBeenCalledWith('posts');
    expect(runAction).toHaveBeenCalledWith('get', {
      params: {
        filterByTk: 100,
        fields: ['title'],
        isTemplate: true,
      },
    });
    expect(blockResource.create).toHaveBeenCalledWith({ title: 'Copy' }, requestConfig);
    expect(ctx.message.success).toHaveBeenCalled();
    expect(ctx.model.duplicateLoading).toBe(false);
    expect(ctx.model.rerender).toHaveBeenCalledTimes(2);
  });

  it('skips duplicate create when already loading', async () => {
    const flow: any = createModel({ duplicateFields: ['title'] }).getFlow('duplicateSettings');
    const step: any = flow.getStep('duplicate');
    const handler = step.serialize().handler;
    const ctx: any = {
      model: {
        props: {
          duplicateFields: ['title'],
        },
        duplicateLoading: true,
        rerender: vi.fn(),
      },
      createResource: vi.fn(),
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    await handler(ctx, {});

    expect(ctx.createResource).not.toHaveBeenCalled();
    expect(ctx.model.rerender).not.toHaveBeenCalled();
  });

  it('creates records with composite filter target keys and resets loading after failures', async () => {
    const flow: any = createModel({ duplicateFields: ['title'] }).getFlow('duplicateSettings');
    const step: any = flow.getStep('duplicate');
    const handler = step.serialize().handler;
    const createError = new Error('create failed');
    const runAction = vi.fn(async () => ({ data: { title: 'Copy' } }));
    const resource = {
      setDataSourceKey: vi.fn(),
      setResourceName: vi.fn(),
      runAction,
    };
    const ctx: any = {
      model: {
        props: {
          duplicateFields: ['title'],
        },
        duplicateLoading: false,
        rerender: vi.fn(),
      },
      blockModel: {
        collection: {
          filterTargetKey: ['tenantId', 'id'],
          dataSourceKey: 'main',
          name: 'posts',
        },
        resource: {
          create: vi.fn().mockRejectedValue(createError),
        },
      },
      record: {
        tenantId: 1,
        id: 100,
      },
      collection: {
        fields: new Map([['title', { name: 'title' }]]),
      },
      createResource: vi.fn(() => resource),
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    await expect(handler(ctx, {})).rejects.toBe(createError);

    expect(runAction).toHaveBeenCalledWith('get', {
      params: {
        filterByTk: {
          tenantId: 1,
          id: 100,
        },
        fields: ['title'],
        isTemplate: true,
      },
    });
    expect(ctx.model.duplicateLoading).toBe(false);
    expect(ctx.model.rerender).toHaveBeenCalledTimes(2);
    expect(ctx.message.success).not.toHaveBeenCalled();
  });

  it('creates an empty duplicate when no selected field exists in the collection', async () => {
    const flow: any = createModel({ duplicateFields: ['unknown'] }).getFlow('duplicateSettings');
    const step: any = flow.getStep('duplicate');
    const handler = step.serialize().handler;
    const runAction = vi.fn();
    const resource = {
      setDataSourceKey: vi.fn(),
      setResourceName: vi.fn(),
      runAction,
    };
    const create = vi.fn().mockResolvedValue(undefined);
    const ctx: any = {
      model: {
        props: {
          duplicateFields: ['unknown'],
        },
        duplicateLoading: false,
        rerender: vi.fn(),
      },
      blockModel: {
        collection: {
          filterTargetKey: 'id',
          dataSourceKey: 'main',
          name: 'posts',
        },
        resource: {
          create,
        },
      },
      record: {
        id: 100,
      },
      collection: {
        fields: new Map([['title', { name: 'title' }]]),
      },
      createResource: vi.fn(() => resource),
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    await handler(ctx, {});

    expect(runAction).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({}, undefined);
  });

  it('creates an empty duplicate when record id is unavailable', async () => {
    const flow: any = createModel({ duplicateFields: ['title'] }).getFlow('duplicateSettings');
    const step: any = flow.getStep('duplicate');
    const handler = step.serialize().handler;
    const runAction = vi.fn();
    const create = vi.fn().mockResolvedValue(undefined);
    const ctx: any = {
      model: {
        props: {
          duplicateFields: ['title'],
        },
        duplicateLoading: false,
        rerender: vi.fn(),
      },
      blockModel: {
        collection: {
          filterTargetKey: 'id',
          dataSourceKey: 'main',
          name: 'posts',
        },
        resource: {
          create,
        },
      },
      record: {},
      collection: {
        fields: new Map([['title', { name: 'title' }]]),
      },
      createResource: vi.fn(() => ({
        setDataSourceKey: vi.fn(),
        setResourceName: vi.fn(),
        runAction,
      })),
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    await handler(ctx, {});

    expect(runAction).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({}, undefined);
  });

  it('delegates openView when popupTemplateUid is provided', async () => {
    const model = createModel({ duplicateFields: ['title'] });
    const flow: any = model.getFlow('popupSettings');
    const step: any = flow.getStep('openView');
    const handler = step.serialize().handler;

    vi.spyOn(model, 'dispatchEvent').mockResolvedValue(undefined as any);

    const runAction = vi.fn(async () => ({ data: { title: 'Copy' } }));
    const resource = {
      setDataSourceKey: vi.fn(),
      setResourceName: vi.fn(),
      runAction,
    };

    const ctx: any = {
      model,
      blockModel: {
        uid: 'view-uid',
        collection: {
          filterTargetKey: 'id',
          dataSourceKey: 'main',
          name: 'posts',
        },
      },
      record: {
        id: 100,
        __collection: 'posts',
      },
      collection: {
        fields: new Map([['title', { name: 'title' }]]),
      },
      createResource: vi.fn(() => resource),
      runAction: vi.fn(async () => undefined),
      viewer: {
        open: vi.fn(),
      },
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    const params = {
      popupTemplateUid: ' popup-uid ',
      uid: ' target-uid ',
      viewUid: 'custom-view',
      dataSourceKey: 'main',
      collectionName: 'posts',
    };

    await handler(ctx, params);

    expect(ctx.runAction).toHaveBeenCalledWith(
      'openView',
      expect.objectContaining({
        navigation: false,
        scene: 'new',
        formData: { title: 'Copy' },
        viewUid: 'custom-view',
        dataSourceKey: 'main',
        collectionName: 'posts',
        uid: 'target-uid',
      }),
    );
    expect(ctx.viewer.open).not.toHaveBeenCalled();
  });

  it('shows an error when popup duplicate fields are not configured', async () => {
    const model = createModel();
    const flow: any = model.getFlow('popupSettings');
    const step: any = flow.getStep('openView');
    const handler = step.serialize().handler;
    vi.spyOn(model, 'dispatchEvent').mockResolvedValue(undefined as any);
    const ctx: any = {
      model,
      message: {
        error: vi.fn(),
      },
      t: (key: string) => key,
    };

    await handler(ctx, {});

    expect(model.dispatchEvent).toHaveBeenCalledWith('beforeRender');
    expect(ctx.message.error).toHaveBeenCalledWith(
      'Please configure the duplicate fields in duplicate mode configuration',
    );
  });

  it('opens local duplicate popup with fetched template data', async () => {
    const model = createModel({ duplicateFields: ['title'] });
    const flow: any = model.getFlow('popupSettings');
    const step: any = flow.getStep('openView');
    const handler = step.serialize().handler;
    vi.spyOn(model, 'dispatchEvent').mockResolvedValue(undefined as any);
    model.uid = 'duplicate-action';

    const runAction = vi.fn(async () => ({ data: { title: 'Copy' } }));
    const resource = {
      setDataSourceKey: vi.fn(),
      setResourceName: vi.fn(),
      runAction,
    };
    model.flowEngine.context.themeToken = {
      colorBgLayout: '#f5f5f5',
    } as any;
    const ctx: any = {
      model,
      inputArgs: {
        mode: 'dialog',
        size: 'large',
      },
      layoutContentElement: document.createElement('div'),
      blockModel: {
        uid: 'block-uid',
        collection: {
          filterTargetKey: 'id',
          dataSourceKey: 'main',
          name: 'posts',
        },
      },
      record: {
        id: 100,
        __collection: 'archivedPosts',
      },
      collection: {
        fields: new Map([['title', { name: 'title' }]]),
      },
      createResource: vi.fn(() => resource),
      runAction: vi.fn(),
      viewer: {
        open: vi.fn(),
      },
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    await handler(ctx, {
      mode: 'drawer',
      size: 'small',
    });

    expect(ctx.runAction).not.toHaveBeenCalled();
    expect(ctx.viewer.open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dialog',
        width: '80%',
        inheritContext: false,
        target: ctx.layoutContentElement,
        inputArgs: {
          parentId: 'duplicate-action',
          scene: 'new',
          dataSourceKey: 'main',
          collectionName: 'archivedPosts',
          formData: { title: 'Copy' },
          viewUid: 'block-uid',
        },
        styles: expect.objectContaining({
          content: expect.objectContaining({
            padding: 0,
            backgroundColor: '#f5f5f5',
          }),
        }),
      }),
    );
    expect(ctx.viewer.open.mock.calls[0][0].content).toBeTypeOf('function');
    const contentElement = ctx.viewer.open.mock.calls[0][0].content();
    expect(contentElement.props.model).toBe(model);
    expect(contentElement.props.scene).toBe('create');
  });

  it('opens embed duplicate popup without template data when record id is unavailable', async () => {
    const model = createModel({ duplicateFields: ['title'] });
    const flow: any = model.getFlow('popupSettings');
    const step: any = flow.getStep('openView');
    const handler = step.serialize().handler;
    vi.spyOn(model, 'dispatchEvent').mockResolvedValue(undefined as any);
    model.uid = 'duplicate-action';

    const runAction = vi.fn();
    model.flowEngine.context.themeToken = {
      colorBgLayout: '#f5f5f5',
    } as any;
    const ctx: any = {
      model,
      inputArgs: {
        mode: 'embed',
      },
      layoutContentElement: document.createElement('div'),
      blockModel: {
        uid: 'block-uid',
        collection: {
          filterTargetKey: 'id',
          dataSourceKey: 'main',
          name: 'posts',
        },
      },
      record: {},
      collection: {
        fields: new Map([['title', { name: 'title' }]]),
      },
      createResource: vi.fn(() => ({
        setDataSourceKey: vi.fn(),
        setResourceName: vi.fn(),
        runAction,
      })),
      runAction: vi.fn(),
      viewer: {
        open: vi.fn(),
      },
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (key: string) => key,
    };

    await handler(ctx, {
      uid: 'duplicate-action',
    });

    expect(runAction).not.toHaveBeenCalled();
    expect(ctx.viewer.open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'embed',
        width: undefined,
        inputArgs: expect.objectContaining({
          formData: undefined,
          collectionName: 'posts',
        }),
        styles: expect.objectContaining({
          content: expect.objectContaining({
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }),
        }),
      }),
    );
  });
});
