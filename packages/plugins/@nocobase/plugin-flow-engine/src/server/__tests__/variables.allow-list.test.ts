/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { generateFlowModelRd } from '@nocobase/utils';
import { vi } from 'vitest';
import type { VariablePathRef } from '../template/variable-expression';
import { authorizeVariablesResolve } from '../variables/allow-list';
import { variables } from '../variables/registry';
import { resetVariablesRegistryForTest } from './test-utils';

type FakeCtxOptions = {
  allowConfigure?: boolean;
  currentRole?: string;
  fieldKinds?: Record<string, 'association' | 'field'>;
  findModelById?: (uid: string) => Promise<unknown>;
  findRoles?: () => Promise<unknown[]>;
  models?: Record<string, unknown>;
  token?: string;
};

function createTokenSession(userId = 1) {
  const signInTime = `variables-allow-list-${userId}`;
  const payload = Buffer.from(JSON.stringify({ userId, signInTime })).toString('base64url');
  return {
    rd: (flowModelUid: string) => generateFlowModelRd(flowModelUid, `${userId}:${signInTime}`),
    token: `test.${payload}.sig`,
  };
}

function createFakeCtx(options: FakeCtxOptions = {}) {
  const currentRole = options.currentRole || 'member';
  const models = options.models || {};
  const headers = options.token ? { authorization: `Bearer ${options.token}` } : {};
  const fields = Object.fromEntries(
    Object.entries(options.fieldKinds || {}).map(([name, kind]) => [
      name,
      {
        isAssociationField: () => kind === 'association',
        isRelationField: () => kind === 'association',
      },
    ]),
  );
  const collection = {
    fields: { get: (name: string) => fields[name] },
    getField: (name: string) => fields[name],
  };

  return {
    app: {
      acl: {
        getRole: () => ({
          getStrategy: () => ({ allowConfigure: options.allowConfigure === true }),
        }),
      },
      dataSourceManager: {
        get: () => ({
          collectionManager: {
            getCollection: () => collection,
          },
        }),
      },
    },
    db: {
      getCollection: (name: string) => {
        if (name === 'flowModels') {
          return {
            repository: {
              findModelById: options.findModelById || (async (uid: string) => models[uid] || null),
            },
          };
        }
        return collection;
      },
      getRepository: (name: string) => {
        if (name === 'roles') {
          return { find: options.findRoles || (async () => []) };
        }
        return {};
      },
    },
    get: (name: string) => headers[name.toLowerCase() as keyof typeof headers],
    state: {
      currentRole,
      currentRoles: [currentRole],
    },
  } as unknown as ResourcerContext;
}

function createFlowModel(uid: string, template: unknown) {
  return {
    uid,
    use: 'DetailsBlockModel',
    stepParams: {
      resourceSettings: {
        init: { dataSourceKey: 'main', collectionName: 'users' },
      },
    },
    props: template,
  };
}

function createEditFormModel(uid: string, template: unknown, configuredFields: string[]) {
  return {
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
          items: configuredFields.map((fieldPath, index) => ({
            uid: `${uid}-field-${index}`,
            use: 'FormItemModel',
            stepParams: { fieldSettings: { init: { fieldPath } } },
          })),
        },
      },
    },
    props: template,
  };
}

