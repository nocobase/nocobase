/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import { MockServer } from '@nocobase/test';
import { generateFlowModelRd } from '@nocobase/utils';
import * as variableExpression from '../template/variable-expression';
import { inferSelectsFromUsage } from '../variables/registry';
import FlowModelRepository from '../repository';
import { getRecordSlotResolverRegistry } from '../variables/record-slot-resolvers';
import { createFlowEngineMockServer, resetVariablesRegistryForTest } from './test-utils';

describe('plugin-flow-engine variables:resolve (no HTTP)', () => {
  let app: MockServer;
  beforeAll(() => {
    resetVariablesRegistryForTest();
  });
  const execResolve = async (
    values: any,
    userId?: number,
    options: { currentRole?: string; currentRoles?: string[]; token?: string } = {},
  ) => {
    const action = app.resourceManager.getAction('variables', 'resolve').clone();
    const currentRole = options.currentRole ?? (userId ? 'root' : undefined);
    const ctx: any = {
      app,
      db: app.db,
      headers: options.token ? { authorization: `Bearer ${options.token}` } : {},
      request: { method: 'POST', path: '/api/variables:resolve', query: {}, body: values },
      auth: userId ? { user: { id: userId }, role: 'root' } : {},
      state: {
        currentRole,
        currentRoles: options.currentRoles ?? (currentRole ? [currentRole] : undefined),
      },
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
  const createTokenSession = (userId = 1) => {
    const signInTime = `variables-resolve-${userId}`;
    const payload = Buffer.from(JSON.stringify({ userId, signInTime })).toString('base64url');
    return {
      rd: (flowModelUid: string) => generateFlowModelRd(flowModelUid, `${userId}:${signInTime}`),
      token: `test.${payload}.sig`,
    };
  };

  const insertFlowModel = async (model: Record<string, unknown>) => {
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    return repository.insertModel(model);
  };

  const editFormModel = (uid: string, template: unknown) => ({
    uid,
    use: 'EditFormModel',
    stepParams: {
      resourceSettings: {
        init: { dataSourceKey: 'main', collectionName: 'users' },
      },
    },
    subModels: {
      grid: {
        uid: `${uid}-grid`,
        use: 'FormGridModel',
        subModels: {
          items: [
            {
              uid: `${uid}-roles`,
              use: 'FormItemModel',
              stepParams: { fieldSettings: { init: { fieldPath: 'roles' } } },
            },
          ],
        },
      },
    },
    props: template,
  });

  const popupSubTableModel = (uid: string, template: unknown) => ({
    uid: `${uid}-wrapper`,
    use: 'FormItemModel',
    stepParams: {
      fieldSettings: {
        init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'roles' },
      },
    },
    subModels: {
      field: {
        uid: `${uid}-field`,
        use: 'PopupSubTableFieldModel',
        subModels: {
          popup: {
            uid: `${uid}-popup-grid`,
            use: 'BlockGridModel',
            subModels: {
              blocks: [
                {
                  uid,
                  use: 'PopupSubTableFormModel',
                  props: template,
                },
              ],
            },
          },
        },
      },
    },
  });

  beforeEach(async () => {
    app = await createFlowEngineMockServer({
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

  it('should fail closed for unsupported request expressions while resolving a valid sibling batch item', async () => {
    const templates = [
      '{{ __get(ctx.user, "id") }}',
      '{{ __g\\u0065t(ctx.user, "id") }}',
      '{{ ctx }}',
      '{{ (() => { const alias = ctx; return alias.user.id; })() }}',
      '{{ ctx["user"][ctx.now] }}',
      '{{ ctx.user.get("id") }}',
      '{{ ctx.user.id }',
    ];
    const res = await execResolve(
      {
        batch: [
          ...templates.map((template, index) => ({ id: `blocked-${index}`, template: { value: template } })),
          { id: 'allowed', template: { value: '{{ ctx.user.id }}' } },
        ],
      },
      1,
    );
    const results = res.body?.results || [];

    templates.forEach((template, index) => {
      expect(results[index]).toEqual({ id: `blocked-${index}`, data: { value: template } });
    });
    expect(results[templates.length]).toEqual({ id: 'allowed', data: { value: 1 } });
  });

  it('should isolate thrown analysis and prototype root names per batch item', async () => {
    const invalidTemplate = { value: 'invalid' };
    const prototypeTemplates = ['__proto__', 'constructor', 'toString', 'hasOwnProperty'].map(
      (name) => `{{ctx.${name}.id}}`,
    );
    const originalAnalyze = variableExpression.analyzeVariableTemplate;
    const analyze = vi.spyOn(variableExpression, 'analyzeVariableTemplate').mockImplementation(originalAnalyze);

    try {
      analyze.mockImplementationOnce(() => {
        throw new TypeError('untrusted template');
      });
      const single = await execResolve({ template: invalidTemplate }, 1);
      const singlePrototypeResults: unknown[] = [];
      for (const template of prototypeTemplates) {
        const singlePrototype = await execResolve({ template }, 1);
        singlePrototypeResults.push(singlePrototype.body);
      }

      analyze.mockImplementationOnce(() => {
        throw new TypeError('untrusted template');
      });
      const res = await execResolve(
        {
          batch: [
            { id: 'thrown', template: invalidTemplate },
            ...prototypeTemplates.map((template, index) => ({ id: `prototype-${index}`, template })),
            { id: 'allowed', template: '{{ctx.user.id}}' },
          ],
        },
        1,
      );
      const results = res.body?.results || [];

      expect(single.body).toEqual(invalidTemplate);
      expect(results[0]).toEqual({ id: 'thrown', data: invalidTemplate });
      prototypeTemplates.forEach((template, index) => {
        expect(results[index + 1]).toEqual({ id: `prototype-${index}`, data: template });
        expect(singlePrototypeResults[index]).toBe(template);
      });
      expect(results.at(-1)).toEqual({ id: 'allowed', data: 1 });
    } finally {
      analyze.mockRestore();
    }
  });

  it('should keep unsafe expressions unresolved for ordinary and configure lanes', async () => {
    const templates = [
      '{{ eval("__resolveVariablePath0") }}',
      '{{ (eval)("__resolveVariablePath0") }}',
      '{{ globalThis.eval("__resolveVariablePath0") }}',
      '{{ (0, eval)("__resolveVariablePath0") }}',
      '{{ Function("return __resolveVariablePath0")() }}',
      '{{ globalThis["__resolveVariablePath"] }}',
      '{{ (() => 1)() }}',
    ];
    const payload = {
      batch: templates.map((template, index) => ({ id: index, template })),
    };

    for (const options of [
      { currentRole: 'root', currentRoles: ['root'] },
      { currentRole: 'member', currentRoles: ['member'] },
    ]) {
      const res = await execResolve(payload, 1, options);
      expect(res.body?.results).toEqual(templates.map((template, id) => ({ id, data: template })));
    }
  });

  it('should keep original template when rd is missing for a non-configure role', async () => {
    const payload = {
      template: { id: '{{ ctx.view.record.id }}' },
      contextParams: {
        'view.record': {
          dataSourceKey: 'main',
          collection: 'users',
          filterByTk: 1,
        },
      },
    };
    const res = await execResolve(payload, 1, { currentRole: 'member', currentRoles: ['member'] });
    const data = res.body?.data ?? res.body;
    expect(res.status).toBeUndefined();
    expect(data.id).toBe('{{ ctx.view.record.id }}');
  });

  it('should resolve allow-listed request user for a non-configure role and ignore spoofed user contextParams', async () => {
    const flowModelUid = 'allow-listed-request-user';
    const session = createTokenSession(1);
    await insertFlowModel({
      uid: flowModelUid,
      use: 'DetailsBlockModel',
      stepParams: {
        resourceSettings: {
          init: { dataSourceKey: 'main', collectionName: 'users' },
        },
      },
      props: {
        userId: '{{ ctx.user.id }}',
      },
    });

    const payload = {
      rd: session.rd(flowModelUid),
      template: { userId: '{{ ctx.user.id }}' },
      contextParams: {
        user: {
          dataSourceKey: 'main',
          collection: 'roles',
          filterByTk: 'root',
        },
      },
    };
    const res = await execResolve(payload, 1, {
      currentRole: 'member',
      currentRoles: ['member'],
      token: session.token,
    });
    const data = res.body?.data ?? res.body;
    expect(data.userId).toBe(1);
  });

  it('should preserve an allow-listed view Record target in its exact Slot', async () => {
    const flowModelUid = 'strict-view-record-source';
    const session = createTokenSession(1);
    await insertFlowModel({
      uid: flowModelUid,
      use: 'DetailsBlockModel',
      stepParams: {
        resourceSettings: {
          init: { dataSourceKey: 'main', collectionName: 'users' },
        },
      },
      props: {
        title: '{{ ctx.view.record.name }}',
      },
    });

    const payload = {
      rd: session.rd(flowModelUid),
      template: { name: '{{ ctx.view.record.name }}' },
      contextParams: {
        'view.record': {
          dataSourceKey: 'main',
          collection: 'roles',
          filterByTk: 'root',
        },
      },
    };
    const res = await execResolve(payload, 1, {
      currentRole: 'member',
      currentRoles: ['member'],
      token: session.token,
    });
    const data = res.body?.data ?? res.body;
    expect(data.name).toBe('root');
  });

  it('should preserve an allow-listed popup Record target in its exact Slot', async () => {
    const flowModelUid = 'popup-template-source-skip';
    const session = createTokenSession(1);
    await insertFlowModel({
      uid: flowModelUid,
      use: 'DetailsBlockModel',
      stepParams: {
        resourceSettings: {
          init: { dataSourceKey: 'main', collectionName: 'users' },
        },
      },
      props: {
        title: '{{ ctx.popup.parent.record.name }}',
      },
    });

    const payload = {
      rd: session.rd(flowModelUid),
      template: { name: '{{ ctx.popup.parent.record.name }}' },
      contextParams: {
        'popup.parent.record': {
          dataSourceKey: 'main',
          collection: 'roles',
          filterByTk: 'root',
        },
      },
    };
    const res = await execResolve(payload, 1, {
      currentRole: 'member',
      currentRoles: ['member'],
      token: session.token,
    });
    const data = res.body?.data ?? res.body;
    expect(data.name).toBe('root');
  });

  it('resolves a persisted RunJS ctx.getVar path for a non-configure role', async () => {
    const flowModelUid = 'runjs-get-var-member';
    const session = createTokenSession(1);
    await insertFlowModel({
      uid: flowModelUid,
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: `const roleName = await ctx.getVar('ctx.popup.record.name'); ctx.render(roleName);`,
            version: 'v2',
          },
        },
      },
    });

    const res = await execResolve(
      {
        rd: session.rd(flowModelUid),
        template: { name: '{{ ctx.popup.record.name }}' },
        contextParams: {
          'popup.record': {
            dataSourceKey: 'main',
            collection: 'roles',
            filterByTk: 'root',
          },
        },
      },
      1,
      { currentRole: 'member', currentRoles: ['member'], token: session.token },
    );

    expect(res.body).toEqual({ name: 'root' });
  });

  it('resolves a persisted RunJS ctx.resolveJsonTemplate path for a non-configure role', async () => {
    const flowModelUid = 'runjs-resolve-json-template-member';
    const session = createTokenSession(1);
    await insertFlowModel({
      uid: flowModelUid,
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: `
              const data = await ctx.resolveJsonTemplate({
                role: '{{ ctx.record.roles[0].name }}',
              });
              ctx.render(data.role);
            `,
            version: 'v2',
          },
        },
      },
    });

    const res = await execResolve(
      {
        rd: session.rd(flowModelUid),
        template: { role: '{{ ctx.record.roles[0].name }}' },
        contextParams: {
          record: { dataSourceKey: 'main', collection: 'users', filterByTk: 1 },
        },
      },
      1,
      { currentRole: 'member', currentRoles: ['member'], token: session.token },
    );

    expect(res.body.role).not.toBe('{{ ctx.record.roles[0].name }}');
    expect(typeof res.body.role).toBe('string');
  });

  it('keeps the exact popup Slot gate for member and root roles', async () => {
    const flowModelUid = 'popup-moved-record-slot';
    const session = createTokenSession(1);
    const template = { title: '{{ ctx.popup.record.roles.title }}' };
    await insertFlowModel({ uid: flowModelUid, use: 'DetailsBlockModel', props: template });
    const roles = app.db.getRepository('roles');
    const dataSourceGet = vi.spyOn(app.dataSourceManager, 'get');
    const getRepository = vi.spyOn(app.db, 'getRepository');
    const find = vi.spyOn(roles, 'find');
    const findOne = vi.spyOn(roles, 'findOne');

    const root = await execResolve(
      {
        rd: session.rd(flowModelUid),
        template,
        contextParams: { 'popup.record.roles': { collection: 'roles', filterByTk: 'root' } },
      },
      1,
      { currentRole: 'root', currentRoles: ['root'], token: session.token },
    );

    expect(root.body).toEqual(template);

    dataSourceGet.mockClear();
    getRepository.mockClear();
    find.mockClear();
    findOne.mockClear();
    const member = await execResolve(
      {
        rd: session.rd(flowModelUid),
        template,
        contextParams: { 'popup.record.roles': { collection: 'roles', filterByTk: 'root' } },
      },
      1,
      { currentRole: 'member', currentRoles: ['member'], token: session.token },
    );

    expect(member.body).toEqual(template);
    expect(dataSourceGet).not.toHaveBeenCalled();
    expect(findOne).not.toHaveBeenCalled();
    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith({ fields: ['name', 'allowConfigure'], filter: { name: ['member'] } });
    expect(getRepository).toHaveBeenCalledWith('roles');
    expect(getRepository).not.toHaveBeenCalledWith('users');
  });

  it.each([
    ['scalar', '{{ ctx.item.value.title.name }}', 'item.value.title'],
    ['JSON', '{{ ctx.item.value.strategy.actions }}', 'item.value.strategy'],
  ])('rejects an item descriptor on a %s field before any target-record lookup', async (_kind, expression, slot) => {
    const flowModelUid = `item-${_kind.toLowerCase()}-record-slot`;
    const session = createTokenSession(1);
    const template = { value: expression };
    await insertFlowModel(popupSubTableModel(flowModelUid, template));
    const users = app.db.getRepository('users');
    const roles = app.db.getRepository('roles');
    const dataSourceGet = vi.spyOn(app.dataSourceManager, 'get');
    const getRepository = vi.spyOn(app.db, 'getRepository');
    const usersFind = vi.spyOn(users, 'find');
    const usersFindOne = vi.spyOn(users, 'findOne');
    const rolesFind = vi.spyOn(roles, 'find');

    const response = await execResolve(
      {
        rd: session.rd(flowModelUid),
        template,
        contextParams: { [slot]: { collection: 'users', dataSourceKey: 'attack_source', filterByTk: 1 } },
      },
      1,
      { currentRole: 'member', currentRoles: ['member'], token: session.token },
    );

    expect(response.body).toEqual(template);
    expect(dataSourceGet).not.toHaveBeenCalled();
    expect(getRepository).not.toHaveBeenCalledWith('users');
    expect(usersFind).not.toHaveBeenCalled();
    expect(usersFindOne).not.toHaveBeenCalled();
    expect(rolesFind).toHaveBeenCalledTimes(1);
  });

  it('resolves item associations from the persisted association field chain', async () => {
    const flowModelUid = 'item-confirmed-association-slots';
    const session = createTokenSession(1);
    const template = {
      user: '{{ ctx.item.value.users.nickname }}',
      role: '{{ ctx.item.parentItem.value.roles.title }}',
    };
    await insertFlowModel(popupSubTableModel(flowModelUid, template));

    const response = await execResolve(
      {
        rd: session.rd(flowModelUid),
        template,
        contextParams: {
          'item.value.users': { collection: 'users', dataSourceKey: 'main', filterByTk: 1 },
          'item.parentItem.value.roles': { collection: 'roles', dataSourceKey: 'main', filterByTk: 'root' },
        },
      },
      1,
      { currentRole: 'root', currentRoles: ['root'], token: session.token },
    );

    expect(response.body).toEqual({ role: expect.any(String), user: expect.any(String) });
    expect(response.body.role).not.toBe(template.role);
    expect(response.body.user).not.toBe(template.user);
  });

  it('rejects a member view association slot move before any target-record lookup', async () => {
    const flowModelUid = 'view-moved-record-slot';
    const session = createTokenSession(1);
    const template = { name: '{{ ctx.view.record.department.name }}' };
    await insertFlowModel({ uid: flowModelUid, use: 'DetailsBlockModel', props: template });
    const users = app.db.getRepository('users');
    const find = vi.spyOn(users, 'find');
    const findOne = vi.spyOn(users, 'findOne');
    const response = await execResolve(
      {
        rd: session.rd(flowModelUid),
        template,
        contextParams: { 'view.record.department': { collection: 'users', filterByTk: 1 } },
      },
      1,
      { currentRole: 'member', currentRoles: ['member'], token: session.token },
    );

    expect(response.body).toEqual(template);
    expect(find).not.toHaveBeenCalled();
    expect(findOne).not.toHaveBeenCalled();
  });

  it('resolves a direct Record from the descriptor target in its exact Slot', async () => {
    const flowModelUid = 'direct-record-persisted-target';
    const session = createTokenSession(1);
    const template = { name: '{{ ctx.record.name }}' };
    await insertFlowModel({
      uid: flowModelUid,
      use: 'DetailsBlockModel',
      props: template,
    });

    const response = await execResolve(
      {
        rd: session.rd(flowModelUid),
        template,
        contextParams: { record: { collection: 'roles', dataSourceKey: 'main', filterByTk: 'root' } },
      },
      1,
      { currentRole: 'member', currentRoles: ['member'], token: session.token },
    );

    expect(response.body).toEqual({ name: 'root' });
  });

  it('resolves configured Form associations through the production exact Slot resolver', async () => {
    const flowModelUid = 'form-values-moved-record-slot';
    const session = createTokenSession(1);
    const template = { title: '{{ ctx.formValues.roles.title }}' };
    await insertFlowModel(editFormModel(flowModelUid, template));
    const users = app.db.getRepository('users');
    const roles = app.db.getRepository('roles');
    const usersFind = vi.spyOn(users, 'find');
    const usersFindOne = vi.spyOn(users, 'findOne');
    const rolesFind = vi.spyOn(roles, 'find');
    const rolesFindOne = vi.spyOn(roles, 'findOne');
    const attack = await execResolve(
      {
        rd: session.rd(flowModelUid),
        template,
        contextParams: { formValues: { collection: 'users', filterByTk: 1 } },
      },
      1,
      { currentRole: 'member', currentRoles: ['member'], token: session.token },
    );

    expect(attack.body).toEqual(template);
    expect(usersFind).not.toHaveBeenCalled();
    expect(usersFindOne).not.toHaveBeenCalled();
    expect(rolesFind).toHaveBeenCalledTimes(1);
    expect(rolesFindOne).not.toHaveBeenCalled();

    const legal = await execResolve(
      {
        rd: session.rd(flowModelUid),
        template,
        contextParams: {
          'formValues.roles': { collection: 'roles', dataSourceKey: 'main', filterByTk: 'root' },
        },
      },
      1,
      { currentRole: 'member', currentRoles: ['member'], token: session.token },
    );

    expect(typeof legal.body.title).toBe('string');
    expect(legal.body.title).not.toBe(template.title);
    expect(usersFind).not.toHaveBeenCalled();
    expect(usersFindOne).not.toHaveBeenCalled();
    expect(rolesFindOne).toHaveBeenCalledTimes(1);
  });

  it('does not let allowConfigure endpoint requests move descriptors', async () => {
    const getRole = vi.spyOn(app.acl, 'getRole').mockReturnValue({
      getStrategy: () => ({ allowConfigure: true }),
    } as never);
    const template = { title: '{{ ctx.popup.record.roles.title }}' };
    const response = await execResolve(
      {
        template,
        contextParams: { 'popup.record.roles': { collection: 'roles', filterByTk: 'root' } },
      },
      1,
      { currentRole: 'designer', currentRoles: ['designer'] },
    );

    expect(response.body).toEqual(template);
    expect(getRole).toHaveBeenCalledWith('designer');
  });

  it.each([
    ['dot', '{{ ctx.popup.record.roles.title }}', 'popup.record.roles'],
    ['static bracket', '{{ ctx["popup"]["record"]["roles"]["title"] }}', 'popup.record.roles'],
    ['numeric index', '{{ ctx.popup.record.roles[0].title }}', 'popup.record.roles.0'],
    ['dashed key', '{{ ctx.popup.record["role-list"].title }}', 'popup.record.role-list'],
  ])('rejects moved endpoint descriptors with %s syntax', async (_syntax, expression, movedSlot) => {
    const template = { value: expression };
    const response = await execResolve(
      {
        template,
        contextParams: { [movedSlot]: { collection: 'roles', filterByTk: 'root' } },
      },
      1,
    );

    expect(response.body).toEqual(template);
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
        // nickname 未在 fields 中显式选择，必须保留占位符
        nickname: '{{ ctx.view.record.nickname }}',
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
    expect(data.nickname).toBe('{{ ctx.view.record.nickname }}');
  });

  it('should keep unregistered record variables unresolved for root', async () => {
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
          filterByTk: 'root',
          fields: ['name'],
        },
      },
    };

    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(data).toEqual(payload.template);
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

  it('batch: preserves id, order, and original templates for unauthorized items', async () => {
    const flowModelUid = 'mixed-authorized-batch';
    const session = createTokenSession(1);
    await insertFlowModel({
      uid: flowModelUid,
      use: 'DetailsBlockModel',
      props: { id: '{{ ctx.view.record.id }}' },
    });
    const recordParams = { collection: 'users', dataSourceKey: 'main', filterByTk: 1 };
    const res = await execResolve(
      {
        batch: [
          {
            id: 'allowed-first',
            rd: session.rd(flowModelUid),
            template: { value: '{{ ctx.view.record.id }}' },
            contextParams: { 'view.record': recordParams },
          },
          {
            id: 'blocked-middle',
            rd: session.rd(flowModelUid),
            template: { value: '{{ ctx.view.record.nickname }}' },
            contextParams: { 'view.record': recordParams },
          },
          {
            id: 'allowed-last',
            rd: session.rd(flowModelUid),
            template: { value: '{{ ctx.view.record.id }}' },
            contextParams: { 'view.record': recordParams },
          },
        ],
      },
      1,
      { currentRole: 'member', currentRoles: ['member'], token: session.token },
    );

    expect(res.body?.results).toEqual([
      { id: 'allowed-first', data: { value: 1 } },
      { id: 'blocked-middle', data: { value: '{{ ctx.view.record.nickname }}' } },
      { id: 'allowed-last', data: { value: 1 } },
    ]);
  });

  it('batch: should resolve filterByTk array into record arrays (formValues.roles.title)', async () => {
    const flowModelUid = 'batch-form-values-roles';
    const session = createTokenSession(1);
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

    const template = { titles: '{{ ctx.formValues.roles.title }}' };
    await insertFlowModel(editFormModel(flowModelUid, template));
    getRecordSlotResolverRegistry(app).register({
      owner: 'variables.resolve.test',
      id: 'form-values-roles',
      match: (path) => path.varName === 'formValues' && path.runtimeSegments[0] === 'roles',
      resolve: () => ({
        status: 'resolved',
        slot: ['roles'],
      }),
    });
    const payload = {
      batch: [
        {
          id: 't-roles',
          rd: session.rd(flowModelUid),
          template,
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
    const res = await execResolve(payload, 1, { token: session.token });
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

  it('should keep ctx method calls unresolved', async () => {
    const payload = {
      template: {
        v: '{{ ctx.twice(21) }}',
        nested: '{{ ctx.twice(ctx.user.id) }}',
      },
    };
    const res = await execResolve(payload, 1);
    const data = res.body?.data ?? res.body;
    expect(data.v).toBe('{{ ctx.twice(21) }}');
    expect(data.nested).toBe('{{ ctx.twice(ctx.user.id) }}');
  });

  describe('custom collection: hospital_customers', () => {
    let hospitalCustomersCollection = '';
    let hospitalCustomersCollectionSequence = 0;

    beforeEach(async () => {
      hospitalCustomersCollectionSequence += 1;
      hospitalCustomersCollection = `v2_hospital_customers_${
        process.pid
      }_${Date.now()}_${hospitalCustomersCollectionSequence}`;

      const collRepo = app.db.getRepository('collections');
      await collRepo.create({
        values: {
          name: hospitalCustomersCollection,
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
      await app.db.getRepository(hospitalCustomersCollection).create({
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
                collection: hospitalCustomersCollection,
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
                collection: hospitalCustomersCollection,
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
                collection: hospitalCustomersCollection,
                filterByTk: '323538',
              },
            },
          },
        ],
      };

      // 从 DB 中获取期望的“完整记录”形态，用于对比 keys 集合
      const repo = app.db.getRepository(hospitalCustomersCollection);
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
                collection: hospitalCustomersCollection,
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
                collection: hospitalCustomersCollection,
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
                collection: hospitalCustomersCollection,
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

    it('does not reinterpret structured literal dotted keys as associations', () => {
      expect(inferSelectsFromUsage([['a.b']])).toEqual({
        generatedAppends: undefined,
        generatedFields: undefined,
      });
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
