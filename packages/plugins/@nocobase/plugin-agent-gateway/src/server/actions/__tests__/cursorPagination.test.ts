/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { describe, expect, it } from 'vitest';

import { CursorPageFindOptions, CursorPageRow, findCursorPage } from '../cursorPagination';

const ROW_IDS = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
] as const;

class TestRow implements CursorPageRow {
  constructor(
    readonly id: string,
    readonly createdAt: string,
    readonly ingestId: number,
    readonly sessionIngestId: number = ingestId,
  ) {}

  get(name: string) {
    if (name === 'id') {
      return this.id;
    }
    if (name === 'createdAt') {
      return this.createdAt;
    }
    if (name === 'ingestId') {
      return this.ingestId;
    }
    if (name === 'sessionIngestId') {
      return this.sessionIngestId;
    }
    return undefined;
  }
}

function createContext(query: Record<string, unknown> = {}) {
  return {
    query,
    throw(status: number, message: string): never {
      const error = new Error(message) as Error & { status: number };
      error.status = status;
      throw error;
    },
  } as unknown as Context;
}

function createRow(index: number) {
  return new TestRow(ROW_IDS[index], `2026-07-11T00:00:0${index}.000Z`, index + 1);
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function compareRowValue(row: TestRow, key: string, expected: unknown) {
  if (key === 'ingestId' || key === 'sessionIngestId') {
    return Number(row.get(key)) - Number(expected);
  }
  return row.id.localeCompare(String(expected));
}

function matchesFilter(row: TestRow, value: unknown): boolean {
  const filter = getRecord(value);
  const andFilters = Array.isArray(filter.$and) ? filter.$and : [];
  if (andFilters.length && !andFilters.every((item) => matchesFilter(row, item))) {
    return false;
  }
  const orFilters = Array.isArray(filter.$or) ? filter.$or : [];
  if (orFilters.length && !orFilters.some((item) => matchesFilter(row, item))) {
    return false;
  }
  for (const key of ['ingestId', 'sessionIngestId']) {
    if (!(key in filter)) {
      continue;
    }
    const condition = filter[key];
    const operators = getRecord(condition);
    if (Object.keys(operators).some((operator) => operator.startsWith('$'))) {
      if ('$lt' in operators && compareRowValue(row, key, operators.$lt) >= 0) {
        return false;
      }
      if ('$gt' in operators && compareRowValue(row, key, operators.$gt) <= 0) {
        return false;
      }
      continue;
    }
    if (compareRowValue(row, key, condition) !== 0) {
      return false;
    }
  }
  return true;
}

function createInMemoryFindRows(sourceRows: TestRow[]) {
  return async (options: CursorPageFindOptions) => {
    const rows = sourceRows.filter((row) => matchesFilter(row, options.filter));
    const descending = options.sort[0]?.startsWith('-') === true;
    const cursorField = options.sort[0]?.replace(/^-/, '') || 'ingestId';
    rows.sort((left, right) => {
      const difference = Number(left.get(cursorField)) - Number(right.get(cursorField));
      return descending ? -difference : difference;
    });
    return rows.slice(0, options.limit);
  };
}

describe('findCursorPage', () => {
  it('returns the newest page in chronological order and builds an older-page cursor', async () => {
    let findOptions: CursorPageFindOptions | undefined;
    const page = await findCursorPage({
      ctx: createContext({ pageSize: 2 }),
      filter: { runId: 'run-1' },
      scope: 'events:run-1',
      cursorField: 'ingestId',
      defaultPageSize: 100,
      maxPageSize: 500,
      async findRows(options) {
        findOptions = options;
        return [createRow(4), createRow(3), createRow(2)];
      },
    });

    expect(findOptions).toEqual({
      filter: { runId: 'run-1' },
      sort: ['-ingestId'],
      limit: 3,
    });
    expect(page.rows.map((row) => row.id)).toEqual([ROW_IDS[3], ROW_IDS[4]]);
    expect(page.hasMoreBefore).toBe(true);
    expect(page.hasMoreAfter).toBe(false);
    expect(page.beforeCursor).toBeTypeOf('string');
    expect(page.afterCursor).toBeTypeOf('string');
  });

  it('applies a scoped cursor and reports navigation in both directions', async () => {
    const initialPage = await findCursorPage({
      ctx: createContext({ pageSize: 2 }),
      filter: { runId: 'run-1' },
      scope: 'events:run-1',
      cursorField: 'ingestId',
      defaultPageSize: 100,
      maxPageSize: 500,
      async findRows() {
        return [createRow(4), createRow(3), createRow(2)];
      },
    });
    let findOptions: CursorPageFindOptions | undefined;

    const olderPage = await findCursorPage({
      ctx: createContext({ pageSize: 2, beforeCursor: initialPage.beforeCursor }),
      filter: { runId: 'run-1' },
      scope: 'events:run-1',
      cursorField: 'ingestId',
      defaultPageSize: 100,
      maxPageSize: 500,
      async findRows(options) {
        findOptions = options;
        return [createRow(2), createRow(1)];
      },
    });

    expect(findOptions?.sort).toEqual(['-ingestId']);
    expect(findOptions?.filter).toMatchObject({
      $and: [
        { runId: 'run-1' },
        {
          ingestId: { $lt: '00000000000000000004' },
        },
      ],
    });
    expect(olderPage.rows.map((row) => row.id)).toEqual([ROW_IDS[1], ROW_IDS[2]]);
    expect(olderPage.hasMoreAfter).toBe(true);
  });

  it('rejects cursors from another scope and conflicting directions', async () => {
    const initialPage = await findCursorPage({
      ctx: createContext(),
      filter: {},
      scope: 'events:run-1',
      cursorField: 'ingestId',
      defaultPageSize: 2,
      maxPageSize: 10,
      async findRows() {
        return [createRow(1)];
      },
    });
    const findRows = async () => [createRow(1)];

    await expect(
      findCursorPage({
        ctx: createContext({ beforeCursor: initialPage.beforeCursor }),
        filter: {},
        scope: 'events:run-2',
        cursorField: 'ingestId',
        defaultPageSize: 2,
        maxPageSize: 10,
        findRows,
      }),
    ).rejects.toMatchObject({ status: 400, message: 'beforeCursor is invalid' });

    await expect(
      findCursorPage({
        ctx: createContext({ beforeCursor: initialPage.beforeCursor }),
        filter: {},
        scope: 'events:run-1',
        cursorField: 'sessionIngestId',
        defaultPageSize: 2,
        maxPageSize: 10,
        findRows,
      }),
    ).rejects.toMatchObject({ status: 400, message: 'beforeCursor is invalid' });

    await expect(
      findCursorPage({
        ctx: createContext({
          beforeCursor: initialPage.beforeCursor,
          afterCursor: initialPage.afterCursor,
        }),
        filter: {},
        scope: 'events:run-1',
        cursorField: 'ingestId',
        defaultPageSize: 2,
        maxPageSize: 10,
        findRows,
      }),
    ).rejects.toMatchObject({ status: 400, message: 'beforeCursor and afterCursor cannot be used together' });
  });

  it('keeps cursors fixed-size while paging both directions across more than 5000 rows', async () => {
    const timestamp = '2026-07-11T01:00:00.000Z';
    const allRows = Array.from(
      { length: 5007 },
      (_, index) => new TestRow(`00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, timestamp, index + 1),
    );
    const findRows = createInMemoryFindRows(allRows);
    const pageSize = 127;
    const beforeCursorLengths = new Set<number>();
    const afterCursorLengths = new Set<number>();
    let page = await findCursorPage({
      ctx: createContext({ pageSize }),
      filter: {},
      scope: 'events:equal-timestamp',
      cursorField: 'ingestId',
      defaultPageSize: pageSize,
      maxPageSize: pageSize,
      findRows,
    });
    const backwardPages = [page.rows];

    while (page.hasMoreBefore) {
      expect(page.beforeCursor).toBeTypeOf('string');
      beforeCursorLengths.add(page.beforeCursor?.length || 0);
      page = await findCursorPage({
        ctx: createContext({ pageSize, beforeCursor: page.beforeCursor }),
        filter: {},
        scope: 'events:equal-timestamp',
        cursorField: 'ingestId',
        defaultPageSize: pageSize,
        maxPageSize: pageSize,
        findRows,
      });
      backwardPages.unshift(page.rows);
    }

    const backwardIds = backwardPages.flat().map((row) => row.id);
    expect(backwardIds).toEqual(allRows.map((row) => row.id));
    expect(new Set(backwardIds).size).toBe(allRows.length);
    expect(beforeCursorLengths.size).toBe(1);
    expect([...beforeCursorLengths][0]).toBeLessThan(300);

    const forwardIds = page.rows.map((row) => row.id);
    while (page.hasMoreAfter) {
      expect(page.afterCursor).toBeTypeOf('string');
      afterCursorLengths.add(page.afterCursor?.length || 0);
      page = await findCursorPage({
        ctx: createContext({ pageSize, afterCursor: page.afterCursor }),
        filter: {},
        scope: 'events:equal-timestamp',
        cursorField: 'ingestId',
        defaultPageSize: pageSize,
        maxPageSize: pageSize,
        findRows,
      });
      forwardIds.push(...page.rows.map((row) => row.id));
    }

    expect(forwardIds).toEqual(allRows.map((row) => row.id));
    expect(new Set(forwardIds).size).toBe(allRows.length);
    expect(afterCursorLengths.size).toBe(1);
    expect([...afterCursorLengths][0]).toBeLessThan(300);

    const finalAfterCursor = page.afterCursor;
    const emptyDeltaPage = await findCursorPage({
      ctx: createContext({ pageSize, afterCursor: finalAfterCursor }),
      filter: {},
      scope: 'events:equal-timestamp',
      cursorField: 'ingestId',
      defaultPageSize: pageSize,
      maxPageSize: pageSize,
      findRows,
    });
    expect(emptyDeltaPage.rows).toEqual([]);
    expect(emptyDeltaPage.afterCursor).toBe(finalAfterCursor);
  });

  it('returns later ingests even when their timestamp and UUID sort before the cursor boundary', async () => {
    const timestamp = '2026-07-11T01:00:00.000Z';
    const rows = [
      new TestRow('ffffffff-ffff-4fff-bfff-fffffffffff1', timestamp, 1),
      new TestRow('ffffffff-ffff-4fff-bfff-fffffffffff2', timestamp, 2),
    ];
    const findRows = createInMemoryFindRows(rows);
    const initialPage = await findCursorPage({
      ctx: createContext({ pageSize: 2 }),
      filter: {},
      scope: 'events:live',
      cursorField: 'ingestId',
      defaultPageSize: 2,
      maxPageSize: 10,
      findRows,
    });

    rows.push(new TestRow('00000000-0000-4000-8000-000000000001', timestamp, 3));
    const deltaPage = await findCursorPage({
      ctx: createContext({ pageSize: 2, afterCursor: initialPage.afterCursor }),
      filter: {},
      scope: 'events:live',
      cursorField: 'ingestId',
      defaultPageSize: 2,
      maxPageSize: 10,
      findRows,
    });

    expect(deltaPage.rows.map((row) => row.id)).toEqual(['00000000-0000-4000-8000-000000000001']);
  });

  it('uses the requested feed cursor field for filters, ordering, and cursor validation', async () => {
    const rows = [
      new TestRow(ROW_IDS[0], '2026-07-11T01:00:00.000Z', 20, 1),
      new TestRow(ROW_IDS[1], '2026-07-11T01:00:00.000Z', 10, 2),
    ];
    const findRows = createInMemoryFindRows(rows);
    const initialPage = await findCursorPage({
      ctx: createContext({ pageSize: 1 }),
      filter: { sessionId: 'session-1' },
      scope: 'events:session-1',
      cursorField: 'sessionIngestId',
      defaultPageSize: 1,
      maxPageSize: 10,
      findRows,
    });

    expect(initialPage.rows.map((row) => row.id)).toEqual([ROW_IDS[1]]);
    const olderPage = await findCursorPage({
      ctx: createContext({ pageSize: 1, beforeCursor: initialPage.beforeCursor }),
      filter: { sessionId: 'session-1' },
      scope: 'events:session-1',
      cursorField: 'sessionIngestId',
      defaultPageSize: 1,
      maxPageSize: 10,
      findRows,
    });
    expect(olderPage.rows.map((row) => row.id)).toEqual([ROW_IDS[0]]);
  });
});
