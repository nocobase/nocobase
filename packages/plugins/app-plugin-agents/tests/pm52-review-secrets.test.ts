import { afterEach, expect, it } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  await h?.close();
});

it('does not deliver after scope management access is revoked before the claim transaction', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  let mayManage = true;
  h.services.scopes.register({
    key: 'team',
    title: { key: 'scopes.team', ns: 'test' },
    access: async () => ({ visible: true, manage: mayManage }),
  });
  h.scopes = [{ scope: 'team', scopeId: 't-1' }];
  await h.services.variables.set(
    h.scopes[0],
    'REVIEW_TOKEN',
    'synthetic-test-value',
    'owner',
  );
  await h.enqueue(agentId);
  const runner = await h.registerRunner({
    trust: 'ownerOnly',
    ownerUserId: 'owner',
  });
  h.services.briefs.sections.register({
    key: 'review-revoke',
    prepare: async () => {
      mayManage = false;
      return null;
    },
    section: () => null,
  });
  const delivered = await claim(h, runner);
  expect(mayManage).toBe(false);
  expect(delivered).toEqual([]);
});

it('claims an authorized scope selected by the real run inputs', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  h.services.scopes.register({
    key: 'team',
    title: { key: 'scopes.team', ns: 'test' },
    access: async () => ({ visible: true, manage: true }),
  });
  await h.services.variables.set(
    { scope: 'team', scopeId: 't-1' },
    'REVIEW_TOKEN',
    'synthetic-test-value',
    'owner',
  );
  const provider = h.services.subjects.get('sample')!.context;
  const assemble = provider.assemble.bind(provider);
  provider.assemble = async (conn, context) => ({
    ...(await assemble(conn, context)),
    scopes: context.inputs.length ? [{ scope: 'team', scopeId: 't-1' }] : [],
  });
  await h.enqueue(agentId);
  const runner = await h.registerRunner({
    trust: 'ownerOnly',
    ownerUserId: 'owner',
  });
  expect((await claim(h, runner)).length).toBe(1);
});
