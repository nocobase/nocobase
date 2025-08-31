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

describe('plugin-flow-engine variables:resolve', () => {
  let app: MockServer;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['@nocobase/plugin-flow-engine'],
    });
  });

  afterAll(async () => {
    await app?.destroy();
  });

  it('should resolve simple expressions and keep unknown as-is', async () => {
    const agent = app.agent();

    const payload = {
      a: 1,
      b: 'hello',
      c: 'Now: {{ ctx.now }}',
      d: '{{ ctx.unknown }}',
    };

    const res = await agent.resource('variables').resolve({ values: payload });
    expect(res.status).toBe(200);

    const data = res.body?.data ?? res.body; // data-wrapping
    expect(typeof data.c).toBe('string');
    expect(data.c.startsWith('Now: ')).toBeTruthy();
    // unknown should be kept as original string
    expect(data.d).toBe('{{ ctx.unknown }}');
    expect(data.a).toBe(1);
    expect(data.b).toBe('hello');
  });

  it('should resolve current user when logged in', async () => {
    const agent = await app.agent().loginUsingId(1);

    const payload = {
      userId: '{{ ctx.user.id }}',
    };
    const res = await agent.resource('variables').resolve({ values: payload });
    expect(res.status).toBe(200);
    const data = res.body?.data ?? res.body;
    expect(data.userId).toBe(1);
  });

  it('should support values.template field', async () => {
    const agent = app.agent();
    const payload = { template: { time: '{{ ctx.timestamp }}' } };
    const res = await agent.resource('variables').resolve({ values: payload });
    expect(res.status).toBe(200);
    const data = res.body?.data ?? res.body;
    expect(typeof data.time).toBe('number');
  });

  it('should validate missing record context params', async () => {
    const agent = app.agent();
    const payload = {
      template: {
        id: '{{ ctx.record.id }}',
      },
      // no contextParams.record provided
    };
    const res = await agent.resource('variables').resolve({ values: payload });
    expect(res.status).toBe(400);
    const data = res.body;
    expect(data?.error?.code).toBe('INVALID_CONTEXT_PARAMS');
    expect(Array.isArray(data?.error?.missing)).toBeTruthy();
  });

  it('should resolve record with explicit contextParams', async () => {
    const agent = await app.agent().loginUsingId(1);
    const payload = {
      template: { id: '{{ ctx.record.id }}' },
      contextParams: {
        record: {
          dataSourceKey: 'main',
          collection: 'users',
          filterByTk: 1,
          fields: ['id'],
        },
      },
    };
    const res = await agent.resource('variables').resolve({ values: payload });
    expect(res.status).toBe(200);
    const data = res.body?.data ?? res.body;
    expect(data.id).toBe(1);
  });

  it('should resolve deep association with auto appends (roles[0].name)', async () => {
    const agent = await app.agent().loginUsingId(1);
    const payload = {
      template: { role: '{{ ctx.record.roles[0].name }}' },
      contextParams: {
        record: {
          dataSourceKey: 'main',
          collection: 'users',
          filterByTk: 1,
          // no explicit appends: registry should auto-generate ['roles'] from template usage
        },
      },
    };
    const res = await agent.resource('variables').resolve({ values: payload });
    expect(res.status).toBe(200);
    const data = res.body?.data ?? res.body;
    // role should be a string (e.g., 'admin'), content depends on seed
    expect(typeof data.role).toBe('string');
    expect(data.role.length).toBeGreaterThan(0);
  });

  it('should support bracket notation and arithmetic', async () => {
    const agent = await app.agent().loginUsingId(1);
    const payload = {
      template: {
        a: "{{ ctx['user'].id + 1 }}",
        b: "{{ ctx.record['id'] }}",
        c: "{{ ctx.record['roles'][0]['name'] }}",
      },
      contextParams: {
        record: {
          dataSourceKey: 'main',
          collection: 'users',
          filterByTk: 1,
        },
      },
    };
    const res = await agent.resource('variables').resolve({ values: payload });
    expect(res.status).toBe(200);
    const data = res.body?.data ?? res.body;
    expect(data.a).toBe(2);
    expect(data.b).toBe(1);
    expect(typeof data.c).toBe('string');
    expect(data.c.length).toBeGreaterThan(0);
  });

  it('should keep unsupported references and partially replace', async () => {
    const agent = await app.agent().loginUsingId(1);
    const payload = {
      template: {
        text: 'ID: {{ ctx.user.id }}, Unknown: {{ foo.bar }}',
      },
    };
    const res = await agent.resource('variables').resolve({ values: payload });
    expect(res.status).toBe(200);
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

    const agent = await app.agent().loginUsingId(1);
    const payload = {
      template: {
        v: '{{ ctx.twice(21) }}',
        nested: '{{ ctx.twice(ctx.record.id) }}',
      },
      contextParams: {
        record: {
          dataSourceKey: 'main',
          collection: 'users',
          filterByTk: 1,
        },
      },
    };
    const res = await agent.resource('variables').resolve({ values: payload });
    expect(res.status).toBe(200);
    const data = res.body?.data ?? res.body;
    expect(data.v).toBe(42);
    expect(data.nested).toBe(2);
  });
});
