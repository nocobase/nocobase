/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
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
    const ctx: any = { engine, api, t: (k: string) => k };
    const params: any = { popupTemplateUid: 'tpl-1', uid: 'old' };

    await enhanced.beforeParamsSave(ctx, params, {});
    expect(params.uid).toBe('popup-1');
    expect(baseBefore).toHaveBeenCalledTimes(1);
    expect(baseBefore.mock.calls[0][1]).toEqual({ uid: 'popup-1' });

    const out = await enhanced.handler(ctx, { uid: 'x', popupTemplateUid: 'tpl-1' });
    expect(baseHandler).toHaveBeenCalledTimes(1);
    expect(out?.uid).toEqual('popup-1');
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

  it('allows non-relation popup template when collection matches (relation field)', async () => {
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
    const ctx: any = { engine, api, model, t: (k: string) => k };
    const params: any = { popupTemplateUid: 'tpl-1', uid: 'old', associationName: 'users.roles' };

    await expect(enhanced.beforeParamsSave(ctx, params, {})).resolves.toBeUndefined();
    expect(params.uid).toBe('popup-1');
    expect('associationName' in params).toBe(false);
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
