import { afterEach, describe, expect, it, vi } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';
let h: Harness;
afterEach(async () => {
  await h?.close();
});
describe('subject admission during claim', () => {
  it('cancels rejected work without assembly, retries or using a runner slot', async () => {
    h = await createHarness();
    const context = h.services.subjects.get('sample')!.context;
    const assemble = vi.spyOn(context, 'assemble');
    context.admit = async (_conn, candidate) =>
      candidate.run.subject.id === 'old'
        ? { reason: 'stageMismatch', detail: 'The stage changed.' }
        : null;
    const agent = await h.createAgent();
    const rejected = await h.enqueue(agent, 'old');
    const accepted = await h.enqueue(agent, 'current');
    const runner = await h.registerRunner({ slots: 1 });
    const payloads = await claim(h, runner);
    expect(payloads.map((payload) => payload.run.id)).toEqual([accepted]);
    expect(assemble).toHaveBeenCalledTimes(1);
    expect(await h.services.runs.get(rejected)).toMatchObject({
      status: 'cancelled',
      attempt: 1,
      failureReason: null,
      failureDetail: 'stageMismatch: The stage changed.',
    });
    expect(await claim(h, runner)).toEqual([]);
  });
  it('cancels a retried workspace wait without retaining its previous failure', async () => {
    h = await createHarness();
    const agent = await h.createAgent({ maxAttempts: 1 });
    const runId = await h.enqueue(agent);
    const runner = await h.registerRunner();
    expect((await claim(h, runner))[0].run.id).toBe(runId);
    expect(
      (
        await h.request('POST', `/agents/runners/runs/${runId}/fail`, {
          runnerKey: runner.key,
          body: { reason: 'workspaceBusy' },
        })
      ).body.data.status,
    ).toBe('queued');
    h.services.subjects.get('sample')!.context.admit = async () => ({
      reason: 'stageMismatch',
    });
    h.clock.advance(30_000);
    expect(await claim(h, runner)).toEqual([]);
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'cancelled',
      attempt: 2,
      failureReason: null,
      failureDetail: 'stageMismatch',
    });
    expect(h.finished).toHaveLength(1);
  });
  it('applies the same admission hook to online work', async () => {
    h = await createHarness();
    const binding = h.services.subjects.get('sample')!;
    h.services.subjects.register({
      ...binding,
      kind: 'admitted',
      agentTypes: ['online'],
    });
    const assemble = vi.spyOn(binding.context, 'assemble');
    binding.context.admit = async () => ({ reason: 'stageMismatch' });
    const agent = await h.createAgent({ type: 'online', modelEntries: [] });
    const queued = await h.services.runs.enqueue({
      agentId: agent,
      subject: { kind: 'admitted', id: 'old' },
      actorUserId: 'owner',
      input: {
        type: 'signal',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'Continue.',
      },
    });
    const run = queued.runId!;
    expect(
      await h.services.claims.claimServer({ id: 'server:test' }, 1),
    ).toEqual([]);
    expect(assemble).not.toHaveBeenCalled();
    expect(await h.services.runs.get(run)).toMatchObject({
      status: 'cancelled',
      attempt: 1,
      failureDetail: 'stageMismatch',
    });
  });
});

for (const type of ['runner', 'online'] as const) {
  it(`delivers the subject-selected inputs to ${type} claims`, async () => {
    h = await createHarness();
    const binding = h.services.subjects.get('sample')!;
    const assemble = binding.context.assemble;
    h.services.subjects.register({
      ...binding,
      kind: 'filtered',
      agentTypes: [type],
      context: {
        ...binding.context,
        assemble: async (conn, candidate) => {
          const inputs = candidate.inputs.filter(
            (item) => item.text !== 'Obsolete',
          );
          return {
            ...(await assemble(conn, { ...candidate, inputs })),
            inputs,
          };
        },
      },
    });
    const agent = await h.createAgent({
      type,
      ...(type === 'online' ? { modelEntries: [] } : {}),
    });
    for (const text of ['Current', 'Obsolete'])
      await h.services.runs.enqueue({
        agentId: agent,
        subject: { kind: 'filtered', id: 'issue' },
        actorUserId: 'owner',
        input: {
          type: 'signal',
          actor: { kind: 'system', id: 'system', name: 'System' },
          text,
        },
      });
    if (type === 'runner') {
      const runner = await h.registerRunner();
      const [payload] = await claim(h, runner);
      expect(payload.inputs.map((input) => input.text)).toEqual(['Current']);
      expect(payload.prompt.turn).not.toContain('Obsolete');
      expect(
        (
          await h.services.runs.pendingInputs(
            h.database.connection(),
            payload.run.id,
          )
        ).map((input) => input.text),
      ).toEqual(['Current']);
    } else {
      const [payload] = await h.services.claims.claimServer(
        { id: 'server:test' },
        1,
      );
      expect(payload.inputs.map((input) => input.text)).toEqual(['Current']);
      expect(payload.turn).not.toContain('Obsolete');
      expect(
        (
          await h.services.runs.pendingInputs(
            h.database.connection(),
            payload.runId,
          )
        ).map((input) => input.text),
      ).toEqual(['Current']);
    }
  });
}

