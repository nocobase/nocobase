/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { generateFlowModelRd } from '@nocobase/utils';
import { authorizeVariablesResolve } from '../variables/allow-list';
import { validatePopupContextParams, variables } from '../variables/registry';
import { resetVariablesRegistryForTest } from './test-utils';

type FakeCtxOptions = {
  currentRole?: string;
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
  const collection = {
    fields: { get: () => undefined },
    getField: () => undefined,
  };

  return {
    app: {
      acl: {
        getRole: () => ({
          getStrategy: () => ({ allowConfigure: false }),
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
              findModelById: async (uid: string) => models[uid] || null,
            },
          };
        }
        return collection;
      },
      getRepository: (name: string) => {
        if (name === 'roles') {
          return { find: async () => [] };
        }
        return {};
      },
    },
    get: (name: string) => headers[name.toLowerCase() as keyof typeof headers],
    state: {
      currentRole,
      currentRoles: [currentRole],
    },
  } as any;
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

  it('keeps strict source validation for ordinary record contextParams', async () => {
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
        'view.record': { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' },
      },
    });

    expect(result.allowed).toBe(false);
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

  it('lets official popup record contextParams skip static source matching', async () => {
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

  it('does not mark non-official popup record context keys for source skip', () => {
    const result = validatePopupContextParams({
      recordEntries: [
        {
          contextKey: 'popup.parent.record',
          params: { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' },
        },
        {
          contextKey: 'popup.custom',
          params: { dataSourceKey: 'main', collection: 'roles', filterByTk: 'root' },
        },
      ],
    });

    expect(result.allowed).toBe(true);
    expect(result.skipSourceValidationContextKeys).toEqual(['popup.parent.record']);
  });

  it('rebuilds record entries when custom validators mutate contextParams in place', async () => {
    variables.register({
      name: 'evil',
      scope: 'request',
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

    expect(result.allowed).toBe(false);
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

  it('rejects unsupported dynamic ctx paths for non-configure roles', async () => {
    const result = await authorizeVariablesResolve(createFakeCtx(), {
      template: { value: '{{ ctx[dynamicKey].record.id }}' },
    });

    expect(result.allowed).toBe(false);
  });
});
