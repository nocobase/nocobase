/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { GlobalContext, HttpRequestContext } from '../template/contexts';
import { resolveJsonTemplate } from '../template/resolver';
import { variables } from '../variables/registry';

describe('variables resolver (no HTTP)', () => {
  let app: MockServer;
  let CAN_ENV = false;

  beforeAll(async () => {
    process.env.INIT_ROOT_EMAIL = 'test@nocobase.com';
    process.env.INIT_ROOT_PASSWORD = '123456';
    process.env.INIT_ROOT_NICKNAME = 'Test';
    app = await createMockServer({
      database: { dialect: 'sqlite', storage: ':memory:' },
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

  it.runIf(CAN_ENV)('filters env to public prefixes only', async () => {
    app.environment.setVariable('PUBLIC_FOO', 'x');
    app.environment.setVariable('NEXT_PUBLIC_BAR', 'y');
    app.environment.setVariable('NCB_PUBLIC_Z', 'z');
    app.environment.setVariable('SECRET_TOKEN', 'hidden');
    const { req } = makeCtx(1);
    const tpl = { a: '{{ ctx.env.PUBLIC_FOO }}', b: '{{ ctx.env.SECRET_TOKEN }}' } as any;
    const out = await resolveJsonTemplate(tpl, req);
    expect(out.a).toBe('x');
    expect(out.b).toBe('{{ ctx.env.SECRET_TOKEN }}');
  });

  it('resolves date variables (shape existence)', async () => {
    const { req } = makeCtx(1);
    const tpl = { today: '{{ ctx.date.today }}', thisMonth: '{{ ctx.date.thisMonth }}' } as any;
    const out = await resolveJsonTemplate(tpl, req);
    expect(typeof out.today).toBe('string');
    expect(out.today.length).toBeGreaterThan(0);
    expect(typeof out.thisMonth).toBe('string');
    expect(out.thisMonth.length).toBeGreaterThan(0);
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

  // Note: fallback via current action context is covered by integration tests.
});
