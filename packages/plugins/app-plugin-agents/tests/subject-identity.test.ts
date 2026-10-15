import { afterEach, describe, expect, it } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => h?.close());

describe('subject-selected execution identity', () => {
  async function setup() {
    h = await createHarness();
    const binding = h.services.subjects.get('sample')!;
    let owner: string | null = 'owner';
    h.services.subjects.register({
      ...binding,
      kind: 'owned',
      actsAs: async () => ({ actorUserId: owner }),
    });
    const agentId = await h.createAgent();
    const enqueue = (text = 'Work') =>
      h.services.runs.enqueue({
        agentId,
        subject: { kind: 'owned', id: '1' },
        actorUserId: 'bob',
        input: {
          type: 'comment',
          actor: { kind: 'user', id: 'bob', name: 'Bob' },
          text,
        },
      });
    return {
      agentId,
      enqueue,
      setOwner: (next: string | null) => {
        owner = next;
      },
    };
  }

  it('uses the owner runner and credentials while preserving the trigger and inputs', async () => {
    const { enqueue, setOwner } = await setup();
    const result = await enqueue();
    await enqueue('More');
    expect(await h.services.runs.get(result.runId!)).toMatchObject({
      actorUserId: 'owner',
      requestedByUserId: 'bob',
      ownerUserId: 'owner',
    });
    const bob = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'bob',
    });
    const owner = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'owner',
    });
    expect(await claim(h, bob)).toEqual([]);
    setOwner('bob');
    expect(await claim(h, owner)).toEqual([]);
    const [payload] = await claim(h, bob);
    expect(payload.inputs.map((input: { text: string }) => input.text)).toEqual(
      ['Work', 'More'],
    );
    expect(await h.services.runs.get(result.runId!)).toMatchObject({
      actorUserId: 'bob',
      requestedByUserId: 'bob',
    });
    const credential = JSON.parse(
      payload.cli.credential.content
        ? JSON.stringify(payload.cli.credential.content)
        : '{}',
    );
    expect(
      (await h.services.runs.authenticateToken(credential.token)).run
        .actorUserId,
    ).toBe('bob');
  });

  it('repairs legacy queued identity before runner ownership checks and leaves claimed work fixed', async () => {
    const { enqueue, setOwner } = await setup();
    const result = await enqueue();
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({
        filter: { id: result.runId },
        values: {
          actorUserId: 'bob',
          ownerUserId: 'bob',
          requestedByUserId: null,
        },
      });
    const bob = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'bob',
    });
    const owner = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'owner',
    });
    expect((await claim(h, owner))[0].run.id).toBe(result.runId);
    expect((await h.services.runs.get(result.runId!)).requestedByUserId).toBe(
      'bob',
    );
    expect(await claim(h, bob)).toEqual([]);
    setOwner('bob');
    expect(await h.services.runs.get(result.runId!)).toMatchObject({
      actorUserId: 'owner',
      status: 'dispatched',
    });
    expect(
      (await h.services.runs.detail(result.runId!)).inputs.at(-1)?.text,
    ).toBe('Work');
    expect(await enqueue('Next')).toMatchObject({ outcome: 'created' });
    const failed = await h.request(
      'POST',
      `/agents/runners/runs/${result.runId}/fail`,
      {
        runnerKey: owner.key,
        body: { reason: 'workspaceBusy' },
      },
    );
    expect(failed.status).toBe(200);
    h.clock.advance(30_000);
    expect((await claim(h, owner))[0].run.id).toBe(result.runId);
    expect((await h.services.runs.get(result.runId!)).actorUserId).toBe(
      'owner',
    );
  });

  it('abandons a stale prepared candidate when identity changes at the claim boundary', async () => {
    const { enqueue, setOwner } = await setup();
    const result = await enqueue();
    const context = h.services.subjects.get('owned')!.context;
    const assemble = context.assemble.bind(context);
    const preparedFor: string[] = [];
    const assembledFor: string[] = [];
    context.prepare = async (run) => {
      // Permission preparation must read the repaired identity outside the claim transaction.
      await h.services.tx.read().repository('agAgents').findMany();
      preparedFor.push(run.actorUserId);
      return new Set([run.actorUserId]);
    };
    context.assemble = async (conn, claimContext, prepared) => {
      expect(prepared).toEqual(new Set([claimContext.run.actorUserId]));
      assembledFor.push(claimContext.run.actorUserId);
      return assemble(conn, claimContext);
    };
    let reached!: () => void;
    let resume!: () => void;
    const prepared = new Promise<void>((resolve) => {
      reached = resolve;
    });
    const released = new Promise<void>((resolve) => {
      resume = resolve;
    });
    h.services.briefs.sections.register({
      key: 'pause-before-claim',
      prepare: async () => {
        reached();
        await released;
      },
      section: async () => null,
    });
    const owner = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'owner',
    });
    const claiming = claim(h, owner);
    await prepared;
    try {
      setOwner('bob');
    } finally {
      resume();
    }
    expect(await claiming).toEqual([]);
    expect(preparedFor).toEqual(['owner']);
    expect(assembledFor).toEqual([]);
    expect(await h.services.runs.get(result.runId!)).toMatchObject({
      actorUserId: 'bob',
      status: 'queued',
    });
    const bob = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'bob',
    });
    expect((await claim(h, bob))[0].run.id).toBe(result.runId);
    expect(preparedFor).toEqual(['owner', 'bob']);
    expect(assembledFor).toEqual(['bob']);
  });

  it('refuses an absent owner and cancels queued work rather than falling back', async () => {
    const { enqueue, setOwner } = await setup();
    const result = await enqueue();
    setOwner(null);
    await expect(enqueue()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await claim(h, await h.registerRunner())).toEqual([]);
    expect(await h.services.runs.get(result.runId!)).toMatchObject({
      status: 'cancelled',
      failureDetail: 'noOwner',
    });
  });
});
