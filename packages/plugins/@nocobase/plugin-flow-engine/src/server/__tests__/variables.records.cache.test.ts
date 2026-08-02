/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { describe, expect, it, vi } from 'vitest';
import {
  fetchRecordWithRequestCache,
  getRecordRequestCache,
  prepareRecordQuery,
  resolveRecordTarget,
} from '../variables/records';

function createContext() {
  const calls: Array<{ collection: string; options: Record<string, unknown> }> = [];
  const collections = new Map(
    ['users', 'projects'].map((name) => [
      name,
      {
        filterTargetKey: 'id',
        model: {
          associations: { roles: {} },
          primaryKeyAttribute: 'id',
          rawAttributes: { email: {}, id: {}, name: {} },
        },
        name,
      },
    ]),
  );
  const repositories = new Map(
    [...collections].map(([name, collection]) => [
      name,
      {
        collection,
        find: async (options: Record<string, unknown>) => {
          calls.push({ collection: name, options });
          const filterByTk = options.filterByTk as unknown[];
          return [...filterByTk].reverse().map((id) => ({ email: `${id}@example.test`, id, name: `record-${id}` }));
        },
        findOne: async (options: Record<string, unknown>) => {
          calls.push({ collection: name, options });
          return {
            email: 'record@example.test',
            id: options.filterByTk,
            name: `record-${JSON.stringify(options.filterByTk)}`,
            roles: [{ name: 'admin', title: 'Administrator' }],
          };
        },
      },
    ]),
  );
  const context = {
    app: {
      dataSourceManager: {
        get: () => ({
          collectionManager: {
            db: {
              getCollection: (name: string) => collections.get(name),
              getRepository: (name: string) => repositories.get(name),
            },
          },
        }),
      },
      logger: { child: () => ({ warn: vi.fn() }) },
    },
    state: {},
  } as unknown as ResourcerContext;
  return { calls, context };
}

describe('variable record request cache index', () => {
  it('only scans the matching typed identity bucket without reparsing cache keys', async () => {
    const { calls, context } = createContext();
    for (let id = 0; id < 50; id += 1) {
      await fetchRecordWithRequestCache(context, { collection: 'users', filterByTk: { group: id, id } }, [
        'id',
        'name',
      ]);
    }

    const parse = vi.spyOn(JSON, 'parse');
    try {
      const result = await fetchRecordWithRequestCache(
        context,
        { collection: 'users', filterByTk: { id: 42, group: 42 } },
        ['id'],
      );

      expect(result).toMatchObject({ id: { group: 42, id: 42 } });
      expect(calls).toHaveLength(50);
      expect(parse).not.toHaveBeenCalled();
    } finally {
      parse.mockRestore();
    }
  });

  it('keeps strict selects exact even when a non-strict superset exists', async () => {
    const { calls, context } = createContext();
    await fetchRecordWithRequestCache(context, { collection: 'users', filterByTk: 1 }, ['id', 'email']);
    await fetchRecordWithRequestCache(context, { collection: 'users', filterByTk: 1 }, ['id'], undefined, true);
    await fetchRecordWithRequestCache(context, { collection: 'users', filterByTk: 1 }, ['id'], undefined, true);

    expect(calls).toHaveLength(2);
    expect(calls[1].options.fields).toEqual(['id']);
  });

  it('preserves full-record coverage, append coverage, and filter array order', async () => {
    const { calls, context } = createContext();
    const full = await fetchRecordWithRequestCache(
      context,
      { collection: 'users', filterByTk: [2, 1] },
      undefined,
      undefined,
      false,
      true,
    );
    const subset = await fetchRecordWithRequestCache(context, { collection: 'users', filterByTk: [2, 1] }, ['id']);
    await fetchRecordWithRequestCache(context, { collection: 'users', filterByTk: 7 }, ['roles.name']);
    await fetchRecordWithRequestCache(context, { collection: 'users', filterByTk: 7 }, ['roles.title']);

    expect(full).toEqual([
      { email: '2@example.test', id: 2, name: 'record-2' },
      { email: '1@example.test', id: 1, name: 'record-1' },
    ]);
    expect(subset).toBe(full);
    expect(calls).toHaveLength(2);
  });

  it('isolates association targets by source id and request', async () => {
    const calls: unknown[] = [];
    const targetCollection = {
      filterTargetKey: 'name',
      model: {
        associations: {},
        primaryKeyAttribute: 'name',
        rawAttributes: { name: {}, title: {} },
      },
      name: 'roles',
    };
    const createAssociationContext = () =>
      ({
        app: {
          dataSourceManager: {
            get: () => ({
              collectionManager: {
                db: {
                  getCollection: () => targetCollection,
                  getRepository: (_name: string, sourceId: unknown) => ({
                    collection: targetCollection,
                    findOne: async (options: unknown) => {
                      calls.push({ options, sourceId });
                      return { name: 'root', sourceId, title: 'Root' };
                    },
                    targetCollection,
                  }),
                },
              },
            }),
          },
          logger: { child: () => ({ warn: vi.fn() }) },
        },
        state: {},
      }) as unknown as ResourcerContext;
    const firstRequest = createAssociationContext();
    const params = { associationName: 'users.roles', collection: 'users', filterByTk: 'root' };

    await fetchRecordWithRequestCache(firstRequest, { ...params, sourceId: 1 }, ['name', 'title']);
    await fetchRecordWithRequestCache(firstRequest, { ...params, sourceId: 1 }, ['name']);
    await fetchRecordWithRequestCache(firstRequest, { ...params, sourceId: 2 }, ['name']);
    await fetchRecordWithRequestCache(createAssociationContext(), { ...params, sourceId: 1 }, ['name']);

    expect(calls).toHaveLength(3);
    expect(calls).toEqual(
      expect.arrayContaining([expect.objectContaining({ sourceId: 1 }), expect.objectContaining({ sourceId: 2 })]),
    );
  });

  it('does not duplicate replaced keys or retain deleted candidates', async () => {
    const { calls, context } = createContext();
    const target = resolveRecordTarget(context, { collection: 'users', filterByTk: 1 });
    expect(target).toBeDefined();
    if (!target) return;

    const query = prepareRecordQuery(context, target, 1, ['id', 'name']);
    const cache = getRecordRequestCache(context);
    cache.set(query.cacheKey, { id: 1, name: 'old' });
    cache.set(query.cacheKey, { id: 1, name: 'new' });

    expect(cache).toHaveLength(1);
    await expect(
      fetchRecordWithRequestCache(context, { collection: 'users', filterByTk: 1 }, ['id']),
    ).resolves.toMatchObject({
      name: 'new',
    });
    expect(calls).toHaveLength(0);

    cache.delete(query.cacheKey);
    await fetchRecordWithRequestCache(context, { collection: 'users', filterByTk: 1 }, ['id']);
    expect(calls).toHaveLength(1);
  });
});
