import { afterEach, expect, it } from 'vitest';
import type { Knex } from 'knex';
import { createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => h?.close());

it('reads unique causal identities in a batch, including missing runs and empty inputs', async () => {
  h = await createHarness();
  const agent = await h.createAgent();
  const first = await h.enqueue(agent, '1');
  const second = await h.enqueue(agent, '2');
  await h.services.runs.addInput(first, {
    type: 'comment',
    actor: { kind: 'user', id: 'owner', name: 'Owner' },
    text: 'A second input',
    payload: { commentId: 'comment-2', commentSourceSnapshot: true },
  });
  const conn = h.database.connection();
  await conn
    .repository('agRunInputs')
    .deleteMany({ filter: { runId: second } });
  const expected = new Map([
    [first, await h.services.runs.identityInputs(conn, first)],
    [second, await h.services.runs.identityInputs(conn, second)],
  ]);
  const queries: string[] = [];
  const client = await conn.client<Knex>();
  const listener = (query: { sql: string }) => queries.push(query.sql);
  client.on('query', listener);
  try {
    expect(await h.services.runs.identityInputsMany(conn, [])).toEqual(
      new Map(),
    );
    expect(queries).toHaveLength(0);
    expect(
      await h.services.runs.identityInputsMany(conn, [
        second,
        first,
        first,
        'missing',
      ]),
    ).toEqual(expected);
    expect(queries).toHaveLength(2);
    expect(queries.every((sql) => /^select /iu.test(sql))).toBe(true);
  } finally {
    client.off('query', listener);
  }
  // The connection belongs to the caller; no identities survive into a later read.
  await h.services.runs.addInput(first, {
    type: 'comment',
    actor: { kind: 'user', id: 'owner', name: 'Owner' },
    text: 'Fresh input',
  });
  expect(
    (await h.services.runs.identityInputsMany(conn, [first])).get(first)
      ?.inputs,
  ).toHaveLength(3);
});
