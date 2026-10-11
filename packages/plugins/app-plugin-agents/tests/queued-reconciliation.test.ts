import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
});
afterEach(async () => {
  await h.close();
});
const signal = {
  type: 'signal' as const,
  actor: { kind: 'system' as const, id: 'system', name: 'System' },
  text: 'Old stage',
};
async function enqueue(
  agentId: string,
  actorUserId = 'owner',
  threadScope = 'main',
) {
  const result = await h.services.runs.enqueue({
    agentId,
    actorUserId,
    threadScope,
    subject: { kind: 'sample', id: '1' },
    input: signal,
  });
  return result.runId!;
}
async function cancel(runId: string, ids: string[]) {
  return h.services.runs.reconcileQueued({
    runId,
    expectedPendingInputIds: ids,
    operation: { type: 'cancel', byUserId: 'owner', detail: 'Left stage' },
  });
}
async function ids(runId: string) {
  return (
    await h.services.runs.pendingInputs(h.database.connection(), runId)
  ).map((input) => input.id);
}

describe('conditional queued reconciliation', () => {
  it('cancels precisely one actor and thread without withdrawing another run', async () => {
    const agentId = await h.createAgent();
    const first = await enqueue(agentId);
    const second = await enqueue(agentId, 'other');
    const thread = await enqueue(agentId, 'owner', 'separate');
    await h.services.runs.addInput(second, {
      ...signal,
      type: 'comment',
      text: 'Keep my comment',
    });
    expect(await cancel(first, await ids(first))).toBe('cancelled');
    expect((await h.services.runs.get(second)).status).toBe('queued');
    expect((await h.services.runs.get(thread)).status).toBe('queued');
  });

  it.each(['enqueue', 'addInput'] as const)(
    'rejects a stale cancellation after %s adds an input',
    async (path) => {
      const agentId = await h.createAgent();
      const runId = await enqueue(agentId);
      const snapshot = await ids(runId);
      if (path === 'enqueue') await enqueue(agentId);
      else
        await h.services.runs.addInput(runId, {
          ...signal,
          type: 'comment',
          text: 'A new comment',
        });
      expect(await cancel(runId, snapshot)).toBe('inputsChanged');
      expect(await ids(runId)).toHaveLength(2);
      expect((await h.services.runs.get(runId)).status).toBe('queued');
    },
  );

  it('leaves claimed runs alone and keeps signals idempotent', async () => {
    const agentId = await h.createAgent();
    const runId = await enqueue(agentId);
    const request = {
      runId,
      operation: { type: 'signal' as const, key: 'left-stage', input: signal },
    };
    expect(
      await h.services.runs.reconcileQueued({
        ...request,
        expectedPendingInputIds: await ids(runId),
      }),
    ).toBe('signalled');
    expect(
      await h.services.runs.reconcileQueued({
        ...request,
        expectedPendingInputIds: await ids(runId),
      }),
    ).toBe('signalled');
    expect(await ids(runId)).toHaveLength(2);
    const runner = await h.registerRunner();
    await claim(h, runner, 1);
    expect(await cancel(runId, await ids(runId))).toBe('notQueued');
  });
  it('restarts the whole transaction after a snapshot conflict rolls its changes back', async () => {
    const agentId = await h.createAgent();
    const runId = await enqueue(agentId);
    const snapshot = await ids(runId);
    const original = h.database.transaction.bind(h.database);
    const transaction = vi
      .spyOn(h.database, 'transaction')
      .mockImplementationOnce((execute) =>
        original(async (conn) => {
          await execute(conn);
          throw new Error('Snapshot conflict');
        }),
      );
    try {
      expect(await cancel(runId, snapshot)).toBe('cancelled');
      expect(transaction).toHaveBeenCalledTimes(2);
      expect((await h.services.runs.get(runId)).status).toBe('cancelled');
    } finally {
      transaction.mockRestore();
    }
  });
});
