/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlowEngine, FlowModel, SingleRecordResource } from '@nocobase/flow-engine';
import { QuickEditFormModel } from '../QuickEditFormModel';

describe('QuickEditFormModel - quick edit save triggers API (regression)', () => {
  let engine: FlowEngine;
  const originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia');

  beforeEach(() => {
    engine = new FlowEngine();
  });

  afterEach(() => {
    if (originalMatchMediaDescriptor) {
      Object.defineProperty(window, 'matchMedia', originalMatchMediaDescriptor);
      return;
    }
    delete (window as unknown as { matchMedia?: Window['matchMedia'] }).matchMedia;
  });

  const mockMatchMedia = (matches: boolean) => {
    const matchMediaMock = vi.fn((query: string) => {
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    });

    Object.defineProperty(window, 'matchMedia', {
      ...(originalMatchMediaDescriptor || { configurable: true, writable: true }),
      value: matchMediaMock,
    });
  };

  const addUsersCollection = () => {
    const ds = engine.context.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'users',
      fields: [{ name: 'name', type: 'string', interface: 'input', uiSchema: { title: 'Name' } }],
    });
  };

  it('uses source field context when opening quick edit', async () => {
    engine.registerModels({ QuickEditFormModel });
    engine.context.defineProperty('pageActive', { value: { value: false } });
    engine.context.defineProperty('viewer', { value: { open: vi.fn(async () => undefined) } });

    const page = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'page' });
    page.context.defineProperty('pageActive', { value: { value: true } });
    const source = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'source-field', parentId: page.uid });

    await QuickEditFormModel.open({
      flowEngine: engine,
      target: document.createElement('div'),
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'name',
      record: {},
      sourceFieldModelUid: source.uid,
    });

    let quickEditModel: QuickEditFormModel | undefined;
    engine.forEachModel((model) => {
      if (model instanceof QuickEditFormModel) {
        quickEditModel = model;
      }
    });

    expect(quickEditModel?.context.pageActive.value).toBe(true);
  });

  it('opens quick edit in a mobile drawer when the source field layout is mobile', async () => {
    engine.registerModels({ QuickEditFormModel });
    addUsersCollection();
    const engineOpen = vi.fn(async () => undefined);
    const sourceOpen = vi.fn(async () => undefined);
    engine.context.defineProperty('isMobileLayout', { value: false });
    engine.context.defineProperty('viewer', { value: { open: engineOpen } });
    const source = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'source-field' });
    source.context.defineProperty('isMobileLayout', { value: true });
    source.context.defineProperty('viewer', { value: { open: sourceOpen } });

    await QuickEditFormModel.open({
      flowEngine: engine,
      target: document.createElement('div'),
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'name',
      record: {},
      sourceFieldModelUid: source.uid,
    });

    expect(engineOpen).not.toHaveBeenCalled();
    expect(sourceOpen).toHaveBeenCalledTimes(1);
    expect(sourceOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drawer',
        title: 'Name',
        closable: true,
        placement: 'bottom',
        styles: {
          body: expect.objectContaining({
            maxHeight: '50vh',
          }),
        },
        inputArgs: {
          isMobileLayout: true,
        },
      }),
    );
    let quickEditModel: QuickEditFormModel | undefined;
    engine.forEachModel((model) => {
      if (model instanceof QuickEditFormModel) {
        quickEditModel = model;
      }
    });
    expect(quickEditModel?.context.isMobileLayout).toBe(true);
  });

  it('uses the source table column title for the mobile drawer header', async () => {
    engine.registerModels({ QuickEditFormModel });
    addUsersCollection();
    const sourceOpen = vi.fn(async () => undefined);
    engine.context.defineProperty('viewer', { value: { open: vi.fn(async () => undefined) } });
    const column = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'table-column' });
    column.setProps({ title: 'Custom marital status' });
    const source = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'source-field', parentId: column.uid });
    source.context.defineProperty('isMobileLayout', { value: true });
    source.context.defineProperty('viewer', { value: { open: sourceOpen } });

    await QuickEditFormModel.open({
      flowEngine: engine,
      target: document.createElement('div'),
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'name',
      record: {},
      sourceFieldModelUid: source.uid,
    });

    expect(sourceOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drawer',
        title: 'Custom marital status',
      }),
    );
  });

  it('uses the mobile drawer fallback on narrow viewports', async () => {
    engine.registerModels({ QuickEditFormModel });
    addUsersCollection();
    mockMatchMedia(true);
    const viewContext = {
      defineProperty: vi.fn(),
    };
    const open = vi.fn(
      async (config: { content: (view: { close: () => void }, context: typeof viewContext) => unknown }) => {
        config.content({ close: vi.fn() }, viewContext);
      },
    );
    engine.context.defineProperty('viewer', { value: { open } });

    await QuickEditFormModel.open({
      flowEngine: engine,
      target: document.createElement('div'),
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'name',
      record: {},
    });

    expect(open).toHaveBeenCalledTimes(1);
    expect(viewContext.defineProperty).toHaveBeenCalledWith('isMobileLayout', { value: true });
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 768px)');
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drawer',
        title: 'Name',
        closable: true,
        placement: 'bottom',
        styles: {
          body: expect.objectContaining({
            maxHeight: '50vh',
          }),
        },
        inputArgs: {
          isMobileLayout: true,
        },
      }),
    );
    let quickEditModel: QuickEditFormModel | undefined;
    engine.forEachModel((model) => {
      if (model instanceof QuickEditFormModel) {
        quickEditModel = model;
      }
    });
    expect(quickEditModel?.context.isMobileLayout).toBe(true);
  });

  it('uses the engine mobile layout context without relying on matchMedia', async () => {
    engine.registerModels({ QuickEditFormModel });
    addUsersCollection();
    mockMatchMedia(false);
    const open = vi.fn(async () => undefined);
    engine.context.defineProperty('isMobileLayout', { value: true });
    engine.context.defineProperty('viewer', { value: { open } });

    await QuickEditFormModel.open({
      flowEngine: engine,
      target: document.createElement('div'),
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'name',
      record: {},
    });

    expect(window.matchMedia).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drawer',
        title: 'Name',
        placement: 'bottom',
      }),
    );
  });

  it('keeps an explicit non-mobile layout context ahead of the narrow viewport fallback', async () => {
    engine.registerModels({ QuickEditFormModel });
    addUsersCollection();
    mockMatchMedia(true);
    const open = vi.fn(async () => undefined);
    const target = document.createElement('div');
    engine.context.defineProperty('isMobileLayout', { value: false });
    engine.context.defineProperty('viewer', { value: { open } });

    await QuickEditFormModel.open({
      flowEngine: engine,
      target,
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'name',
      record: {},
    });

    expect(window.matchMedia).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'popover',
        target,
        placement: 'rightTop',
      }),
    );
  });

  it('keeps dynamic preventClose effective for mobile quick edit drawer containers', async () => {
    engine.registerModels({ QuickEditFormModel });
    addUsersCollection();
    mockMatchMedia(true);
    const originalBeforeClose = vi.fn(async () => true);
    const drawerView = {
      close: vi.fn(),
      update: vi.fn(),
      beforeClose: originalBeforeClose,
    };
    const open = vi.fn(async (config: { content: (view: typeof drawerView) => unknown }) => {
      config.content(drawerView);
    });
    engine.context.defineProperty('viewer', { value: { open } });

    await QuickEditFormModel.open({
      flowEngine: engine,
      target: document.createElement('div'),
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'name',
      record: {},
    });

    let quickEditModel: QuickEditFormModel | undefined;
    engine.forEachModel((model) => {
      if (model instanceof QuickEditFormModel) {
        quickEditModel = model;
      }
    });

    quickEditModel?.viewContainer.update?.({ preventClose: true });
    expect(drawerView.update).toHaveBeenCalledWith({ preventClose: true });
    await expect(drawerView.beforeClose?.({ force: false })).resolves.toBe(false);
    expect(originalBeforeClose).not.toHaveBeenCalled();

    quickEditModel?.viewContainer.update?.({ preventClose: false });
    expect(drawerView.update).toHaveBeenCalledWith({ preventClose: false });
    await expect(drawerView.beforeClose?.({ force: false })).resolves.toBe(true);
    expect(originalBeforeClose).toHaveBeenCalledTimes(1);
  });

  it('keeps desktop quick edit in the existing right-top popover', async () => {
    engine.registerModels({ QuickEditFormModel });
    mockMatchMedia(false);
    const open = vi.fn(async () => undefined);
    const target = document.createElement('div');
    engine.context.defineProperty('viewer', { value: { open } });

    await QuickEditFormModel.open({
      flowEngine: engine,
      target,
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'name',
      record: {},
    });

    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'popover',
        target,
        placement: 'rightTop',
        styles: {
          body: expect.objectContaining({
            width: 420,
          }),
        },
      }),
    );
  });

  it('keeps mobile quick edit content naturally sized with half-window scroll bounds', () => {
    engine.registerModels({ QuickEditFormModel });
    const model = engine.createModel<QuickEditFormModel>({
      use: QuickEditFormModel,
      uid: 'quick-edit-style',
    });
    model.context.defineProperty('isMobileLayout', { value: true });

    const result = QuickEditFormModel.prototype.render.call(model) as any;
    const formBody = result.props.children[0];
    const actions = result.props.children[1];

    expect(formBody.props.style).toMatchObject({
      maxHeight: 'calc(50vh - var(--nb-mobile-page-header-height, 40px) - 132px)',
      overflowY: 'auto',
      padding: '8px var(--nb-mobile-page-tabs-content-padding, 12px) 0',
    });
    expect(formBody.props.style.minHeight).toBe(0);
    expect(actions.props.style).toMatchObject({
      justifyContent: 'flex-end',
      padding: '8px var(--nb-mobile-page-tabs-content-padding, 12px) calc(80px + env(safe-area-inset-bottom, 0px))',
    });
  });

  it('calls update with filterByTk and merges primary key from ctx.collection/record', async () => {
    // 1) 准备数据源与集合（含主键字段）
    const dsm = engine.context.dataSourceManager;
    const ds = dsm.getDataSource('main');
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'name', type: 'string', interface: 'text' },
      ],
    });

    // 2) 注入 API mock：拦截请求并断言参数
    const api = {
      request: vi.fn(async (config: any) => {
        expect(config.method).toBe('post');
        expect(config.url).toBe('users:update');
        // filterByTk 通过 params 传入
        expect(config.params?.filterByTk).toBe(1);
        // data 应包含要更新的字段以及主键（由 ctx.collection + ctx.record 推导）
        expect(config.data).toMatchObject({ name: 'new-name' });
        return { data: { data: {} } } as any;
      }),
    } as any;
    engine.context.defineProperty('api', { value: api });

    // 3) 创建 QuickEditFormModel；onInit 中已为 ctx 注入 collection getter（本次回归修复点）
    const m = engine.createModel<QuickEditFormModel>({
      use: QuickEditFormModel,
      uid: 'qe-1',
    });

    (m as any).collection = dsm.getCollection('main', 'users');
    const res = m.context.createResource(SingleRecordResource) as SingleRecordResource<any>;
    res.setDataSourceKey('main');
    res.setResourceName('users');
    (m as any).resource = res;

    // 预置当前记录（ctx.record 由 QuickEditFormModel.onInit 提供）与 tk
    res.setFilterByTk(1);
    res.setData({ name: 'old-name' });

    // 4) 保存：应触发 update 请求，并包含主键
    await res.save({ name: 'new-name' }, { refresh: false });

    expect(api.request).toHaveBeenCalledTimes(1);
  });
});
