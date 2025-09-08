/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { variables } from '../variables/registry';
import { resetVariablesRegistryForTest } from './test-utils';

describe('plugin-flow-engine variables:resolve (no HTTP)', () => {
  let app: MockServer;
  beforeAll(() => {
    resetVariablesRegistryForTest();
  });
  const execResolve = async (values: any, userId?: number) => {
    const action = app.resourceManager.getAction('variables', 'resolve');
    const ctx: any = {
      app,
      db: app.db,
      headers: {},
      request: { method: 'POST', path: '/api/variables:resolve', query: {}, body: values },
      auth: userId ? { user: { id: userId }, role: 'root' } : {},
      state: {},
      getCurrentLocale: () => 'en-US',
    };
    ctx.get = (name: string) => ctx.headers?.[name] || ctx.headers?.[name?.toLowerCase?.()] || undefined;
    ctx.throw = (status: number, body: any) => {
      throw { status, body };
    };
    action.mergeParams({ values });
    // 为兼容服务端中间件（依赖 ctx.action.*），显式设置 ctx.action
    ctx.action = action;
    try {
      await action.execute(ctx, async () => {});
    } catch (e: any) {
      if (e && typeof e.status === 'number') {
        ctx.status = e.status;
        ctx.body = { error: e.body };
      } else {
        throw e;
      }
    }
    return ctx;
  };

  beforeEach(async () => {
    app = await createMockServer({
      database: { dialect: 'sqlite', storage: ':memory:' },
      plugins: [
        'error-handler',
        'auth',
        'users',
        'acl',
        'data-source-manager',
        'field-sort',
        '@nocobase/plugin-flow-engine',
      ],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('should resolve simple expressions and keep unknown as-is', async () => {
    const payload = {
      template: {
        a: 1,
        b: 'hello',
        c: 'Now: {{ ctx.now }}',
        d: '{{ ctx.unknown }}',
      },
    };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(typeof data.c).toBe('string');
    expect(data.c.startsWith('Now: ')).toBeTruthy();
    // unknown should be kept as original string
    expect(data.d).toBe('{{ ctx.unknown }}');
    expect(data.a).toBe(1);
    expect(data.b).toBe('hello');
  });

  it('should resolve current user when logged in', async () => {
    const payload = {
      template: {
        userId: '{{ ctx.user.id }}',
      },
    };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(data.userId).toBe(1);
  });

  it('should support values.template field', async () => {
    const payload = { template: { time: '{{ ctx.timestamp }}' } };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(typeof data.time).toBe('number');
  });

  it('should resolve dynamic record via flattened key (e.g., view.record)', async () => {
    const payload = {
      template: { id: '{{ ctx.view.record.id }}' },
      contextParams: {
        'view.record': {
          dataSourceKey: 'main',
          collection: 'users',
          filterByTk: 1,
          fields: ['id'],
        },
      },
    };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(data.id).toBe(1);
  });

  it('should resolve deep association with auto appends (roles[0].name)', async () => {
    const payload = {
      template: { role: '{{ ctx.view.record.roles[0].name }}' },
      contextParams: {
        'view.record': {
          dataSourceKey: 'main',
          collection: 'users',
          filterByTk: 1,
          // no explicit appends: registry should auto-generate ['roles'] from template usage
        },
      },
    };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    // role should be a string (e.g., 'admin'), content depends on seed
    expect(typeof data.role).toBe('string');
    expect(data.role.length).toBeGreaterThan(0);
  });

  it('should support bracket notation for first association segment', async () => {
    const payload = {
      template: {
        b: "{{ ctx.view.record['id'] }}",
        c: "{{ ctx.view.record['roles'][0]['name'] }}",
      },
      contextParams: {
        'view.record': {
          dataSourceKey: 'main',
          collection: 'users',
          filterByTk: 1,
        },
      },
    };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(data.b).toBe(1);
    expect(typeof data.c).toBe('string');
    expect(data.c.length).toBeGreaterThan(0);
  });

  it('batch: resolves multiple items and preserves unmatched placeholders', async () => {
    const payload = {
      batch: [
        { id: 't1', template: { ts: '{{ ctx.timestamp }}' } },
        // missing contextParams for view.record -> keep placeholder
        { id: 't2', template: { id: '{{ ctx.view.record.id }}' } },
      ],
    } as any;
    const res = await execResolve(payload, 1);
    const results = res.body?.results || [];
    const r1 = results.find((r: any) => r.id === 't1');
    const r2 = results.find((r: any) => r.id === 't2');
    expect(typeof r1.data.ts).toBe('number');
    expect(r2.data.id).toBe('{{ ctx.view.record.id }}');
  });

  it('should support top-level bracket var for record', async () => {
    const payload = {
      template: {
        id: "{{ ctx['view'].record.id }}",
        role: "{{ ctx['view']['record']['roles'][0].name }}",
      },
      contextParams: {
        'view.record': {
          dataSourceKey: 'main',
          collection: 'users',
          filterByTk: 1,
        },
      },
    };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(data.id).toBe(1);
    expect(typeof data.role).toBe('string');
    expect(data.role.length).toBeGreaterThan(0);
  });

  it('should resolve array-indexed dynamic record via flattened key (list.0)', async () => {
    const payload = {
      template: {
        username: '{{ ctx.list[0].name }}',
      },
      contextParams: {
        'list.0': {
          dataSourceKey: 'main',
          collection: 'users',
          filterByTk: 1,
          fields: ['name'],
        },
      },
    };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(typeof data.username).toBe('string');
    expect(data.username.length).toBeGreaterThan(0);
  });

  it('should keep unsupported references and partially replace', async () => {
    const payload = {
      template: {
        text: 'ID: {{ ctx.user.id }}, Unknown: {{ foo.bar }}',
      },
    };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(typeof data.text).toBe('string');
    expect(data.text.includes('ID: 1')).toBeTruthy();
    expect(data.text.includes('{{ foo.bar }}')).toBeTruthy();
  });

  it('should support calling ctx methods defined via registry attach', async () => {
    // Register a lightweight variable that attaches a callable method onto ctx
    if (!variables.get('twice')) {
      variables.register({
        name: 'twice',
        scope: 'request',
        attach: (flowCtx) => {
          flowCtx.defineMethod('twice', (n: any) => Number(n) * 2);
        },
      });
    }
    const payload = {
      template: {
        v: '{{ ctx.twice(21) }}',
        nested: '{{ ctx.twice(ctx.user.id) }}',
      },
    };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(data.v).toBe(42);
    expect(data.nested).toBe(2);
  });
});