describe('subject admission for a working run', () => {
  async function working() {
    h = await createHarness();
    const agent = await h.createAgent();
    const runId = await h.enqueue(agent, 'issue');
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    expect(payload.run.id).toBe(runId);
    const payloadInputs = payload.inputs.map((input) => input.id);
    await h.request('POST', `/agents/runners/runs/${runId}/start`, {
      runnerKey: runner.key,
      body: { workDir: '/tmp/work', acceptsInput: true },
    });
    const send = (text: string) =>
      h.services.runs.enqueue({
        agentId: agent,
        subject: { kind: 'sample', id: 'issue' },
        actorUserId: 'owner',
        input: {
          type: 'signal',
          actor: { kind: 'system', id: 'system', name: 'System' },
          text,
        },
      });
    const lease = async (): Promise<string[]> =>
      (
        await h.request('POST', `/agents/runners/runs/${runId}/lease`, {
          runnerKey: runner.key,
          body: {},
        })
      ).body.data.inputs.map((input: { text: string }) => input.text);
    const complete = (handledInputIds: readonly string[]) =>
      h.request('POST', `/agents/runners/runs/${runId}/complete`, {
        runnerKey: runner.key,
        body: { summary: 'Done', handledInputIds },
      });
    return { runId, send, lease, complete, claimed: payloadInputs };
  }

  it('queues rejected input in a separate run instead of appending it', async () => {
    const { runId, send, lease } = await working();
    h.services.subjects.get('sample')!.context.admit = async () => ({
      reason: 'stageMismatch',
    });
    const queued = await send('Rejected');
    expect(queued).toMatchObject({ outcome: 'created', status: 'queued' });
    expect(queued.runId).not.toBe(runId);
    expect(await lease()).not.toContain('Rejected');
  });

  it('marks pending input handled instead of delivering what the subject no longer admits or selects', async () => {
    const { runId, send, lease } = await working();
    const context = h.services.subjects.get('sample')!.context;
    expect(await send('Rejected later')).toMatchObject({
      runId,
      outcome: 'appended',
    });
    expect(await send('Obsolete')).toMatchObject({ outcome: 'appended' });
    expect(await send('Current')).toMatchObject({ outcome: 'appended' });
    context.selectInputs = async (_conn, candidate) =>
      candidate.inputs.filter((input) => input.text !== 'Obsolete');
    context.admit = async (_conn, candidate) =>
      candidate.inputs.some((input) => input.text === 'Rejected later')
        ? { reason: 'stageMismatch' }
        : null;
    const delivered = await lease();
    expect(delivered).not.toContain('Rejected later');
    expect(delivered).not.toContain('Obsolete');
    context.admit = async () => null;
    await send('Current again');
    expect(await lease()).toContain('Current again');
    expect(
      (await h.services.runs.pendingInputs(h.database.connection(), runId)).map(
        (input) => input.text,
      ),
    ).not.toContain('Obsolete');
  });

  it('completes without asking for input the subject no longer lets the run act on', async () => {
    const { runId, send, complete, claimed } = await working();
    expect(await send('Arrived in time')).toMatchObject({
      runId,
      outcome: 'appended',
    });
    h.services.subjects.get('sample')!.context.admit = async () => ({
      reason: 'stageMismatch',
    });
    const done = await complete(claimed);
    expect(done.status).toBe(200);
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'completed',
    });
  });
});
