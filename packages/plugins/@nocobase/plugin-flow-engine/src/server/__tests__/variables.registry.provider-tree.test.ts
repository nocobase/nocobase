/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { beforeEach, describe, expect, it } from 'vitest';
import { HttpRequestContext } from '../template/contexts';
import { resolveJsonTemplate, type JSONValue } from '../template/resolver';
import { analyzeVariableTemplate, type PathSegment } from '../template/variable-expression';
import type { AuthorizedRecordBinding, RecordBindingPlan } from '../variables/record-bindings';
import { variables } from '../variables/registry';
import { resetVariablesRegistryForTest } from './test-utils';

type QueryOptions = { filterByTk?: unknown };
type QueryCall = { collection: string; filterByTk: unknown };
type FixtureContext = { calls: QueryCall[]; koaCtx: ResourcerContext };
type FixtureRepository = {
  collection: { name: string; filterTargetKey: string; model: typeof model };
  find: (options: QueryOptions) => Promise<unknown[]>;
  findOne: (options: QueryOptions) => Promise<unknown>;
};

const model = {
  primaryKeyAttribute: 'id',
  rawAttributes: {
    id: {},
    name: {},
    nickname: {},
    owner: {},
    secret: {},
    status: {},
    title: {},
  },
  associations: {},
};

function createFixtureContext(
  fixtures: Readonly<Record<string, unknown>>,
  cached: ReadonlyArray<readonly [string, unknown]> = [],
): FixtureContext {
  const calls: QueryCall[] = [];
  const getFixture = (collection: string, filterByTk: unknown) => {
    const exactKey = `${collection}:${JSON.stringify(filterByTk)}`;
    return Object.prototype.hasOwnProperty.call(fixtures, exactKey) ? fixtures[exactKey] : fixtures[collection];
  };
  const repositories = new Map<string, FixtureRepository>();
  for (const collection of new Set(Object.keys(fixtures).map((key) => key.split(':')[0]))) {
    repositories.set(collection, {
      collection: { name: collection, filterTargetKey: 'id', model },
      find: async (options: QueryOptions) => {
        calls.push({ collection, filterByTk: options.filterByTk });
        const value = getFixture(collection, options.filterByTk);
        return Array.isArray(value) ? value : [];
      },
      findOne: async (options: QueryOptions) => {
        calls.push({ collection, filterByTk: options.filterByTk });
        return getFixture(collection, options.filterByTk);
      },
    });
  }
  const koaCtx = {
    app: {
      dataSourceManager: {
        get: () => ({
          collectionManager: {
            db: {
              getCollection: (collection: string) => repositories.get(collection)?.collection,
              getRepository: (collection: string) => repositories.get(collection),
            },
          },
        }),
      },
      logger: { child: () => ({ warn: () => undefined }) },
    },
    state: { __varResolveBatchCache: new Map(cached) },
  } as unknown as ResourcerContext;
  return { calls, koaCtx };
}

function recordParams(collection: string, filterByTk: unknown = 1) {
  return { collection, dataSourceKey: 'main', filterByTk };
}

function binding(
  varName: string,
  prefix: readonly PathSegment[],
  collection: string,
  relativePaths: readonly (readonly PathSegment[])[],
  filterByTk: unknown = 1,
): AuthorizedRecordBinding {
  return {
    params: recordParams(collection, filterByTk),
    varName,
    prefix,
    relativePaths,
    preferFullRecord: relativePaths.some((path) => path.length === 0),
    contextKey: [varName, ...prefix].join('.'),
    contextLocation: [[varName, ...prefix].join('.')],
  };
}

function plan(bindings: readonly AuthorizedRecordBinding[]): RecordBindingPlan {
  return { bindings, contextParams: {}, rejections: [] };
}

async function resolveBindings(
  template: JSONValue,
  bindings: readonly AuthorizedRecordBinding[],
  fixtures: Readonly<Record<string, unknown>>,
  cached: ReadonlyArray<readonly [string, unknown]> = [],
) {
  const fixture = createFixtureContext(fixtures, cached);
  const flowCtx = new HttpRequestContext(fixture.koaCtx);
  const analysis = analyzeVariableTemplate(template);
  await variables.attachUsedVariablesFromPlan(flowCtx, fixture.koaCtx, analysis.usage, plan(bindings));
  return {
    ...fixture,
    data: await resolveJsonTemplate(template, flowCtx),
    flowCtx,
  };
}

