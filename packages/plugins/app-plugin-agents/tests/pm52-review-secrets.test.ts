import { afterEach, expect, it } from 'vitest';

import { claim, createHarness, type Harness } from './harness.js';

/**
 * The PM-52 review's cases, under the rule that a variable marked for team runners only keeps a run off personal
 * runners: the mark is read in the claim's own transaction, from the payload assembled with the run's real inputs.
 */
let h: Harness;
afterEach(async () => {
  await h?.close();
});

it('does not deliver a variable marked team-only just before the claim transaction', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
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
  let marked = false;
  h.services.briefs.sections.register({
    key: 'review-mark',
    prepare: async () => {
      await h.services.variables.set(
        h.scopes[0],
        'REVIEW_TOKEN',
        undefined,
        'owner',
        { teamRunnersOnly: true },
      );
      marked = true;
      return null;
    },
    section: () => null,
  });
  const delivered = await claim(h, runner);
  expect(marked).toBe(true);
  expect(delivered).toEqual([]);
  expect(
    (await h.services.variables.audits(h.scopes[0])).some(
      (audit) => audit.action === 'deliver',
    ),
  ).toBe(false);
});

it('decides by the scope the real run inputs select', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  await h.services.variables.set(
    { scope: 'team', scopeId: 't-1' },
    'REVIEW_TOKEN',
    'synthetic-test-value',
    'owner',
    { teamRunnersOnly: true },
  );
  const provider = h.services.subjects.get('sample')!.context;
  const assemble = provider.assemble.bind(provider);
  provider.assemble = async (conn, context) => ({
    ...(await assemble(conn, context)),
    scopes: context.inputs.length ? [{ scope: 'team', scopeId: 't-1' }] : [],
  });
  await h.enqueue(agentId);
  const personal = await h.registerRunner({
    trust: 'ownerOnly',
    ownerUserId: 'owner',
  });
  expect(await claim(h, personal)).toEqual([]);
  const [payload] = await claim(h, await h.registerRunner());
  expect(payload.workspace.env).toEqual([
    { name: 'REVIEW_TOKEN', value: 'synthetic-test-value' },
  ]);
});