describe('variables:resolve allow-list authorization', () => {
  beforeEach(() => {
    resetVariablesRegistryForTest();
  });

  it('sanitizes user contextParams before configure role bypass', async () => {
    const result = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
      template: { userId: '{{ ctx.user.id }}' },
      contextParams: {
        user: { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' },
        'user.profile': { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' },
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.contextParams).not.toHaveProperty('user');
    expect(result.contextParams).not.toHaveProperty('user.profile');
  });

  it('rejects user without rd for non-configure roles but still ignores spoofed user contextParams', async () => {
    const result = await authorizeVariablesResolve(createFakeCtx(), {
      template: { userId: '{{ ctx.user.id }}' },
      contextParams: {
        user: { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' },
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.contextParams).not.toHaveProperty('user');
  });

  it('allows allow-listed user with rd and ignores spoofed user contextParams', async () => {
    const session = createTokenSession();
    const modelUid = 'allow-listed-user';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createFlowModel(modelUid, { userId: '{{ ctx.user.id }}' }),
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: { userId: '{{ ctx.user.id }}' },
      contextParams: {
        user: { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' },
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.contextParams).not.toHaveProperty('user');
  });

  it('keeps registered variable contextParams sanitized after later validators mutate them', async () => {
    variables.register({
      name: 'evil',
      scope: 'request',
      validateContextParams: ({ contextParams }) => {
        contextParams.user = { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' };
        contextParams['user.profile'] = { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' };
        return { allowed: true, requireFlowModel: false };
      },
      attach: () => {},
    });

    const session = createTokenSession();
    const modelUid = 'mutating-validator-user-cleanup';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createFlowModel(modelUid, {
          userId: '{{ ctx.user.id }}',
          evil: '{{ ctx.evil.value }}',
        }),
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: {
        userId: '{{ ctx.user.id }}',
        evil: '{{ ctx.evil.value }}',
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.contextParams).not.toHaveProperty('user');
    expect(result.contextParams).not.toHaveProperty('user.profile');
  });

  it('does not include runtime record sources in path authorization', async () => {
    const session = createTokenSession();
    const modelUid = 'strict-view-record-source';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createFlowModel(modelUid, { title: '{{ ctx.view.record.name }}' }),
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: { name: '{{ ctx.view.record.name }}' },
      contextParams: {
        'view.record': {
          associationName: 'users.roles',
          collection: 'roles',
          dataSourceKey: 'secondary',
          filterByTk: ['root'],
          sourceId: 9,
        },
      },
    });

    expect(result.allowed).toBe(true);
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings[0].params).toEqual({
      associationName: 'users.roles',
      collection: 'roles',
      dataSourceKey: 'secondary',
      filterByTk: ['root'],
      sourceId: 9,
    });
  });

  it('keeps dash field names intact when matching requested keys', async () => {
    const session = createTokenSession();
    const modelUid = 'allow-dash-field-name';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createFlowModel(modelUid, { title: '{{ ctx.view.record.roles.a-b }}' }),
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: { title: '{{ ctx.view.record.roles.a-b }}' },
      contextParams: {
        'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 },
      },
    });

    expect(result.allowed).toBe(true);
  });

  it('does not authorize dash field paths as their shorter prefix', async () => {
    const session = createTokenSession();
    const modelUid = 'reject-dash-field-prefix';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createFlowModel(modelUid, { title: '{{ ctx.view.record.roles.a }}' }),
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: { title: '{{ ctx.view.record.roles.a-b }}' },
      contextParams: {
        'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 },
      },
    });

    expect(result.allowed).toBe(false);
  });

  it('accepts popup record contextParams from arbitrary runtime sources', async () => {
    const session = createTokenSession();
    const modelUid = 'popup-official-source-skip';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createFlowModel(modelUid, { title: '{{ ctx.popup.parent.record.name }}' }),
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: { name: '{{ ctx.popup.parent.record.name }}' },
      contextParams: {
        'popup.parent.record': { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' },
        'popup.custom': { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' },
      },
    });

    expect(result.allowed).toBe(true);
  });

  it('strips a validator descriptor without a persisted slot policy', async () => {
    variables.register({
      name: 'evil',
      scope: 'request',
      recordContextPolicy: { allowGenericStrictPrefix: true },
      validateContextParams: ({ contextParams }) => {
        contextParams['evil.record'] = { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' };
        return { allowed: true };
      },
      attach: () => {},
    });

    const session = createTokenSession();
    const modelUid = 'mutating-validator-source-check';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createFlowModel(modelUid, { title: '{{ ctx.evil.record.name }}' }),
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: { name: '{{ ctx.evil.record.name }}' },
      contextParams: {},
    });

    expect(result.allowed).toBe(true);
    expect(result.contextParams).toEqual({});
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toEqual([]);
  });

  it('still requires popup requested keys to exist in the flow model allow-list', async () => {
    const session = createTokenSession();
    const modelUid = 'popup-missing-key';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createFlowModel(modelUid, { title: '{{ ctx.popup.parent.record.id }}' }),
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: { name: '{{ ctx.popup.parent.record.name }}' },
      contextParams: {
        'popup.parent.record': { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' },
      },
    });

    expect(result.allowed).toBe(false);
  });

  it('keeps legal strict siblings when another slot descriptor is missing or misplaced', async () => {
    const session = createTokenSession();
    const modelUid = 'strict-descriptor-tolerance';
    const template = ['{{ ctx.formValues.status }}', '{{ ctx.formValues.department.name }}'];
    const ctx = createFakeCtx({
      fieldKinds: { department: 'association', status: 'field' },
      models: { [modelUid]: createEditFormModel(modelUid, template, ['department']) },
      token: session.token,
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template,
      contextParams: {
        formValues: { collection: 'users', filterByTk: 1 },
        'formValues.department.name': { collection: 'roles', filterByTk: 2 },
        'unrelated.record': { collection: 'roles', filterByTk: 3 },
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.contextParams).toEqual({});
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toEqual([expect.objectContaining({ prefix: [], relativePaths: [['status']] })]);
  });

  it('rejects missing, invalid, and model-external paths for ordinary roles', async () => {
    const session = createTokenSession();
    const otherSession = createTokenSession(2);
    const modelUid = 'ordinary-path-gates';
    const ctx = createFakeCtx({
      token: session.token,
      models: { [modelUid]: createFlowModel(modelUid, '{{ctx.user.id}}') },
    });

    const missingRd = await authorizeVariablesResolve(ctx, { template: '{{ctx.user.id}}' });
    const invalidRd = await authorizeVariablesResolve(ctx, {
      rd: otherSession.rd(modelUid),
      template: '{{ctx.user.id}}',
    });
    const externalPath = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: '{{ctx.user.name}}',
    });

    expect([missingRd.allowed, invalidRd.allowed, externalPath.allowed]).toEqual([false, false, false]);
  });

  it('collects paths from the whole model while ignoring unsupported client expressions', async () => {
    const session = createTokenSession();
    const modelUid = 'whole-model-collection';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createFlowModel(modelUid, {
          clientOnly: '{{ctx.record[field]}}',
          nested: { value: '{{ctx.user.profile.name}}' },
        }),
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: '{{ctx.user.profile.name}}',
    });

    expect(result.allowed).toBe(true);
    expect(result.policy.allowedPaths.has(result.analysis.paths[0].canonicalKey)).toBe(true);
  });

  it('uses exact whole-object, numeric wildcard, and literal dotted-key canonical paths', async () => {
    const session = createTokenSession();
    const modelUid = 'canonical-path-semantics';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createFlowModel(modelUid, ['{{ctx.whole}}', '{{ctx.roles[0].name}}', '{{ctx.data["a.b"]}}']),
      },
    });
    const rd = session.rd(modelUid);

    const whole = await authorizeVariablesResolve(ctx, { rd, template: '{{ctx.whole}}' });
    const child = await authorizeVariablesResolve(ctx, { rd, template: '{{ctx.whole.id}}' });
    const otherIndex = await authorizeVariablesResolve(ctx, { rd, template: '{{ctx.roles[9].name}}' });
    const dottedKey = await authorizeVariablesResolve(ctx, { rd, template: '{{ctx.data["a.b"]}}' });
    const dottedPath = await authorizeVariablesResolve(ctx, { rd, template: '{{ctx.data.a.b}}' });

    expect([whole.allowed, child.allowed, otherIndex.allowed, dottedKey.allowed, dottedPath.allowed]).toEqual([
      true,
      false,
      true,
      true,
      false,
    ]);
  });

  it('lets configure roles bypass model paths but not server syntax restrictions', async () => {
    const ctx = createFakeCtx({ allowConfigure: true });

    const staticPath = await authorizeVariablesResolve(ctx, { template: '{{ctx.view.record.name}}' });
    const dynamicPath = await authorizeVariablesResolve(ctx, { template: '{{ctx.view.record[field]}}' });
    const method = await authorizeVariablesResolve(ctx, { template: '{{ctx.view.load()}}' });

    expect(staticPath.allowed).toBe(true);
    expect(staticPath.policy.allowAll).toBe(true);
    expect([dynamicPath.allowed, method.allowed]).toEqual([false, false]);
  });

  it('passes structured usage and grants registered model-free variables without rd', async () => {
    let receivedUsage: unknown;
    variables.register({
      name: 'external',
      scope: 'request',
      validateContextParams: ({ contextParams, usage }) => {
        receivedUsage = usage;
        contextParams.user = { collection: 'roles', filterByTk: 1 };
        return { allowed: true, contextParams, requireFlowModel: false };
      },
      attach: () => undefined,
    });

    const result = await authorizeVariablesResolve(createFakeCtx(), {
      template: '{{ctx.external.items[0].name}}',
    });
    const refs = receivedUsage as readonly VariablePathRef[];

    expect(result.allowed).toBe(true);
    expect(result.policy.unrestrictedVariables.has('external')).toBe(true);
    expect(refs[0].runtimeSegments).toEqual(['items', 0, 'name']);
    expect(refs[0]).toBe(result.analysis.usage.external[0]);
    expect(result.contextParams).not.toHaveProperty('user');
  });

  it('returns sanitized contextParams when a later validator denies the request', async () => {
    variables.register({
      name: 'mutator',
      scope: 'request',
      validateContextParams: ({ contextParams }) => {
        contextParams.user = { collection: 'roles', filterByTk: 1 };
        return { contextParams, requireFlowModel: false };
      },
      attach: () => undefined,
    });
    variables.register({
      name: 'denied',
      scope: 'request',
      validateContextParams: () => ({ allowed: false, requireFlowModel: false }),
      attach: () => undefined,
    });

    const result = await authorizeVariablesResolve(createFakeCtx(), {
      template: ['{{ctx.mutator.value}}', '{{ctx.denied.value}}'],
    });

    expect(result.allowed).toBe(false);
    expect(result.contextParams).not.toHaveProperty('user');
  });

  it('caches true role policies per request', async () => {
    const findRoles = vi.fn(async () => [{ allowConfigure: true }]);
    const ctx = createFakeCtx({ findRoles });

    const first = await authorizeVariablesResolve(ctx, { template: '{{ctx.unlisted.value}}' });
    const second = await authorizeVariablesResolve(ctx, { template: '{{ctx.unlisted.value}}' });

    expect(first.policy.allowAll).toBe(true);
    expect(second.allowed).toBe(true);
    expect(findRoles).toHaveBeenCalledTimes(1);
  });

  it('caches false role policies and both present and missing flow models per request', async () => {
    const session = createTokenSession();
    const modelUid = 'request-cache-model';
    const findRoles = vi.fn(async () => []);
    const findModelById = vi.fn(async (uid: string) =>
      uid === modelUid ? createFlowModel(modelUid, '{{ctx.user.id}}') : null,
    );
    const ctx = createFakeCtx({ findModelById, findRoles, token: session.token });
    const rd = session.rd(modelUid);
    const missingRd = session.rd('missing-model');

    await authorizeVariablesResolve(ctx, { rd, template: '{{ctx.user.id}}' });
    await authorizeVariablesResolve(ctx, { rd, template: '{{ctx.user.id}}' });
    await authorizeVariablesResolve(ctx, { rd: missingRd, template: '{{ctx.user.id}}' });
    await authorizeVariablesResolve(ctx, { rd: missingRd, template: '{{ctx.user.id}}' });

    expect(findRoles).toHaveBeenCalledTimes(1);
    expect(findModelById).toHaveBeenCalledTimes(2);
  });

  it('fails closed only around request template analysis', async () => {
    const findRoles = vi.fn(async () => []);
    const template = new Proxy(
      {},
      {
        ownKeys: () => {
          throw new TypeError('untrusted template');
        },
      },
    );

    const result = await authorizeVariablesResolve(createFakeCtx({ findRoles }), {
      template,
    });

    expect(result.allowed).toBe(false);
    expect(result.analysis).toBeUndefined();
    expect(findRoles).not.toHaveBeenCalled();
  });

  it('uses an empty allow-list when flow model analysis throws', async () => {
    const session = createTokenSession();
    const modelUid = 'throwing-model-analysis';
    const model = createFlowModel(modelUid, {});
    model.props = new Proxy(
      {},
      {
        ownKeys: () => {
          throw new TypeError('untrusted flow model');
        },
      },
    );
    const ctx = createFakeCtx({
      token: session.token,
      models: { [modelUid]: model },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: '{{ctx.user.id}}',
    });

    expect(result.allowed).toBe(false);
    expect(result.policy.allowedPaths.size).toBe(0);
  });

  it('does not hide role or flow model repository failures', async () => {
    const roleError = new Error('role repository unavailable');
    await expect(
      authorizeVariablesResolve(
        createFakeCtx({
          findRoles: async () => {
            throw roleError;
          },
        }),
        { template: '{{ctx.user.id}}' },
      ),
    ).rejects.toBe(roleError);

    const session = createTokenSession();
    const modelError = new Error('flow model repository unavailable');
    await expect(
      authorizeVariablesResolve(
        createFakeCtx({
          token: session.token,
          findModelById: async () => {
            throw modelError;
          },
        }),
        { rd: session.rd('unavailable-model'), template: '{{ctx.user.id}}' },
      ),
    ).rejects.toBe(modelError);
  });

  it('authorizes a record descriptor at a trusted prefix', async () => {
    const result = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
      template: '{{ ctx.view.record.name }}',
      contextParams: {
        'view.record': { collection: 'users', filterByTk: 1 },
      },
    });

    expect(result.allowed).toBe(true);
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toEqual([
      expect.objectContaining({ prefix: ['record'], relativePaths: [['name']], preferFullRecord: false }),
    ]);
    expect(result.contextParams).toEqual({});
  });

  it('allows a trusted record descriptor attached to the scalar leaf', async () => {
    const result = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
      template: '{{ ctx.view.record.name }}',
      contextParams: {
        'view.record.name': { collection: 'users', filterByTk: 1 },
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.contextParams).toEqual({});
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toEqual([
      expect.objectContaining({ prefix: ['record', 'name'], relativePaths: [[]], preferFullRecord: true }),
    ]);
  });

  it('strips malformed trusted descriptors without creating a binding', async () => {
    const result = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
      template: '{{ ctx.view.record.name }}',
      contextParams: {
        'view.record': { collection: 'users', fields: 'name', filterByTk: 1 },
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.contextParams).toEqual({});
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toEqual([]);
  });

  it.each([
    ['member', { currentRole: 'member' }],
    ['root', { currentRole: 'root' }],
    ['allowConfigure', { allowConfigure: true, currentRole: 'designer' }],
  ] as const)('keeps popup contracts strict only for the %s lane', async (_lane, roleOptions) => {
    const session = createTokenSession();
    const modelUid = `popup-slot-${_lane}`;
    const model = createFlowModel(modelUid, '{{ ctx.popup.record.roles.title }}');
    const request = {
      rd: session.rd(modelUid),
      template: '{{ ctx.popup.record.roles.title }}',
    };
    const options = { ...roleOptions, models: { [modelUid]: model }, token: session.token };
    const attack = await authorizeVariablesResolve(createFakeCtx(options), {
      ...request,
      contextParams: { 'popup.record.roles': { collection: 'roles', filterByTk: 'root' } },
    });
    const legal = await authorizeVariablesResolve(createFakeCtx(options), {
      ...request,
      contextParams: { 'popup.record': { collection: 'users', filterByTk: 1 } },
    });

    expect(attack.allowed).toBe(true);
    expect(attack.contextParams).toEqual({});
    expect(legal.allowed).toBe(true);
    if (!attack.allowed) return;
    expect(attack.bindingPlan.bindings).toHaveLength(_lane === 'member' ? 0 : 1);
  });

  it.each([
    ['dot', '{{ ctx.popup.record.roles.title }}', 'popup.record.roles'],
    ['static bracket', '{{ ctx["popup"]["record"]["roles"]["title"] }}', 'popup.record.roles'],
    ['numeric index', '{{ ctx.popup.record.roles[0].title }}', 'popup.record.roles.0'],
    ['dashed key', '{{ ctx.popup.record["role-list"].title }}', 'popup.record.role-list'],
  ])('allows a trusted descriptor at a %s path prefix', async (_syntax, template, movedSlot) => {
    const descriptor = { collection: 'roles', filterByTk: 'root' };
    const attack = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
      template,
      contextParams: { [movedSlot]: descriptor },
    });
    const legal = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
      template,
      contextParams: { 'popup.record': descriptor },
    });

    expect(attack.allowed).toBe(true);
    expect(legal.allowed).toBe(true);
  });

  it.each([
    ['member', { currentRole: 'member' }],
    ['root', { currentRole: 'root' }],
    ['allowConfigure', { allowConfigure: true, currentRole: 'designer' }],
  ] as const)('keeps Form association contracts strict only for the %s lane', async (_lane, roleOptions) => {
    const session = createTokenSession();
    const modelUid = `form-association-slot-${_lane}`;
    const model = createEditFormModel(modelUid, '{{ ctx.formValues.roles.title }}', ['roles']);
    const options = {
      ...roleOptions,
      fieldKinds: { roles: 'association' as const },
      models: { [modelUid]: model },
      token: session.token,
    };
    const request = {
      rd: session.rd(modelUid),
      template: '{{ ctx.formValues.roles.title }}',
    };
    const attack = await authorizeVariablesResolve(createFakeCtx(options), {
      ...request,
      contextParams: { formValues: { collection: 'users', filterByTk: 1 } },
    });
    const legal = await authorizeVariablesResolve(createFakeCtx(options), {
      ...request,
      contextParams: { 'formValues.roles': { collection: 'roles', filterByTk: 'root' } },
    });

    expect(attack.allowed).toBe(true);
    expect(legal.allowed).toBe(true);
    if (!attack.allowed) return;
    expect(attack.bindingPlan.bindings).toHaveLength(_lane === 'member' ? 0 : 1);
  });

  it('lets trusted roles use descriptors without a persisted slot policy', async () => {
    const descriptor = { collection: 'roles', filterByTk: 'root' };
    const unknown = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
      template: '{{ ctx.unregistered.record.name }}',
      contextParams: { 'unregistered.record': descriptor },
    });
    const dynamicWithoutRd = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
      template: '{{ ctx.formValues.roles.title }}',
      contextParams: { 'formValues.roles': descriptor },
    });

    expect(unknown.allowed).toBe(true);
    expect(dynamicWithoutRd.allowed).toBe(true);
    if (!unknown.allowed || !dynamicWithoutRd.allowed) return;
    expect(unknown.bindingPlan.bindings).toHaveLength(1);
    expect(dynamicWithoutRd.bindingPlan.bindings).toHaveLength(1);
  });

  it.each([
    ['root', { currentRole: 'root' }],
    ['allowConfigure', { allowConfigure: true, currentRole: 'designer' }],
  ] as const)('does not load FlowModel contracts for the %s trusted lane', async (_lane, roleOptions) => {
    const session = createTokenSession();
    const findModelById = vi.fn(async () => createFlowModel('unused', '{{ ctx.other.value }}'));
    const ctx = createFakeCtx({ ...roleOptions, findModelById, token: session.token });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd('unused'),
      template: '{{ ctx.dynamic.customer.name }}',
      contextParams: { 'dynamic.customer': { collection: 'users', filterByTk: 1 } },
    });

    expect(result.allowed).toBe(true);
    expect(findModelById).not.toHaveBeenCalled();
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toHaveLength(1);
  });

  it.each(['query.page', 'headers.authorization', 'locale', 'now', 'env.PUBLIC_VALUE', 'defineProperty.value'])(
    'rejects record descriptors on protected context roots: %s',
    async (path) => {
      const result = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
        template: `{{ ctx.${path} }}`,
        contextParams: {
          [path]: { collection: 'users', filterByTk: 1 },
        },
      });

      expect(result.allowed).toBe(false);
      expect(result.contextParams).toEqual({});
    },
  );

  it('rejects unsupported dynamic ctx paths for non-configure roles', async () => {
    const result = await authorizeVariablesResolve(createFakeCtx(), {
      template: { value: '{{ ctx[dynamicKey].record.id }}' },
    });

    expect(result.allowed).toBe(false);
    expect(result.analysis.supported).toBe(false);
    expect(result.policy.allowAll).toBe(false);
  });
});
