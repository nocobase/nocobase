import { afterEach, describe, expect, it } from 'vitest';

import type { AgentsEvent } from '../server/kernel/events.js';
import { RUN_REQUEST_TTL_MS } from '../server/core/runs/index.js';
import type { EnqueueRequest } from '../server/core/runs/index.js';
import {
  claim,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';

/** Alice answers for sample 1; Bob comments on it. */
const ALICE = 'alice';
const BOB = 'bob';

const comment = (
  by: string,
  text: string,
  payload?: Record<string, unknown>,
): EnqueueRequest['input'] => ({
  type: 'comment',
  actor: { kind: 'user', id: by, name: by === ALICE ? 'Alice' : 'Bob' },
  text,
  ...(payload ? { payload } : {}),
});

describe('run requests', () => {
  let h: Harness;
  let agentId: string;
  let events: AgentsEvent[];

  afterEach(async () => {
    await h?.close();
  });

  async function setUp(): Promise<void> {
    h = await createHarness();
    agentId = await h.createAgent();
    events = [];
    h.services.events.onAny((event) => {
      if (event.type.startsWith('runRequest.') || event.type === 'notice')
        events.push(event);
    });
  }

  /** Bob wakes the agent on Alice's sample. */
  const bobAsks = (
    text = 'Please fix the login.',
    extra: Partial<EnqueueRequest> = {},
  ) =>
    h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      responsibleUserId: ALICE,
      requestedByUserId: BOB,
      input: comment(BOB, text),
      ...extra,
    });

  const runsOn = async () =>
    h.services.runs.list({ subjectKind: 'sample', subjectId: '1' });

  const startRun = (runner: RegisteredRunner, runId: string) =>
    h.request('POST', `/agents/runners/runs/${runId}/start`, {
      runnerKey: runner.key,
      body: {
        workDir: '/work/SMP-1',
        adapter: { kind: 'claude' },
        acceptsInput: true,
      },
    });

  it('turns work someone else causes into a request instead of a run', async () => {
    await setUp();
    const result = await bobAsks();
    expect(result).toMatchObject({
      outcome: 'pending',
      status: 'pending',
      runId: null,
      inputId: null,
    });
    expect(await runsOn()).toEqual([]);
    const request = await h.services.runs.requests.get(
      result.outcome === 'pending' ? result.requestId : '',
    );
    expect(request).toMatchObject({
      agentId,
      subject: { kind: 'sample', id: '1' },
      threadScope: 'main',
      responsibleUserId: ALICE,
      requestedByUserId: BOB,
      status: 'pending',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: BOB, name: 'Bob' },
        text: 'Please fix the login.',
      },
      expiresAt: new Date(
        h.clock.now().getTime() + RUN_REQUEST_TTL_MS,
      ).toISOString(),
      agentName: 'Coder',
    });
    expect(events.map((event) => event.type)).toEqual(['runRequest.created']);
  });

  it('queues the responsible’s own work as them, and work on a subject nobody answers for as before', async () => {
    await setUp();
    const own = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      responsibleUserId: ALICE,
      requestedByUserId: ALICE,
      input: comment(ALICE, 'Go.'),
    });
    expect(own).toMatchObject({ outcome: 'created' });
    const run = await h.services.runs.get(own.runId!);
    expect(run).toMatchObject({
      actorUserId: ALICE,
      requestedByUserId: ALICE,
      confirmedByUserId: null,
    });

    const unowned = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '2' },
      actorUserId: BOB,
      input: comment(BOB, 'Go.'),
    });
    expect(await h.services.runs.get(unowned.runId!)).toMatchObject({
      actorUserId: BOB,
      requestedByUserId: BOB,
    });
    expect(events).toEqual([]);
  });

  it('runs a confirmed request as the responsible, its input acted by the person who asked', async () => {
    await setUp();
    const asked = await bobAsks();
    const requestId = asked.outcome === 'pending' ? asked.requestId : '';
    const response = await h.request(
      'POST',
      `/agents/runRequests/${requestId}/confirm`,
      { user: ALICE },
    );
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      request: { status: 'confirmed', settledById: ALICE },
      run: { outcome: 'created' },
    });
    const runId = response.body.data.run.runId as string;
    expect(response.body.data.request.runId).toBe(runId);
    const detail = await h.services.runs.detail(runId);
    expect(detail).toMatchObject({
      actorUserId: ALICE,
      requestedByUserId: BOB,
      confirmedByUserId: ALICE,
    });
    expect(detail.inputs).toEqual([
      expect.objectContaining({
        type: 'comment',
        actor: { kind: 'user', id: BOB, name: 'Bob' },
        text: 'Please fix the login.',
      }),
    ]);
    expect(events.map((event) => event.type)).toEqual([
      'runRequest.created',
      'runRequest.confirmed',
    ]);

    // Settled for good.
    for (const action of ['confirm', 'reject'])
      expect(
        (
          await h.request(
            'POST',
            `/agents/runRequests/${requestId}/${action}`,
            {
              user: ALICE,
              ...(action === 'reject' ? { body: {} } : {}),
            },
          )
        ).body.error,
      ).toMatchObject({
        reason: 'RUN_REQUEST_SETTLED',
        metadata: { status: 'confirmed' },
      });
    expect(
      (
        await h.request('POST', `/agents/runRequests/${requestId}/withdraw`, {
          user: BOB,
        })
      ).body.error.reason,
    ).toBe('RUN_REQUEST_SETTLED');
  });

  it('adds a confirmed request to the responsible’s run while it is running and takes input', async () => {
    await setUp();
    const own = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      responsibleUserId: ALICE,
      input: comment(ALICE, 'Start.'),
    });
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    expect(payload.run.id).toBe(own.runId);
    expect((await startRun(runner, own.runId!)).status).toBe(200);

    // Bob's comment does not reach the running run until Alice confirms it.
    const asked = await bobAsks('Also the docs.');
    expect(asked.outcome).toBe('pending');
    expect(
      (await h.services.runs.detail(own.runId!)).inputs.map(
        (input) => input.text,
      ),
    ).toEqual(['Start.']);

    const confirmed = await h.services.runs.requests.confirm(
      asked.outcome === 'pending' ? asked.requestId : '',
      ALICE,
    );
    expect(confirmed.run).toMatchObject({
      runId: own.runId,
      outcome: 'appended',
      status: 'running',
    });
    expect(
      (await h.services.runs.detail(own.runId!)).inputs.map((input) => ({
        text: input.text,
        actor: input.actor.id,
      })),
    ).toEqual([
      { text: 'Start.', actor: ALICE },
      { text: 'Also the docs.', actor: BOB },
    ]);
  });

  it('lets only the responsible confirm or reject, administrators included', async () => {
    await setUp();
    const asked = await bobAsks();
    const requestId = asked.outcome === 'pending' ? asked.requestId : '';
    const admin = {
      can: ['agents.agents/manage', 'agents.runners/manage'],
      scope: ['agents.agents/edit=all'],
    };
    for (const action of ['confirm', 'reject']) {
      // Someone not in it (a manager of agents, too) cannot even see it.
      const stranger = await h.request(
        'POST',
        `/agents/runRequests/${requestId}/${action}`,
        { user: 'carol', ...admin, body: {} },
      );
      expect(stranger.status).toBe(404);
      expect(stranger.body.error.reason).toBe('RUN_REQUEST_NOT_FOUND');
      // The person who asked sees it, but does not answer for it.
      const asker = await h.request(
        'POST',
        `/agents/runRequests/${requestId}/${action}`,
        { user: BOB, ...admin, body: {} },
      );
      expect(asker.status).toBe(403);
    }
    // A run acting for Alice is no person: the service refuses anyone but the responsible as well.
    await expect(
      h.services.runs.requests.confirm(requestId, BOB),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    for (const action of ['withdraw', 'runAsMe']) {
      const responsible = await h.request(
        'POST',
        `/agents/runRequests/${requestId}/${action}`,
        { user: ALICE },
      );
      expect(responsible.status).toBe(403);
    }
    expect(await runsOn()).toEqual([]);
    expect((await h.services.runs.requests.get(requestId)).status).toBe(
      'pending',
    );

    const rejected = await h.request(
      'POST',
      `/agents/runRequests/${requestId}/reject`,
      { user: ALICE, body: { note: 'Not now.' } },
    );
    expect(rejected.body.data).toMatchObject({
      status: 'rejected',
      settledById: ALICE,
      note: 'Not now.',
    });
    expect(events.map((event) => event.type)).toEqual([
      'runRequest.created',
      'runRequest.rejected',
    ]);
  });

  it('checks again on confirming that the responsible may still wake the agent', async () => {
    await setUp();
    const restricted = await h.createAgent({
      name: 'Private',
      access: 'users',
      userIds: [ALICE, BOB],
    });
    const asked = await h.services.runs.enqueue({
      agentId: restricted,
      subject: { kind: 'sample', id: '1' },
      responsibleUserId: ALICE,
      requestedByUserId: BOB,
      input: comment(BOB, 'Please.'),
    });
    expect(asked.outcome).toBe('pending');
    const agent = await h.services.agents.get(restricted);
    await h.services.agents.update(restricted, 'owner', {
      expectedRevision: agent.revision,
      userIds: ['owner'],
    });
    await expect(
      h.services.runs.requests.confirm(
        asked.outcome === 'pending' ? asked.requestId : '',
        ALICE,
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await runsOn()).toEqual([]);
  });

  it.each(['mine', 'runAsMe'] as const)(
    'keeps Bob’s %s input out of Alice’s running run',
    async (execution) => {
      await setUp();
      const own = await h.services.runs.enqueue({
        agentId,
        subject: { kind: 'sample', id: '1' },
        responsibleUserId: ALICE,
        input: comment(ALICE, 'Alice starts.'),
      });
      const runner = await h.registerRunner();
      await claim(h, runner);
      expect((await startRun(runner, own.runId!)).status).toBe(200);
      const mine =
        execution === 'mine'
          ? await bobAsks('Bob alone.', { execution: 'mine' })
          : await (async () => {
              const asked = await bobAsks('Bob alone.');
              return (
                await h.services.runs.requests.runAsRequester(
                  asked.outcome === 'pending' ? asked.requestId : '',
                  BOB,
                )
              ).run;
            })();
      expect(mine.outcome).toBe('created');
      expect(mine.runId).not.toBe(own.runId);
      expect(await h.services.runs.get(mine.runId!)).toMatchObject({
        actorUserId: BOB,
      });
      expect(
        (await h.services.runs.detail(own.runId!)).inputs.map(
          (input) => input.text,
        ),
      ).toEqual(['Alice starts.']);
      // Isolation does not allow two identities to run the same work simultaneously.
      expect(await claim(h, runner)).toEqual([]);
    },
  );

  it.each(['queued', 'running'] as const)(
    'keeps Alice’s confirmed work out of Bob’s %s mine run',
    async (status) => {
      await setUp();
      const runner = await h.registerRunner();
      const mine = await bobAsks('Bob starts.', { execution: 'mine' });
      if (status === 'running') {
        await claim(h, runner);
        expect((await startRun(runner, mine.runId!)).status).toBe(200);
      }
      const asked = await bobAsks('Alice approves this.');
      const confirmed = await h.services.runs.requests.confirm(
        asked.outcome === 'pending' ? asked.requestId : '',
        ALICE,
      );
      expect(confirmed.run.outcome).toBe('created');
      expect(confirmed.run.runId).not.toBe(mine.runId);
      expect(await h.services.runs.get(confirmed.run.runId)).toMatchObject({
        actorUserId: ALICE,
        confirmedByUserId: ALICE,
      });
      expect(
        (await h.services.runs.detail(mine.runId!)).inputs.map(
          (input) => input.text,
        ),
      ).toEqual(['Bob starts.']);
    },
  );

  it.each([null, 'dave'] as const)(
    'rejects the old responsible when the resolver now returns %s, before reassign is called',
    async (newResponsible) => {
      await setUp();
      let responsible: string | null = ALICE;
      h.services.subjects.register({
        kind: 'ownedSample',
        context: h.services.subjects.get('sample')!.context,
        responsibleUserId: () => Promise.resolve(responsible),
      });
      const asked = await bobAsks('Needs approval.', {
        subject: { kind: 'ownedSample', id: '1' },
      });
      const id = asked.outcome === 'pending' ? asked.requestId : '';
      responsible = newResponsible;
      for (const action of ['confirm', 'reject']) {
        const response = await h.request(
          'POST',
          `/agents/runRequests/${id}/${action}`,
          { user: ALICE, body: {} },
        );
        expect(response.status).toBe(403);
      }
      expect((await h.services.runs.requests.get(id)).status).toBe('pending');
      responsible = ALICE;
      expect(
        (await h.services.runs.requests.confirm(id, ALICE)).run.outcome,
      ).toBe('created');
    },
  );

  it.each([null, 'dave'] as const)(
    'expires and notifies when reassignment to %s cannot run the work, preserving runAsMe',
    async (toUserId) => {
      await setUp();
      const restricted = await h.createAgent({
        access: 'users',
        userIds: [ALICE, BOB],
      });
      const asked = await bobAsks('Keep this work.', { agentId: restricted });
      const id = asked.outcome === 'pending' ? asked.requestId : '';
      const handed = await h.services.runs.requests.reassign({
        subject: { kind: 'sample', id: '1' },
        toUserId,
        byUserId: ALICE,
      });
      expect(handed).toMatchObject({ superseded: [], created: [], queued: [] });
      expect(handed.expired.map((request) => request.id)).toEqual([id]);
      expect(events.map((event) => event.type)).toEqual([
        'runRequest.created',
        'runRequest.expired',
        'notice',
      ]);
      expect(events.at(-1)).toMatchObject({
        notice: { userIds: [BOB], params: { reason: 'reassignment' } },
      });
      await h.registerRunner();
      const ran = await h.services.runs.requests.runAsRequester(id, BOB);
      expect(await h.services.runs.get(ran.run.runId)).toMatchObject({
        actorUserId: BOB,
      });
      await expect(
        h.services.runs.requests.runAsRequester(id, BOB),
      ).rejects.toMatchObject({ code: 'RUN_REQUEST_SETTLED' });
    },
  );

  it('requires the requester’s own permission before creating an auto request', async () => {
    await setUp();
    const restricted = await h.createAgent({
      access: 'users',
      userIds: [ALICE],
    });
    await expect(
      bobAsks('Unwanted.', { agentId: restricted }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await h.services.runs.requests.list({ userId: ALICE })).toEqual([]);
    expect(events).toEqual([]);
  });

  it('reuses an identical pending snapshot without renewing expiry, while retaining distinct work', async () => {
    await setUp();
    const first = await bobAsks('Same.', {
      input: comment(BOB, 'Same.', { a: 1, b: 2 }),
    });
    const id = first.outcome === 'pending' ? first.requestId : '';
    const original = await h.services.runs.requests.get(id);
    h.clock.advance(1_000);
    const repeats = await Promise.all([
      bobAsks('Same.', { input: comment(BOB, 'Same.', { b: 2, a: 1 }) }),
      bobAsks('Same.', { input: comment(BOB, 'Same.', { a: 1, b: 2 }) }),
    ]);
    expect(repeats).toEqual([first, first]);
    expect((await h.services.runs.requests.get(id)).expiresAt).toBe(
      original.expiresAt,
    );
    expect(events.map((event) => event.type)).toEqual(['runRequest.created']);
    await bobAsks('Edited.', {
      input: comment(BOB, 'Edited.', { a: 1, b: 2 }),
    });
    await bobAsks('Same.', {
      input: comment(BOB, 'Same.', { a: 1, b: 2 }),
      maxAttempts: 1,
    });
    expect(
      await h.services.runs.requests.list({ userId: ALICE, status: 'pending' }),
    ).toHaveLength(3);
    h.clock.advance(RUN_REQUEST_TTL_MS);
    expect(
      await bobAsks('Same.', { input: comment(BOB, 'Same.', { a: 1, b: 2 }) }),
    ).not.toEqual(first);
  });

  it('hands pending requests to a new responsible, and the old one can no longer confirm them', async () => {
    await setUp();
    const asked = await bobAsks();
    const requestId = asked.outcome === 'pending' ? asked.requestId : '';
    const handed = await h.services.runs.requests.reassign({
      subject: { kind: 'sample', id: '1' },
      toUserId: 'dave',
      byUserId: 'owner',
    });
    expect(handed.superseded).toHaveLength(1);
    expect(handed.created).toHaveLength(1);
    const next = handed.created[0];
    expect(handed.superseded[0]).toMatchObject({
      id: requestId,
      status: 'superseded',
      settledById: 'owner',
      supersededById: next.id,
    });
    expect(next).toMatchObject({
      responsibleUserId: 'dave',
      requestedByUserId: BOB,
      status: 'pending',
      input: { text: 'Please fix the login.' },
    });

    const old = await h.request(
      'POST',
      `/agents/runRequests/${requestId}/confirm`,
      { user: ALICE },
    );
    expect(old.status).toBe(400);
    expect(old.body.error).toMatchObject({
      reason: 'RUN_REQUEST_SETTLED',
      metadata: { status: 'superseded' },
    });
    // Alice is not in the new request at all.
    expect(
      (
        await h.request('POST', `/agents/runRequests/${next.id}/confirm`, {
          user: ALICE,
        })
      ).status,
    ).toBe(404);
    const confirmed = await h.services.runs.requests.confirm(next.id, 'dave');
    expect(await h.services.runs.get(confirmed.run.runId)).toMatchObject({
      actorUserId: 'dave',
      requestedByUserId: BOB,
      confirmedByUserId: 'dave',
    });

    // Handed to the person who asked, the work is their own and runs as them at once.
    const again = await bobAsks('One more.', { responsibleUserId: 'dave' });
    const toBob = await h.services.runs.requests.reassign({
      subject: { kind: 'sample', id: '1' },
      toUserId: BOB,
      byUserId: 'dave',
    });
    expect(toBob.created).toEqual([]);
    expect(toBob.queued).toHaveLength(1);
    expect(toBob.superseded[0].id).toBe(
      again.outcome === 'pending' ? again.requestId : '',
    );
  });

  it('keeps the input as it was asked, whatever happens to its source', async () => {
    await setUp();
    const payload = { commentId: 'c1', body: 'Fix the login.' };
    const asked = await bobAsks('Fix the login.', {
      input: comment(BOB, 'Fix the login.', payload),
    });
    // The comment is edited afterwards (its object, and its words wherever the application keeps them).
    payload.body = 'Delete the database.';
    const requestId = asked.outcome === 'pending' ? asked.requestId : '';
    expect((await h.services.runs.requests.get(requestId)).input).toEqual({
      type: 'comment',
      actor: { kind: 'user', id: BOB, name: 'Bob' },
      text: 'Fix the login.',
      payload: { commentId: 'c1', body: 'Fix the login.' },
    });
    const confirmed = await h.services.runs.requests.confirm(requestId, ALICE);
    const [input] = (await h.services.runs.detail(confirmed.run.runId)).inputs;
    expect(input).toMatchObject({
      text: 'Fix the login.',
      payload: { commentId: 'c1', body: 'Fix the login.' },
    });
  });

  it('expires a request nobody settles in seven days, and tells the person who asked', async () => {
    await setUp();
    const asked = await bobAsks();
    const requestId = asked.outcome === 'pending' ? asked.requestId : '';
    h.clock.advance(RUN_REQUEST_TTL_MS - 1);
    expect((await h.sweep()).requestsExpired).toBe(0);
    expect((await h.services.runs.requests.get(requestId)).status).toBe(
      'pending',
    );

    h.clock.advance(1);
    // Due, but not swept yet: it cannot be confirmed any more either.
    await expect(
      h.services.runs.requests.confirm(requestId, ALICE),
    ).rejects.toMatchObject({
      code: 'RUN_REQUEST_SETTLED',
      details: { status: 'expired' },
    });
    expect((await h.sweep()).requestsExpired).toBe(1);
    expect((await h.services.runs.requests.get(requestId)).status).toBe(
      'expired',
    );
    expect((await h.sweep()).requestsExpired).toBe(0);
    expect(events.map((event) => event.type)).toEqual([
      'runRequest.created',
      'runRequest.expired',
      'notice',
    ]);
    expect(events[2]).toMatchObject({
      type: 'notice',
      notice: {
        key: `run_request_expired:${requestId}`,
        type: 'run_request_expired',
        userIds: [BOB],
        subject: { kind: 'runRequest', id: requestId, label: 'Coder' },
      },
    });

    // What the notice offers: Bob runs it as himself, once.
    await h.registerRunner({ trust: 'ownerOnly', ownerUserId: BOB });
    const ran = await h.request(
      'POST',
      `/agents/runRequests/${requestId}/runAsMe`,
      { user: BOB },
    );
    expect(ran.status).toBe(200);
    expect(ran.body.data.request).toMatchObject({
      status: 'expired',
      runId: ran.body.data.run.runId,
    });
    expect(
      (
        await h.request('POST', `/agents/runRequests/${requestId}/runAsMe`, {
          user: BOB,
        })
      ).body.error.reason,
    ).toBe('RUN_REQUEST_SETTLED');
  });

  it('runs work as the person who asked on a runner they may use, never on the responsible’s own', async () => {
    await setUp();
    const alices = await h.registerRunner({
      name: 'alice-laptop',
      trust: 'ownerOnly',
      ownerUserId: ALICE,
    });
    // Only Alice's runner is online: Bob has nowhere to run it, and nothing waits unseen.
    await expect(bobAsks('Mine.', { execution: 'mine' })).rejects.toMatchObject(
      { code: 'NO_RUNNER_AVAILABLE' },
    );
    expect(await runsOn()).toEqual([]);

    const team = await h.registerRunner({ name: 'team', trust: 'team' });
    const mine = await bobAsks('Mine.', { execution: 'mine' });
    expect(mine.outcome).toBe('created');
    expect(await h.services.runs.get(mine.runId!)).toMatchObject({
      actorUserId: BOB,
      requestedByUserId: BOB,
      confirmedByUserId: null,
    });
    expect(await claim(h, alices)).toEqual([]);
    const [taken] = await claim(h, team);
    expect(taken.run.id).toBe(mine.runId);

    // From a pending request: it is withdrawn, and the work runs as Bob.
    const asked = await bobAsks('Later.', { threadScope: 'other' });
    const requestId = asked.outcome === 'pending' ? asked.requestId : '';
    const ran = await h.services.runs.requests.runAsRequester(requestId, BOB);
    expect(ran.request).toMatchObject({
      status: 'withdrawn',
      settledById: BOB,
      runId: ran.run.runId,
    });
    expect(await h.services.runs.get(ran.run.runId)).toMatchObject({
      actorUserId: BOB,
    });
  });

  it('withdraws a request for the person who asked, and lists requests for the people in them', async () => {
    await setUp();
    const first = await bobAsks('One.');
    await bobAsks('Two.', { subject: { kind: 'sample', id: '2' } });
    const firstId = first.outcome === 'pending' ? first.requestId : '';
    const withdrawn = await h.request(
      'POST',
      `/agents/runRequests/${firstId}/withdraw`,
      { user: BOB },
    );
    expect(withdrawn.body.data).toMatchObject({
      status: 'withdrawn',
      settledById: BOB,
    });

    const inbox = await h.request(
      'GET',
      '/agents/runRequests?role=responsible&status=pending',
      { user: ALICE },
    );
    expect(inbox.status).toBe(200);
    expect(
      inbox.body.data.map(
        (item: { input: { text: string } }) => item.input.text,
      ),
    ).toEqual(['Two.']);
    expect(inbox.body.data[0]).toMatchObject({
      agentName: 'Coder',
      responsibleUserId: ALICE,
      requestedByUserId: BOB,
    });
    const asked = await h.request(
      'GET',
      '/agents/runRequests?role=requester&pageSize=1',
      { user: BOB },
    );
    expect(asked.body.data).toHaveLength(1);
    expect(asked.body.meta.nextPageToken).toEqual(expect.any(String));
    const rest = await h.request(
      'GET',
      `/agents/runRequests?role=requester&pageSize=1&pageToken=${asked.body.meta.nextPageToken}`,
      { user: BOB },
    );
    expect(rest.body.data[0].id).toBe(firstId);
    // Nobody else sees them, a manager of agents included.
    expect(
      (
        await h.request('GET', '/agents/runRequests', {
          user: 'carol',
          can: ['agents.agents/manage'],
        })
      ).body.data,
    ).toEqual([]);
    expect(
      (
        await h.request('GET', `/agents/runRequests/${firstId}`, {
          user: 'carol',
          can: ['agents.agents/manage'],
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await h.request('GET', `/agents/runRequests/${firstId}`, {
          user: ALICE,
        })
      ).body.data.input.text,
    ).toBe('One.');
    expect((await h.request('GET', '/agents/runRequests')).status).toBe(401);
  });

  it('carries the source of a chain of work along the runs it causes', async () => {
    await setUp();
    await h.registerRunner({ trust: 'team' });
    // Bob runs work on Alice's sample as himself; what that run does next is still Bob's doing.
    const bobs = await bobAsks('Mine.', { execution: 'mine' });
    const caused = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      threadScope: 'followUp',
      responsibleUserId: ALICE,
      causedByRunId: bobs.runId!,
      input: {
        type: 'custom',
        actor: { kind: 'agent', id: agentId, name: 'Coder' },
        text: 'The status changed.',
      },
    });
    expect(caused.outcome).toBe('pending');
    expect(
      await h.services.runs.requests.get(
        caused.outcome === 'pending' ? caused.requestId : '',
      ),
    ).toMatchObject({ requestedByUserId: BOB, responsibleUserId: ALICE });

    // Once Alice confirms it, the chain is hers: what its run causes runs as her, without asking again.
    const confirmed = await h.services.runs.requests.confirm(
      caused.outcome === 'pending' ? caused.requestId : '',
      ALICE,
    );
    const next = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      threadScope: 'third',
      responsibleUserId: ALICE,
      causedByRunId: confirmed.run.runId,
      input: {
        type: 'custom',
        actor: { kind: 'agent', id: agentId, name: 'Coder' },
        text: 'Then this.',
      },
    });
    expect(next.outcome).toBe('created');
    expect(await h.services.runs.get(next.runId!)).toMatchObject({
      actorUserId: ALICE,
      requestedByUserId: ALICE,
    });

    // On a subject someone else answers for, Alice's chain asks them in turn.
    const elsewhere = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '9' },
      responsibleUserId: 'erin',
      causedByRunId: next.runId!,
      input: {
        type: 'custom',
        actor: { kind: 'agent', id: agentId, name: 'Coder' },
        text: 'Over there.',
      },
    });
    expect(elsewhere.outcome).toBe('pending');
  });

  it('expires a due request on reassignment rather than renewing it, before the sweeper noticed', async () => {
    await setUp();
    const asked = await bobAsks();
    const requestId = asked.outcome === 'pending' ? asked.requestId : '';
    h.clock.advance(RUN_REQUEST_TTL_MS);
    const handed = await h.services.runs.requests.reassign({
      subject: { kind: 'sample', id: '1' },
      toUserId: 'dave',
      byUserId: 'owner',
    });
    expect(handed).toMatchObject({ superseded: [], created: [], queued: [] });
    expect(handed.expired.map((request) => request.id)).toEqual([requestId]);
    expect(await h.services.runs.requests.get(requestId)).toMatchObject({
      status: 'expired',
      supersededById: null,
    });
    expect(events.map((event) => event.type)).toEqual([
      'runRequest.created',
      'runRequest.expired',
      'notice',
    ]);
    // A due request is not withdrawn either: it is over, as confirming it would find.
    const again = await bobAsks('Again.');
    h.clock.advance(RUN_REQUEST_TTL_MS);
    await expect(
      h.services.runs.requests.withdraw(
        again.outcome === 'pending' ? again.requestId : '',
        BOB,
      ),
    ).rejects.toMatchObject({
      code: 'RUN_REQUEST_SETTLED',
      details: { status: 'expired' },
    });
  });

  it('does not queue an expired request when responsibility moves to its requester', async () => {
    await setUp();
    const result = await bobAsks('Synthetic request');
    expect(result.outcome).toBe('pending');
    h.clock.advance(RUN_REQUEST_TTL_MS + 1);
    const reassigned = await h.services.runs.requests.reassign({
      subject: { kind: 'sample', id: '1' },
      toUserId: BOB,
      byUserId: 'carol',
    });
    expect(reassigned.queued).toEqual([]);
    expect(await h.services.runs.list({ subjectKind: 'sample' })).toEqual([]);
  });

  it('retains a scheduled enqueue time after confirmation', async () => {
    await setUp();
    const fireAt = new Date(h.clock.now().getTime() + 60_000).toISOString();
    const result = await bobAsks('Scheduled synthetic request', {
      fireAt,
      input: {
        ...comment(BOB, 'Scheduled synthetic request'),
        type: 'signal',
      },
    });
    if (result.outcome !== 'pending')
      throw new Error('Expected pending request');
    const confirmed = await h.services.runs.requests.confirm(
      result.requestId,
      ALICE,
    );
    expect((await h.services.runs.get(confirmed.run.runId)).availableAt).toBe(
      fireAt,
    );
  });

  it('keeps how the work was asked to run: its moment and its attempts', async () => {
    await setUp();
    const fireAt = new Date(h.clock.now().getTime() + 3_600_000).toISOString();
    const asked = await bobAsks('Later.', { fireAt, maxAttempts: 1 });
    const requestId = asked.outcome === 'pending' ? asked.requestId : '';
    expect(await h.services.runs.requests.get(requestId)).toMatchObject({
      fireAt,
      maxAttempts: 1,
    });
    const confirmed = await h.services.runs.requests.confirm(requestId, ALICE);
    expect(await h.services.runs.get(confirmed.run.runId)).toMatchObject({
      availableAt: fireAt,
      maxAttempts: 1,
    });

    // Confirmed after its moment passed, it is claimable at once.
    const late = await bobAsks('Soon.', {
      threadScope: 'late',
      fireAt: new Date(h.clock.now().getTime() + 60_000).toISOString(),
    });
    h.clock.advance(120_000);
    const run = await h.services.runs.requests.confirm(
      late.outcome === 'pending' ? late.requestId : '',
      ALICE,
    );
    expect((await h.services.runs.get(run.run.runId)).availableAt).toBeNull();
  });

  it('never makes a consultation wait for confirmation', async () => {
    await setUp();
    const own = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      responsibleUserId: ALICE,
      input: comment(ALICE, 'Start.'),
    });
    await expect(
      bobAsks('Asked.', { parentRunId: own.runId! }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
  });
});
