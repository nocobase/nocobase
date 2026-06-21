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
});
