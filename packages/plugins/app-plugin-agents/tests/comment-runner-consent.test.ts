import { afterEach, describe, expect, it } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';

describe('comment personal runner consent', () => {
  let h: Harness;
  let agentId: string;
  let ownerKey = 'assignment-1';
  afterEach(async () => h?.close());
  async function setup() {
    h = await createHarness();
    agentId = await h.createAgent();
    ownerKey = 'assignment-1';
    const sample = h.services.subjects.get('sample')!;
    h.services.subjects.register({
      ...sample,
      kind: 'commentIssue',
      actsAs: async () => ({ actorUserId: 'alice' }),
      responsibleUserId: async () => 'alice',
      commentOwnerKey: async () => ownerKey,
    });
  }
  const enqueue = (commentId = 'c1', source = 'bob') =>
    h.services.runs.enqueue({
      agentId,
      subject: { kind: 'commentIssue', id: '1' },
      actorUserId: source,
      ownerUserId: 'alice',
      comment: { ownerKey },
      input: {
        type: 'comment',
        actor: { kind: 'user', id: source, name: source },
        text: 'Please continue this work.',
        payload: { commentId },
      },
    });
  const pending = () =>
    h.services.runs.requests.list({ userId: 'alice', status: 'pending' });

  it('queues as the owner and lets a team claim without asking', async () => {
    await setup();
    const team = await h.registerRunner({ trust: 'team' });
    const personal = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'alice',
    });
    const queued = await enqueue();
    expect(await pending()).toEqual([]);
    expect(await claim(h, personal)).toEqual([]);
    expect(
      await h.database
        .connection()
        .repository('agRunTokens')
        .count({ filter: { runId: queued.runId! } }),
    ).toBe(0);
    const [taken] = await claim(h, team);
    expect(taken.run.id).toBe(queued.runId);
    expect((await h.services.runs.get(queued.runId!)).actorUserId).toBe(
      'alice',
    );
  });

  it('issues no personal payload before confirmation, then releases the same run and descendants', async () => {
    await setup();
    const personal = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'alice',
    });
    const queued = await enqueue();
    const [request] = await pending();
    expect(request).toMatchObject({
      purpose: 'personalRunner',
      commentRootRunId: queued.runId,
      requestedByUserId: 'bob',
      responsibleUserId: 'alice',
    });
    expect(await claim(h, personal)).toEqual([]);
    expect(await h.services.runs.get(queued.runId!)).toMatchObject({
      status: 'queued',
      runnerId: null,
    });
    const confirmed = await h.services.runs.requests.confirm(
      request.id,
      'alice',
    );
    expect(confirmed.run.runId).toBe(queued.runId);
    expect(confirmed.request.settledById).toBe('alice');
    expect((await claim(h, personal))[0].run.id).toBe(queued.runId);
    await expect(
      h.services.runs.requests.confirm(request.id, 'alice'),
    ).rejects.toMatchObject({ code: 'RUN_REQUEST_SETTLED' });
    const childAgent = await h.createAgent({ name: 'child' });
    const child = await h.services.runs.enqueue({
      agentId: childAgent,
      subject: { kind: 'commentIssue', id: '1' },
      actorUserId: 'alice',
      causedByRunId: queued.runId!,
      input: {
        type: 'comment',
        actor: { kind: 'agent', id: agentId, name: 'manager' },
        text: 'Do the next step.',
        payload: { commentId: 'step' },
      },
    });
    expect(await h.services.runs.get(child.runId!)).toMatchObject({
      requestedByUserId: 'bob',
      commentRootRunId: queued.runId,
    });
    expect((await claim(h, personal))[0].run.id).toBe(child.runId);
  });

  it('withdraws an obsolete request and prevents use of an earlier owner assignment token', async () => {
    await setup();
    const personal = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'alice',
    });
    const queued = await enqueue();
    const [request] = await pending();
    await h.services.runs.cancel(queued.runId!, 'alice');
    await h.services.claims.reconcileCommentQueue();
    expect((await h.services.runs.requests.get(request.id)).status).toBe(
      'withdrawn',
    );
    const next = await enqueue('c2');
    await h.services.runs.requests.confirm((await pending())[0].id, 'alice');
    const [taken] = await claim(h, personal);
    expect(taken.run.id).toBe(next.runId);
    const token = taken.cli.credential.content.token;
    await h.services.runs.authenticateToken(token);
    ownerKey = 'assignment-2';
    await expect(
      h.services.runs.authenticateToken(token),
    ).rejects.toMatchObject({ code: 'RUN_TOKEN_INVALID' });
  });

  it('does not treat a mapped agent identity as proof of a personal owner comment', async () => {
    await setup();
    const personal = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'alice',
    });
    await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'commentIssue', id: '1' },
      actorUserId: 'alice',
      ownerUserId: 'alice',
      comment: { ownerKey },
      input: {
        type: 'comment',
        actor: { kind: 'agent', id: agentId, name: 'manager' },
        text: 'Continue.',
        payload: { commentId: 'agent-comment', byAgent: true },
      },
    });
    expect(await pending()).toHaveLength(1);
    expect(await claim(h, personal)).toEqual([]);
  });

  it('does not merge a new comment into the authorized chain', async () => {
    await setup();
    const personal = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'alice',
    });
    const first = await enqueue();
    await h.services.runs.requests.confirm((await pending())[0].id, 'alice');
    await claim(h, personal);
    const second = await enqueue('c2');
    expect(second.runId).not.toBe(first.runId);
    expect(second.outcome).toBe('created');
    expect((await pending())[0].commentRootRunId).toBe(second.runId);
    expect(await claim(h, personal)).toEqual([]);
    await expect(
      h.services.runs.addInput(first.runId!, {
        type: 'comment',
        actor: { kind: 'user', id: 'bob', name: 'Bob' },
        text: 'An unrelated request.',
        payload: { commentId: 'another' },
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('preserves rejection and runs once as the commenter, including child identity', async () => {
    await setup();
    const personal = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'alice',
    });
    const queued = await enqueue();
    const [request] = await pending();
    await h.services.runs.requests.reject(request.id, 'alice');
    expect((await h.services.runs.get(queued.runId!)).status).toBe('cancelled');
    expect(await claim(h, personal)).toEqual([]);
    const bobs = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'bob',
    });
    const mine = await h.services.runs.requests.runAsRequester(
      request.id,
      'bob',
    );
    expect(mine.request.status).toBe('rejected');
    expect(await h.services.runs.get(mine.run.runId)).toMatchObject({
      actorUserId: 'bob',
      commentExecution: 'requester',
    });
    expect((await claim(h, bobs))[0].run.id).toBe(mine.run.runId);
    const childAgent = await h.createAgent({ name: 'child' });
    const child = await h.services.runs.enqueue({
      agentId: childAgent,
      subject: { kind: 'commentIssue', id: '1' },
      actorUserId: 'alice',
      causedByRunId: mine.run.runId,
      input: {
        type: 'signal',
        actor: { kind: 'agent', id: agentId, name: 'manager' },
        text: 'Next step.',
      },
    });
    expect(await h.services.runs.get(child.runId!)).toMatchObject({
      actorUserId: 'bob',
      commentExecution: 'requester',
    });
    expect((await claim(h, bobs))[0].run.id).toBe(child.runId);
    await expect(
      h.services.runs.requests.runAsRequester(request.id, 'bob'),
    ).rejects.toMatchObject({ code: 'RUN_REQUEST_SETTLED' });
  });

  it('withdraws a stale consent when a team becomes available first', async () => {
    await setup();
    await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'alice' });
    const queued = await enqueue();
    const [request] = await pending();
    const team = await h.registerRunner({ trust: 'team' });
    expect((await claim(h, team))[0].run.id).toBe(queued.runId);
    expect((await h.services.runs.requests.get(request.id)).status).toBe(
      'withdrawn',
    );
    await expect(
      h.services.runs.requests.confirm(request.id, 'alice'),
    ).rejects.toMatchObject({ code: 'RUN_REQUEST_SETTLED' });
  });

  it('does not carry authorization across an owner assignment or affect owner comments', async () => {
    await setup();
    const personal = await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'alice',
    });
    await enqueue();
    const [request] = await pending();
    ownerKey = 'assignment-2';
    await expect(
      h.services.runs.requests.confirm(request.id, 'alice'),
    ).rejects.toMatchObject({ code: 'RUN_REQUEST_SETTLED' });
    expect(await claim(h, personal)).toEqual([]);
    await h.services.sweeper.sweep();
    const own = await enqueue('owner-comment', 'alice');
    expect((await claim(h, personal))[0].run.id).toBe(own.runId);
  });

  it('waits for compatible busy team capacity without asking for personal consent', async () => {
    await setup();
    const team = await h.registerRunner({ trust: 'team', slots: 1 });
    await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'alice' });
    await enqueue('first', 'alice');
    await claim(h, team);
    await enqueue('second');
    await h.services.sweeper.sweep();
    expect(await pending()).toEqual([]);
  });

  it('serializes a team claim with rejection and revokes any previously issued token', async () => {
    await setup();
    await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'alice' });
    const queued = await enqueue();
    const [request] = await pending();
    const team = await h.registerRunner({ trust: 'team' });
    const outcomes = await Promise.allSettled([
      h.services.runs.requests.reject(request.id, 'alice'),
      claim(h, team),
    ]);
    const rejected = outcomes[0].status === 'fulfilled';
    const current = await h.services.runs.get(queued.runId!);
    if (rejected) {
      expect(current.status).toBe('cancelled');
      const tokens = await h.database
        .connection()
        .repository<{ runId: string; revokedAt: string | null }>('agRunTokens')
        .findMany({ filter: { runId: current.id } });
      expect(tokens.every((token) => Boolean(token.revokedAt))).toBe(true);
    } else {
      expect((await h.services.runs.requests.get(request.id)).status).toBe(
        'withdrawn',
      );
      expect(current.status).toBe('dispatched');
    }
    expect(await pending()).toEqual([]);
  });
  it.each(['pending', 'rejected'])(
    'switches all %s targets once with merged inputs and causal references intact',
    async (state) => {
      await setup();
      await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'alice' });
      const root = await enqueue();
      const secondAgent = await h.createAgent({ name: 'Second target' });
      const step = {
        agentId: secondAgent,
        subject: { kind: 'commentIssue', id: '1' },
        actorUserId: 'alice',
        causedByRunId: root.runId!,
        input: {
          type: 'comment' as const,
          actor: { kind: 'agent' as const, id: agentId, name: 'Manager' },
          text: 'First instruction.',
          payload: {
            commentId: 'step-1',
            causedByRunId: root.runId,
            byAgent: true,
          },
        },
      };
      const second = await h.services.runs.enqueue(step);
      const merged = await h.services.runs.enqueue({
        ...step,
        input: {
          ...step.input,
          text: 'Second instruction.',
          payload: { ...step.input.payload, commentId: 'step-2' },
        },
      });
      expect(merged.runId).toBe(second.runId);
      const [request] = await pending();
      if (state === 'rejected')
        await h.services.runs.requests.reject(request.id, 'alice');
      const bobs = await h.registerRunner({
        trust: 'ownerOnly',
        ownerUserId: 'bob',
      });
      const switched = await h.services.runs.requests.runAsRequester(
        request.id,
        'bob',
      );
      const queued = (
        await h.services.runs.list({
          subjectKind: 'commentIssue',
          subjectId: '1',
        })
      ).filter((run) => run.status === 'queued');
      expect(queued.map((run) => run.agentId).sort()).toEqual(
        [agentId, secondAgent].sort(),
      );
      const nextRoot = queued.find((run) => run.agentId === agentId)!;
      const nextStep = queued.find((run) => run.agentId === secondAgent)!;
      expect(
        queued.every(
          (run) =>
            run.actorUserId === 'bob' && run.commentRootRunId === nextRoot.id,
        ),
      ).toBe(true);
      const inputs = await h.services.runs.pendingInputs(
        h.database.connection(),
        nextStep.id,
      );
      expect(inputs.map((input) => input.text)).toEqual([
        'First instruction.',
        'Second instruction.',
      ]);
      expect(inputs.map((input) => input.payload)).toEqual([
        expect.objectContaining({
          commentId: 'step-1',
          commentRootRunId: nextRoot.id,
          causedByRunId: nextRoot.id,
        }),
        expect.objectContaining({
          commentId: 'step-2',
          commentRootRunId: nextRoot.id,
          causedByRunId: nextRoot.id,
        }),
      ]);
      await expect(
        h.services.runs.requests.runAsRequester(request.id, 'bob'),
      ).rejects.toMatchObject({ code: 'RUN_REQUEST_SETTLED' });
      expect((await h.services.runs.requests.get(request.id)).runId).toBe(
        switched.run.runId,
      );
      const claims = await claim(h, bobs, 2);
      expect(claims.map((taken) => taken.run.id).sort()).toEqual(
        queued.map((run) => run.id).sort(),
      );
    },
  );

  it.each(['pending', 'rejected'])(
    'leaves completed ancestors and independently cancelled targets ended after %s switching',
    async (state) => {
      await setup();
      const team = await h.registerRunner({ trust: 'team' });
      const root = await enqueue();
      const [taken] = await claim(h, team);
      await h.request('POST', `/agents/runners/runs/${taken.run.id}/start`, {
        runnerKey: team.key,
        body: { workDir: '.', adapter: { kind: 'claude' }, acceptsInput: true },
      });
      await h.request('POST', `/agents/runners/runs/${taken.run.id}/complete`, {
        runnerKey: team.key,
        body: {
          summary: 'Already done',
          handledInputIds: taken.inputs.map(
            (input: { id: string }) => input.id,
          ),
        },
      });
      await h.database
        .connection()
        .repository('agRunners')
        .updateMany({
          filter: { id: team.runnerId },
          values: { trust: 'ownerOnly', ownerUserId: 'alice' },
        });
      const secondAgent = await h.createAgent({ name: 'Remaining target' });
      const child = await h.services.runs.enqueue({
        parentRunId: root.runId!,
        agentId: secondAgent,
        subject: { kind: 'commentIssue', id: '1' },
        actorUserId: 'alice',
        causedByRunId: root.runId!,
        input: {
          type: 'comment',
          actor: { kind: 'agent', id: agentId, name: 'Manager' },
          text: 'The remaining step.',
          payload: {
            commentId: 'remaining',
            causedByRunId: root.runId,
            byAgent: true,
          },
        },
      });
      const stoppedAgent = await h.createAgent({
        name: 'Separately stopped target',
      });
      const stopped = await h.services.runs.enqueue({
        agentId: stoppedAgent,
        subject: { kind: 'commentIssue', id: '1' },
        actorUserId: 'alice',
        causedByRunId: root.runId!,
        input: {
          type: 'signal',
          actor: { kind: 'agent', id: agentId, name: 'Manager' },
          text: 'Stopped separately.',
        },
      });
      await h.services.runs.cancel(stopped.runId!, 'alice');
      const [request] = await pending();
      if (state === 'rejected')
        await h.services.runs.requests.reject(request.id, 'alice');
      await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'bob' });
      const switched = await h.services.runs.requests.runAsRequester(
        request.id,
        'bob',
      );
      expect((await h.services.runs.get(root.runId!)).status).toBe('completed');
      const queued = (
        await h.services.runs.list({
          subjectKind: 'commentIssue',
          subjectId: '1',
        })
      ).filter((run) => run.status === 'queued');
      expect(queued).toHaveLength(1);
      expect(queued[0].agentId).toBe(secondAgent);
      const next = await h.services.runs.detail(switched.run.runId);
      expect(
        next.inputs
          .filter((input) => !input.handledAt)
          .map((input) => input.text),
      ).toEqual(['The remaining step.']);
      expect(
        next.inputs.some(
          (input) =>
            input.text === 'Please continue this work.' && input.handledAt,
        ),
      ).toBe(true);
      expect(queued[0].parentRunId).toBe(root.runId);
      expect((await h.services.runs.get(child.runId!)).status).toBe(
        'cancelled',
      );
    },
  );
  it('rolls back the whole switch when one remaining target has no compatible requester runner', async () => {
    await setup();
    await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'alice' });
    const root = await enqueue();
    const childAgent = await h.createAgent({ name: 'Requires checkout' });
    const child = await h.services.runs.enqueue({
      agentId: childAgent,
      subject: { kind: 'commentIssue', id: '1' },
      actorUserId: 'alice',
      causedByRunId: root.runId!,
      requires: ['checkout'],
      input: {
        type: 'signal',
        actor: { kind: 'agent', id: agentId, name: 'Manager' },
        text: 'Needs a checkout.',
      },
    });
    const [request] = await pending();
    await h.registerRunner({
      trust: 'ownerOnly',
      ownerUserId: 'bob',
      features: ['input'],
    });
    await expect(
      h.services.runs.requests.runAsRequester(request.id, 'bob'),
    ).rejects.toMatchObject({ code: 'NO_RUNNER_AVAILABLE' });
    expect((await h.services.runs.requests.get(request.id)).status).toBe(
      'pending',
    );
    expect((await h.services.runs.requests.get(request.id)).runId).toBeNull();
    for (const id of [root.runId!, child.runId!])
      expect((await h.services.runs.get(id)).status).toBe('queued');
    expect(
      (
        await h.services.runs.list({
          subjectKind: 'commentIssue',
          subjectId: '1',
        })
      ).some((run) => run.actorUserId === 'bob'),
    ).toBe(false);
  });

  it('serializes concurrent Run as me clicks for the entire comment chain', async () => {
    await setup();
    await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'alice' });
    const root = await enqueue();
    const secondAgent = await h.createAgent({ name: 'Second target' });
    await h.services.runs.enqueue({
      agentId: secondAgent,
      subject: { kind: 'commentIssue', id: '1' },
      actorUserId: 'alice',
      causedByRunId: root.runId!,
      input: {
        type: 'signal',
        actor: { kind: 'agent', id: agentId, name: 'Manager' },
        text: 'Do the second step.',
      },
    });
    const [request] = await pending();
    await h.registerRunner({ trust: 'ownerOnly', ownerUserId: 'bob' });
    const results = await Promise.allSettled([
      h.services.runs.requests.runAsRequester(request.id, 'bob'),
      h.services.runs.requests.runAsRequester(request.id, 'bob'),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const queued = (
      await h.services.runs.list({
        subjectKind: 'commentIssue',
        subjectId: '1',
      })
    ).filter((run) => run.status === 'queued');
    expect(queued.map((run) => run.agentId).sort()).toEqual(
      [agentId, secondAgent].sort(),
    );
    expect(queued.every((run) => run.actorUserId === 'bob')).toBe(true);
  });
});
