/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Repository } from '@nocobase/database';
import type { ResourcerContext } from '@nocobase/resourcer';
import { MockServer } from '@nocobase/test';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createNestedRecordSlotResolver, getRecordSlotResolverRegistry } from '../variables/record-slot-resolvers';
import { createFlowEngineMockServer, resetVariablesRegistryForTest } from './test-utils';

type ResolveAction = {
  execute: (ctx: ResourcerContext, next: () => Promise<void>) => Promise<void>;
  mergeParams: (params: { values: Record<string, unknown> }) => void;
};

describe('variables:resolve filter target key projection', () => {
  let app: MockServer;
  let repository: Repository;

  const execResolve = async (values: Record<string, unknown>) => {
    const action = app.resourceManager.getAction('variables', 'resolve').clone() as unknown as ResolveAction;
    action.mergeParams({ values });
    const ctx = {
      action,
      app,
      auth: { role: 'root', user: { id: 1 } },
      db: app.db,
      getCurrentLocale: () => 'en-US',
      get: () => undefined,
      request: { body: values, method: 'POST', path: '/api/variables:resolve', query: {} },
      state: { currentRole: 'root', currentRoles: ['root'] },
      throw: (status: number, body: unknown) => {
        throw Object.assign(new Error(String(body)), { body, status });
      },
    } as unknown as ResourcerContext & { body?: unknown };

    await action.execute(ctx, async () => {});
    return ctx.body;
  };

  beforeAll(async () => {
    resetVariablesRegistryForTest();
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
    const collection = app.db.collection({
      name: 'variableFilterTargetRecords',
      filterTargetKey: 'uuid',
      fields: [
        { name: 'uuid', type: 'string', unique: true },
        { name: 'name', type: 'string' },
      ],
    });
    await collection.sync();
    repository = collection.repository;
    getRecordSlotResolverRegistry(app).register(
      createNestedRecordSlotResolver({
        owner: '@nocobase/plugin-flow-engine',
        id: 'view:record',
        varName: 'view',
      }),
    );
    await repository.create({
      values: [
        { name: 'A', uuid: 'a' },
        { name: 'B', uuid: 'b' },
      ],
    });
  });

  afterAll(async () => {
    await app?.destroy();
  });

  it('returns a narrow ordered projection from the single action with one query', async () => {
    const rawOrders: unknown[][] = [];
    const originalFind = repository.find.bind(repository);
    const find = vi.spyOn(repository, 'find').mockImplementation(async (options) => {
      const rows = await originalFind(options);
      rawOrders.push(rows.map((row) => (row.toJSON() as Record<string, unknown>).uuid));
      return rows;
    });

    try {
      const body = await execResolve({
        contextParams: {
          'view.record': {
            collection: 'variableFilterTargetRecords',
            dataSourceKey: 'main',
            fields: ['name'],
            filterByTk: ['b', 'a'],
          },
        },
        template: { names: '{{ ctx.view.record.name }}' },
      });

      expect(body).toEqual({ names: ['B', 'A'] });
      expect(rawOrders).toEqual([['a', 'b']]);
      expect(find).toHaveBeenCalledTimes(1);
      expect(find).toHaveBeenCalledWith({
        appends: undefined,
        fields: ['id', 'name', 'uuid'],
        filterByTk: ['b', 'a'],
      });
    } finally {
      find.mockRestore();
    }
  });

  it('returns narrow ordered projections from a shared batch prefetch with one query', async () => {
    const rawOrders: unknown[][] = [];
    const originalFind = repository.find.bind(repository);
    const find = vi.spyOn(repository, 'find').mockImplementation(async (options) => {
      const rows = await originalFind(options);
      rawOrders.push(rows.map((row) => (row.toJSON() as Record<string, unknown>).uuid));
      return rows;
    });
    const recordParams = {
      collection: 'variableFilterTargetRecords',
      dataSourceKey: 'main',
      fields: ['name'],
      filterByTk: ['b', 'a'],
    };

    try {
      const body = await execResolve({
        batch: [
          {
            contextParams: { 'view.record': recordParams },
            id: 'first',
            template: { names: '{{ ctx.view.record.name }}' },
          },
          {
            contextParams: { 'view.record': recordParams },
            id: 'second',
            template: { names: '{{ ctx.view.record.name }}' },
          },
        ],
      });

      expect(body).toEqual({
        results: [
          { data: { names: ['B', 'A'] }, id: 'first' },
          { data: { names: ['B', 'A'] }, id: 'second' },
        ],
      });
      expect(rawOrders).toEqual([['a', 'b']]);
      expect(find).toHaveBeenCalledTimes(1);
      expect(find).toHaveBeenCalledWith({
        appends: undefined,
        fields: ['id', 'name', 'uuid'],
        filterByTk: ['b', 'a'],
      });
    } finally {
      find.mockRestore();
    }
  });
});
