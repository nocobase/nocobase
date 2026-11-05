import { expect, it } from 'vitest';
import type { SortBuilder } from '../../../../../db/src/index.js';
import { describeIntegrationDatabases } from '../../helpers.js';
import { createDocumentationFixture } from '../fixtures/documentation.js';
import { createRelationFixture } from '../fixtures/relations.js';
import { captureSql } from '../fixtures/tenants.js';

describeIntegrationDatabases('Repository sort nullability', (context) => {
  async function prepare() {
    await createDocumentationFixture(context);
    await context.database.repository('projects').createMany({
      values: [
        { id: 'P', name: 'Populated' },
        { id: 'Q', name: 'Empty' },
      ],
    });
    await context.database.repository('tasks').createMany({
      values: [
        {
          id: 'A',
          title: 'A',
          points: 1,
          priority: null,
          status: 'one',
          projectId: 'P',
        },
        {
          id: 'B',
          title: 'B',
          points: 1,
          priority: 1,
          status: 'one',
          projectId: 'P',
        },
        {
          id: 'C',
          title: 'C',
          points: 2,
          priority: 1,
          status: 'two',
          projectId: 'P',
        },
        {
          id: 'D',
          title: 'D',
          points: 3,
          priority: 2,
          status: 'three',
          projectId: 'P',
        },
      ],
    });
  }

  for (const direction of ['asc', 'desc'] as const) {
    for (const nulls of ['first', 'last'] as const) {
      it(`${direction} nulls ${nulls} omits only proven non-null scalar keys`, async () => {
        await prepare();
        const tasks = context.database.repository('tasks');
        for (const distinct of [undefined, ['status'] as const]) {
          const required = await captureSql(context, () =>
            tasks.findMany({
              distinct,
              sort: (s) => [
                s
                  .field('points')
                  [direction]()
                  [nulls === 'first' ? 'nullsFirst' : 'nullsLast'](),
                s.field('id').asc(),
              ],
              select: (s) => s.fields('id'),
            }),
          );
          expect(required.result.map((r) => r.id)).toEqual(
            direction === 'asc'
              ? distinct
                ? ['A', 'C', 'D']
                : ['A', 'B', 'C', 'D']
              : distinct
                ? ['D', 'C', 'A']
                : ['D', 'C', 'A', 'B'],
          );
          expect(required.statements).toHaveLength(1);
          expect(required.statements[0]).not.toMatch(/case when/i);
          const nullable = await captureSql(context, () =>
            tasks.findMany({
              distinct,
              sort: (s) => [
                s
                  .field('priority')
                  [direction]()
                  [nulls === 'first' ? 'nullsFirst' : 'nullsLast'](),
                s.field('id').asc(),
              ],
              select: (s) => s.fields('id'),
            }),
          );
          const nonNull =
            direction === 'asc' ? ['B', 'C', 'D'] : ['D', 'B', 'C'];
          const expected =
            nulls === 'first' ? ['A', ...nonNull] : [...nonNull, 'A'];
          expect(nullable.result.map((r) => r.id)).toEqual(
            distinct
              ? expected.filter((id) => id !== (nulls === 'first' ? 'B' : 'A'))
              : expected,
          );
          expect(nullable.statements).toHaveLength(1);
          expect(nullable.statements[0].match(/case when/gi)).toHaveLength(
            distinct ? 2 : 1,
          );
        }
      });
    }
  }

  it('keeps tied multi-key cursor pages stable in both directions, including distinct', async () => {
    await prepare();
    const tasks = context.database.repository('tasks');
    for (const distinct of [undefined, ['status'] as const]) {
      const options = {
        distinct,
        sort: (s: SortBuilder) => [
          s.field('points').asc(),
          s.field('id').asc(),
        ],
      };
      const all = await tasks.findMany(options);
      const forward = [];
      let cursor: { points: number; id: string } | undefined;
      for (let index = 0; index < all.length; index++) {
        const page = await tasks.findMany({ ...options, cursor, limit: 1 });
        expect(page).toHaveLength(1);
        forward.push(page[0].id);
        cursor = { points: page[0].points as number, id: page[0].id as string };
      }
      expect(await tasks.findMany({ ...options, cursor, limit: 1 })).toEqual(
        [],
      );
      expect(forward).toEqual(all.map((r) => r.id));
      const backward = [all.at(-1)!.id];
      for (let index = 1; index < all.length; index++) {
        const page = await tasks.findMany({
          ...options,
          cursor,
          direction: 'backward',
          limit: 1,
        });
        expect(page).toHaveLength(1);
        backward.unshift(page[0].id);
        cursor = { points: page[0].points as number, id: page[0].id as string };
      }
      expect(backward).toEqual(forward);
      expect(
        await tasks.findMany({
          ...options,
          cursor,
          direction: 'backward',
          limit: 1,
        }),
      ).toEqual([]);
    }
  });

  it('preserves nullability through relation distinct and limited aggregate ranking', async () => {
    await prepare();
    const projects = context.database.repository('projects');
    const ranked = await captureSql(context, () =>
      projects.findMany({
        sort: (s) => s.field('id').asc(),
        select: (s) =>
          s.fields('id').include('tasks', (t) =>
            t
              .sort((s) => [s.field('points').desc(), s.field('id').asc()])
              .distinct(['status'])
              .limit(2)
              .combine({ records: t.fields('id'), maximum: t.max('points') }),
          ),
      }),
    );
    expect(ranked.result).toEqual([
      { id: 'P', tasks: { records: [{ id: 'D' }, { id: 'C' }], maximum: 3 } },
      { id: 'Q', tasks: { records: [], maximum: null } },
    ]);
    expect(ranked.statements).toHaveLength(3);
    expect(ranked.statements.join(' ')).toMatch(/row_number/i);
    expect(ranked.statements.join(' ')).not.toMatch(/case when/i);
    const nullable = await captureSql(context, () =>
      projects.findMany({
        filter: { id: 'P' },
        select: (s) =>
          s.fields('id').include('tasks', (t) =>
            t
              .sort((s) => [
                s.field('priority').asc().nullsFirst(),
                s.field('id').asc(),
              ])
              .distinct(['status'])
              .limit(2)
              .fields('id'),
          ),
      }),
    );
    expect(nullable.result).toEqual([
      { id: 'P', tasks: [{ id: 'A' }, { id: 'C' }] },
    ]);
    expect(nullable.statements.join(' ')).toMatch(/case when/i);
  });

  it('keeps null handling when column nullability is unspecified or comes from a view', async () => {
    await context.builder.createCollection('unspecified', (c) => {
      c.increments('id');
      c.integer('value');
    });
    await context.database
      .repository('unspecified')
      .createMany({ values: [{ value: null }, { value: 1 }] });
    const primaryKey = await captureSql(context, () =>
      context.database.repository('unspecified').findMany({
        sort: (s) => s.field('id').asc(),
        select: (s) => s.fields('id'),
      }),
    );
    expect(primaryKey.result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(primaryKey.statements.at(-1)).not.toMatch(/case when/i);
    await context.builder.createViewCollection('uncertainView', (v) => {
      v.integer('id').primary().notNull();
      v.integer('value').notNull();
      v.as((q) => q.from('unspecified').select('id', 'value'));
    });
    for (const collection of ['unspecified', 'uncertainView']) {
      const result = await captureSql(context, () =>
        context.database.repository(collection).findMany({
          sort: (s) => s.field('value').desc().nullsLast(),
          select: (s) => s.fields('value'),
        }),
      );
      expect(result.result).toEqual([{ value: 1 }, { value: null }]);
      expect(result.statements.at(-1)).toMatch(/case when/i);
    }
  });

  it('retains null handling for missing relations even when target columns are required', async () => {
    await createRelationFixture(context);
    const result = await captureSql(context, () =>
      context.database.repository('repositoryBooks').findMany({
        select: (s) => s.fields('title'),
        sort: (s) => [
          s.field('publisher.name').desc().nullsLast(),
          s.field('id').asc(),
        ],
      }),
    );
    expect(result.result).toEqual([
      { title: 'Gamma' },
      { title: 'Alpha' },
      { title: 'Beta' },
    ]);
    expect(result.statements).toHaveLength(1);
    expect(result.statements[0].match(/case when/gi)).toHaveLength(1);
  });
});
