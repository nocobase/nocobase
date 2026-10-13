import { afterEach, expect, it } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';
let h: Harness;
afterEach(async () => {
  await h?.close();
});

it('prepares subject permissions before the claim holds the database connection', async () => {
  h = await createHarness();
  const agent = await h.createAgent();
  const provider = h.services.subjects.get('sample')!.context;
  const assemble = provider.assemble.bind(provider);
  let prepared = 0;
  provider.prepare = async () => {
    await h.services.tx.read().repository('agAgents').findMany();
    prepared += 1;
    return new Set(['fixture-permission']);
  };
  provider.assemble = async (conn, context, permissions) => {
    expect(permissions).toEqual(new Set(['fixture-permission']));
    return assemble(conn, context);
  };
  const runner = await h.registerRunner();
  await h.enqueue(agent, 'subject-prepare');
  expect(await claim(h, runner)).toHaveLength(1);
  expect(prepared).toBe(1);
});
