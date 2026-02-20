/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowContext, FlowEngine } from '@nocobase/flow-engine';
import type { ActionDefinition } from '@nocobase/flow-engine';
import { registerOpenViewPopupTemplateAction } from '../openViewActionExtensions';

describe('openViewActionExtensions (popup template)', () => {
  it('resolves popupTemplateUid to uid and delegates to base', async () => {
    const engine = new FlowEngine();
    const baseBefore = vi.fn(async () => {});
    const baseHandler = vi.fn(async (_ctx: any, params: any) => params);

    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        mode: { type: 'string' },
        size: { type: 'string' },
        uid: { type: 'string' },
      },
      beforeParamsSave: baseBefore as any,
      handler: baseHandler as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;
    expect(typeof enhanced?.beforeParamsSave).toBe('function');

    const api = {
      resource: (name: string) => {
        if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
        return {
          get: vi.fn(async () => ({ data: { data: { uid: 'tpl-1', targetUid: 'popup-1' } } })),
        };
      },
    };
    const ctx: any = new FlowContext();
    ctx.engine = engine;
    ctx.api = api;
    ctx.t = (k: string) => k;
    const params: any = { popupTemplateUid: 'tpl-1', uid: 'old' };

    await enhanced.beforeParamsSave(ctx, params, {});
    expect(params.uid).toBe('popup-1');
    expect(baseBefore).toHaveBeenCalledTimes(1);
    expect(baseBefore.mock.calls[0][1]).toEqual({ uid: 'popup-1' });

    // runtime 依赖“保存时已回填”的 uid，因此这里直接传入已解析的 uid
    const out = await enhanced.handler(ctx, { uid: 'popup-1', popupTemplateUid: 'tpl-1' });
    expect(baseHandler).toHaveBeenCalledTimes(1);
    expect(out?.uid).toEqual('popup-1');
  });

  it('clears filterByTk/sourceId when template does not define them (avoid leaking record defaults)', async () => {
    const engine = new FlowEngine();
    const baseBefore = vi.fn(async () => {});
    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      beforeParamsSave: baseBefore as any,
      handler: vi.fn(async () => undefined) as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const api = {
      resource: (name: string) => {
        if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
        return {
          get: vi.fn(async () => ({
            data: {
              data: {
                uid: 'tpl-1',
                targetUid: 'popup-1',
                dataSourceKey: 'main',
                collectionName: 'users',
                // template does NOT define filterByTk/sourceId
              },
            },
          })),
        };
      },
    };
    const model: any = {
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'resourceSettings' && stepKey === 'init') {
          return { dataSourceKey: 'main', collectionName: 'users' };
        }
        return {};
      }),
      parent: null,
    };
    const ctx: any = { engine, api, model, t: (k: string) => k };
    const params: any = {
      popupTemplateUid: 'tpl-1',
      uid: 'old',
      dataSourceKey: 'main',
      collectionName: 'users',
      filterByTk: '{{ ctx.record.id }}',
      sourceId: '{{ ctx.resource.sourceId }}',
    };

    await enhanced.beforeParamsSave(ctx, params, {});
    expect(params.uid).toBe('popup-1');
    expect('filterByTk' in params).toBe(false);
    expect('sourceId' in params).toBe(false);

    expect(baseBefore).toHaveBeenCalledTimes(1);
    const forwarded = baseBefore.mock.calls[0][1] as any;
    expect(forwarded?.popupTemplateUid).toBeUndefined();
    expect(forwarded?.filterByTk).toBeUndefined();
    expect(forwarded?.sourceId).toBeUndefined();
  });

  it('treats collection-scene popup template as no filterByTk even if template stores ctx.record expr', async () => {
    const engine = new FlowEngine();
    class CollectionOnlyModel {
      static _isScene(scene: string) {
        return scene === 'collection';
      }
    }
    engine.registerModels({ AddNewActionModel: CollectionOnlyModel } as any);

    const baseBefore = vi.fn(async () => {});
    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      beforeParamsSave: baseBefore as any,
      handler: vi.fn(async () => undefined) as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const api = {
      resource: (name: string) => {
        if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
        return {
          get: vi.fn(async () => ({
            data: {
              data: {
                uid: 'tpl-collection',
                targetUid: 'popup-1',
                useModel: 'AddNewActionModel',
                dataSourceKey: 'main',
                collectionName: 'users',
                filterByTk: '{{ ctx.record.id }}',
                sourceId: '{{ ctx.resource.sourceId }}',
              },
            },
          })),
        };
      },
    };
    const model: any = {
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'resourceSettings' && stepKey === 'init') {
          return { dataSourceKey: 'main', collectionName: 'users' };
        }
        return {};
      }),
      parent: null,
    };
    const ctx: any = { engine, api, model, t: (k: string) => k };
    const params: any = {
      popupTemplateUid: 'tpl-collection',
      uid: 'old',
      dataSourceKey: 'main',
      collectionName: 'users',
      filterByTk: '{{ ctx.record.id }}',
      sourceId: '{{ ctx.resource.sourceId }}',
    };

    await enhanced.beforeParamsSave(ctx, params, {});
    expect(params.uid).toBe('popup-1');
    expect(params.popupTemplateHasFilterByTk).toBe(false);
    expect(params.popupTemplateHasSourceId).toBe(false);
    expect('filterByTk' in params).toBe(false);
    expect('sourceId' in params).toBe(false);
  });

  it('runtime overrides resource keys via shadow ctx (non-relation template in relation trigger)', async () => {
    const engine = new FlowEngine();
    let capturedCtx: any;
    let capturedParams: any;
    const baseHandler = vi.fn(async (ctxArg: any, paramsArg: any) => {
      capturedCtx = ctxArg;
      capturedParams = paramsArg;
      return undefined;
    });

    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      handler: baseHandler as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const baseInputArgs: any = {
      dataSourceKey: 'main',
      collectionName: 'users',
      associationName: 'users.roles',
      filterByTk: 'role-1',
      sourceId: 'user-1',
      defaultInputKeys: ['filterByTk', 'sourceId'],
    };
    const ctx: any = new FlowContext();
    ctx.engine = engine;
    ctx.t = (k: string) => k;
    ctx.collectionField = {
      isAssociationField: () => true,
    };
    ctx.defineProperty('inputArgs', { value: baseInputArgs });

    await enhanced.handler(ctx, {
      popupTemplateUid: 'tpl-1',
      uid: 'popup-1',
      dataSourceKey: 'main',
      collectionName: 'roles',
      // non-relation template: no associationName
      filterByTk: 'tpl-filter',
    });

    expect(baseHandler).toHaveBeenCalledTimes(1);
    expect(capturedParams?.popupTemplateUid).toBeUndefined();
    expect(capturedParams?.uid).toBe('popup-1');

    // should not mutate original ctx.inputArgs
    expect(ctx.inputArgs.collectionName).toBe('users');
    expect(ctx.inputArgs.associationName).toBe('users.roles');
    expect(ctx.inputArgs.filterByTk).toBe('role-1');

    // shadow ctx should override resource keys (keep runtime record context from inputArgs)
    expect(capturedCtx).not.toBe(ctx);
    expect(capturedCtx?.inputArgs?.dataSourceKey).toBe('main');
    expect(capturedCtx?.inputArgs?.collectionName).toBe('roles');
    expect('associationName' in (capturedCtx?.inputArgs || {})).toBe(false);
    expect(capturedCtx?.inputArgs?.filterByTk).toBe('role-1');
    expect(capturedCtx?.inputArgs?.sourceId).toBe(null);
    expect(capturedCtx?.inputArgs?.defaultInputKeys || []).toContain('filterByTk');
    expect(capturedCtx?.inputArgs?.defaultInputKeys || []).not.toContain('sourceId');
  });

  it('infers target filterByTk from belongsTo record when reusing target collection template in relation field', async () => {
    const engine = new FlowEngine();
    let capturedCtx: any;
    const baseHandler = vi.fn(async (ctxArg: any) => {
      capturedCtx = ctxArg;
      return undefined;
    });

    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      handler: baseHandler as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    // 模拟 C 表记录（filterTargetKey 是 nanoid），以及 belongsTo D（D 主键为 bigint）
    const cRecord: any = {
      cUnique: 'kEOzJ5VIJueYAitvGQPRPN',
      dId: 123,
      d: { id: 123 },
    };

    // 关系字段上下文：inputArgs.filterByTk 来自 C 的 filterTargetKey（string），但目标弹窗需要 D 的 id（number）
    const baseInputArgs: any = {
      dataSourceKey: 'main',
      collectionName: 'c',
      associationName: 'c.d',
      filterByTk: cRecord.cUnique,
    };

    const assocField: any = {
      isAssociationField: () => true,
      name: 'd',
      foreignKey: 'dId',
      targetKey: 'id',
      targetCollection: { dataSourceKey: 'main', name: 'd', filterTargetKey: 'id' },
      collection: { dataSourceKey: 'main', name: 'c' },
    };

    const ctx: any = new FlowContext();
    ctx.engine = engine;
    ctx.t = (k: string) => k;
    ctx.collectionField = assocField;
    ctx.defineProperty('record', { value: cRecord });
    ctx.defineProperty('inputArgs', { value: baseInputArgs });

    await enhanced.handler(ctx, {
      popupTemplateUid: 'tpl-1',
      uid: 'popup-1',
      dataSourceKey: 'main',
      collectionName: 'd',
      // 配置时误填（来自 C 的 filterTargetKey），运行时应从 belongsTo 的 dId/d.id 推断覆盖
      filterByTk: cRecord.cUnique,
      popupTemplateHasFilterByTk: true,
    });

    expect(baseHandler).toHaveBeenCalledTimes(1);
    // should not mutate original ctx.inputArgs
    expect(ctx.inputArgs.filterByTk).toBe(cRecord.cUnique);

    // runtime ctx 应推断出 D 的 filterByTk（bigint id）
    expect(capturedCtx).not.toBe(ctx);
    expect(capturedCtx?.inputArgs?.collectionName).toBe('d');
    expect(capturedCtx?.inputArgs?.filterByTk).toBe(123);
  });

  it('runtime clears filterByTk/sourceId in shadow ctx when template does not provide them', async () => {
    const engine = new FlowEngine();
    let capturedCtx: any;
    const baseHandler = vi.fn(async (ctxArg: any) => {
      capturedCtx = ctxArg;
      return undefined;
    });

    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      handler: baseHandler as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const baseInputArgs: any = {
      dataSourceKey: 'main',
      collectionName: 'posts',
      filterByTk: 'record-1',
      sourceId: 'source-1',
      defaultInputKeys: ['filterByTk', 'sourceId'],
    };
    const ctx: any = new FlowContext();
    ctx.engine = engine;
    ctx.t = (k: string) => k;
    ctx.defineProperty('inputArgs', { value: baseInputArgs });

    await enhanced.handler(ctx, {
      popupTemplateUid: 'tpl-1',
      uid: 'popup-1',
      dataSourceKey: 'main',
      collectionName: 'users',
      // template does NOT provide filterByTk/sourceId/associationName
    });

    expect(baseHandler).toHaveBeenCalledTimes(1);
    // should not mutate original ctx.inputArgs
    expect(ctx.inputArgs.collectionName).toBe('posts');
    expect(ctx.inputArgs.filterByTk).toBe('record-1');
    expect(ctx.inputArgs.sourceId).toBe('source-1');

    // shadow ctx should clear filterByTk/sourceId (avoid fallback to actionDefaults)
    expect(capturedCtx).not.toBe(ctx);
    expect(capturedCtx?.inputArgs?.collectionName).toBe('users');
    expect(capturedCtx?.inputArgs?.filterByTk).toBe(null);
    expect(capturedCtx?.inputArgs?.sourceId).toBe(null);
    expect(capturedCtx?.inputArgs?.defaultInputKeys).toBeUndefined();
  });

  it('runtime clears filterByTk in shadow ctx for association template when template does not need record context', async () => {
    const engine = new FlowEngine();
    let capturedCtx: any;
    const baseHandler = vi.fn(async (ctxArg: any) => {
      capturedCtx = ctxArg;
      return undefined;
    });

    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      handler: baseHandler as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const baseInputArgs: any = {
      dataSourceKey: 'main',
      collectionName: 'users',
      associationName: 'users.roles',
      filterByTk: 'role-1',
      sourceId: 'user-1',
      defaultInputKeys: ['filterByTk', 'sourceId'],
    };
    const ctx: any = new FlowContext();
    ctx.engine = engine;
    ctx.t = (k: string) => k;
    ctx.collectionField = {
      isAssociationField: () => true,
    };
    ctx.defineProperty('inputArgs', { value: baseInputArgs });

    await enhanced.handler(ctx, {
      popupTemplateUid: 'tpl-1',
      uid: 'popup-1',
      dataSourceKey: 'main',
      collectionName: 'roles',
      // association template (keeps association context), but collection-scene (no filterByTk)
      associationName: 'users.roles',
      popupTemplateHasFilterByTk: false,
    });

    expect(baseHandler).toHaveBeenCalledTimes(1);
    // should not mutate original ctx.inputArgs
    expect(ctx.inputArgs.filterByTk).toBe('role-1');

    // shadow ctx should clear filterByTk (avoid leaking record context into "add" template)
    // 关系资源弹窗需要保留 sourceId，否则无法生成正确的关联资源 URL
    expect(capturedCtx).not.toBe(ctx);
    expect(capturedCtx?.inputArgs?.collectionName).toBe('roles');
    expect(capturedCtx?.inputArgs?.associationName).toBe('users.roles');
    expect(capturedCtx?.inputArgs?.filterByTk).toBe(null);
    expect(capturedCtx?.inputArgs?.sourceId).toBe('user-1');
    expect(capturedCtx?.inputArgs?.defaultInputKeys || []).not.toContain('filterByTk');
    expect(capturedCtx?.inputArgs?.defaultInputKeys || []).toContain('sourceId');
  });

  it('injects placeholder filterByTk when template expects record context but record is unavailable', async () => {
    const engine = new FlowEngine();
    let capturedCtx: any;
    const baseHandler = vi.fn(async (ctxArg: any) => {
      capturedCtx = ctxArg;
      return undefined;
    });

    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      handler: baseHandler as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const baseInputArgs: any = {
      dataSourceKey: 'main',
      collectionName: 'posts',
      defaultInputKeys: ['filterByTk'],
    };
    const ctx: any = new FlowContext();
    ctx.engine = engine;
    ctx.t = (k: string) => k;
    ctx.view = { inputArgs: {} };
    ctx.defineProperty('inputArgs', { value: baseInputArgs });

    await enhanced.handler(ctx, {
      popupTemplateUid: 'tpl-1',
      popupTemplateHasFilterByTk: true,
      uid: 'popup-1',
      dataSourceKey: 'main',
      collectionName: 'users',
      // runtime resolved filterByTk is undefined (e.g. ctx.record is unavailable in preview)
      filterByTk: undefined,
    });

    expect(baseHandler).toHaveBeenCalledTimes(1);
    expect(capturedCtx?.inputArgs?.collectionName).toBe('users');
    expect(capturedCtx?.inputArgs?.filterByTk).toBe('__popupTemplateFilterByTk__');
    expect(capturedCtx?.inputArgs?.defaultInputKeys).toBeUndefined();
  });

  it('infers record-scene needs filterByTk when template row misses filterByTk', async () => {
    const engine = new FlowEngine();
    class RecordOnlyModel {
      static _isScene(scene: string) {
        return scene === 'record';
      }
    }
    engine.registerModels({ EditActionModel: RecordOnlyModel } as any);

    let capturedCtx: any;
    const baseHandler = vi.fn(async (ctxArg: any) => {
      capturedCtx = ctxArg;
      return undefined;
    });

    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      handler: baseHandler as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const api = {
      resource: (name: string) => {
        if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
        return {
          get: vi.fn(async () => ({
            data: {
              data: {
                uid: 'tpl-record',
                targetUid: 'popup-1',
                useModel: 'EditActionModel',
                dataSourceKey: 'main',
                collectionName: 'users',
                // old template: filterByTk missing
                filterByTk: null,
              },
            },
          })),
        };
      },
    };

    const baseInputArgs: any = {
      dataSourceKey: 'main',
      collectionName: 'users',
      defaultInputKeys: ['filterByTk'],
    };
    const ctx: any = new FlowContext();
    ctx.engine = engine;
    ctx.api = api;
    ctx.t = (k: string) => k;
    ctx.view = { inputArgs: {} };
    ctx.defineProperty('inputArgs', { value: baseInputArgs });

    await enhanced.handler(ctx, {
      popupTemplateUid: 'tpl-record',
      uid: 'popup-1',
      dataSourceKey: 'main',
      collectionName: 'users',
      filterByTk: undefined,
    });

    expect(baseHandler).toHaveBeenCalledTimes(1);
    expect(capturedCtx?.inputArgs?.filterByTk).toBe('__popupTemplateFilterByTk__');
  });

  it('runtime clears filterByTk when template is collection-scene even if template stores record expr', async () => {
    const engine = new FlowEngine();
    class CollectionOnlyModel {
      static _isScene(scene: string) {
        return scene === 'collection';
      }
    }
    engine.registerModels({ AddNewActionModel: CollectionOnlyModel } as any);

    let capturedCtx: any;
    const baseHandler = vi.fn(async (ctxArg: any) => {
      capturedCtx = ctxArg;
      return undefined;
    });

    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      handler: baseHandler as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const api = {
      resource: (name: string) => {
        if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
        return {
          get: vi.fn(async () => ({
            data: {
              data: {
                uid: 'tpl-collection',
                targetUid: 'popup-1',
                useModel: 'AddNewActionModel',
                dataSourceKey: 'main',
                collectionName: 'users',
                filterByTk: '{{ ctx.record.id }}',
              },
            },
          })),
        };
      },
    };

    const baseInputArgs: any = {
      dataSourceKey: 'main',
      collectionName: 'users',
      filterByTk: 'record-1',
      defaultInputKeys: ['filterByTk'],
    };
    const ctx: any = new FlowContext();
    ctx.engine = engine;
    ctx.api = api;
    ctx.t = (k: string) => k;
    ctx.defineProperty('inputArgs', { value: baseInputArgs });

    await enhanced.handler(ctx, {
      popupTemplateUid: 'tpl-collection',
      uid: 'popup-1',
      dataSourceKey: 'main',
      collectionName: 'users',
      filterByTk: 'record-1',
    });

    expect(baseHandler).toHaveBeenCalledTimes(1);
    expect(ctx.inputArgs.filterByTk).toBe('record-1');
    expect(capturedCtx?.inputArgs?.filterByTk).toBe(null);
  });

  it('does not clear filterByTk/sourceId when template declares them but runtime resolves to undefined', async () => {
    const engine = new FlowEngine();
    let capturedCtx: any;
    const baseHandler = vi.fn(async (ctxArg: any) => {
      capturedCtx = ctxArg;
      return undefined;
    });

    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      handler: baseHandler as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const baseInputArgs: any = {
      dataSourceKey: 'main',
      collectionName: 'users',
      filterByTk: 'record-1',
      sourceId: 'source-1',
      defaultInputKeys: ['filterByTk', 'sourceId'],
    };
    const ctx: any = new FlowContext();
    ctx.engine = engine;
    ctx.t = (k: string) => k;
    ctx.defineProperty('inputArgs', { value: baseInputArgs });

    await enhanced.handler(ctx, {
      popupTemplateUid: 'tpl-1',
      popupTemplateHasFilterByTk: true,
      popupTemplateHasSourceId: true,
      uid: 'popup-1',
      dataSourceKey: 'main',
      collectionName: 'users',
      filterByTk: undefined,
      sourceId: undefined,
    });

    expect(baseHandler).toHaveBeenCalledTimes(1);
    expect(capturedCtx).not.toBe(ctx);
    expect(capturedCtx?.inputArgs?.filterByTk).toBe('record-1');
    expect(capturedCtx?.inputArgs?.sourceId).toBe('source-1');
  });

  it('runtime overrides resource keys via shadow ctx in copy mode (popupTemplateContext)', async () => {
    const engine = new FlowEngine();
    let capturedCtx: any;
    let capturedParams: any;
    const baseHandler = vi.fn(async (ctxArg: any, paramsArg: any) => {
      capturedCtx = ctxArg;
      capturedParams = paramsArg;
      return undefined;
    });

    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      handler: baseHandler as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const baseInputArgs: any = {
      dataSourceKey: 'main',
      collectionName: 'users',
      associationName: 'users.roles',
      filterByTk: 'role-1',
      sourceId: 'user-1',
      defaultInputKeys: ['filterByTk', 'sourceId'],
    };
    const ctx: any = new FlowContext();
    ctx.engine = engine;
    ctx.t = (k: string) => k;
    ctx.collectionField = {
      isAssociationField: () => true,
    };
    ctx.defineProperty('inputArgs', { value: baseInputArgs });

    await enhanced.handler(ctx, {
      popupTemplateContext: true,
      uid: 'popup-1',
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: 'tpl-filter',
    });

    expect(baseHandler).toHaveBeenCalledTimes(1);
    expect(capturedParams?.popupTemplateUid).toBeUndefined();
    expect(capturedParams?.popupTemplateContext).toBeUndefined();
    expect(capturedParams?.uid).toBe('popup-1');

    // should not mutate original ctx.inputArgs
    expect(ctx.inputArgs.collectionName).toBe('users');
    expect(ctx.inputArgs.associationName).toBe('users.roles');
    expect(ctx.inputArgs.filterByTk).toBe('role-1');

    // shadow ctx should override resource keys (keep runtime record context from inputArgs)
    expect(capturedCtx).not.toBe(ctx);
    expect(capturedCtx?.inputArgs?.dataSourceKey).toBe('main');
    expect(capturedCtx?.inputArgs?.collectionName).toBe('roles');
    expect('associationName' in (capturedCtx?.inputArgs || {})).toBe(false);
    expect(capturedCtx?.inputArgs?.filterByTk).toBe('role-1');
    expect(capturedCtx?.inputArgs?.sourceId).toBe(null);
    expect(capturedCtx?.inputArgs?.defaultInputKeys || []).toContain('filterByTk');
    expect(capturedCtx?.inputArgs?.defaultInputKeys || []).not.toContain('sourceId');
  });

  it('keeps object filterByTk in shadow ctx (composite target key)', async () => {
    const engine = new FlowEngine();
    let capturedCtx: any;
    const baseHandler = vi.fn(async (ctxArg: any) => {
      capturedCtx = ctxArg;
      return undefined;
    });

    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      handler: baseHandler as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const compositeTk = { Code1: 'C1', Code2: 'C2' };
    const baseInputArgs: any = {
      dataSourceKey: 'main',
      collectionName: 'composites',
      filterByTk: compositeTk,
      defaultInputKeys: ['filterByTk'],
    };
    const ctx: any = new FlowContext();
    ctx.engine = engine;
    ctx.t = (k: string) => k;
    ctx.view = { inputArgs: {} };
    ctx.defineProperty('inputArgs', { value: baseInputArgs });

    await enhanced.handler(ctx, {
      popupTemplateContext: true,
      uid: 'popup-1',
      dataSourceKey: 'main',
      collectionName: 'composites',
      filterByTk: 'tpl-filter',
    });

    expect(baseHandler).toHaveBeenCalledTimes(1);
    expect(capturedCtx).not.toBe(ctx);
    expect(capturedCtx?.inputArgs?.filterByTk).toEqual(compositeTk);
  });

  it('rejects popup template when dataSourceKey/collectionName mismatches current context', async () => {
    const engine = new FlowEngine();
    const baseBefore = vi.fn(async () => {});
    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      beforeParamsSave: baseBefore as any,
      handler: vi.fn(async () => undefined) as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const api = {
      resource: (name: string) => {
        if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
        return {
          get: vi.fn(async () => ({
            data: {
              data: {
                uid: 'tpl-1',
                targetUid: 'popup-1',
                dataSourceKey: 'main',
                collectionName: 'posts',
              },
            },
          })),
        };
      },
    };
    const model: any = {
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'resourceSettings' && stepKey === 'init') {
          return { dataSourceKey: 'main', collectionName: 'users' };
        }
        return {};
      }),
      parent: null,
    };
    const ctx: any = { engine, api, model, t: (k: string) => k };
    const params: any = { popupTemplateUid: 'tpl-1', uid: 'old' };

    await expect(enhanced.beforeParamsSave(ctx, params, {})).rejects.toThrow('Template collection mismatch');
    expect(baseBefore).toHaveBeenCalledTimes(0);
  });

  it('rejects popup template when associationName mismatches current context', async () => {
    const engine = new FlowEngine();
    const baseBefore = vi.fn(async () => {});
    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      beforeParamsSave: baseBefore as any,
      handler: vi.fn(async () => undefined) as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const api = {
      resource: (name: string) => {
        if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
        return {
          get: vi.fn(async () => ({
            data: {
              data: {
                uid: 'tpl-1',
                targetUid: 'popup-1',
                dataSourceKey: 'main',
                collectionName: 'users',
                associationName: 'users.departments',
              },
            },
          })),
        };
      },
    };
    const model: any = {
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'resourceSettings' && stepKey === 'init') {
          return { dataSourceKey: 'main', collectionName: 'users', associationName: 'users.roles' };
        }
        return {};
      }),
      parent: null,
    };
    const ctx: any = { engine, api, model, t: (k: string) => k };
    const params: any = { popupTemplateUid: 'tpl-1', uid: 'old' };

    await expect(enhanced.beforeParamsSave(ctx, params, {})).rejects.toThrow('Template association mismatch');
    expect(baseBefore).toHaveBeenCalledTimes(0);
  });

  it('allows non-relation popup template when target collection matches (relation field)', async () => {
    const engine = new FlowEngine();
    const baseBefore = vi.fn(async () => {});
    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      beforeParamsSave: baseBefore as any,
      handler: vi.fn(async () => undefined) as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const api = {
      resource: (name: string) => {
        if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
        return {
          get: vi.fn(async () => ({
            data: {
              data: {
                uid: 'tpl-1',
                targetUid: 'popup-1',
                dataSourceKey: 'main',
                collectionName: 'roles',
                // non-relation template: no associationName
              },
            },
          })),
        };
      },
    };
    const model: any = {
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'resourceSettings' && stepKey === 'init') {
          return { dataSourceKey: 'main', collectionName: 'users', associationName: 'users.roles' };
        }
        return {};
      }),
      parent: null,
    };
    const dataSourceManager = {
      getCollection: vi.fn((_ds: string, name: string) => {
        if (name !== 'users') return undefined;
        return {
          getFieldByPath: vi.fn((path: string) => {
            if (path !== 'roles') return undefined;
            return { targetCollection: { dataSourceKey: 'main', name: 'roles' } };
          }),
          getField: vi.fn((path: string) => {
            if (path !== 'roles') return undefined;
            return { targetCollection: { dataSourceKey: 'main', name: 'roles' } };
          }),
        };
      }),
    };
    const ctx: any = { engine, api, model, dataSourceManager, t: (k: string) => k };
    const params: any = { popupTemplateUid: 'tpl-1', uid: 'old', associationName: 'users.roles' };

    await expect(enhanced.beforeParamsSave(ctx, params, {})).resolves.toBeUndefined();
    expect(params.uid).toBe('popup-1');
    expect('associationName' in params).toBe(false);
  });

  it('rejects record-scene popup template when association context cannot provide filterByTk (collection scene)', async () => {
    const engine = new FlowEngine();
    class CollectionOnlyModel {
      static _isScene(scene: string) {
        return scene === 'collection';
      }
    }
    engine.registerModels({ CollectionOnlyModel } as any);

    const baseBefore = vi.fn(async () => {});
    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      beforeParamsSave: baseBefore as any,
      handler: vi.fn(async () => undefined) as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const api = {
      resource: (name: string) => {
        if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
        return {
          get: vi.fn(async () => ({
            data: {
              data: {
                uid: 'tpl-1',
                targetUid: 'popup-1',
                dataSourceKey: 'main',
                collectionName: 'roles',
                // record-scene popup template (needs filterByTk)
                filterByTk: '{{ ctx.record.id }}',
              },
            },
          })),
        };
      },
    };
    const dataSourceManager = {
      getCollection: vi.fn((_ds: string, name: string) => {
        if (name !== 'users') return undefined;
        return {
          getFieldByPath: vi.fn((path: string) => {
            if (path !== 'roles') return undefined;
            return { targetCollection: { dataSourceKey: 'main', name: 'roles' } };
          }),
          getField: vi.fn((path: string) => {
            if (path !== 'roles') return undefined;
            return { targetCollection: { dataSourceKey: 'main', name: 'roles' } };
          }),
        };
      }),
    };
    const model: any = {
      constructor: { name: 'CollectionOnlyModel' },
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'resourceSettings' && stepKey === 'init') {
          return { dataSourceKey: 'main', collectionName: 'users', associationName: 'users.roles' };
        }
        return {};
      }),
      parent: null,
    };
    const ctx: any = { engine, api, model, dataSourceManager, t: (k: string) => k };
    const params: any = { popupTemplateUid: 'tpl-1', uid: 'old', associationName: 'users.roles' };

    await expect(enhanced.beforeParamsSave(ctx, params, {})).rejects.toThrow('Cannot resolve template parameter');
    expect(baseBefore).toHaveBeenCalledTimes(0);
  });

  it('allows record-scene popup template in association context when current action is record scene', async () => {
    const engine = new FlowEngine();
    class RecordOnlyModel {
      static _isScene(scene: string) {
        return scene === 'record';
      }
    }
    engine.registerModels({ RecordOnlyModel } as any);

    const baseBefore = vi.fn(async () => {});
    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      beforeParamsSave: baseBefore as any,
      handler: vi.fn(async () => undefined) as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const api = {
      resource: (name: string) => {
        if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
        return {
          get: vi.fn(async () => ({
            data: {
              data: {
                uid: 'tpl-1',
                targetUid: 'popup-1',
                dataSourceKey: 'main',
                collectionName: 'roles',
                filterByTk: '{{ ctx.record.id }}',
              },
            },
          })),
        };
      },
    };
    const dataSourceManager = {
      getCollection: vi.fn((_ds: string, name: string) => {
        if (name !== 'users') return undefined;
        return {
          getFieldByPath: vi.fn((path: string) => {
            if (path !== 'roles') return undefined;
            return { targetCollection: { dataSourceKey: 'main', name: 'roles' } };
          }),
          getField: vi.fn((path: string) => {
            if (path !== 'roles') return undefined;
            return { targetCollection: { dataSourceKey: 'main', name: 'roles' } };
          }),
        };
      }),
    };
    const model: any = {
      constructor: { name: 'RecordOnlyModel' },
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'resourceSettings' && stepKey === 'init') {
          return { dataSourceKey: 'main', collectionName: 'users', associationName: 'users.roles' };
        }
        return {};
      }),
      parent: null,
    };
    const ctx: any = { engine, api, model, dataSourceManager, t: (k: string) => k };
    const params: any = { popupTemplateUid: 'tpl-1', uid: 'old', associationName: 'users.roles' };

    await expect(enhanced.beforeParamsSave(ctx, params, {})).resolves.toBeUndefined();
    expect(params.uid).toBe('popup-1');
    expect(params.collectionName).toBe('roles');
    expect(params.filterByTk).toBe('{{ ctx.record.id }}');
  });

  it('uses action params to resolve target collection for relation popups', async () => {
    const engine = new FlowEngine();
    const baseBefore = vi.fn(async () => {});
    const baseOpenView: ActionDefinition = {
      name: 'openView',
      title: 'openView',
      uiSchema: {
        uid: { type: 'string' },
      },
      beforeParamsSave: baseBefore as any,
      handler: vi.fn(async () => undefined) as any,
    };
    engine.registerActions({ openView: baseOpenView });

    registerOpenViewPopupTemplateAction(engine);
    const enhanced = engine.getAction('openView') as any;

    const api = {
      resource: (name: string) => {
        if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
        return {
          get: vi.fn(async () => ({
            data: {
              data: {
                uid: 'tpl-1',
                targetUid: 'popup-1',
                dataSourceKey: 'main',
                collectionName: 'posts',
                associationName: 'comments',
              },
            },
          })),
        };
      },
    };
    const dataSourceManager = {
      getCollection: vi.fn((_ds: string, name: string) => {
        if (name !== 'posts') return undefined;
        return {
          getFieldByPath: vi.fn((path: string) => {
            if (path !== 'comments') return undefined;
            return { targetCollection: { dataSourceKey: 'main', name: 'comments' } };
          }),
          getField: vi.fn((path: string) => {
            if (path !== 'comments') return undefined;
            return { targetCollection: { dataSourceKey: 'main', name: 'comments' } };
          }),
        };
      }),
    };
    const model: any = {
      getStepParams: vi.fn((flowKey: string, stepKey: string) => {
        if (flowKey === 'resourceSettings' && stepKey === 'init') {
          // 当前触发上下文是源集合（如表单：posts），并不会携带 associationName
          return { dataSourceKey: 'main', collectionName: 'posts' };
        }
        return {};
      }),
      parent: null,
    };
    const ctx: any = { engine, api, model, dataSourceManager, t: (k: string) => k };
    const params: any = {
      popupTemplateUid: 'tpl-1',
      uid: 'old',
      dataSourceKey: 'main',
      collectionName: 'posts',
      associationName: 'comments',
    };

    await expect(enhanced.beforeParamsSave(ctx, params, {})).resolves.toBeUndefined();
    expect(params.uid).toBe('popup-1');
    expect(baseBefore).toHaveBeenCalledTimes(1);
  });
});