function requestCacheKey(collection: string, filterByTk: unknown) {
  return JSON.stringify({ ds: 'main', c: collection, tk: filterByTk, full: true });
}

async function readContextPath(root: unknown, segments: readonly PathSegment[]) {
  let value = await root;
  for (const segment of segments) {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) return undefined;
    value = await (value as Record<string, unknown>)[String(segment)];
  }
  return value;
}

describe('record provider prefix tree', () => {
  beforeEach(() => {
    resetVariablesRegistryForTest();
  });

  it.each<[string, Record<string, unknown>]>([
    ['plain', { name: 'Customer', nickname: 'Projected sibling', owner: { name: 'raw owner' }, secret: 'raw' }],
    [
      'null-prototype',
      Object.assign(Object.create(null) as Record<string, unknown>, {
        name: 'Customer',
        nickname: 'Projected sibling',
        owner: { name: 'raw owner' },
        secret: 'raw',
      }),
    ],
  ])('overlays an exact child on a %s projected parent without a root binding', async (_kind, customer) => {
    const template = {
      name: '{{ ctx.formValues.customer.name }}',
      nickname: '{{ ctx.formValues.customer.nickname }}',
      owner: '{{ ctx.formValues.customer.owner.name }}',
    };
    const result = await resolveBindings(
      template,
      [
        binding('formValues', ['customer'], 'customers', [['name'], ['nickname']]),
        binding('formValues', ['customer', 'owner'], 'owners', [['name']]),
      ],
      {
        customers: customer,
        owners: { name: 'exact owner', secret: 'child raw' },
      },
    );

    expect(result.data).toEqual({ name: 'Customer', nickname: 'Projected sibling', owner: 'exact owner' });
    expect(await readContextPath(result.flowCtx, ['formValues', 'customer', 'secret'])).toBeUndefined();
    expect(await readContextPath(result.flowCtx, ['formValues', 'customer', 'owner', 'secret'])).toBeUndefined();
    expect(result.calls).toHaveLength(2);
    expect(result.calls).toEqual(
      expect.arrayContaining([
        { collection: 'customers', filterByTk: 1 },
        { collection: 'owners', filterByTk: 1 },
      ]),
    );
  });

  it('composes root, parent, and child identically across template and binding order', async () => {
    const forwardTemplate = {
      status: '{{ ctx.formValues.status }}',
      customer: '{{ ctx.formValues.customer.name }}',
      owner: '{{ ctx.formValues.customer.owner.name }}',
    };
    const reverseTemplate = {
      owner: '{{ ctx.formValues.customer.owner.name }}',
      customer: '{{ ctx.formValues.customer.name }}',
      status: '{{ ctx.formValues.status }}',
    };
    const fixtures = {
      roots: { status: 'active', customer: { name: 'raw root customer' }, secret: 'root raw' },
      customers: { name: 'Customer', owner: { name: 'raw owner' }, secret: 'parent raw' },
      owners: { name: 'Owner', secret: 'child raw' },
    };
    const forwardBindings = [
      binding('formValues', [], 'roots', [['status']]),
      binding('formValues', ['customer'], 'customers', [['name']]),
      binding('formValues', ['customer', 'owner'], 'owners', [['name']]),
    ];
    const forward = await resolveBindings(forwardTemplate, forwardBindings, fixtures);
    const reverse = await resolveBindings(reverseTemplate, [...forwardBindings].reverse(), fixtures);
    const expected = { status: 'active', customer: 'Customer', owner: 'Owner' };

    expect(forward.data).toEqual(expected);
    expect(reverse.data).toEqual(expected);
    for (const result of [forward, reverse]) {
      expect(result.calls).toHaveLength(3);
      expect(result.calls.map((call) => call.collection).sort()).toEqual(['customers', 'owners', 'roots']);
    }
  });

  it('keeps a numeric prefix structured when no root binding exists', async () => {
    const result = await resolveBindings(
      { name: '{{ ctx.rows[0].name }}' },
      [binding('rows', [0], 'first-row', [['name']])],
      { 'first-row': { name: 'first' } },
    );

    expect(result.data).toEqual({ name: 'first' });
    expect(result.calls).toHaveLength(1);
  });

  it('preserves a whole-object relative path when the binding has no children', async () => {
    const result = await resolveBindings({ record: '{{ ctx.record }}' }, [binding('record', [], 'records', [[]])], {
      records: { id: 1, name: 'whole', secret: 'explicitly requested whole value' },
    });

    expect(result.data).toEqual({
      record: { id: 1, name: 'whole', secret: 'explicitly requested whole value' },
    });
    expect(result.calls).toHaveLength(1);
  });

  it('overlays only a numeric child on a projected parent array', async () => {
    const result = await resolveBindings(
      { first: '{{ ctx.rows[0].name }}', second: '{{ ctx.rows[1].name }}' },
      [binding('rows', [], 'rows', [[0, 'name']], [1, 2]), binding('rows', [1], 'replacement', [['name']])],
      {
        rows: [
          { id: 1, name: 'first', secret: 'raw first' },
          { id: 2, name: 'raw second', secret: 'raw second' },
        ],
        replacement: { name: 'exact second', secret: 'child raw' },
      },
    );

    expect(result.data).toEqual({ first: 'first', second: 'exact second' });
    expect(result.calls).toHaveLength(2);
  });

  it('fails closed for a non-numeric child of a projected parent array', async () => {
    const template = { first: '{{ ctx.rows[0].name }}', invalid: '{{ ctx.rows.owner.name }}' };
    const result = await resolveBindings(
      template,
      [binding('rows', [], 'rows', [[0, 'name']], [1]), binding('rows', ['owner'], 'owners', [['name']])],
      { rows: [{ id: 1, name: 'first' }], owners: { name: 'must not overlay an array' } },
    );

    expect(result.data).toEqual({ first: 'first', invalid: template.invalid });
  });

  it.each<[string, unknown]>([
    ['null', null],
    ['undefined', undefined],
  ])('uses an empty overlay for a %s parent with children and preserves it without children', async (_kind, value) => {
    const parent = binding('formValues', ['customer'], 'parent', [[]], _kind);
    const child = binding('formValues', ['customer', 'owner'], 'owner', [['name']]);
    const cached: ReadonlyArray<readonly [string, unknown]> = [[requestCacheKey('parent', _kind), value]];
    const withChild = await resolveBindings(
      { customer: '{{ ctx.formValues.customer }}', owner: '{{ ctx.formValues.customer.owner.name }}' },
      [parent, child],
      { parent: value, owner: { name: 'exact owner' } },
      cached,
    );
    const withoutChild = await resolveBindings(
      { customer: '{{ ctx.formValues.customer }}' },
      [parent],
      { parent: value },
      cached,
    );

    expect(withChild.data).toEqual({ customer: { owner: { name: 'exact owner' } }, owner: 'exact owner' });
    expect(await readContextPath(withoutChild.flowCtx, ['formValues', 'customer'])).toBe(value);
  });

  it('hides an anomalous scalar parent while retaining provable exact children', async () => {
    const parent = binding('formValues', ['customer'], 'parent', [[]], 'scalar');
    const result = await resolveBindings(
      { customer: '{{ ctx.formValues.customer }}', owner: '{{ ctx.formValues.customer.owner.name }}' },
      [parent, binding('formValues', ['customer', 'owner'], 'owner', [['name']])],
      { owner: { name: 'exact owner' } },
      [[requestCacheKey('parent', 'scalar'), 'unexpected scalar']],
    );

    expect(result.data).toEqual({ customer: { owner: { name: 'exact owner' } }, owner: 'exact owner' });
  });

  it('fails closed instead of selecting a duplicate exact prefix by input order', async () => {
    const template = { name: '{{ ctx.formValues.customer.name }}' };
    const left = binding('formValues', ['customer'], 'left', [['name']]);
    const right = binding('formValues', ['customer'], 'right', [['name']]);
    const fixtures = { left: { name: 'left' }, right: { name: 'right' } };
    const outcomes = await Promise.allSettled([
      resolveBindings(template, [left, right], fixtures),
      resolveBindings(template, [right, left], fixtures),
    ]);

    expect(outcomes[0].status).toBe(outcomes[1].status);
    if (outcomes[0].status === 'fulfilled' && outcomes[1].status === 'fulfilled') {
      expect(outcomes[0].value.data).toEqual(template);
      expect(outcomes[1].value.data).toEqual(template);
    } else {
      expect(outcomes[0].status).toBe('rejected');
      expect(outcomes[1].status).toBe('rejected');
    }
  });

  it('still ignores protected server context roots', async () => {
    const template = { page: '{{ ctx.query.page }}' };
    const result = await resolveBindings(template, [binding('query', [], 'records', [['page']])], {
      records: { page: 'spoofed' },
    });

    expect(result.data).toEqual(template);
    expect(result.calls).toEqual([]);
  });
});
