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
import { createFormItemRecordSlotResolvers } from '../variables/form-item-record-slot-resolvers';
import { createBuiltInRecordSlotResolvers } from '../variables/record-slot-policy';
import { createNestedRecordSlotResolver, getRecordSlotResolverRegistry } from '../variables/record-slot-resolvers';
import { variables } from '../variables/registry';
import {
  MAX_FLOW_MODEL_VARIABLE_SOURCE_NODES,
  MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH,
} from '../variables/runjs-variable-dependencies';
import { resetVariablesRegistryForTest } from './test-utils';

type FakeCtxOptions = {
  allowConfigure?: boolean;
  currentRole?: string;
  fieldKinds?: Record<string, 'association' | 'field'>;
  findModelNodeSnapshotById?: (uid: string) => Promise<unknown>;
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
        target: `${name}Target`,
        targetCollection: { dataSourceKey: 'main', name: `${name}Target` },
      },
    ]),
  );
  const collection = {
    fields: { get: (name: string) => fields[name] },
    getField: (name: string) => fields[name],
  };

  const ctx = {
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
              findModelNodeSnapshotById:
                options.findModelNodeSnapshotById || (async (uid: string) => models[uid] || null),
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
  const registry = getRecordSlotResolverRegistry(ctx.app);
  [...createBuiltInRecordSlotResolvers(), ...createFormItemRecordSlotResolvers()].forEach((resolver) =>
    registry.register(resolver),
  );
  return ctx;
}

function createFlowModel(uid: string, template: unknown) {
  return {
    uid,
    options: {
      use: 'DetailsBlockModel',
      stepParams: {
        resourceSettings: {
          init: { dataSourceKey: 'main', collectionName: 'users' },
        },
      },
      props: template,
    },
    parentId: null,
    subKey: null,
    async: false,
  };
}

function createJsBlockModel(uid: string, code: string) {
  return {
    uid,
    options: {
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: { code, version: 'v2' },
        },
      },
    },
    parentId: null,
    subKey: null,
    async: false,
  };
}

