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
