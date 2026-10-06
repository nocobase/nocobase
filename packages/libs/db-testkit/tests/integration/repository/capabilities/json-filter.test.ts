import { expect, it } from 'vitest';
import type {
  FilterBuilder,
  FilterNode,
  FilterLiteral,
} from '../../../../../db/src/index.js';
import { describeIntegrationDatabases } from '../../helpers.js';

describeIntegrationDatabases('Repository JSON filters', (context) => {
  it('compares JSON structures, typed array members, paths, and nulls in SQL', async () => {
    await context.builder.createCollection('jsonDocuments', (collection) => {
      collection.string('id').primary();
      collection.json('payload').nullable();
      collection.string('status').nullable();
    });
    const repository = context.database.repository('jsonDocuments');
    const rows: readonly [string, FilterLiteral][] = [
      ['object', { b: [1, true, '1', null], a: { label: 'test' } }],
      ['empty', []],
      ['numbers', [1, 2]],
      ['nestedArray', [[1]]],
      ['booleans', [true]],
      ['strings', ['1']],
      ['text', 'plain text'],
      ['null', null],
      ['missing', {}],
      ['nestedNull', { b: null }],
    ];
    for (const [id, payload] of rows) {
      await context
        .db(context.table('jsonDocuments'))
        .insert({ id, payload: JSON.stringify(payload) });
    }
    await context
      .db(context.table('jsonDocuments'))
      .insert({ id: 'dbNull', payload: null });
    const ids = async (
      filter: (f: FilterBuilder) => FilterNode,
    ): Promise<string[]> =>
      (
        await repository.findMany({
          filter,
          select: (s) => s.fields('id'),
          sort: (s) => [s.field('id').asc()],
        })
      ).map((row) => String(row.id));
    if (context.profile.json.filters === 'unsupported') {
      await expect(ids((f) => f.json('payload').has(1))).rejects.toMatchObject({
        code: 'FIELD_CAPABILITY_NOT_SUPPORTED',
      });
      return;
    }
    expect(
      await ids((f) =>
        f.json('payload').eq({ a: { label: 'test' }, b: [1, true, '1', null] }),
      ),
    ).toEqual(['object']);
    expect(await ids((f) => f.json('payload').eq([2, 1]))).toEqual([]);
    // Equality is exact for containers: neither a part of an array or object nor an empty one matches.
    expect(await ids((f) => f.json('payload').eq([1]))).toEqual([]);
    expect(await ids((f) => f.json('payload').eq([]))).toEqual(['empty']);
    expect(await ids((f) => f.json('payload').eq({}))).toEqual(['missing']);
    expect(
      await ids((f) => f.json('payload').eq({ a: { label: 'test' } })),
    ).toEqual([]);
    expect(
      await ids((f) => f.json('payload').path(['b']).eq([1, true])),
    ).toEqual([]);
    expect(
      await ids((f) => f.json('payload').path(['b']).ne([1, true])),
    ).toEqual(['nestedNull', 'object']);
    expect(await ids((f) => f.json('payload').path(['b', 0]).eq(1))).toEqual([
      'object',
    ]);
    expect(
      await ids((f) => f.json('payload').path(['a', 'label']).eq('test')),
    ).toEqual(['object']);
    expect(await ids((f) => f.json('payload').has(1))).toEqual(['numbers']);
    expect(await ids((f) => f.json('payload').has(true))).toEqual(['booleans']);
    expect(await ids((f) => f.json('payload').has('1'))).toEqual(['strings']);
    expect(await ids((f) => f.json('payload').hasSome([1, true]))).toEqual([
      'booleans',
      'numbers',
    ]);
    expect(await ids((f) => f.json('payload').hasEvery([1, 2]))).toEqual([
      'numbers',
    ]);
    expect(await ids((f) => f.json('payload').path(['b']).has(null))).toEqual([
      'object',
    ]);
    expect(await ids((f) => f.json('payload').hasEvery([]))).toEqual([
      'booleans',
      'empty',
      'nestedArray',
      'numbers',
      'strings',
    ]);
    expect(await ids((f) => f.json('payload').hasSome([]))).toEqual([]);
    expect(await ids((f) => f.json('payload').isEmpty())).toEqual(['empty']);
    expect(await ids((f) => f.json('payload').isNotEmpty())).toEqual([
      'booleans',
      'nestedArray',
      'numbers',
      'strings',
    ]);
    expect(await ids((f) => f.json('payload').isDbNull())).toEqual(['dbNull']);
    expect(await ids((f) => f.json('payload').isJsonNull())).toEqual(['null']);
    expect(await ids((f) => f.json('payload').isAnyNull())).toEqual([
      'dbNull',
      'null',
    ]);
    expect(
      await ids((f) => f.json('payload').path(['b']).isJsonNull()),
    ).toEqual(['nestedNull']);
    expect(await ids((f) => f.json('payload').path(['b']).isAnyNull())).toEqual(
      ['dbNull', 'nestedNull'],
    );
    expect(await ids((f) => f.json('payload').path(['b']).ne(null))).toEqual([
      'object',
    ]);
    const result = await repository.updateMany({
      filter: (f) => f.json('payload').has(f.variable('$needle')),
      context: { needle: 2 },
      values: { status: 'matched' },
    });
    expect(result.updatedCount).toBe(1);
    expect(
      await repository.findMany({
        filter: {
          kind: 'filter',
          version: 1,
          root: {
            kind: 'group',
            logic: 'and',
            items: [
              {
                kind: 'condition',
                path: ['payload'],
                operator: '$jsonHas',
                value: 2,
              },
            ],
          },
        },
        select: (s) => s.fields('status'),
      }),
    ).toEqual([{ status: 'matched' }]);
    for (const path of [[''], [-1], ['bad"key'], ['bad\\key']]) {
      await expect(
        ids((f) => f.json('payload').path(path).eq(1)),
      ).rejects.toMatchObject({ code: 'INVALID_FILTER' });
    }
    await expect(ids((f) => f.json('payload').eq(NaN))).rejects.toMatchObject({
      code: 'INVALID_FILTER',
    });
    await expect(
      ids((f) => f.json('payload').path(['b']).isDbNull()),
    ).rejects.toMatchObject({ code: 'INVALID_FILTER' });
  });
});