function createEditFormModel(uid: string, template: unknown, configuredFields: string[]) {
  return {
    uid,
    options: {
      use: 'EditFormModel',
      stepParams: {
        resourceSettings: {
          init: { dataSourceKey: 'main', collectionName: 'users' },
        },
      },
      subModels: {
        grid: {
          subModels: {
            items: configuredFields.map((fieldPath, index) => ({
              uid: `${uid}-field-${index}`,
              stepParams: {
                fieldSettings: {
                  init: { collectionName: 'users', dataSourceKey: 'main', fieldPath },
                },
              },
            })),
          },
        },
      },
      props: template,
    },
    parentId: null,
    subKey: null,
    async: false,
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

  it('keeps runtime record sources out of path authorization and preserves exact-slot targets', async () => {
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
    expect(result.bindingPlan.bindings).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({
          associationName: 'users.roles',
          collection: 'roles',
          dataSourceKey: 'secondary',
          filterByTk: ['root'],
          sourceId: 9,
        }),
        prefix: ['record'],
      }),
    ]);
    expect(result.contextParams).toEqual({});
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

  it('binds persisted Form descriptors while stripping moved and unrelated descriptors', async () => {
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
        'formValues.department': { collection: 'roles', filterByTk: 2 },
        'unrelated.record': { collection: 'roles', filterByTk: 3 },
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.contextParams).toEqual({});
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({ collection: 'users', filterByTk: 1 }),
        prefix: [],
      }),
      expect.objectContaining({
        params: expect.objectContaining({ collection: 'roles', filterByTk: 2 }),
        prefix: ['department'],
      }),
    ]);
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

  it('recursively collects paths from the current node options while ignoring unsupported expressions', async () => {
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

  it('authorizes a persisted RunJS ctx.getVar path for an ordinary role', async () => {
    const session = createTokenSession();
    const modelUid = 'runjs-get-var-path';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createJsBlockModel(
          modelUid,
          `const roleName = await ctx.getVar('ctx.popup.record.name'); ctx.render(roleName);`,
        ),
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: '{{ ctx.popup.record.name }}',
      contextParams: {
        'popup.record': { dataSourceKey: 'main', collection: 'roles', filterByTk: 'member' },
      },
    });

    expect(result.allowed).toBe(true);
    if (!result.allowed) return;
    expect(result.policy.allowedPaths.has(result.analysis.paths[0].canonicalKey)).toBe(true);
    expect(result.bindingPlan.bindings).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({ collection: 'roles', filterByTk: 'member' }),
        prefix: ['record'],
      }),
    ]);
  });

  it.each([
    ['dynamic argument', `const path = 'ctx.popup.record.name'; await ctx.getVar(path);`],
    ['shadowed ctx', `(ctx) => ctx.getVar('ctx.popup.record.name');`],
    ['plain string', `const text = "ctx.getVar('ctx.popup.record.name')";`],
    ['multiple paths', `await ctx.getVar('ctx.user.id || ctx.popup.record.name');`],
    ['placeholder injection', `await ctx.getVar('ctx.user.id }} {{ ctx.popup.record.name');`],
    ['ctx rewrite', `ctx.getVar = () => {}; ctx.getVar('ctx.popup.record.name');`],
    [
      'indirect ctx rewrite',
      `Object.defineProperty(ctx, 'getVar', { value: () => {} }); ctx.getVar('ctx.popup.record.name');`,
    ],
    ['ctx alias rewrite', `const alias = ctx; alias.getVar = () => {}; ctx.getVar('ctx.popup.record.name');`],
    [
      'destructured ctx alias rewrite',
      `const [alias] = [ctx]; alias.getVar = () => {}; ctx.getVar('ctx.popup.record.name');`,
    ],
    [
      'constructor ctx escape',
      `class Mutator { constructor(target) { target.getVar = () => {}; } } new Mutator(ctx); ctx.getVar('ctx.popup.record.name');`,
    ],
    ['dynamic with scope', `with ({ ctx: { getVar() {} } }) ctx.getVar('ctx.popup.record.name');`],
    ['later ctx parameter', `function f(value = ctx.getVar('ctx.popup.record.name'), ctx) {}`],
  ])('does not authorize persisted RunJS with a %s', async (_title, code) => {
    const session = createTokenSession();
    const modelUid = `runjs-denied-${Buffer.from(code).toString('hex').slice(0, 12)}`;
    const ctx = createFakeCtx({
      token: session.token,
      models: { [modelUid]: createJsBlockModel(modelUid, code) },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: '{{ ctx.popup.record.name }}',
      contextParams: {
        'popup.record': { dataSourceKey: 'main', collection: 'roles', filterByTk: 'member' },
      },
    });

    expect(result.allowed).toBe(false);
  });

  it('does not authorize Handlebars-looking text inside v2 RunJS code', async () => {
    const session = createTokenSession();
    const modelUid = 'runjs-v2-template-text';
    const ctx = createFakeCtx({
      token: session.token,
      models: {
        [modelUid]: createJsBlockModel(
          modelUid,
          `// {{ ctx.user.password }}\nconst marker = '{{ ctx.popup.record.name }}';`,
        ),
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: '{{ ctx.popup.record.name }}',
      contextParams: {
        'popup.record': { dataSourceKey: 'main', collection: 'roles', filterByTk: 'member' },
      },
    });

    expect(result.allowed).toBe(false);
  });

  it('does not authorize Handlebars-looking comments inside v1 RunJS code', async () => {
    const session = createTokenSession();
    const modelUid = 'runjs-v1-comment-text';
    const model = createJsBlockModel(modelUid, `// {{ ctx.popup.record.name }}\nreturn 1;`);
    model.options.stepParams.jsSettings.runJs.version = 'v1';
    const ctx = createFakeCtx({ token: session.token, models: { [modelUid]: model } });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: '{{ ctx.popup.record.name }}',
      contextParams: {
        'popup.record': { dataSourceKey: 'main', collection: 'roles', filterByTk: 'member' },
      },
    });

    expect(result.allowed).toBe(false);
  });

  it('does not treat an unrelated code/version object as persisted RunJS', async () => {
    const session = createTokenSession();
    const modelUid = 'unrelated-code-object';
    const model = createFlowModel(modelUid, {});
    Object.defineProperty(model, 'options', {
      value: {
        metadata: {
          code: `await ctx.getVar('ctx.popup.record.name');`,
          version: 'v2',
        },
      },
    });
    const ctx = createFakeCtx({ token: session.token, models: { [modelUid]: model } });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: '{{ ctx.popup.record.name }}',
      contextParams: {
        'popup.record': { dataSourceKey: 'main', collection: 'roles', filterByTk: 'member' },
      },
    });

    expect(result.allowed).toBe(false);
  });

  it('isolates parent, child, sibling, and async node allow-lists', async () => {
    const session = createTokenSession();
    const parent = createFlowModel('scope-parent', '{{ ctx.parentOnly }}');
    const child = { ...createFlowModel('scope-child', '{{ ctx.childOnly }}'), parentId: parent.uid };
    const sibling = { ...createFlowModel('scope-sibling', '{{ ctx.siblingOnly }}'), parentId: parent.uid };
    const asyncChild = {
      ...createFlowModel('scope-async-child', '{{ ctx.asyncOnly }}'),
      parentId: parent.uid,
      async: true,
    };
    const ctx = createFakeCtx({
      models: Object.fromEntries([parent, child, sibling, asyncChild].map((model) => [model.uid, model])),
      token: session.token,
    });

    for (const [uid, ownPath, foreignPath] of [
      [parent.uid, 'parentOnly', 'childOnly'],
      [child.uid, 'childOnly', 'parentOnly'],
      [sibling.uid, 'siblingOnly', 'childOnly'],
      [asyncChild.uid, 'asyncOnly', 'parentOnly'],
    ]) {
      const rd = session.rd(uid);
      const own = await authorizeVariablesResolve(ctx, { rd, template: `{{ ctx.${ownPath} }}` });
      const foreign = await authorizeVariablesResolve(ctx, { rd, template: `{{ ctx.${foreignPath} }}` });
      expect([own.allowed, foreign.allowed]).toEqual([true, false]);
    }
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
    const findModelNodeSnapshotById = vi.fn(async (uid: string) =>
      uid === modelUid ? createFlowModel(modelUid, '{{ctx.user.id}}') : null,
    );
    const ctx = createFakeCtx({ findModelNodeSnapshotById, findRoles, token: session.token });
    const rd = session.rd(modelUid);
    const missingRd = session.rd('missing-model');

    await authorizeVariablesResolve(ctx, { rd, template: '{{ctx.user.id}}' });
    await authorizeVariablesResolve(ctx, { rd, template: '{{ctx.user.id}}' });
    await authorizeVariablesResolve(ctx, { rd: missingRd, template: '{{ctx.user.id}}' });
    await authorizeVariablesResolve(ctx, { rd: missingRd, template: '{{ctx.user.id}}' });

    expect(findRoles).toHaveBeenCalledTimes(1);
    expect(findModelNodeSnapshotById).toHaveBeenCalledTimes(2);
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
    Object.defineProperty(model, 'options', {
      value: new Proxy(
        {},
        {
          ownKeys: () => {
            throw new TypeError('untrusted flow model');
          },
        },
      ),
    });
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

  it('uses an empty allow-list when flow model options exceed the preparation limit', async () => {
    const session = createTokenSession();
    const modelUid = 'oversized-model-options';
    const model = createFlowModel(modelUid, '{{ ctx.user.id }}');
    Object.defineProperty(model, 'options', {
      value: {
        allowed: '{{ ctx.user.id }}',
        ...Object.fromEntries(
          Array.from({ length: MAX_FLOW_MODEL_VARIABLE_SOURCE_NODES }, (_, index) => [`node${index}`, index]),
        ),
      },
    });
    const ctx = createFakeCtx({ token: session.token, models: { [modelUid]: model } });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: '{{ ctx.user.id }}',
    });

    expect(result.allowed).toBe(false);
    expect(result.policy.allowedPaths.size).toBe(0);
  });

  it('uses an empty allow-list when flow model text exceeds the preparation limit', async () => {
    const session = createTokenSession();
    const modelUid = 'oversized-model-text';
    const model = createFlowModel(modelUid, '{{ ctx.user.id }}');
    Object.defineProperty(model, 'options', {
      value: {
        allowed: '{{ ctx.user.id }}',
        oversized: 'x'.repeat(MAX_FLOW_MODEL_VARIABLE_STRING_LENGTH + 1),
      },
    });
    const ctx = createFakeCtx({ token: session.token, models: { [modelUid]: model } });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: '{{ ctx.user.id }}',
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
          findModelNodeSnapshotById: async () => {
            throw modelError;
          },
        }),
        { rd: session.rd('unavailable-model'), template: '{{ctx.user.id}}' },
      ),
    ).rejects.toBe(modelError);
  });

  it('binds a root descriptor by exact slot without rewriting its target', async () => {
    const result = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
      template: '{{ ctx.view.record.name }}',
      contextParams: {
        'view.record': { collection: 'users', filterByTk: 1 },
      },
    });

    expect(result.allowed).toBe(true);
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toEqual([
      expect.objectContaining({ params: expect.objectContaining({ collection: 'users', filterByTk: 1 }) }),
    ]);
    expect(result.contextParams).toEqual({});
  });

  it.each(['record', 'responseRecord', 'clickedRowRecord'] as const)(
    'keeps the direct %s descriptor at the exact root Slot without rd or resource metadata',
    async (varName) => {
      const descriptor = { collection: 'users', filterByTk: 1 };
      const template = `{{ ctx.${varName}.name }}`;
      const legal = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
        template,
        contextParams: { [varName]: descriptor },
      });
      const moved = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
        template,
        contextParams: { [`${varName}.name`]: descriptor },
      });

      expect(legal.allowed).toBe(true);
      expect(moved.allowed).toBe(true);
      if (!legal.allowed || !moved.allowed) return;
      expect(legal.bindingPlan.bindings).toEqual([
        expect.objectContaining({ params: expect.objectContaining(descriptor), prefix: [] }),
      ]);
      expect(legal.contextParams).toEqual({});
      expect(moved.bindingPlan.bindings).toEqual([]);
      expect(moved.contextParams).toEqual({});
    },
  );

  it('does not let root move a descriptor to a scalar leaf', async () => {
    const result = await authorizeVariablesResolve(createFakeCtx({ currentRole: 'root' }), {
      template: '{{ ctx.view.record.name }}',
      contextParams: {
        'view.record.name': { collection: 'users', filterByTk: 1 },
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.contextParams).toEqual({});
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toEqual([]);
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
  ] as const)(
    'keeps popup exact Slot strict while accepting its dynamic target in the %s lane',
    async (_lane, roleOptions) => {
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
      expect(attack.bindingPlan.bindings).toHaveLength(0);
      if (!legal.allowed) return;
      expect(legal.bindingPlan.bindings).toEqual([
        expect.objectContaining({ params: expect.objectContaining({ collection: 'users', filterByTk: 1 }) }),
      ]);
    },
  );

  it.each([
    ['dot', '{{ ctx.popup.record.roles.title }}', 'popup.record.roles'],
    ['static bracket', '{{ ctx["popup"]["record"]["roles"]["title"] }}', 'popup.record.roles'],
    ['numeric index', '{{ ctx.popup.record.roles[0].title }}', 'popup.record.roles.0'],
    ['dashed key', '{{ ctx.popup.record["role-list"].title }}', 'popup.record.role-list'],
  ])('does not let root move a descriptor to a %s path prefix', async (_syntax, template, movedSlot) => {
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
    if (!attack.allowed || !legal.allowed) return;
    expect(attack.bindingPlan.bindings).toEqual([]);
    expect(legal.bindingPlan.bindings).toEqual([
      expect.objectContaining({ params: expect.objectContaining(descriptor), prefix: ['record'] }),
    ]);
  });

  it.each([
    ['member', { currentRole: 'member' }],
    ['root', { currentRole: 'root' }],
    ['allowConfigure', { allowConfigure: true, currentRole: 'designer' }],
  ] as const)('uses the persisted Form exact Slot with a dynamic target in the %s lane', async (_lane, roleOptions) => {
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
    expect(attack.bindingPlan.bindings).toHaveLength(0);
    if (!legal.allowed) return;
    expect(legal.bindingPlan.bindings).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({ collection: 'roles', filterByTk: 'root' }),
        prefix: ['roles'],
      }),
    ]);
  });

  it('strips root descriptors without a registered Slot policy', async () => {
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
    expect(unknown.bindingPlan.bindings).toHaveLength(0);
    expect(dynamicWithoutRd.bindingPlan.bindings).toHaveLength(0);
  });

  it.each([
    ['root', { currentRole: 'root' }],
    ['allowConfigure', { allowConfigure: true, currentRole: 'designer' }],
  ] as const)('loads the current node for exact Slot resolution in the %s lane', async (_lane, roleOptions) => {
    const session = createTokenSession();
    const findModelNodeSnapshotById = vi.fn(async () => createFlowModel('unused', '{{ ctx.other.value }}'));
    const ctx = createFakeCtx({ ...roleOptions, findModelNodeSnapshotById, token: session.token });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd('unused'),
      template: '{{ ctx.dynamic.customer.name }}',
      contextParams: { 'dynamic.customer': { collection: 'users', filterByTk: 1 } },
    });

    expect(result.allowed).toBe(true);
    expect(findModelNodeSnapshotById).toHaveBeenCalledOnce();
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toHaveLength(0);
  });

  it.each([
    ['member', { currentRole: 'member' }],
    ['root', { currentRole: 'root' }],
    ['allowConfigure', { allowConfigure: true, currentRole: 'designer' }],
  ] as const)('uses the same registered exact Slot and dynamic target in the %s lane', async (_lane, roleOptions) => {
    const session = createTokenSession();
    const modelUid = `registered-backend-${_lane}`;
    const ctx = createFakeCtx({
      ...roleOptions,
      models: { [modelUid]: createFlowModel(modelUid, '{{ ctx.backend.record.name }}') },
      token: session.token,
    });
    getRecordSlotResolverRegistry(ctx.app).register(
      createNestedRecordSlotResolver({
        owner: 'test',
        id: `backend-${_lane}`,
        varName: 'backend',
      }),
    );

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(modelUid),
      template: '{{ ctx.backend.record.name }}',
      contextParams: { 'backend.record': { collection: 'roles', dataSourceKey: 'secondary', filterByTk: 1 } },
    });

    expect(result.allowed).toBe(true);
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({ collection: 'roles', dataSourceKey: 'secondary', filterByTk: 1 }),
        prefix: ['record'],
        relativePaths: [['name']],
      }),
    ]);
  });

  it('loads ancestors only for an opt-in resolver without adding their paths', async () => {
    const session = createTokenSession();
    const parent = {
      ...createFlowModel('ancestor-parent', '{{ ctx.parentOnly }}'),
      options: { provider: true, props: '{{ ctx.parentOnly }}' },
    };
    const child = { ...createFlowModel('ancestor-child', '{{ ctx.backend.record.name }}'), parentId: parent.uid };
    const findModelNodeSnapshotById = vi.fn(async (uid: string) =>
      uid === parent.uid ? parent : uid === child.uid ? child : null,
    );
    const ctx = createFakeCtx({ findModelNodeSnapshotById, token: session.token });
    getRecordSlotResolverRegistry(ctx.app).register({
      owner: 'test',
      id: 'ancestor-provider',
      needsAncestors: true,
      match: (path) => path.varName === 'backend',
      resolve: async ({ loadAncestors }) => {
        const ancestors = await loadAncestors?.();
        return ancestors?.some((node) => (node as { options?: { provider?: boolean } }).options?.provider === true)
          ? {
              status: 'resolved',
              slot: ['record'],
            }
          : { status: 'abstain' };
      },
    });
    const rd = session.rd(child.uid);

    const backend = await authorizeVariablesResolve(ctx, {
      rd,
      template: '{{ ctx.backend.record.name }}',
      contextParams: { 'backend.record': { collection: 'roles', filterByTk: 1 } },
    });
    const parentPath = await authorizeVariablesResolve(ctx, { rd, template: '{{ ctx.parentOnly }}' });

    expect(backend.allowed).toBe(true);
    if (!backend.allowed) return;
    expect(backend.bindingPlan.bindings).toHaveLength(1);
    expect(parentPath.allowed).toBe(false);
    expect(findModelNodeSnapshotById.mock.calls.map(([uid]) => uid)).toEqual([child.uid, parent.uid]);
  });

  it.each([
    [
      'cyclic',
      () => {
        const child = { ...createFlowModel('cycle-child', '{{ ctx.backend.record.name }}'), parentId: 'cycle-parent' };
        const parent = { ...createFlowModel('cycle-parent', {}), parentId: child.uid };
        return { current: child, models: { [child.uid]: child, [parent.uid]: parent } };
      },
    ],
    [
      'over-deep',
      () => {
        const nodes = Array.from({ length: 66 }, (_, index) => ({
          ...createFlowModel(`deep-${index}`, index === 0 ? '{{ ctx.backend.record.name }}' : {}),
          parentId: index < 65 ? `deep-${index + 1}` : null,
        }));
        return { current: nodes[0], models: Object.fromEntries(nodes.map((node) => [node.uid, node])) };
      },
    ],
  ] as const)('fails closed for a %s ancestor chain', async (_case, createModels) => {
    const session = createTokenSession();
    const { current, models } = createModels();
    const ctx = createFakeCtx({ models, token: session.token });
    getRecordSlotResolverRegistry(ctx.app).register({
      owner: 'test',
      id: `ancestor-${_case}`,
      needsAncestors: true,
      match: (path) => path.varName === 'backend',
      resolve: async ({ loadAncestors }) => {
        await loadAncestors?.();
        return {
          status: 'resolved',
          slot: ['record'],
        };
      },
    });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(current.uid),
      template: '{{ ctx.backend.record.name }}',
      contextParams: { 'backend.record': { collection: 'users', filterByTk: 1 } },
    });

    expect(result.allowed).toBe(true);
    if (!result.allowed) return;
    expect(result.bindingPlan.bindings).toEqual([]);
    expect(result.contextParams).toEqual({});
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
