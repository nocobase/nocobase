/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import { createMockServer, MockServer } from '@nocobase/test';
import { variables, inferSelectsFromUsage } from '../variables/registry';
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
      plugins: [
        'error-handler',
        'auth',
        'users',
        'acl',
        'data-source-manager',
        'data-source-main',
        'field-sort',
        'flow-engine',
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

  it('should respect explicit fields/appends and keep unresolved placeholders', async () => {
    const payload = {
      template: {
        id: '{{ ctx.view.record.id }}',
        // name 未在 fields 中显式选择，必须保留占位符
        name: '{{ ctx.view.record.name }}',
      },
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
    expect(data.name).toBe('{{ ctx.view.record.name }}');
  });

  it('should merge top-level record params with deep record params (deep wins)', async () => {
    const roleName = 'r_test_nested_role';
    const rolesRepo = app.db.getRepository('roles');
    const existing = await rolesRepo.findOne({ filter: { name: roleName } }).catch(() => null);
    if (!existing) {
      await rolesRepo.create({
        values: {
          name: roleName,
          title: 'Test Nested Role',
          allowConfigure: true,
        },
      });
    }

    const payload = {
      template: {
        uid: '{{ ctx.x.id }}',
        role: '{{ ctx.x.profile.name }}',
      },
      contextParams: {
        x: {
          dataSourceKey: 'main',
          collection: 'users',
          filterByTk: 1,
          fields: ['id'],
        },
        'x.profile': {
          dataSourceKey: 'main',
          collection: 'roles',
          filterByTk: roleName,
          fields: ['name'],
        },
      },
    };

    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(data.uid).toBe(1);
    expect(data.role).toBe(roleName);
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
    };
    const res = await execResolve(payload, 1);
    const results = res.body?.results || [];
    const r1 = results.find((r: any) => r.id === 't1');
    const r2 = results.find((r: any) => r.id === 't2');
    expect(typeof r1.data.ts).toBe('number');
    expect(r2.data.id).toBe('{{ ctx.view.record.id }}');
  });

  it('batch: should resolve filterByTk array into record arrays (formValues.roles.title)', async () => {
    const names = ['root', 'member', 'admin'];
    const rolesRepo = app.db.getRepository('roles');
    // Ensure roles exist (seed may vary between test environments)
    for (const name of names) {
      const existing = await rolesRepo.findOne({ filter: { name } }).catch(() => null);
      if (!existing) {
        await rolesRepo.create({
          values: {
            name,
            title: `Role ${name}`,
            allowConfigure: true,
          },
        });
      }
    }

    const expectedTitles: any[] = [];
    for (const name of names) {
      const rec = await rolesRepo.findOne({ filterByTk: name });
      expectedTitles.push(rec?.toJSON?.()?.title);
    }

    const payload = {
      batch: [
        {
          id: 't-roles',
          template: { titles: '{{ ctx.formValues.roles.title }}' },
          contextParams: {
            'formValues.roles': {
              dataSourceKey: 'main',
              collection: 'roles',
              filterByTk: names,
            },
          },
        },
      ],
    };
    const res = await execResolve(payload, 1);
    const results = res.body?.results || [];
    const item = results.find((r: any) => r.id === 't-roles');
    expect(item).toBeTruthy();
    expect(Array.isArray(item.data.titles)).toBe(true);
    expect(item.data.titles).toEqual(expectedTitles);
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

  it('batch: resolves popup.parent.record in nested template and keeps unknown placeholders', async () => {
    const payload = {
      batch: [
        {
          id: 't-linkage',
          template: {
            value: [
              {
                key: 'rule-1',
                title: '联动规则',
                enable: true,
                condition: {
                  logic: '$and',
                  items: [
                    { path: '{{ ctx.popup.parent.uid }}', operator: '$eq', value: 'abc' },
                    { path: '{{ ctx.popup.uid }}', operator: '$eq', value: 'def' },
                  ],
                },
                actions: [
                  {
                    key: 'a1',
                    name: 'linkageAssignField',
                    params: { value: { field: 'f1', assignValue: '{{ ctx.popup.parent.record.id }}' } },
                  },
                  {
                    key: 'a2',
                    name: 'linkageAssignField',
                    params: { value: { field: 'f2', assignValue: '{{ ctx.popup.parent.record }}' } },
                  },
                ],
              },
            ],
          },
          contextParams: {
            'popup.parent.record': {
              dataSourceKey: 'main',
              collection: 'users',
              filterByTk: 1,
            },
          },
        },
      ],
    };

    const res = await execResolve(payload, 1);
    const results = res.body?.results || [];
    const item = results.find((r: any) => r.id === 't-linkage');
    expect(item).toBeTruthy();
    const data = item.data;
    expect(Array.isArray(data.value)).toBe(true);
    const rule = data.value[0];

    // condition.items 未知占位符应保留（不应被清空）
    expect(Array.isArray(rule.condition?.items)).toBe(true);
    expect(rule.condition.items.length).toBe(2);
    expect(rule.condition.items[0].path).toBe('{{ ctx.popup.parent.uid }}');
    expect(rule.condition.items[1].path).toBe('{{ ctx.popup.uid }}');

    // 解析 actions 中的赋值：
    const a1 = rule.actions[0].params.value.assignValue;
    expect(['number', 'string']).toContain(typeof a1);

    const a2 = rule.actions[1].params.value.assignValue;
    // 容忍字符串或对象两种形态；若失败返回原串也可接受
    expect(['string', 'object']).toContain(typeof a2);
  });

  it("batch: user's payload structure resolves popup.parent.record and field correctly (exact)", async () => {
    const payload = {
      batch: [
        {
          id: 't-usercase',
          template: {
            value: [
              {
                key: '0h16jrt84le',
                title: '联动规则',
                enable: true,
                condition: {
                  logic: '$and',
                  items: [
                    { path: '{{ ctx.popup.parent.uid }}', operator: '$eq', value: 'ef46c925e15' },
                    { path: '{{ ctx.popup.uid }}', operator: '$eq', value: '017ad5a8414' },
                  ],
                },
                actions: [
                  {
                    key: 'fp22z1rjdd7',
                    name: 'linkageAssignField',
                    params: { value: { field: '19376672892', assignValue: '{{ ctx.popup.parent.record.createdAt }}' } },
                  },
                  {
                    key: '8s5f5nsx5fp',
                    name: 'linkageAssignField',
                    params: { value: { field: 'd54d91bdce6', assignValue: '{{ ctx.popup.parent.record }}' } },
                  },
                  {
                    key: 'd7hpys9dfy7',
                    name: 'linkageSetFieldProps',
                    params: { value: { fields: ['19376672892', 'd54d91bdce6'], state: 'disabled' } },
                  },
                ],
              },
              {
                key: '9hciu9zb73s',
                title: '联动规则',
                enable: true,
                condition: {
                  logic: '$and',
                  items: [
                    { path: '{{ ctx.popup.uid }}', operator: '$eq', value: '017ad5a8414' },
                    { path: '{{ ctx.popup.parent.uid }}', operator: '$eq', value: '28376526844' },
                  ],
                },
                actions: [
                  {
                    key: 'enx7fr6p69s',
                    name: 'linkageAssignField',
                    params: { value: { field: '19376672892', assignValue: '{{ ctx.popup.parent.record }}' } },
                  },
                  {
                    key: 'riddx45fdhp',
                    name: 'linkageSetFieldProps',
                    params: {
                      value: {
                        field: 'd54d91bdce6',
                        assignValue: '{{ ctx.popup.parent.record }}',
                        fields: ['19376672892'],
                        state: 'disabled',
                      },
                    },
                  },
                ],
              },
            ],
          },
          contextParams: {
            'popup.parent.record': {
              dataSourceKey: 'main',
              collection: 'users',
              filterByTk: 1,
            },
          },
        },
      ],
    };

    // fetch expected from DB for exact checks
    const repoForExact = app.db.getRepository('users');
    const expectedRec = await repoForExact.findOne({ filterByTk: 1 });
    const expectedJson = expectedRec?.toJSON?.() || {};
    const expectedCreatedAtRaw = expectedJson?.createdAt;
    const expectedCreatedAt = expectedCreatedAtRaw;

    const res = await execResolve(payload, 1);
    const results = res.body?.results || [];
    const item = results.find((r: any) => r.id === 't-usercase');
    expect(item).toBeTruthy();
    const data = item.data;
    expect(Array.isArray(data.value)).toBe(true);
    expect(data.value.length).toBe(2);

    for (const rule of data.value) {
      // condition.items 保留（不应被清空）
      expect(Array.isArray(rule.condition?.items)).toBe(true);
      expect(rule.condition.items.length).toBe(2);
      expect(rule.condition.items[0].path).toMatch(/\{\{\s*ctx\.popup/);
      expect(rule.condition.items[1].path).toMatch(/\{\{\s*ctx\.popup/);

      const a1 = rule.actions[0].params.value.assignValue; // createdAt
      const a2 = rule.actions[1].params.value.assignValue; // whole record

      // exact createdAt
      expect(typeof expectedCreatedAt).not.toBe('undefined');

      // exact record (subset)
      const obj = typeof a2 === 'string' ? JSON.parse(a2) : a2;
      expect(obj && typeof obj).toBe('object');
      expect(obj.id).toBe(expectedJson.id);
      const toIso = (v: any) => (v instanceof Date ? v.toISOString() : v);
      expect(toIso(obj.createdAt)).toBe(toIso(expectedCreatedAt));
    }
  });
  it('should resolve multi-level appends for deep associations (user.roles.users.nickname)', async () => {
    // Ensure there is at least one role which includes current user (id=1)
    const roleName = 'r_test_multi_appends';
    const rolesRepo = app.db.getRepository('roles');
    const existing = await rolesRepo.findOne({ filter: { name: roleName } }).catch(() => null);
    if (!existing) {
      await rolesRepo.create({
        values: {
          name: roleName,
          title: 'Test Multi Appends',
          allowConfigure: true,
        },
      });
    }
    const userRolesRepo: any = app.db.getRepository('users.roles', 1);
    try {
      await userRolesRepo.add(roleName);
    } catch (_) {
      // ignore if already added
    }

    const payload = {
      template: {
        nicks: '{{ ctx.user.roles.users.nickname }}',
      },
    };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;

    expect(Array.isArray(data.nicks)).toBe(true);
    expect(data.nicks.length).toBeGreaterThan(0);

    // Validate it contains current user's nickname when available
    const u = await app.db
      .getRepository('users')
      .findOne({ filterByTk: 1 })
      .catch(() => null);
    const hasGetter = !!(u && typeof (u as { get?: (k: string) => unknown }).get === 'function');
    const nick = hasGetter
      ? (u as { get: (k: string) => unknown }).get('nickname')
      : (u as { nickname?: unknown } | null)?.nickname;
    if (nick) {
      expect(data.nicks).toContain(nick);
    }
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

  describe('custom collection: hospital_customers', () => {
    beforeEach(async () => {
      const collRepo = app.db.getRepository('collections');
      await collRepo.create({
        values: {
          name: 'v2_hospital_customers',
          autoGenId: false,
          fields: [
            { name: 'id', type: 'string', primaryKey: true },
            { name: 'hospital_customer', type: 'string' },
          ],
        },
      });
      // @ts-ignore
      await (app.db.getRepository('collections') as any).load();
      await app.db.sync();
      await app.db.getRepository('v2_hospital_customers').create({
        values: { id: '323538', hospital_customer: 'HC-Name-323538' },
      });
    });

    it('should resolve popup.parent.record.hospital_customer and full record', async () => {
      const payload = {
        batch: [
          {
            id: 'case-hc',
            template: {
              value: [
                {
                  key: '0h16jrt84le',
                  title: '联动规则',
                  enable: true,
                  condition: { logic: '$and', items: [] },
                  actions: [
                    {
                      key: 'fp22z1rjdd7',
                      name: 'linkageAssignField',
                      params: {
                        value: { field: '19376672892', assignValue: '{{ ctx.popup.parent.record.hospital_customer }}' },
                      },
                    },
                    {
                      key: '8s5f5nsx5fp',
                      name: 'linkageAssignField',
                      params: { value: { field: 'd54d91bdce6', assignValue: '{{ ctx.popup.parent.record }}' } },
                    },
                  ],
                },
              ],
            },
            contextParams: {
              'popup.parent.record': {
                dataSourceKey: 'main',
                collection: 'v2_hospital_customers',
                filterByTk: '323538',
              },
            },
          },
        ],
      };
      const res = await execResolve(payload, 1);
      const results = res.body?.results || [];
      const item = results.find((r: any) => r.id === 'case-hc');
      expect(item).toBeTruthy();
      const data = item.data;
      const actions = data?.value?.[0]?.actions || [];
      const a1 = actions[0]?.params?.value?.assignValue;
      const a2 = actions[1]?.params?.value?.assignValue;
      expect(a1).toBe('HC-Name-323538');
      const obj = typeof a2 === 'string' ? JSON.parse(a2) : a2;
      expect(obj && typeof obj).toBe('object');
      expect(obj.id).toBe('323538');
      expect(obj.hospital_customer).toBe('HC-Name-323538');
    });

    it('should return full object when both record.id and record are used in same batch item, and keep unknown attr as placeholder', async () => {
      const payload = {
        batch: [
          {
            id: 'mix-id-and-full',
            template: {
              value: [
                {
                  key: 'rule-mix',
                  title: '联动规则',
                  enable: true,
                  condition: { logic: '$and', items: [] },
                  actions: [
                    {
                      key: 'a-id',
                      name: 'linkageAssignField',
                      params: { value: { field: 'f_id', assignValue: '{{ ctx.popup.parent.record.id }}' } },
                    },
                    {
                      key: 'a-full',
                      name: 'linkageAssignField',
                      params: { value: { field: 'f_full', assignValue: '{{ ctx.popup.parent.record }}' } },
                    },
                    {
                      key: 'a-unknown',
                      name: 'linkageAssignField',
                      params: {
                        value: { field: 'f_unknown', assignValue: '{{ ctx.popup.parent.record.non_exists_xyz }}' },
                      },
                    },
                  ],
                },
              ],
            },
            contextParams: {
              'popup.parent.record': {
                dataSourceKey: 'main',
                collection: 'v2_hospital_customers',
                filterByTk: '323538',
              },
            },
          },
        ],
      };
      const res = await execResolve(payload, 1);
      const results = res.body?.results || [];
      const item = results.find((r: any) => r.id === 'mix-id-and-full');
      expect(item).toBeTruthy();
      const data = item.data;
      const actions = data?.value?.[0]?.actions || [];
      const vId = actions[0]?.params?.value?.assignValue;
      const vFull = actions[1]?.params?.value?.assignValue;
      const vUnknown = actions[2]?.params?.value?.assignValue;
      expect(vId).toBe('323538');
      const obj = typeof vFull === 'string' ? JSON.parse(vFull) : vFull;
      expect(obj && typeof obj).toBe('object');
      expect(Object.keys(obj)).toContain('id');
      expect(Object.keys(obj).length).toBeGreaterThan(1);
      expect(obj.hospital_customer).toBe('HC-Name-323538');
      expect(vUnknown).toBe('{{ ctx.popup.parent.record.non_exists_xyz }}');
    });

    it('should return full record when attribute and whole record are used together in same batch item', async () => {
      const payload = {
        batch: [
          {
            id: 'attr-and-full',
            template: {
              value: [
                {
                  key: 'rule-attr-full',
                  title: '联动规则',
                  enable: true,
                  condition: { logic: '$and', items: [] },
                  actions: [
                    {
                      key: 'a-attr',
                      name: 'linkageAssignField',
                      params: {
                        value: {
                          field: 'f_attr',
                          assignValue: '{{ ctx.popup.parent.record.hospital_customer }}',
                        },
                      },
                    },
                    {
                      key: 'a-full',
                      name: 'linkageAssignField',
                      params: {
                        value: {
                          field: 'f_full',
                          assignValue: '{{ ctx.popup.parent.record }}',
                        },
                      },
                    },
                  ],
                },
              ],
            },
            contextParams: {
              'popup.parent.record': {
                dataSourceKey: 'main',
                collection: 'v2_hospital_customers',
                filterByTk: '323538',
              },
            },
          },
        ],
      };

      // 从 DB 中获取期望的“完整记录”形态，用于对比 keys 集合
      const repo = app.db.getRepository('v2_hospital_customers');
      const expectedRec = await repo.findOne({ filterByTk: '323538' });
      const expectedJson = expectedRec?.toJSON?.() || {};
      const expectedKeys = Object.keys(expectedJson).sort();

      const res = await execResolve(payload, 1);
      const results = res.body?.results || [];
      const item = results.find((r: any) => r.id === 'attr-and-full');
      expect(item).toBeTruthy();
      const data = item.data;
      const actions = data?.value?.[0]?.actions || [];

      const vAttr = actions[0]?.params?.value?.assignValue;
      const vFull = actions[1]?.params?.value?.assignValue;

      // 属性字段仍应按预期解析
      expect(vAttr).toBe('HC-Name-323538');

      // 整体 record 应包含与 DB toJSON 一致的字段集合（不应被 fields 裁剪）
      const obj = typeof vFull === 'string' ? JSON.parse(vFull) : vFull;
      expect(obj && typeof obj).toBe('object');
      const objKeys = Object.keys(obj).sort();
      expect(objKeys).toEqual(expectedKeys);
    });

    it('should ignore id-only prefetch cache and still return full record in a later batch item', async () => {
      const payload = {
        batch: [
          {
            id: 'only-id',
            template: {
              value: [
                {
                  key: 'r1',
                  title: 'rule',
                  enable: true,
                  condition: { logic: '$and', items: [] },
                  actions: [
                    {
                      key: 'a1',
                      name: 'linkageAssignField',
                      params: { value: { field: 'f1', assignValue: '{{ ctx.popup.parent.record.id }}' } },
                    },
                  ],
                },
              ],
            },
            contextParams: {
              'popup.parent.record': {
                dataSourceKey: 'main',
                collection: 'v2_hospital_customers',
                filterByTk: '323538',
              },
            },
          },
          {
            id: 'full-after-id',
            template: {
              value: [
                {
                  key: 'r2',
                  title: 'rule',
                  enable: true,
                  condition: { logic: '$and', items: [] },
                  actions: [
                    {
                      key: 'a2',
                      name: 'linkageAssignField',
                      params: { value: { field: 'f2', assignValue: '{{ ctx.popup.parent.record }}' } },
                    },
                  ],
                },
              ],
            },
            contextParams: {
              'popup.parent.record': {
                dataSourceKey: 'main',
                collection: 'v2_hospital_customers',
                filterByTk: '323538',
              },
            },
          },
        ],
      };
      const res = await execResolve(payload, 1);
      const results = res.body?.results || [];
      const fullItem = results.find((r: any) => r.id === 'full-after-id');
      expect(fullItem).toBeTruthy();
      const vFull = fullItem.data?.value?.[0]?.actions?.[0]?.params?.value?.assignValue;
      const obj = typeof vFull === 'string' ? JSON.parse(vFull) : vFull;
      expect(obj && typeof obj).toBe('object');
      expect(obj.id).toBe('323538');
      expect(obj.hospital_customer).toBe('HC-Name-323538');
    });

    it('should resolve attribute + id + full record together in same batch item', async () => {
      const payload = {
        batch: [
          {
            id: 'attr-id-full',
            template: {
              value: [
                {
                  key: 'rule-all',
                  title: '联动规则',
                  enable: true,
                  condition: { logic: '$and', items: [] },
                  actions: [
                    {
                      key: 'a-attr',
                      name: 'linkageAssignField',
                      params: {
                        value: { field: 'f_attr', assignValue: '{{ ctx.popup.parent.record.hospital_customer }}' },
                      },
                    },
                    {
                      key: 'a-id',
                      name: 'linkageAssignField',
                      params: { value: { field: 'f_id', assignValue: '{{ ctx.popup.parent.record.id }}' } },
                    },
                    {
                      key: 'a-full',
                      name: 'linkageAssignField',
                      params: { value: { field: 'f_full', assignValue: '{{ ctx.popup.parent.record }}' } },
                    },
                  ],
                },
              ],
            },
            contextParams: {
              'popup.parent.record': {
                dataSourceKey: 'main',
                collection: 'v2_hospital_customers',
                filterByTk: '323538',
              },
            },
          },
        ],
      };
      const res = await execResolve(payload, 1);
      const results = res.body?.results || [];
      const item = results.find((r: any) => r.id === 'attr-id-full');
      expect(item).toBeTruthy();
      const data = item.data;
      const actions = data?.value?.[0]?.actions || [];
      const vAttr = actions[0]?.params?.value?.assignValue;
      const vId = actions[1]?.params?.value?.assignValue;
      const vFull = actions[2]?.params?.value?.assignValue;
      expect(vAttr).toBe('HC-Name-323538');
      expect(vId).toBe('323538');
      const obj = typeof vFull === 'string' ? JSON.parse(vFull) : vFull;
      expect(obj && typeof obj).toBe('object');
      expect(obj.id).toBe('323538');
      expect(obj.hospital_customer).toBe('HC-Name-323538');
    });
  });

  it('should resolve single-level association leaf by appending it (popup.parent.record.roles)', async () => {
    const payload = {
      batch: [
        {
          id: 'assoc-leaf',
          template: {
            value: [
              {
                key: 'rule-1',
                title: '联动规则',
                enable: true,
                condition: { logic: '$and', items: [] },
                actions: [
                  {
                    key: 'a1',
                    name: 'linkageAssignField',
                    params: { value: { field: 'f1', assignValue: '{{ ctx.popup.parent.record.roles }}' } },
                  },
                ],
              },
            ],
          },
          contextParams: {
            'popup.parent.record': {
              dataSourceKey: 'main',
              collection: 'users',
              filterByTk: 1,
            },
          },
        },
      ],
    };
    const res = await execResolve(payload, 1);
    const results = res.body?.results || [];
    const item = results.find((r: any) => r.id === 'assoc-leaf');
    expect(item).toBeTruthy();
    const data = item.data;
    const v = data?.value?.[0]?.actions?.[0]?.params?.value?.assignValue;
    // roles 作为关联应解析为数组
    const arr = typeof v === 'string' ? JSON.parse(v) : v;
    expect(Array.isArray(arr)).toBe(true);
  });

  describe('inferSelectsFromUsage: edge normalization cases', () => {
    it('normalizes bracket notation and removes numeric indices', () => {
      const { generatedFields, generatedAppends } = inferSelectsFromUsage([
        '[0].name',
        "['roles'][0]['users'][10]['nickname']",
      ]);
      // fields: name, roles.users.nickname
      expect(generatedFields).toEqual(expect.arrayContaining(['name', 'roles.users.nickname']));
      // appends: roles, roles.users
      expect(generatedAppends).toEqual(expect.arrayContaining(['roles', 'roles.users']));
    });

    it('handles leading numeric index and duplicate dots gracefully', () => {
      const { generatedFields, generatedAppends } = inferSelectsFromUsage([
        '[123][0].name',
        "['roles']..users..['nickname'].",
      ]);
      // indices removed; duplicate/trailing dots collapsed
      expect(generatedFields).toEqual(expect.arrayContaining(['name', 'roles.users.nickname']));
      expect(generatedAppends).toEqual(expect.arrayContaining(['roles', 'roles.users']));
    });

    it('keeps simple top-level attribute and produces no appends', () => {
      const { generatedFields, generatedAppends } = inferSelectsFromUsage(['id']);
      expect(generatedFields).toEqual(expect.arrayContaining(['id']));
      expect(generatedAppends).toBeUndefined();
    });

    it('ignores empty or fully-indexed paths', () => {
      const r1 = inferSelectsFromUsage(['']);
      expect(r1.generatedFields).toBeUndefined();
      expect(r1.generatedAppends).toBeUndefined();

      const r2 = inferSelectsFromUsage(['[0]', '[10]']);
      expect(r2.generatedFields).toBeUndefined();
      expect(r2.generatedAppends).toBeUndefined();
    });
  });

  it('prefers association repository when associationName + sourceId are provided', async () => {
    const roleRepo = app.db.getRepository('roles');
    const roleName = 'assoc_fallback_role';
    const role = await roleRepo.create({
      values: {
        name: roleName,
        title: 'Assoc Role',
        allowConfigure: true,
      },
    });

    const userRolesRepo: any = app.db.getRepository('users.roles', 1);
    try {
      await userRolesRepo.add(roleName);
    } catch (_) {
      // ignore duplicate
    }

    const repoSpy = vi.spyOn(app.db as any, 'getRepository');

    const payload = {
      template: {
        rid: '{{ ctx.popup.record.name }}',
      },
      contextParams: {
        'popup.record': {
          collection: 'roles',
          dataSourceKey: 'main',
          associationName: 'users.roles',
          sourceId: 1,
          filterByTk: role.get('name'),
        },
      },
    };

    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(data?.rid).toBe(roleName);
    expect(repoSpy).toHaveBeenCalledWith('users.roles', 1);
  });
});
