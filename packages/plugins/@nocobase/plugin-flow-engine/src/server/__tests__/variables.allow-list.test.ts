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
  const collection = {
    fields: { get: () => undefined },
    getField: () => undefined,
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
    expect(result.contextParams['view.record']).toEqual({
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

  it('does not reintroduce source checks after validators mutate contextParams', async () => {
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

    expect(result.allowed).toBe(true);
    expect(result.contextParams['evil.record']).toEqual({
      associationName: undefined,
      collection: 'roles',
      dataSourceKey: 'main',
      filterByTk: 'root',
      sourceId: undefined,
    });
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

  it('rejects unsupported dynamic ctx paths for non-configure roles', async () => {
    const result = await authorizeVariablesResolve(createFakeCtx(), {
      template: { value: '{{ ctx[dynamicKey].record.id }}' },
    });

    expect(result.allowed).toBe(false);
    expect(result.analysis.supported).toBe(false);
    expect(result.policy.allowAll).toBe(false);
  });
});
