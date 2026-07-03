/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { ACL } from '../Acl';

describe('ACL', () => {
  const makeEngine = (payload: any) => {
    const engine = new FlowEngine();
    // mock api.request
    (engine.context as any).api = {
      request: vi.fn().mockResolvedValue({ data: payload }),
    } as any;
    return engine;
  };

  it('loads data once and checks alias/resources/actions', async () => {
    const payload = {
      data: {
        allowAll: false,
        actionAlias: { remove: 'destroy' },
        resources: ['posts'],
        actions: {
          'posts:destroy': { whitelist: ['title'] },
        },
        strategy: { actions: ['destroy'] },
      },
    };
    const engine = makeEngine(payload);
    const acl = new ACL(engine);
    acl.setData(payload.data);
    expect(acl.getActionAlias('remove')).toBe('destroy');
    expect(acl.inResources('posts')).toBe(true);
    expect(acl.getResourceActionParams('posts', 'remove')).toEqual({ whitelist: ['title'] });
    expect(acl.getStrategyActionParams('remove')).toEqual({});
  });

  it('aclCheck uses parseField when fields present and allowAll=false', async () => {
    const payload = {
      data: {
        allowAll: false,
        actionAlias: {},
        resources: ['posts'],
        actions: { 'posts:update': { whitelist: ['title'] } },
        strategy: { actions: [] },
      },
    };
    const engine = makeEngine(payload);
    const acl = new ACL(engine);
    acl.setData(payload.data);
    const ok = await acl.aclCheck({
      dataSourceKey: 'main',
      resourceName: 'posts',
      actionName: 'update',
      fields: ['title'],
    });
    expect(ok).toBe(true);
    const notOk = await acl.aclCheck({
      dataSourceKey: 'main',
      resourceName: 'posts',
      actionName: 'update',
      fields: ['body'],
    });
    expect(notOk).toBe(false);
  });

  it('aclCheck loads roles before checking an empty cache', async () => {
    const payload = {
      data: {
        allowAll: true,
      },
    };
    const engine = makeEngine(payload);
    const acl = new ACL(engine);

    await expect(
      acl.aclCheck({
        dataSourceKey: 'main',
        resourceName: 'posts',
        actionName: 'view',
      }),
    ).resolves.toBe(true);
    expect((engine.context as any).api.request).toHaveBeenCalledWith({
      url: 'roles:check',
      skipNotify: true,
      skipAuth: true,
    });
  });

  it('reloads permissions when auth token changes', async () => {
    const payload1 = {
      data: {
        allowAll: false,
        actionAlias: { remove: 'destroy' },
        resources: ['posts'],
        actions: {},
        strategy: { actions: [] },
      },
    };
    const payload2 = {
      data: {
        allowAll: false,
        actionAlias: { remove: 'erase' },
        resources: ['posts'],
        actions: {},
        strategy: { actions: [] },
      },
    };

    const engine = new FlowEngine();
    const api: any = {
      auth: { token: 't1' },
      request: vi.fn().mockImplementation(async () => {
        // 返回依据当前 token 的不同 ACL 数据
        return api.auth.token === 't1' ? { data: payload1 } : { data: payload2 };
      }),
    };
    engine.context.defineProperty('api', { value: api });

    const acl = new ACL(engine);
    acl.setData(payload1.data);
    expect(acl.getActionAlias('remove')).toBe('destroy');

    // 切换 token，应触发下次校验时的 ACL 重载
    api.auth.token = 't2';
    acl.setData(payload2.data);
    await acl.aclCheck({ dataSourceKey: 'main', resourceName: 'posts', actionName: 'remove' });
    expect(acl.getActionAlias('remove')).toBe('erase');
  });

  it('can checks resource actions with friendly aliases', () => {
    const engine = makeEngine({});
    const acl = new ACL(engine);
    acl.setData({
      allowAll: false,
      actionAlias: {},
      resources: ['posts'],
      actions: {
        'posts:update': {},
        'posts:destroy': {},
      },
      strategy: { actions: [] },
    });

    expect(acl.can('posts:write')).toBe(true);
    expect(acl.can({ resource: 'posts', action: 'save' })).toBe(true);
    expect(acl.can({ resource: 'posts', action: 'delete' })).toBe(true);
    expect(acl.can('posts:create')).toBe(false);
  });

  it('can checks snippets and boolean expressions', () => {
    const engine = makeEngine({});
    const acl = new ACL(engine);
    acl.setData({
      allowAll: false,
      snippets: ['pm', 'pm.*', '!pm.data-source-manager*'],
      resources: ['posts'],
      actions: {
        'posts:view': {},
        'posts:update': {},
      },
      strategy: { actions: [] },
    });

    expect(acl.canSnippet('pm.acl.roles')).toBe(true);
    expect(acl.canSnippet('pm.data-source-manager.collections')).toBe(false);
    expect(acl.can({ all: ['posts:view', { snippet: 'pm.acl.roles' }] })).toBe(true);
    expect(acl.can({ any: ['posts:create', { snippet: 'pm.acl.roles' }] })).toBe(true);
    expect(acl.can({ not: 'posts:create' })).toBe(true);
  });

  it('can infers resource and record scope from the bound context', () => {
    const engine = makeEngine({});
    const acl = new ACL(engine);
    acl.setData({
      allowAll: false,
      actionAlias: {},
      resources: ['posts'],
      actions: {
        'posts:update': {},
      },
      strategy: { actions: [] },
    });

    const ctx = engine.context;
    ctx.defineProperty('resourceName', { value: 'posts' });
    ctx.defineProperty('dataSource', { value: { key: 'main' } });
    ctx.defineProperty('collection', {
      value: {
        getFilterByTK: (record: { id: number }) => record.id,
      },
    });
    ctx.defineProperty('record', { value: { id: 1 } });
    ctx.defineProperty('resource', {
      value: {
        getMeta: (key: string) => (key === 'allowedActions' ? { update: [1], destroy: [2] } : undefined),
      },
    });

    const contextualAcl = acl.withContext(ctx);
    expect(contextualAcl.can('write')).toBe(true);
    expect(contextualAcl.can('delete')).toBe(false);
  });

  it('ctx.acl shares engine ACL data and binds the current model context', () => {
    const engine = makeEngine({});

    engine.context.acl.setData({
      allowAll: false,
      actionAlias: {},
      resources: ['posts'],
      actions: {
        'posts:update': {},
      },
      strategy: { actions: [] },
    });

    const model = engine.createModel({ use: 'FlowModel', uid: 'acl-model' });
    const ctx = model.context;
    ctx.defineProperty('resourceName', { value: 'posts' });
    ctx.defineProperty('dataSource', { value: { key: 'main' } });
    ctx.defineProperty('collection', {
      value: {
        getFilterByTK: (record: { id: number }) => record.id,
      },
    });
    ctx.defineProperty('record', { value: { id: 1 } });
    ctx.defineProperty('resource', {
      value: {
        getMeta: (key: string) => (key === 'allowedActions' ? { update: [1], destroy: [2] } : undefined),
      },
    });

    expect(ctx.acl.can('write')).toBe(true);
    expect(ctx.acl.can('delete')).toBe(false);
  });
});
