/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { GlobalContext, HttpRequestContext, ServerBaseContext } from '../template/contexts';
import { resolveJsonTemplate } from '../template/resolver';
import { variables } from '../variables/registry';
import { resetVariablesRegistryForTest } from './test-utils';

describe('variables resolver (no HTTP)', () => {
  let app: MockServer;
  let CAN_ENV = false;

  beforeAll(async () => {
    resetVariablesRegistryForTest();
    process.env.INIT_ROOT_EMAIL = 'test@nocobase.com';
    process.env.INIT_ROOT_PASSWORD = '123456';
    process.env.INIT_ROOT_NICKNAME = 'Test';
    app = await createMockServer({
      plugins: ['auth', 'users', 'acl', 'data-source-manager', 'field-sort'],
      skipStart: false,
    });
    // Probe whether ctx.env is exposed in GlobalContext delegation
    const { req } = makeCtx(1);
    CAN_ENV = 'env' in (req as any);
  });

  afterAll(async () => {
    await app?.destroy();
  });

  function makeCtx(userId = 1) {
    const koaLike: any = {
      app,
      db: app.db,
      auth: { user: { id: userId }, role: 'root' },
      state: {},
      request: { ip: '127.0.0.1', headers: {}, query: {} },
      getCurrentLocale: () => 'en-US',
      action: { params: {} },
    };
    const reqCtx = new HttpRequestContext(koaLike);
    reqCtx.delegate(new GlobalContext(app.environment?.getVariables?.()));
    return { koa: koaLike, req: reqCtx };
  }

  it('resolves simple ctx.* without HTTP', async () => {
    const { req } = makeCtx(1);
    const tpl = { a: '{{ ctx.user.id }}', b: 'Now: {{ ctx.now }}' };
    const out = await resolveJsonTemplate(tpl, req);
    expect(out.a).toBe(1);
    expect(typeof out.b).toBe('string');
    expect(out.b.startsWith('Now: ')).toBeTruthy();
  });

  it('resolves dynamic record (view.record) with explicit contextParams (auto appends)', async () => {
    const { koa, req } = makeCtx(1);
    const template = { role: '{{ ctx.view.record.roles[0].name }}' } as any;
    await variables.attachUsedVariables(req, koa, template, {
      'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } as any,
    });
    const out = await resolveJsonTemplate(template, req);
    expect(typeof out.role).toBe('string');
    expect(out.role.length).toBeGreaterThan(0);
  });

  it('blocks access to non-endowed globals in SES compartment', async () => {
    const { req } = makeCtx(1);
    const tpl = { x: '{{ (globalThis && globalThis.process) ? 1 : 0 }}' } as any;
    const out = await resolveJsonTemplate(tpl, req);
    // process is not endowed, expect 0
    expect(out.x).toBe(0);
  });

  it('preserves unknown placeholders', async () => {
    const { req } = makeCtx(1);
    const tpl = { x: '{{ ctx.unknown }}', y: 'Hello {{ foo.bar }}' } as any;
    const out = await resolveJsonTemplate(tpl, req);
    expect(out.x).toBe('{{ ctx.unknown }}');
    expect(out.y).toBe('Hello {{ foo.bar }}');
  });

  it('supports object-returning expressions when used as a whole', async () => {
    const { req } = makeCtx(2);
    const tpl = { obj: '{{ ({ a: 1, b: ctx.user.id }) }}' } as any;
    const out = await resolveJsonTemplate(tpl, req);
    expect(out.obj).toEqual({ a: 1, b: 2 });
  });

  it('does not endow timers (setTimeout is undefined)', async () => {
    const { req } = makeCtx(1);
    const tpl = { t: '{{ typeof setTimeout }}' } as any;
    const out = await resolveJsonTemplate(tpl, req);
    expect(out.t).toBe('undefined');
  });

  it('supports custom ctx methods attached via registry', async () => {
    if (!variables.get('twice')) {
      variables.register({
        name: 'twice',
        scope: 'request',
        attach: (flowCtx) => flowCtx.defineMethod('twice', (n: any) => Number(n) * 2),
      });
    }
    const { koa, req } = makeCtx(1);
    const tpl = { v: '{{ ctx.twice(21) }}' } as any;
    await variables.attachUsedVariables(req, koa, tpl, {});
    const out = await resolveJsonTemplate(tpl, req);
    expect(out.v).toBe(42);
  });

  describe('server resolver: dot-only path aggregation', () => {
    it('aggregates across arrays with dot-only path', async () => {
      const ctx = new ServerBaseContext();
      ctx.defineProperty('a', {
        value: {
          b: [
            { c: 1, d: [1, 2] },
            { c: 2, d: [3] },
          ],
        },
      });
      const out = await resolveJsonTemplate('{{ ctx.a.b.d }}', ctx);
      expect(out).toEqual([1, 2, 3]);
    });

    it('replaces inside strings with JSON stringified array', async () => {
      const ctx = new ServerBaseContext();
      ctx.defineProperty('a', { value: { b: [{ d: [1, 2] }, { d: [3] }] } });
      const out = await resolveJsonTemplate('x={{ ctx.a.b.d }};', ctx as any);
      expect(out).toBe('x=[1,2,3];');
    });

    it('returns scalar for non-array dot-only path', async () => {
      const ctx = new ServerBaseContext();
      ctx.defineProperty('a', { value: { title: 'hello' } });
      const out = await resolveJsonTemplate('{{ ctx.a.title }}', ctx as any);
      expect(out).toBe('hello');
    });

    it('preserves placeholder when path not found (single expression)', async () => {
      const ctx = new ServerBaseContext();
      ctx.defineProperty('a', { value: { b: [{ d: [1, 2] }, { d: [3] }] } });
      const out = await resolveJsonTemplate('{{ ctx.a.missing.path }}', ctx as any);
      // 服务端单占位未解析到值时保留原占位
      expect(out).toBe('{{ ctx.a.missing.path }}');
    });

    it('deep nested arrays keep nested structure (server, no final deep flatten)', async () => {
      const ctx = new ServerBaseContext();
      ctx.defineProperty('a', {
        value: { b: [{ e: [{ d: [1] }, { d: [2] }] }, { e: [{ d: [3, [4]] }, { d: null }] }] },
      });
      const out = await resolveJsonTemplate('{{ ctx.a.b.e.d }}', ctx as any);
      expect(out).toEqual([1, 2, 3, [4]]);
    });

    it('non dot-only expressions remain unaffected alongside aggregation (server)', async () => {
      const ctx = new ServerBaseContext();
      ctx.defineProperty('a', { value: { b: [{ d: [1] }, { d: [2] }] } });
      const out = await resolveJsonTemplate('sum={{ 1 + 2 }}, arr={{ ctx.a.b.d }}', ctx as any);
      expect(out).toBe('sum=3, arr=[1,2]');
    });

    it('awaits async getter in dot-only chain', async () => {
      const view = new ServerBaseContext();
      view.defineProperty('record', {
        get: async () => ({ id: 1 }),
        cache: true,
      });
      const ctx = new ServerBaseContext();
      ctx.defineProperty('view', { value: view });
      const out = await resolveJsonTemplate('{{ ctx.view.record.id }}', ctx as any);
      expect(out).toBe(1);
    });
  });

  // Note: fallback via current action context is covered by integration tests.
});
