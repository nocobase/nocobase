/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection, Repository } from '@nocobase/database';
import type { ResourcerContext } from '@nocobase/resourcer';
import { describe, expect, it, vi } from 'vitest';
import { projectRecord } from '../variables/record-projection';
import { fetchRecordWithRequestCache, prepareRecordQuery, resolveRecordTarget } from '../variables/records';

type Row = { id: number; name: string; uuid: string };

function createFixture(options: {
  filterTargetKey: string | string[];
  primaryKeyAttribute: string;
  rawAttributes: Record<string, unknown>;
}) {
  const rows: Row[] = [
    { id: 1, name: 'A', uuid: 'a' },
    { id: 2, name: 'B', uuid: 'b' },
  ];
  const collection = {
    filterTargetKey: options.filterTargetKey,
    model: {
      associations: {},
      primaryKeyAttribute: options.primaryKeyAttribute,
      rawAttributes: options.rawAttributes,
    },
    name: 'items',
  } as unknown as Collection;
  const select = (row: Row, fields?: string[]) =>
    fields
      ? Object.fromEntries(fields.filter((field) => field in row).map((field) => [field, row[field as keyof Row]]))
      : row;
  const find = vi.fn(async (query: { fields?: string[] }) => rows.map((row) => select(row, query.fields)));
  const repository = { collection, find } as unknown as Repository;
  const context = {
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
  const target = resolveRecordTarget(context, { collection: 'items', filterByTk: ['b', 'a'] });
  if (!target) throw new Error('Expected the record target fixture to resolve');

  return { context, find, target };
}

describe('variable record filter target key selects', () => {
  it('keeps strict internal keys for ordering and projects them away without another query', async () => {
    const { context, find } = createFixture({
      filterTargetKey: 'uuid',
      primaryKeyAttribute: 'id',
      rawAttributes: { id: {}, name: {}, uuid: {} },
    });

    const records = await fetchRecordWithRequestCache(
      context,
      { collection: 'items', filterByTk: ['b', 'a'] },
      ['name'],
      undefined,
      true,
    );

    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith({
      appends: undefined,
      fields: ['id', 'name', 'uuid'],
      filterByTk: ['b', 'a'],
      context,
    });
    expect(records).toEqual([
      { id: 2, name: 'B', uuid: 'b' },
      { id: 1, name: 'A', uuid: 'a' },
    ]);
    expect(projectRecord(records, [['name']])).toEqual([{ name: 'B' }, { name: 'A' }]);
  });

  it('keeps internal keys when explicit fields is empty', async () => {
    const { context, find } = createFixture({
      filterTargetKey: 'uuid',
      primaryKeyAttribute: 'id',
      rawAttributes: { id: {}, name: {}, uuid: {} },
    });

    const records = await fetchRecordWithRequestCache(
      context,
      { collection: 'items', filterByTk: ['b', 'a'] },
      [],
      undefined,
      true,
    );

    expect(find).toHaveBeenCalledWith({
      appends: undefined,
      fields: ['id', 'uuid'],
      filterByTk: ['b', 'a'],
      context,
    });
    expect(records).toEqual([
      { id: 2, uuid: 'b' },
      { id: 1, uuid: 'a' },
    ]);
  });

  it.each([
    {
      expected: ['id', 'name'],
      filterByTk: [2, 1],
      filterTargetKey: 'id',
      label: 'a primary-key target',
      primaryKeyAttribute: 'id',
      rawAttributes: { id: {}, name: {} },
    },
    {
      expected: ['id', 'name'],
      filterByTk: 'b',
      filterTargetKey: 'uuid',
      label: 'a scalar filterByTk',
      primaryKeyAttribute: 'id',
      rawAttributes: { id: {}, name: {}, uuid: {} },
    },
    {
      expected: ['id', 'name'],
      filterByTk: ['b', 'a'],
      filterTargetKey: 'missing',
      label: 'a target absent from rawAttributes',
      primaryKeyAttribute: 'id',
      rawAttributes: { id: {}, name: {} },
    },
    {
      expected: ['id', 'name', 'tenant', 'uuid'],
      filterByTk: [
        { tenant: 'main', uuid: 'b' },
        { tenant: 'main', uuid: 'a' },
      ],
      filterTargetKey: ['tenant', 'uuid'],
      label: 'a composite target',
      primaryKeyAttribute: 'id',
      rawAttributes: { id: {}, name: {}, tenant: {}, uuid: {} },
    },
    {
      expected: ['name', 'uuid'],
      filterByTk: ['b', 'a'],
      filterTargetKey: 'uuid',
      label: 'a collection without a valid primary key',
      primaryKeyAttribute: 'missing',
      rawAttributes: { name: {}, uuid: {} },
    },
  ])(
    'keeps the query shape for $label',
    ({ expected, filterByTk, filterTargetKey, primaryKeyAttribute, rawAttributes }) => {
      const { context, target } = createFixture({ filterTargetKey, primaryKeyAttribute, rawAttributes });

      expect(prepareRecordQuery(context, target, filterByTk, ['name'], undefined, true).fields).toEqual(expected);
    },
  );

  it('does not narrow an appends-only query to internal fields', () => {
    const { context, target } = createFixture({
      filterTargetKey: 'uuid',
      primaryKeyAttribute: 'id',
      rawAttributes: { id: {}, name: {}, uuid: {} },
    });

    const query = prepareRecordQuery(context, target, ['b', 'a'], undefined, ['roles'], true);

    expect(query.fields).toBeUndefined();
    expect(query.appends).toEqual(['roles']);
  });
});
