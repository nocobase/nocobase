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
import { projectRecord } from '../variables/record-projection';
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
  it('reuses the matching typed identity bucket', async () => {
    const { calls, context } = createContext();
    for (let id = 0; id < 50; id += 1) {
      await fetchRecordWithRequestCache(context, { collection: 'users', filterByTk: { group: id, id } }, [
        'id',
        'name',
      ]);
    }

    const result = await fetchRecordWithRequestCache(
      context,
      { collection: 'users', filterByTk: { id: 42, group: 42 } },
      ['id'],
    );

    expect(result).toMatchObject({ id: { group: 42, id: 42 } });
    expect(calls).toHaveLength(50);
  });

  it('reuses a covering non-strict cache entry for a strict projection', async () => {
    const { calls, context } = createContext();
    const broad = await fetchRecordWithRequestCache(
      context,
      { collection: 'users', filterByTk: 1 },
      ['email', 'id'],
      ['roles'],
    );
    const strict = await fetchRecordWithRequestCache(
      context,
      { collection: 'users', filterByTk: 1 },
      ['id', 'roles.name'],
      ['roles'],
      true,
    );

    expect(strict).toBe(broad);
    expect(projectRecord(strict, [['id']])).toEqual({ id: 1 });
    expect(calls).toHaveLength(1);
  });

  it('queries again when a strict cache candidate does not cover selects or identity', async () => {
    const selects = createContext();
    await fetchRecordWithRequestCache(selects.context, { collection: 'users', filterByTk: 1 }, ['id']);
    await fetchRecordWithRequestCache(
      selects.context,
      { collection: 'users', filterByTk: 1 },
      ['email', 'id'],
      undefined,
      true,
    );
    await fetchRecordWithRequestCache(selects.context, { collection: 'users', filterByTk: 1 }, ['id'], ['roles'], true);
    expect(selects.calls).toHaveLength(3);

    const identities = createContext();
    await fetchRecordWithRequestCache(identities.context, { collection: 'users', filterByTk: 1 }, ['id', 'name']);
    await fetchRecordWithRequestCache(
      identities.context,
      { collection: 'users', filterByTk: 2 },
      ['id'],
      undefined,
      true,
    );
    await fetchRecordWithRequestCache(
      identities.context,
      { collection: 'users', dataSourceKey: 'analytics', filterByTk: 1 },
      ['id'],
      undefined,
      true,
    );
    expect(identities.calls).toHaveLength(3);
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

  it('isolates association targets by data source, source id, and request', async () => {
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
            get: (dataSourceKey: string) => ({
              collectionManager: {
                db: {
                  getCollection: () => targetCollection,
                  getRepository: (_name: string, sourceId: unknown) => ({
                    collection: targetCollection,
                    findOne: async (options: unknown) => {
                      calls.push({ dataSourceKey, options, sourceId });
                      return { dataSourceKey, name: 'root', sourceId, title: 'Root' };
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
    const params = { associationName: 'users.roles', collection: 'roles', filterByTk: 'root' };

    await fetchRecordWithRequestCache(firstRequest, { ...params, sourceId: 1 }, ['name', 'title']);
    await fetchRecordWithRequestCache(firstRequest, { ...params, sourceId: 1 }, ['name'], undefined, true);
    await fetchRecordWithRequestCache(firstRequest, { ...params, sourceId: 2 }, ['name']);
    await fetchRecordWithRequestCache(firstRequest, { ...params, dataSourceKey: 'analytics', sourceId: 1 }, ['name']);
    await fetchRecordWithRequestCache(createAssociationContext(), { ...params, sourceId: 1 }, ['name']);

    expect(calls).toHaveLength(4);
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dataSourceKey: 'main', sourceId: 1 }),
        expect.objectContaining({ dataSourceKey: 'main', sourceId: 2 }),
        expect.objectContaining({ dataSourceKey: 'analytics', sourceId: 1 }),
      ]),
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
