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
    expect(out).toEqual({ uid: 'x' });
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
});
