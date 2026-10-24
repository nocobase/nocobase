import type { Knex } from 'knex';
import { afterEach, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => h?.close());

it.each([1, 10, 50])(
  'keeps page reads fixed with %s runners and agents, without writes',
  async (n) => {
    const counts = new Map<string, number>([
      ['/agents', 6],
      ['/agents/available', 5],
      // Native chat also reads model services and the configured default once per catalog.
      ['/agents/chatAgents', 8],
      ['/agents/runners', 4],
      ['/agents/runners/:id', 5],
      ['/agents/runners/:id/runs', 2],
    ]);
    h = await createHarness();
    const models = Array.from({ length: n }, (_, index) => ({
      id: `quota-model-${index}`,
    }));
    let runnerId = '';
    for (let index = 0; index < n; index++) {
      runnerId = (
        await h.registerRunner({
          ownerUserId: 'alice',
          trust: 'team',
          tools: [{ kind: 'codex', authenticated: true, models }],
        })
      ).runnerId;
    }
    // A runner's report no longer creates an agent by itself: create and enable one for each reported model, as
    // this test needs to exercise reads that scale with the number of agents, not with how they came to exist.
    for (const model of models)
      await h.services.agents.createFromAvailable(
        { tool: 'codex', model: model.id, description: 'Reviews' },
        'alice',
      );
    const client = await h.database.connection().client<Knex>();
    for (const endpoint of [
      '/agents',
      '/agents/available',
      '/agents/chatAgents',
      '/agents/runners',
      `/agents/runners/${runnerId}`,
      `/agents/runners/${runnerId}/runs`,
    ]) {
      const request = () =>
        h.request('GET', endpoint, {
          user: 'alice',
          can: ['agents.agents/read', 'agents.runners/read'],
        });
      await request();
      {
        const sql: string[] = [];
        const listen = (query: { sql: string }) => sql.push(query.sql);
        client.on('query', listen);
        const result = await request();
        client.off('query', listen);
        expect(result.status).toBe(200);
        const name = endpoint.replace(runnerId, ':id');
        const reads = sql.filter((query) => /^select/i.test(query)).length;
        const writes = sql.filter((query) =>
          /^(insert|update|delete)/i.test(query),
        ).length;
        expect(writes).toBe(0);
        expect(reads).toBe(counts.get(name));
      }
    }
  },
);
it('bounds directory rows to one page and excludes private detail fields from the runtime list', async () => {
  h = await createHarness();
  const runner = await h.registerRunner({ ownerUserId: 'alice' });
  const conn = h.database.connection();
  const workspaces = Array.from({ length: 1000 }, (_, i) => ({
    workDir: `/work/PM-${i}`,
    lastUsedAt: h.clock.now().toISOString(),
    sizeBytes: 1024,
    unpushed: false,
  }));
  await conn.query
    .updateTable('agRunners')
    .set({
      workspaceUsage: {
        disk: null,
        count: 1000,
        unpushedCount: 0,
        measuredAt: h.clock.now().toISOString(),
        workspaces,
      },
    })
    .where('id', '=', runner.runnerId)
    .execute();
  const detail = await h.request('GET', `/agents/runners/${runner.runnerId}`, {
    user: 'alice',
  });
  expect(detail.body.data.workspaceUsage.count).toBe(1000);
  expect(detail.body.data.workspaceUsage.workspaces).toEqual([]);
  const list = await h.request('GET', '/agents/runners', { user: 'alice' });
  for (const field of [
    'policy',
    'variables',
    'unavailableModels',
    'quotaUsage',
    'load',
    'quotaRevision',
  ])
    expect(list.body.data[0]).not.toHaveProperty(field);
  const page = await h.request(
    'GET',
    `/agents/runners/${runner.runnerId}/workspaces?page=2&pageSize=25&unknown=ignored`,
    { user: 'alice' },
  );
  expect(page.status).toBe(200);
  expect(page.body.data).toHaveLength(25);
  expect(page.body.data[0].workDir).toBe('/work/PM-25');
  expect(page.body.meta).toMatchObject({ total: 1000, page: 2, pageSize: 25 });
  expect(
    (
      await h.request(
        'GET',
        `/agents/runners/${runner.runnerId}/workspaces?pageSize=101`,
        { user: 'alice' },
      )
    ).status,
  ).toBe(400);
});
it('loads only the first input payload for each run in one query', async () => {
  h = await createHarness();
  const agent = await h.createAgent();
  const ids = await Promise.all([
    h.enqueue(agent, 'first'),
    h.enqueue(agent, 'second'),
  ]);
  const conn = h.database.connection();
  for (const id of ids)
    for (let i = 0; i < 20; i++)
      await conn.query
        .insertInto('agRunInputs')
        .values({
          id: `later-${id}-${i}`,
          runId: id,
          type: 'comment',
          actorKind: 'user',
          actorId: 'alice',
          actorName: 'Alice',
          text: 'later',
          payload: { later: true, content: 'x'.repeat(1000) },
          createdAt: '2030-01-01T00:00:00Z',
          deliveredAt: null,
          handledAt: null,
        })
        .execute();
  const client = await conn.client<Knex>();
  let rows = 0;
  const record = (answer: unknown) => {
    if (Array.isArray(answer)) rows += answer.length;
  };
  client.on('query-response', record);
  let result;
  try {
    result = await h.services.runs.inputTriggers(ids);
  } finally {
    client.off('query-response', record);
  }
  expect(rows).toBe(2);
  for (const id of ids) {
    expect(result.get(id)).toHaveLength(1);
    expect(result.get(id)?.[0].payload).not.toHaveProperty('later');
  }
});
