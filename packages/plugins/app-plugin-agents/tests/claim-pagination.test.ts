import { afterEach, describe, expect, it, vi } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';
import { runsRepo } from '../server/core/runs/run.store.js';

interface QueryEvents {
  on(event: 'query', listener: (query: { sql: string }) => void): void;
  off(event: 'query', listener: (query: { sql: string }) => void): void;
}

describe('bounded claim candidate pages', () => {
  let h: Harness;
  afterEach(async () => h?.close());

  async function fixture(blockers: number, targets = 1, compatible = false) {
    h = await createHarness();
    const conn = h.database.connection();
    if (blockers) {
      const excluded = await h.createAgent({
        modelEntries: [{ tool: compatible ? 'claude' : 'codex', model: null }],
      });
      const seedId = await h.enqueue(excluded, 'blocker-0');
      const { revision: _revision, ...seed } = (await runsRepo(conn).findOne({
        filter: { id: seedId },
      }))!;
      await runsRepo(conn).deleteMany({ filter: { id: seedId } });
      await runsRepo(conn).createMany({
        values: Array.from({ length: blockers }, (_, index) => ({
          ...seed,
          id: `blocker-${String(index).padStart(3, '0')}`,
          subjectId: `blocker-${index}`,
          priority: -1,
        })),
      });
    }
    const agent = await h.createAgent({ maxConcurrentRuns: targets });
    const ids: string[] = [];
    for (let index = 0; index < targets; index += 1)
      ids.push((await h.enqueue(agent, `target-${index}`))!);
    const runner = await h.registerRunner({ slots: targets });
    return { conn, ids, runner, agent };
  }

  it.each([0, 49, 50, 99, 100, 149, 150, 200])(
    'claims past %i incompatible runs within the three-page cap',
    async (blockers) => {
      const { conn, ids, runner } = await fixture(blockers);
      const queries: string[] = [];
      const knex = await conn.client<QueryEvents>();
      const onQuery = ({ sql }: { sql: string }) => queries.push(sql);
      knex.on('query', onQuery);
      const start = performance.now();
      let payloads;
      try {
        payloads = await claim(h, runner);
      } finally {
        knex.off('query', onQuery);
      }
      const counts = Object.fromEntries(
        [
          'select',
          'insert',
          'update',
          'delete',
          'begin',
          'commit',
          'rollback',
        ].map((kind) => [
          kind,
          queries.filter((sql) => new RegExp(`^\\s*${kind}\\b`, 'iu').test(sql))
            .length,
        ]),
      );
      const candidatePages = queries.filter(
        (sql) =>
          /^\s*select/iu.test(sql) &&
          /["`]ag_runs["`]/u.test(sql) &&
          /order by.*priority/iu.test(sql),
      );
      process.stdout.write(
        `claim-pagination-cost ${JSON.stringify({ blockers, total: queries.length, ...counts, other: queries.length - Object.values(counts).reduce((a, b) => a + b, 0), candidatePages: candidatePages.length, elapsedMs: Math.round(performance.now() - start) })}\n`,
      );
      expect(candidatePages).toHaveLength(
        Math.min(3, Math.floor(blockers / 50) + 1),
      );
      expect(payloads.map((payload) => payload.run.id)).toEqual(
        blockers < 150 ? ids : [],
      );
      expect((await h.services.runs.get(ids[0]!)).status).toBe(
        blockers < 150 ? 'dispatched' : 'queued',
      );
      if (blockers >= 150) {
        // After preceding work leaves the queue, the next normal poll starts again at its head.
        await runsRepo(conn).deleteMany({
          filter: (f) =>
            f.or(
              Array.from({ length: blockers - 100 }, (_, i) =>
                f.string('id').eq(`blocker-${String(i).padStart(3, '0')}`),
              ),
            ),
        });
        expect(
          (await claim(h, runner)).map((payload) => payload.run.id),
        ).toEqual(ids);
      }
    },
  );

  it('shares the page cap across all slots in one request', async () => {
    const { ids, runner } = await fixture(149, 3);
    const payloads = await claim(h, runner, 3);
    expect(payloads).toHaveLength(1);
    expect(ids).toContain(payloads[0].run.id);
    expect(
      (await claim(h, runner, 2)).map((payload) => payload.run.id),
    ).toHaveLength(1);
  });

  it('retains the rest of a loaded page after a successful claim', async () => {
    const { ids, runner } = await fixture(50, 3);
    expect(
      new Set((await claim(h, runner, 3)).map((payload) => payload.run.id)),
    ).toEqual(new Set(ids));
  });

  it('does not skip work when preceding rows leave between pages or reconsider moved seen rows', async () => {
    const { conn, ids, runner } = await fixture(50, 1, true);
    const sample = h.services.subjects.get('sample')!;
    await runsRepo(conn).updateMany({
      filter: { status: 'queued' },
      values: { subjectKind: 'pagination' },
    });
    const visited: string[] = [];
    h.services.subjects.register({
      ...sample,
      kind: 'pagination',
      runnerPin: {
        pin: async () => true,
        runnerOf: async (_conn, run) => {
          visited.push(run.id);
          if (run.id === 'blocker-049') {
            await runsRepo(conn).deleteMany({ filter: { id: 'blocker-000' } });
            await runsRepo(conn).updateMany({
              filter: { id: 'blocker-001' },
              values: {
                createdAt: new Date(h.clock.now().getTime() + 1).toISOString(),
              },
            });
          }
          return run.subject.id.startsWith('blocker-')
            ? 'another-runner'
            : null;
        },
      },
    });
    expect((await claim(h, runner)).map((payload) => payload.run.id)).toEqual(
      ids,
    );
    expect(visited.filter((id) => id === 'blocker-001')).toHaveLength(1);
  });
  it('preserves priority, timestamp and id ordering across page boundaries', async () => {
    const { conn, ids, runner } = await fixture(100);
    // All three sort axes cross a page boundary; an availableAt in the future remains excluded.
    await runsRepo(conn).updateMany({
      filter: { id: 'blocker-000' },
      values: { priority: -3 },
    });
    await runsRepo(conn).updateMany({
      filter: { id: 'blocker-050' },
      values: {
        createdAt: new Date(h.clock.now().getTime() - 1).toISOString(),
      },
    });
    await runsRepo(conn).updateMany({
      filter: { id: 'blocker-099' },
      values: {
        availableAt: new Date(h.clock.now().getTime() + 1).toISOString(),
      },
    });
    expect((await claim(h, runner)).map((payload) => payload.run.id)).toEqual(
      ids,
    );
  });

  it('stops reading pages after transactional recheck finds the runner full', async () => {
    const { conn, runner } = await fixture(100, 1, true);
    vi.spyOn(h.services.slots, 'held').mockResolvedValue({
      jobs: 0,
      runs: 1,
      byTool: { claude: 1 },
    });
    const knex = await conn.client<QueryEvents>();
    const pages: string[] = [];
    const onQuery = ({ sql }: { sql: string }) => {
      if (/order by.*priority/iu.test(sql)) pages.push(sql);
    };
    knex.on('query', onQuery);
    try {
      expect(await claim(h, runner)).toEqual([]);
    } finally {
      knex.off('query', onQuery);
    }
    expect(pages).toHaveLength(1);
  });
  it('hands out later-page work only once when runners claim concurrently', async () => {
    const { ids, runner } = await fixture(50, 2);
    const other = await h.registerRunner({ slots: 2 });
    const payloads = (
      await Promise.all([claim(h, runner, 2), claim(h, other, 2)])
    ).flat();
    expect(payloads).toHaveLength(ids.length);
    expect(new Set(payloads.map((payload) => payload.run.id))).toEqual(
      new Set(ids),
    );
  });

  it('leaves work reprioritized before the cursor for the next poll', async () => {
    const { conn, ids, runner } = await fixture(50, 1, true);
    const sample = h.services.subjects.get('sample')!;
    await runsRepo(conn).updateMany({
      filter: { status: 'queued' },
      values: { subjectKind: 'pagination' },
    });
    let moved = false;
    h.services.subjects.register({
      ...sample,
      kind: 'pagination',
      runnerPin: {
        pin: async () => true,
        runnerOf: async (_conn, run) => {
          if (run.id === 'blocker-049' && !moved) {
            moved = true;
            await runsRepo(conn).updateMany({
              filter: { id: ids[0]! },
              values: { priority: -2 },
            });
          }
          return run.subject.id.startsWith('blocker-')
            ? 'another-runner'
            : null;
        },
      },
    });
    expect(await claim(h, runner)).toEqual([]);
    expect((await claim(h, runner)).map((payload) => payload.run.id)).toEqual(
      ids,
    );
  });
  it.each([0, 100, 150])(
    'measures repeated authenticated claim requests behind %i incompatible runs',
    async (blockers) => {
      const { conn, runner, agent } = await fixture(blockers);
      const knex = await conn.client<QueryEvents>();
      for (let round = 0; round < 3; round += 1) {
        const queries: string[] = [];
        const onQuery = ({ sql }: { sql: string }) => queries.push(sql);
        knex.on('query', onQuery);
        const start = performance.now();
        let payloads;
        try {
          payloads = await claim(h, runner);
        } finally {
          knex.off('query', onQuery);
        }
        const counts = Object.fromEntries(
          [
            'select',
            'insert',
            'update',
            'delete',
            'begin',
            'commit',
            'rollback',
          ].map((kind) => [
            kind,
            queries.filter((sql) =>
              new RegExp(`^\\s*${kind}\\b`, 'iu').test(sql),
            ).length,
          ]),
        );
        process.stdout.write(
          `claim-poll-cost ${JSON.stringify({ blockers, round, total: queries.length, ...counts, elapsedMs: Math.round(performance.now() - start) })}\n`,
        );
        expect(payloads).toHaveLength(blockers < 150 ? 1 : 0);
        if (payloads.length) {
          const payload = payloads[0];
          expect(
            (
              await h.request(
                'POST',
                `/agents/runners/runs/${payload.run.id}/start`,
                {
                  runnerKey: runner.key,
                  body: {
                    workDir: '/work/sample',
                    adapter: { kind: 'claude' },
                    acceptsInput: true,
                  },
                },
              )
            ).status,
          ).toBe(200);
          expect(
            (
              await h.request(
                'POST',
                `/agents/runners/runs/${payload.run.id}/complete`,
                {
                  runnerKey: runner.key,
                  body: {
                    summary: 'Done.',
                    sessionId: `round-${round}`,
                    handledInputIds: payload.inputs.map(
                      (input: { id: string }) => input.id,
                    ),
                  },
                },
              )
            ).status,
          ).toBe(200);
          await h.enqueue(agent, `next-${round}`);
        }
      }
    },
  );
  it('shares the cap with the long-poll recheck and starts a fresh budget on the next request', async () => {
    const { conn, ids, runner } = await fixture(150);
    vi.spyOn(h.services.signal, 'wait').mockImplementation(async () => {
      await runsRepo(conn).deleteMany({ filter: { id: 'blocker-000' } });
      return 'notified';
    });
    const knex = await conn.client<QueryEvents>();
    const pages: string[] = [];
    const onQuery = ({ sql }: { sql: string }) => {
      if (/order by.*priority/iu.test(sql)) pages.push(sql);
    };
    knex.on('query', onQuery);
    let response;
    try {
      response = await h.request('POST', '/agents/runners/claim?wait=true', {
        runnerKey: runner.key,
        body: { free: 1 },
      });
    } finally {
      knex.off('query', onQuery);
    }
    expect(response.status).toBe(200);
    expect(response.body.data.runs).toEqual([]);
    expect(pages).toHaveLength(3);
    expect((await claim(h, runner)).map((payload) => payload.run.id)).toEqual(
      ids,
    );
  });

  it('uses the remaining long-poll budget when work becomes available during the wait', async () => {
    const { conn, ids, runner } = await fixture(49);
    await runsRepo(conn).updateMany({
      filter: { id: ids[0]! },
      values: {
        availableAt: new Date(h.clock.now().getTime() + 1).toISOString(),
      },
    });
    vi.spyOn(h.services.signal, 'wait').mockImplementation(async () => {
      await runsRepo(conn).updateMany({
        filter: { id: ids[0]! },
        values: { availableAt: null },
      });
      return 'notified';
    });
    const response = await h.request(
      'POST',
      '/agents/runners/claim?wait=true',
      { runnerKey: runner.key, body: { free: 1 } },
    );
    expect(response.status).toBe(200);
    expect(
      response.body.data.runs.map(
        (payload: { run: { id: string } }) => payload.run.id,
      ),
    ).toEqual(ids);
  });
  it('measures the complete capped long-poll request including its post-wait check', async () => {
    const { conn, runner } = await fixture(150);
    vi.spyOn(h.services.signal, 'wait').mockResolvedValue('timeout');
    const knex = await conn.client<QueryEvents>();
    for (let round = 0; round < 3; round += 1) {
      const queries: string[] = [];
      const onQuery = ({ sql }: { sql: string }) => queries.push(sql);
      knex.on('query', onQuery);
      let response;
      try {
        response = await h.request('POST', '/agents/runners/claim?wait=true', {
          runnerKey: runner.key,
          body: { free: 1 },
        });
      } finally {
        knex.off('query', onQuery);
      }
      const counts = Object.fromEntries(
        [
          'select',
          'insert',
          'update',
          'delete',
          'begin',
          'commit',
          'rollback',
        ].map((kind) => [
          kind,
          queries.filter((sql) => new RegExp(`^\\s*${kind}\\b`, 'iu').test(sql))
            .length,
        ]),
      );
      const candidatePages = queries.filter((sql) =>
        /order by.*priority/iu.test(sql),
      ).length;
      process.stdout.write(
        `claim-long-poll-cost ${JSON.stringify({ round, total: queries.length, ...counts, candidatePages })}\n`,
      );
      expect(response.status).toBe(200);
      expect(response.body.data.runs).toEqual([]);
      expect(candidatePages).toBe(3);
    }
  });
});
