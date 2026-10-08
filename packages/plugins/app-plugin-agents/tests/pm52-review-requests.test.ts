import { afterEach, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness.js';
import { RUN_REQUEST_TTL_MS } from '../server/core/runs/index.js';
let h: Harness;
afterEach(async () => {
  await h?.close();
});

it('does not revive a request whose expiry passed during owner reassignment', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const result = await h.services.runs.enqueue({
    agentId,
    subject: { kind: 'sample', id: '1' },
    responsibleUserId: 'alice',
    requestedByUserId: 'bob',
    input: {
      type: 'comment',
      actor: { kind: 'user', id: 'bob', name: 'Bob' },
      text: 'Synthetic request',
    },
  });
  expect(result.outcome).toBe('pending');
  h.clock.advance(RUN_REQUEST_TTL_MS + 1);
  const reassigned = await h.services.runs.requests.reassign({
    subject: { kind: 'sample', id: '1' },
    toUserId: 'bob',
    byUserId: 'carol',
  });
  expect(reassigned.queued).toEqual([]);
  expect(await h.services.runs.list({ subjectKind: 'sample' })).toEqual([]);
});

it('retains a scheduled enqueue time after confirmation', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const fireAt = new Date(h.clock.now().getTime() + 60_000).toISOString();
  const result = await h.services.runs.enqueue({
    agentId,
    subject: { kind: 'sample', id: '1' },
    fireAt,
    responsibleUserId: 'alice',
    requestedByUserId: 'bob',
    input: {
      type: 'signal',
      actor: { kind: 'user', id: 'bob', name: 'Bob' },
      text: 'Scheduled synthetic request',
    },
  });
  if (result.outcome !== 'pending') throw new Error('Expected pending request');
  const confirmed = await h.services.runs.requests.confirm(
    result.requestId,
    'alice',
  );
  expect((await h.services.runs.get(confirmed.run.runId)).availableAt).toBe(
    fireAt,
  );
});
