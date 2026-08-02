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
import { createFlowEngineMockServer, resetVariablesRegistryForTest } from './test-utils';
import * as variableExpression from '../template/variable-expression';
import { resolveVariablesTemplate } from '../variables/resolve';

describe('variables:resolve batch prefetch merges selects (integration)', () => {
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
      state: userId ? { currentRole: 'root', currentRoles: ['root'] } : {},
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
            template: { a: '{{ ctx.view.record.id }}' },
            contextParams: { 'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } },
          },
          {
            id: 't2',
            template: { b: '{{ ctx.view.record.roles[0].name }}' },
            contextParams: { 'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } },
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

    const result = await resolveVariablesTemplate(
      context,
      { role: '{{ ctx.popup.record.name }}' },
      {
        'popup.record': {
          associationName: 'users.roles',
          collection: 'users',
          filterByTk: 'root',
          sourceId: 1,
        },
      },
    );

    expect(result.role).toBe('root');
    const second = await resolveVariablesTemplate(
      context,
      { role: '{{ ctx.popup.record.name }}' },
      {
        'popup.record': {
          associationName: 'users.roles',
          collection: 'users',
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
  });
});
