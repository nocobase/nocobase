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
import { HttpRequestContext } from '../template/contexts';
import { analyzeVariableTemplate } from '../template/variable-expression';
import { projectRecord } from '../variables/record-projection';
import { variables } from '../variables/registry';
import { fetchRecordWithRequestCache, getRecordRequestCache } from '../variables/records';

describe('record projection', () => {
  it('keeps only exposed object fields', () => {
    const raw = { department: { name: 'Engineering' }, status: 'active' };

    expect(projectRecord(raw, [['status']])).toEqual({ status: 'active' });
    expect(raw).toEqual({ department: { name: 'Engineering' }, status: 'active' });
  });

  it('safely copies a whole record without invoking accessors or copying functions and blocked keys', () => {
    let getterCalls = 0;
    const raw = Object.create({ inherited: 'hidden' }) as Record<string, unknown>;
    raw.id = 1;
    raw.nested = { enabled: true };
    raw.method = () => 'secret';
    for (const key of ['__proto__', 'prototype', 'constructor']) {
      Object.defineProperty(raw, key, { enumerable: true, value: `blocked-${key}` });
    }
    Object.defineProperty(raw, 'computed', {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return 'secret';
      },
    });

    const projected = projectRecord(raw, [[]]) as Record<string, unknown>;

    expect(getterCalls).toBe(0);
    expect(projected).toEqual({ id: 1, nested: { enabled: true } });
    expect(projected).not.toBe(raw);
    expect(projected.nested).not.toBe(raw.nested);
    for (const key of ['__proto__', 'prototype', 'constructor']) {
      expect(projected[key]).toBeUndefined();
    }
  });

  it('preserves non-plain scalar values in whole records', () => {
    const createdAt = new Date('2026-08-04T00:00:00.000Z');
    const projected = projectRecord({ createdAt }, [[]]) as { createdAt: Date };

    expect(projected).toEqual({ createdAt });
    expect(projected.createdAt).not.toBe(createdAt);
    expect(projectRecord({ createdAt }, [['createdAt']])).toEqual({ createdAt });
  });

  it('normalizes projected buffers to their stable JSON shape', () => {
    const blob = Buffer.from([0, 127, 255]);
    const expected = { blob: { type: 'Buffer', data: [0, 127, 255] } };

    expect(projectRecord({ blob }, [[]])).toEqual(expected);
    expect(projectRecord({ blob }, [['blob']])).toEqual(expected);
  });

  it('projects string segments across association arrays', () => {
    const raw = {
      roles: [
        { name: 'admin', title: 'Administrator' },
        { name: 'member', title: 'Member' },
      ],
    };

    expect(projectRecord(raw, [['roles', 'name']])).toEqual({ roles: [{ name: 'admin' }, { name: 'member' }] });
  });

  it('projects string segments across a top-level record array', () => {
    const raw = [
      { department: 'Engineering', status: 'active' },
      { department: 'Sales', status: 'inactive' },
    ];

    expect(projectRecord(raw, [['status']])).toEqual([{ status: 'active' }, { status: 'inactive' }]);
  });

  it('keeps only an exact numeric array index', () => {
    const raw = [
      { name: 'first', secret: 1 },
      { name: 'second', secret: 2 },
    ];

    const projected = projectRecord(raw, [[1, 'name']]) as unknown[];

    expect(projected).toHaveLength(2);
    expect(0 in projected).toBe(false);
    expect(projected[1]).toEqual({ name: 'second' });
  });

  it('treats dashed keys as literal segments', () => {
    expect(projectRecord({ 'a-b': 1, a: { b: 2 } }, [['a-b']])).toEqual({ 'a-b': 1 });
  });

  it('treats dotted keys as literal segments', () => {
    expect(projectRecord({ 'a.b': 1, a: { b: 2 } }, [['a.b']])).toEqual({ 'a.b': 1 });
  });

  it('merges paths without overwriting siblings or mutating shared input', () => {
    const raw = {
      profile: { email: 'alice@example.test', name: 'Alice', secret: 'hidden' },
      status: 'active',
    };

    expect(projectRecord(raw, [['profile', 'name'], ['status'], ['profile', 'email']])).toEqual({
      profile: { email: 'alice@example.test', name: 'Alice' },
      status: 'active',
    });
    expect(raw).toEqual({
      profile: { email: 'alice@example.test', name: 'Alice', secret: 'hidden' },
      status: 'active',
    });
  });

  it('projects each binding after a wide request-cache hit', async () => {
    const raw = { department: { name: 'Engineering' }, id: 1, status: 'active' };
    const calls: Record<string, unknown>[] = [];
    const collection = {
      filterTargetKey: 'id',
      model: {
        associations: { department: {} },
        primaryKeyAttribute: 'id',
        rawAttributes: { id: {}, status: {} },
      },
      name: 'users',
    };
    const repository = {
      collection,
      findOne: async (options: Record<string, unknown>) => {
        calls.push(options);
        return raw;
      },
    };
    const koaCtx = {
      app: {
        dataSourceManager: {
          get: () => ({
            collectionManager: {
              db: {
                getCollection: () => collection,
                getRepository: () => repository,
              },
            },
          }),
        },
        logger: { child: () => ({ warn: vi.fn() }) },
      },
      state: {},
    } as unknown as ResourcerContext;
    const params = { collection: 'users', dataSourceKey: 'main', filterByTk: 1 };

    await fetchRecordWithRequestCache(koaCtx, params, undefined, undefined, false, true);
    const flowCtx = new HttpRequestContext(koaCtx);
    const analysis = analyzeVariableTemplate('{{ ctx.formValues.status }}');
    await variables.attachUsedVariablesFromPlan(flowCtx, koaCtx, analysis.usage, {
      bindings: [
        {
          contextKey: 'formValues',
          contextLocation: ['formValues'],
          params,
          prefix: [],
          preferFullRecord: false,
          relativePaths: [['status']],
          varName: 'formValues',
        },
      ],
      contextParams: {},
      rejections: [],
    });

    await expect(flowCtx.formValues).resolves.toEqual({ status: 'active' });
    expect(calls).toHaveLength(1);
    expect([...getRecordRequestCache(koaCtx).values()]).toContain(raw);
    expect(raw).toEqual({ department: { name: 'Engineering' }, id: 1, status: 'active' });
  });
});
