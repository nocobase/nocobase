import { afterEach, expect, it, vi } from 'vitest';
import type { Tx } from '../server/kernel/tx.js';
import type { CancelRequest } from '../server/core/runs/ports.js';
import type { Run } from '../shared/runs.js';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => h?.close());
async function setup() {
  h = await createHarness();
  const callback = vi.fn<
    (tx: Tx, run: Run, request?: CancelRequest) => Promise<void>
  >(async () => undefined);
  h.services.subjects.register({
    ...h.services.subjects.get('sample')!,
    kind: 'stoppable',
    sink: {
      onCancelRequested: callback,
      onRunFinished: async (tx, run) => {
        const stopped = await tx.conn
          .repository<{ failureDetail: string }>('agRuns')
          .findOne({ filter: { id: run.id } });
        expect(stopped?.failureDetail).toBe('Stop accepted.');
      },
    },
  });
  const agentId = await h.createAgent();
  const enqueue = async () =>
    (
      await h.services.runs.enqueue({
        agentId,
        subject: { kind: 'stoppable', id: '1' },
        actorUserId: 'owner',
        input: {
          type: 'comment',
          actor: { kind: 'user', id: 'owner', name: 'Owner' },
          text: 'Work.',
        },
      })
    ).runId!;
  callback.mockImplementation(async (tx, run) => {
    await tx.conn.repository('agRuns').updateMany({
      filter: { id: run.id },
      values: { failureDetail: 'Stop accepted.' },
    });
  });
  return { callback, enqueue };
}

it('runs the stop callback before queued termination, once for an active request, and exposes the actual actor', async () => {
  const { callback, enqueue } = await setup();
  const queued = await enqueue();
  expect(await h.services.runs.cancel(queued, 'owner')).toMatchObject({
    status: 'cancelled',
    cancelledById: 'owner',
  });
  expect(callback).toHaveBeenCalledTimes(1);
  const active = await enqueue();
  const runner = await h.registerRunner();
  await claim(h, runner);
  const first = await h.services.runs.cancel(active, 'owner');
  expect(first).toMatchObject({
    status: 'dispatched',
    cancelledById: 'owner',
    cancelRequestedAt: expect.any(String),
  });
  await h.services.runs.cancel(active, 'owner');
  expect(callback).toHaveBeenCalledTimes(2);
});

it('rolls back stop and callback writes together, and accepts system stops without attributing them to a person', async () => {
  const { callback, enqueue } = await setup();
  const id = await enqueue();
  callback.mockImplementationOnce(async (tx, run) => {
    await tx.conn.repository('agRuns').updateMany({
      filter: { id: run.id },
      values: { failureDetail: 'Stop accepted.' },
    });
    throw new Error('Domain update failed');
  });
  await expect(h.services.runs.cancel(id, 'owner')).rejects.toThrow(
    'Domain update failed',
  );
  expect(await h.services.runs.detail(id)).toMatchObject({
    status: 'queued',
    cancelledById: null,
    inputs: [{ text: 'Work.' }],
  });
  expect(await h.services.runs.cancel(id, null)).toMatchObject({
    status: 'cancelled',
    cancelledById: null,
  });
});

it('tells the subject which run asked for the stop, for queued and held runs alike', async () => {
  const { callback, enqueue } = await setup();
  const queued = await enqueue();
  await h.services.runs.cancel(queued, 'owner', undefined, {
    byRunId: 'manager-run',
  });
  expect(callback.mock.calls[0]?.[2]).toEqual({ byRunId: 'manager-run' });
  const active = await enqueue();
  await claim(h, await h.registerRunner());
  await h.services.runs.cancel(active, 'owner', undefined, {
    byRunId: 'manager-run',
  });
  expect(callback.mock.calls[1]?.[2]).toEqual({ byRunId: 'manager-run' });
  await h.services.runs.cancel(await enqueue(), 'owner');
  expect(callback.mock.calls[2]?.[2]).toBeUndefined();
});
