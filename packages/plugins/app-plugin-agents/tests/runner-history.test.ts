import type { Knex } from 'knex';
import { afterEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness.js';

describe('runner history pagination', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  it('pages tied start times and nulls without offsets, including a deep page and a deleted cursor row', async () => {
    h = await createHarness();
    const { runnerId } = await h.registerRunner();
    const agentId = await h.createAgent();
    const repo = h.database.connection().repository('agRuns');
    const expected: string[] = [];
    // Created time deliberately reverses the requested start-time ordering.
    for (let i = 0; i < 85; i++) {
      const id = String(i).padStart(4, '0');
      const startedAt =
        i < 35
          ? null
          : new Date(i < 60 ? '2026-10-27T10:00:00Z' : '2026-10-28T10:00:00Z');
      await repo.createOne({
        values: {
          id,
          agentId,
          runnerId,
          startedAt,
          subjectKind: 'sample',
          subjectId: '1',
          threadScope: 'main',
          actorUserId: 'owner',
          status: 'completed',
          createdAt: new Date(Date.UTC(2026, 9, 29, 0, 0, 85 - i)),
          updatedAt: new Date(),
        },
      });
      expected.unshift(id);
    }
    const url = `/agents/runners/${runnerId}/runs`;
    const detail = await h.request('GET', `/agents/runners/${runnerId}`, {
      user: 'owner',
    });
    expect(detail.body.data.recentRunsCount).toBe(85);
    const client = await h.database.connection().client<Knex>();
    await h.request('GET', url, { user: 'owner' });
    const seen: string[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 5; page++) {
      const statements: string[] = [];
      const listen = ({ sql }: { sql: string }) => statements.push(sql);
      client.on('query', listen);
      let response;
      try {
        response = await h.request(
          'GET',
          url + (cursor ? `?cursor=${cursor}` : ''),
          { user: 'owner' },
        );
      } finally {
        client.off('query', listen);
      }
      expect(statements.filter((sql) => /^select/iu.test(sql))).toHaveLength(
        [4, 5, 6, 4, 4][page]!,
      );
      expect(
        statements.some((sql) =>
          /^(insert|update|delete|begin)\b|for update/iu.test(sql),
        ),
      ).toBe(false);
      expect(response.status).toBe(200);
      expect(response.body.meta.total).toBe(85);
      expect(response.body.data).toHaveLength(page === 4 ? 5 : 20);
      seen.push(...response.body.data.map((run: { id: string }) => run.id));
      cursor = response.body.meta.nextCursor;
      if (page === 0) {
        // New rows do not shift older pages, and a cursor does not depend on its row surviving.
        await repo.deleteMany({ filter: { id: seen.at(-1)! } });
        await repo.createOne({
          values: {
            id: 'new',
            agentId,
            runnerId,
            startedAt: new Date('2026-10-29T10:00:00Z'),
            subjectKind: 'sample',
            subjectId: '1',
            threadScope: 'main',
            actorUserId: 'owner',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
    expect(cursor).toBeNull();
    expect(seen).toEqual(expected);
    expect(new Set(seen).size).toBe(85);
  });

  it('validates cursors and preserves authentication and runner visibility', async () => {
    h = await createHarness();
    const { runnerId } = await h.registerRunner();
    const url = `/agents/runners/${runnerId}/runs`;
    expect((await h.request('GET', url)).status).toBe(401);
    expect((await h.request('GET', url, { user: 'stranger' })).status).toBe(
      404,
    );
    const bad = await h.request('GET', `${url}?cursor=bad`, { user: 'owner' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.reason).toBe('INVALID_INPUT');
    const empty = await h.request('GET', url, { user: 'owner' });
    expect(empty.body).toMatchObject({
      data: [],
      meta: { nextCursor: null, total: 0 },
    });
  });

  it.each([20, 21, 45])(
    'reports the exact tab count and continuation at the %i-row boundary',
    async (count) => {
      h = await createHarness();
      const { runnerId } = await h.registerRunner();
      for (let i = 0; i < count; i++) {
        await h.database
          .connection()
          .repository('agRuns')
          .createOne({
            values: {
              id: String(i),
              agentId: 'agent',
              runnerId,
              subjectKind: 'sample',
              subjectId: '1',
              threadScope: 'main',
              actorUserId: 'owner',
              startedAt: null,
              status: 'completed',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
      }
      expect(await h.services.runnerView.recentCount(runnerId)).toBe(count);
      const response = await h.request(
        'GET',
        `/agents/runners/${runnerId}/runs`,
        { user: 'owner' },
      );
      expect(response.body.data).toHaveLength(20);
      if (count === 20) expect(response.body.meta.nextCursor).toBeNull();
      else expect(response.body.meta.nextCursor).toEqual(expect.any(String));
    },
  );
});
