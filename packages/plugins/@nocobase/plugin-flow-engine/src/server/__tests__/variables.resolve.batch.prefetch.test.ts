/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import type { ResourcerContext } from '@nocobase/resourcer';
import { generateFlowModelRd } from '@nocobase/utils';
import { createFlowEngineMockServer, resetVariablesRegistryForTest } from './test-utils';
import * as variableExpression from '../template/variable-expression';
import type { AuthorizedRecordBinding } from '../variables/record-bindings';
import { projectRecord } from '../variables/record-projection';
import { fetchRecordWithRequestCache } from '../variables/records';
import { resolveVariablesTemplate } from '../variables/resolve';
import { createNestedRecordSlotResolver, getRecordSlotResolverRegistry } from '../variables/record-slot-resolvers';
import { prefetchRecordsForResolve } from '../variables/utils';
import FlowModelRepository from '../repository';

describe('variables:resolve batch prefetch merges selects (integration)', () => {
  let app: MockServer;
  beforeAll(() => {
    resetVariablesRegistryForTest();
  });

  const execResolve = async (values: any, userId?: number, options: { currentRole?: string; token?: string } = {}) => {
    const action = app.resourceManager.getAction('variables', 'resolve').clone();
    const currentRole = options.currentRole || (userId ? 'root' : undefined);
    const ctx: any = {
      app,
      db: app.db,
      headers: options.token ? { authorization: `Bearer ${options.token}` } : {},
      request: { method: 'POST', path: '/api/variables:resolve', query: {}, body: values },
      auth: userId ? { user: { id: userId }, role: currentRole } : {},
      state: currentRole ? { currentRole, currentRoles: [currentRole] } : {},
      getCurrentLocale: () => 'en-US',
    };
    ctx.get = (name: string) => ctx.headers?.[name] || ctx.headers?.[name?.toLowerCase?.()] || undefined;
    ctx.throw = (status: number, body: any) => {
      throw { status, body };
    };
    action.mergeParams({ values });
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
    const signInTime = `variables-resolve-prefetch-${userId}`;
    const payload = Buffer.from(JSON.stringify({ userId, signInTime })).toString('base64url');
    return {
      rd: (flowModelUid: string) => generateFlowModelRd(flowModelUid, `${userId}:${signInTime}`),
      token: `test.${payload}.sig`,
    };
  };

  const insertFlowModel = async (model: Record<string, unknown>) => {
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel(model);
  };

  beforeAll(async () => {
    app = await createFlowEngineMockServer({
      plugins: ['error-handler', 'auth', 'users', 'acl', 'data-source-manager', 'field-sort', 'flow-engine'],
    });
  });

  afterAll(async () => {
    await app?.destroy();
  });

  it('merges fields/appends for same record and hits DB only once', async () => {
    // patch users repository to count findOne calls
    const ds: any = app.dataSourceManager.get('main');
    const cm = ds.collectionManager;
    const db = cm.db;
    const originalGetRepository = db.getRepository.bind(db);
    const analyze = vi.spyOn(variableExpression, 'analyzeVariableTemplate');
    const dispose = getRecordSlotResolverRegistry(app).register(
      createNestedRecordSlotResolver({
        owner: 'test',
        id: 'batch-backend',
        varName: 'backend',
      }),
    );
    let calls = 0;
    (db as any).getRepository = (collection: string) => {
      const repo = originalGetRepository(collection);
      if (collection === 'users') {
        const originalFindOne = repo.findOne.bind(repo);
        repo.findOne = async (opts: any) => {
          calls += 1;
          return await originalFindOne(opts);
        };
      }
      return repo;
    };

    try {
      const payload = {
        batch: [
          {
            id: 't1',
            template: { a: '{{ ctx.backend.record.id }}' },
            contextParams: { 'backend.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } },
          },
          {
            id: 't2',
            template: { b: '{{ ctx.backend.record.roles[0].name }}' },
            contextParams: { 'backend.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } },
          },
        ],
      };

      const res = await execResolve(payload, 1);
      const results = res.body?.results || [];
      const r1 = results.find((r: any) => r.id === 't1');
      const r2 = results.find((r: any) => r.id === 't2');
      expect(r1?.data?.a).toBe(1);
      expect(typeof r2?.data?.b).toBe('string');
      expect((r2?.data?.b || '').length).toBeGreaterThan(0);

      // ensure only one DB call for users collection due to prefetch merge
      expect(calls).toBe(1);
      expect(analyze).toHaveBeenCalledTimes(2);
    } finally {
      analyze.mockRestore();
      dispose();
      db.getRepository = originalGetRepository;
    }
  });

  it('prefetches an association target once and shares its target metadata and cache with the getter', async () => {
    const relationCalls: Array<{ options: Record<string, unknown>; sourceId: number }> = [];
    let baseCalls = 0;
    const targetCollection = {
      name: 'roles',
      filterTargetKey: 'name',
      model: {
        primaryKeyAttribute: 'name',
        rawAttributes: { name: {}, title: {} },
        associations: {},
      },
    };
    const createRelationRepository = (sourceId: number) => ({
      collection: targetCollection,
      targetCollection,
      find: async (options: Record<string, unknown>) => {
        relationCalls.push({ options, sourceId });
        return [{ name: sourceId === 1 ? 'root' : 'member', title: 'Role' }];
      },
      findOne: async (options: Record<string, unknown>) => {
        relationCalls.push({ options, sourceId });
        return { name: sourceId === 1 ? 'root' : 'member', title: 'Role' };
      },
    });
    const relationRepositories = new Map([
      [1, createRelationRepository(1)],
      [2, createRelationRepository(2)],
    ]);
    const baseRepository = {
      collection: { ...targetCollection, name: 'users' },
      find: async () => {
        baseCalls += 1;
        return [];
      },
      findOne: async () => {
        baseCalls += 1;
        return undefined;
      },
    };
    const context = {
      app: {
        dataSourceManager: {
          get: () => ({
            collectionManager: {
              db: {
                getCollection: (name: string) => (name === 'roles' ? targetCollection : baseRepository.collection),
                getRepository: (name: string, sourceId?: unknown) =>
                  name === 'users.roles' && typeof sourceId === 'number'
                    ? relationRepositories.get(sourceId)
                    : baseRepository,
              },
            },
          }),
        },
        environment: { getVariables: () => ({}) },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      state: {},
    } as unknown as ResourcerContext;
    const dispose = getRecordSlotResolverRegistry(context.app).register(
      createNestedRecordSlotResolver({
        owner: 'test',
        id: 'backend-role',
        varName: 'backend',
      }),
    );

    const result = await resolveVariablesTemplate(
      context,
      { role: '{{ ctx.backend.record.name }}' },
      {
        'backend.record': {
          associationName: 'users.roles',
          collection: 'roles',
          filterByTk: 'root',
          sourceId: 1,
        },
      },
    );

    expect(result.role).toBe('root');
    const second = await resolveVariablesTemplate(
      context,
      { role: '{{ ctx.backend.record.name }}' },
      {
        'backend.record': {
          associationName: 'users.roles',
          collection: 'roles',
          filterByTk: 'member',
          sourceId: 2,
        },
      },
    );

    expect(second.role).toBe('member');
    expect(baseCalls).toBe(0);
    expect(relationCalls).toHaveLength(2);
    expect(relationCalls.map((call) => call.sourceId)).toEqual([1, 2]);
    expect(relationCalls[0].options.fields).toEqual(['name']);
    dispose();
  });

  it('keeps association collection validation independent of prefetch order', async () => {
    const run = async (collections: string[]) => {
      const calls: unknown[] = [];
      const targetCollection = {
        name: 'roles',
        filterTargetKey: 'name',
        model: { primaryKeyAttribute: 'name', rawAttributes: { name: {} }, associations: {} },
      };
      const context = {
        app: {
          dataSourceManager: {
            get: () => ({
              collectionManager: {
                db: {
                  getCollection: () => targetCollection,
                  getRepository: () => ({
                    collection: targetCollection,
                    targetCollection,
                    findOne: async (options: unknown) => {
                      calls.push(options);
                      return { name: 'root' };
                    },
                  }),
                },
              },
            }),
          },
          logger: { child: () => ({ debug: vi.fn() }) },
        },
        state: {},
      } as unknown as ResourcerContext;
      const binding = (collection: string): AuthorizedRecordBinding => ({
        contextKey: 'view.record',
        contextLocation: ['view.record'],
        params: {
          associationName: 'users.roles',
          collection,
          filterByTk: collection === 'secrets' ? 'secret' : 'root',
          sourceId: 1,
        },
        prefix: ['record'],
        preferFullRecord: false,
        relativePaths: [['name']],
        varName: 'view',
      });

      await prefetchRecordsForResolve(context, collections.map(binding));
      return calls;
    };

    await expect(run(['users', 'secrets'])).resolves.toEqual([
      { appends: undefined, context: expect.anything(), fields: ['name'], filterByTk: 'root' },
    ]);
    await expect(run(['secrets', 'users'])).resolves.toEqual([
      { appends: undefined, context: expect.anything(), fields: ['name'], filterByTk: 'root' },
    ]);
  });

  it('reuses a wide prefetch entry for a later strict batch group', async () => {
    const raw = { email: 'root@example.test', id: 1, name: 'Root' };
    const findOne = vi.fn(async () => raw);
    const collection = {
      filterTargetKey: 'id',
      model: {
        associations: {},
        primaryKeyAttribute: 'id',
        rawAttributes: { email: {}, id: {}, name: {} },
      },
      name: 'users',
    };
    const context = {
      app: {
        dataSourceManager: {
          get: () => ({
            collectionManager: {
              db: {
                getCollection: () => collection,
                getRepository: () => ({ collection, findOne }),
              },
            },
          }),
        },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      state: {},
    } as unknown as ResourcerContext;
    const binding = (relativePaths: readonly (readonly string[])[], fields?: string[]): AuthorizedRecordBinding => ({
      contextKey: 'view.record',
      contextLocation: ['view.record'],
      params: { collection: 'users', fields, filterByTk: 1 },
      prefix: ['record'],
      preferFullRecord: false,
      relativePaths,
      varName: 'view',
    });

    await prefetchRecordsForResolve(context, [binding([['email'], ['id']]), binding([['id']], ['id'])]);
    const strict = await fetchRecordWithRequestCache(
      context,
      { collection: 'users', fields: ['id'], filterByTk: 1 },
      ['id'],
      undefined,
      true,
    );

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      appends: undefined,
      fields: ['email', 'id'],
      filterByTk: 1,
      context,
    });
    expect(strict).toBe(raw);
    expect(projectRecord(strict, [['id']])).toEqual({ id: 1 });
  });

  it('strips moved leaf and protected-root descriptors before querying records', async () => {
    const repository = app.db.getRepository('users');
    const findOne = vi.spyOn(repository, 'findOne');

    try {
      const leafTemplate = { value: '{{ ctx.view.record.name }}' };
      const single = await execResolve(
        {
          template: leafTemplate,
          contextParams: { 'view.record.name': { collection: 'users', filterByTk: 1 } },
        },
        1,
      );
      expect(single.body).toEqual(leafTemplate);

      const protectedTemplates = [
        { id: 'query', path: 'query.page' },
        { id: 'headers', path: 'headers.authorization' },
        { id: 'internal', path: 'defineProperty.value' },
        { descriptorPath: 'view.then.record', id: 'nested-internal', path: 'view.then.record.name' },
      ];
      const batch = await execResolve(
        {
          batch: protectedTemplates.map(({ id, path, descriptorPath = path }) => ({
            id,
            template: { value: `{{ ctx.${path} }}` },
            contextParams: { [descriptorPath]: { collection: 'users', filterByTk: 1 } },
          })),
        },
        1,
      );

      expect(batch.body.results).toEqual(
        protectedTemplates.map(({ id, path }) => ({ id, data: { value: `{{ ctx.${path} }}` } })),
      );
      expect(findOne).not.toHaveBeenCalled();
    } finally {
      findOne.mockRestore();
    }
  });

  it('keeps a moved-slot attack out of prefetch while resolving its legal sibling', async () => {
    const session = createTokenSession();
    const attackUid = 'batch-prefetch-moved-slot';
    const legalUid = 'batch-prefetch-legal-sibling';
    const users = app.db.getRepository('users');
    const roles = app.db.getRepository('roles');
    const usersFindOne = vi.spyOn(users, 'findOne');
    const rolesFind = vi.spyOn(roles, 'find');
    const rolesFindOne = vi.spyOn(roles, 'findOne');
    const attackTemplate = { value: '{{ ctx.popup.record.roles.title }}' };
    const legalTemplate = { value: '{{ ctx.backend.record.nickname }}' };
    const dispose = getRecordSlotResolverRegistry(app).register(
      createNestedRecordSlotResolver({
        owner: 'test',
        id: 'legal-backend',
        varName: 'backend',
      }),
    );
    await insertFlowModel({ uid: attackUid, use: 'DetailsBlockModel', props: attackTemplate });
    await insertFlowModel({ uid: legalUid, use: 'DetailsBlockModel', props: legalTemplate });

    try {
      const response = await execResolve(
        {
          batch: [
            {
              id: 'attack',
              rd: session.rd(attackUid),
              template: attackTemplate,
              contextParams: { 'popup.record.roles': { collection: 'roles', filterByTk: 'root' } },
            },
            {
              id: 'legal',
              rd: session.rd(legalUid),
              template: legalTemplate,
              contextParams: { 'backend.record': { collection: 'users', filterByTk: 1 } },
            },
          ],
        },
        1,
        { currentRole: 'member', token: session.token },
      );

      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0]).toEqual({ id: 'attack', data: attackTemplate });
      expect(response.body.results[1].id).toBe('legal');
      expect(response.body.results[1].data.value).not.toBe(legalTemplate.value);
      expect(usersFindOne).toHaveBeenCalledTimes(1);
      expect(rolesFind).toHaveBeenCalledTimes(1);
      expect(rolesFind).toHaveBeenCalledWith({ fields: ['name', 'allowConfigure'], filter: { name: ['member'] } });
      expect(rolesFindOne).not.toHaveBeenCalled();
    } finally {
      usersFindOne.mockRestore();
      rolesFind.mockRestore();
      rolesFindOne.mockRestore();
      dispose();
    }
  });
});
