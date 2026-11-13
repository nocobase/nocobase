// @vitest-environment node
import type { Knex } from 'knex';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Caller } from '../server/access/caller.js';
import { matchesLabels } from '../server/services/codec.js';
import {
  decodeApp,
  type ListAppsOptions,
} from '../server/services/releases.js';
import {
  createFakeDriver,
  createHarness,
  testKeyScope,
  type Harness,
} from './harness.js';

// One migrated fixture per suite. Queries are observed only during listApps, never during setup or the reference read.
describe('database app pagination', () => {
  let h: Harness;
  let admin: Caller;
  let related: Caller;
  let knex: Knex;
  let table: string;
  let baseline: ReturnType<typeof decodeApp>[];
  const calls: { environmentId: string; ids: readonly string[] }[] = [];
  let statusFails = false;

  beforeAll(async () => {
    const fake = createFakeDriver('paging');
    h = await createHarness({
      drivers: [
        {
          ...fake.driver,
          async open(environment, options) {
            const session = await fake.driver.open(environment, options);
            return {
              ...session,
              async status(ids: readonly string[] = []) {
                calls.push({ environmentId: environment.id, ids: [...ids] });
                if (statusFails) throw new Error('Runtime unavailable');
                return new Map(
                  ids.map((id) => [
                    id,
                    {
                      version: null,
                      deploymentId: null,
                      startedAt: null,
                      error: null,
                      state:
                        Number(id.slice(-4)) % 3 === 0
                          ? ('running' as const)
                          : ('stopped' as const),
                    },
                  ]),
                );
              },
            };
          },
        },
      ],
    });
    admin = await h.as('admin', 'admin');
    related = await h.as('dev', 'contributor');
    for (const id of ['preview', 'staging', 'other'])
      await h.environment({ id, name: id, driver: 'paging' });
    const connection = h.database.connection();
    knex = await connection.client<Knex>();
    table = (await connection.collections.getPhysical('relApps'))!.tableName;
    const rows = Array.from({ length: 2600 }, (_, i) => ({
      id: `app-${String(i).padStart(4, '0')}`,
      name: i === 3 ? 'Literal a_b 50% bang! slash\\' : `App ${i}`,
      environmentId: i < 2000 ? 'preview' : i < 2300 ? 'staging' : 'other',
      description: 'x'.repeat(4096),
      enabled: true,
      activation: 'eager',
      labels: JSON.stringify({
        team: i % 2 ? 'red' : 'blue',
        payload: 'x'.repeat(1024),
      }),
      createdBy: i % 4 === 0 ? 'dev' : 'admin',
      createdVia: 'human',
      // A tie spanning batch boundaries, followed by adjacent millisecond instants in both directions.
      createdAt: new Date(Date.UTC(2026, 10, 1) + (i < 600 ? 123 : i)),
      updatedAt: new Date(Date.UTC(2026, 10, 1)),
    }));
    for (let i = 0; i < rows.length; i += 40)
      await connection.query
        .insertInto('relApps')
        .values(rows.slice(i, i + 40))
        .execute();
    baseline = (
      await connection.query
        .selectFrom('relApps')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .orderBy('id', 'desc')
        .execute()
    ).map(decodeApp);
    h.application.related.set('dev', ['app-0001', 'app-0002', 'app-2001']);
  });
  afterAll(async () => {
    await h?.close();
  });

  const expected = (
    options: ListAppsOptions,
    visible: (app: (typeof baseline)[number]) => boolean = () => true,
  ) => {
    const environments = [
      ...(options.environmentId ? [options.environmentId] : []),
      ...(options.environmentIds ?? []),
    ];
    const search = options.search?.trim().toLowerCase();
    const rows = baseline.filter(
      (app) =>
        visible(app) &&
        (!environments.length || environments.includes(app.environmentId)) &&
        (!search ||
          app.id.toLowerCase().includes(search) ||
          app.name.toLowerCase().includes(search)) &&
        matchesLabels(app.labels, options.labels) &&
        (!options.runStates?.length ||
          options.runStates.includes(
            Number(app.id.slice(-4)) % 3 === 0 ? 'running' : 'stopped',
          )),
    );
    const size = options.pageSize ?? 24;
    const page = Math.min(
      options.page ?? 1,
      Math.max(1, Math.ceil(rows.length / size)),
    );
    return {
      total: rows.length,
      page,
      pageSize: size,
      ids: rows.slice((page - 1) * size, page * size).map((app) => app.id),
    };
  };
  const check = async (
    caller: Caller,
    options: ListAppsOptions,
    visible?: (app: (typeof baseline)[number]) => boolean,
  ) => {
    const actual = await h.services.releases.listApps(caller, options);
    expect({
      total: actual.total,
      page: actual.page,
      pageSize: actual.pageSize,
      ids: actual.items.map((item) => item.app.id),
    }).toEqual(expected(options, visible));
    return actual;
  };

  it('matches full-scan ordering, totals and corrected pages for independent and combined filters', async () => {
    for (const filters of [
      {},
      { search: 'APP-0' },
      { labels: { team: 'red' } },
      { search: 'app-1', labels: { team: 'blue' } },
      { search: 'app-1', runStates: ['stopped'] as const },
      { runStates: ['running'] as const },
      {
        search: 'app-1',
        labels: { team: 'blue' },
        runStates: ['running', 'stopped'] as const,
      },
      {
        environmentIds: ['preview', 'staging'],
        labels: { team: 'red' },
        runStates: ['running'] as const,
      },
      { labels: { team: 'missing' } },
    ])
      for (const page of [1, 6, 999])
        await check(admin, {
          environmentId: 'preview',
          pageSize: 100,
          ...filters,
          page,
        });
    // Exactly ten full pages of red labels must keep a full last page when corrected.
    const last = await check(admin, {
      environmentId: 'preview',
      labels: { team: 'red' },
      page: 999,
      pageSize: 100,
    });
    expect(last.items).toHaveLength(100);
  });

  it('treats %, _, ! and backslash as literal text, case insensitively', async () => {
    for (const search of ['a_b', '50%', 'bang!', 'slash\\', 'APP-0003']) {
      const result = await check(admin, { search });
      expect(result.total).toBe(1);
    }
  });

  it('keeps createdBy union related ids intersected with only, including an empty scope and hidden searches', async () => {
    const own = (app: (typeof baseline)[number]) =>
      app.createdBy === 'dev' ||
      ['app-0001', 'app-0002', 'app-2001'].includes(app.id);
    for (const caller of [admin, related])
      for (const only of [
        undefined,
        [],
        ['app-0000', 'app-0001', 'app-0003', 'app-2001'],
      ]) {
        const scoped = only
          ? {
              ...caller,
              keyScope: testKeyScope({
                actions: ['rel.apps/view'],
                apps: only,
              }),
            }
          : caller;
        const visible = (app: (typeof baseline)[number]) =>
          (caller === admin || own(app)) && (!only || only.includes(app.id));
        for (const options of [
          {},
          { search: 'app-0003' },
          {
            labels: { team: 'red' },
            runStates: ['running', 'stopped'] as const,
          },
        ])
          await check(scoped, { pageSize: 100, page: 99, ...options }, visible);
      }
    const nobody = await h.as('nobody', 'nobody');
    await expect(h.services.releases.listApps(nobody)).rejects.toMatchObject({
      status: 'PERMISSION_DENIED',
    });
  });

  it('keeps large explicit scopes within SQLite expression depth', async () => {
    const only = baseline.slice(0, 1600).map((app) => app.id);
    await check(
      {
        ...admin,
        keyScope: testKeyScope({ actions: ['rel.apps/view'], apps: only }),
      },
      { environmentId: 'preview', pageSize: 100, page: 99 },
      (app) => only.includes(app.id),
    );
  });

  it('bounds single- and cross-environment reads and reuses each environment status', async () => {
    for (const scope of [
      { environmentId: 'preview' },
      {},
      { environmentIds: ['preview', 'staging'] },
    ]) {
      const environmentIds = [
        ...(scope.environmentId ? [scope.environmentId] : []),
        ...(scope.environmentIds ?? []),
      ];
      const candidates = baseline.filter(
        (app) =>
          !environmentIds.length || environmentIds.includes(app.environmentId),
      );
      for (const filters of [
        {},
        { labels: { team: 'red' } },
        { runStates: ['running'] as const },
        { labels: { team: 'red' }, runStates: ['running'] as const },
      ]) {
        const reads: { sql: string; rows: Record<string, unknown>[] }[] = [];
        const observe = (response: unknown, query: { sql: string }) => {
          if (
            query.sql.toLowerCase().startsWith('select') &&
            query.sql.includes(table)
          )
            reads.push({
              sql: query.sql,
              rows: Array.isArray(response)
                ? response
                : [response as Record<string, unknown>],
            });
        };
        const options = { ...scope, pageSize: 100, ...filters };
        calls.length = 0;
        knex.on('query-response', observe);
        try {
          await check(admin, options);
        } finally {
          knex.off('query-response', observe);
        }
        const full = reads.filter((read) =>
          read.rows.some((row) => 'description' in row),
        );
        expect(full).toHaveLength(1);
        expect(full[0]!.rows.length).toBeLessThanOrEqual(100);
        const batches = reads.filter((read) =>
          read.rows.some((row) => 'labels' in row && !('description' in row)),
        );
        if ('labels' in filters || 'runStates' in filters) {
          expect(batches).toHaveLength(Math.ceil(candidates.length / 500));
          for (const batch of batches) {
            expect(batch.rows.length).toBeLessThanOrEqual(500);
            expect(Object.keys(batch.rows[0]!).sort()).toEqual(
              ['id', 'environmentId', 'createdAt', 'labels'].sort(),
            );
          }
          // Batches include one empty end probe only on an exact multiple; full page and summary join add two.
          expect(reads).toHaveLength(Math.floor(candidates.length / 500) + 3);
        } else {
          expect(batches).toHaveLength(0);
          expect(reads).toHaveLength(3);
        }
        const pageIds = new Set(expected(options).ids);
        const statusApps =
          'runStates' in filters
            ? candidates.filter((app) =>
                matchesLabels(app.labels, filters.labels),
              )
            : baseline.filter((app) => pageIds.has(app.id));
        const grouped = new Map<string, string[]>();
        for (const app of statusApps)
          grouped.set(app.environmentId, [
            ...(grouped.get(app.environmentId) ?? []),
            app.id,
          ]);
        expect(
          calls
            .map((call) => ({
              environmentId: call.environmentId,
              ids: [...call.ids].sort(),
            }))
            .sort((a, b) => a.environmentId.localeCompare(b.environmentId)),
        ).toEqual(
          [...grouped]
            .map(([environmentId, ids]) => ({ environmentId, ids: ids.sort() }))
            .sort((a, b) => a.environmentId.localeCompare(b.environmentId)),
        );
      }
    }
  });

  it('queries each candidate environment once and reuses failed statuses in summaries', async () => {
    calls.length = 0;
    await check(admin, {
      environmentIds: ['preview', 'staging', 'other'],
      labels: { team: 'red' },
      runStates: ['running'],
      pageSize: 100,
    });
    expect(calls.map((call) => call.environmentId).sort()).toEqual([
      'other',
      'preview',
      'staging',
    ]);
    statusFails = true;
    calls.length = 0;
    try {
      const page = await h.services.releases.listApps(admin, {
        environmentId: 'preview',
        runStates: ['unknown'],
        pageSize: 100,
      });
      expect(page.total).toBe(2000);
      expect(page.items).toHaveLength(100);
      expect(
        page.items.every(
          (item) => item.runtime.error === 'Runtime unavailable',
        ),
      ).toBe(true);
      expect(calls).toHaveLength(1);
    } finally {
      statusFails = false;
    }
    calls.length = 0;
    await check(admin, { labels: { team: 'missing' }, runStates: ['running'] });
    expect(calls).toHaveLength(0);
  });
});
