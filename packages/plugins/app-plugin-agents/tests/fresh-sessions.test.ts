import { afterEach, describe, expect, it } from 'vitest';
import type { EnqueueRequest } from '../server/core/runs/index.js';
import {
  claim,
  skillMd,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';

describe('fresh run sessions', () => {
  let h: Harness;
  afterEach(async () => h?.close());

  const enqueue = (
    agentId: string,
    freshSession = false,
    extra: Partial<EnqueueRequest> = {},
  ) =>
    h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      actorUserId: 'owner',
      freshSession,
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'Review this change.',
      },
      ...extra,
    });
  const post = (
    runner: RegisteredRunner,
    runId: string,
    action: string,
    body: unknown,
  ) =>
    h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
      runnerKey: runner.key,
      body,
    });
  const start = (runner: RegisteredRunner, runId: string) =>
    post(runner, runId, 'start', {
      workDir: '/work/sample',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
  async function finish(
    runner: RegisteredRunner,
    payload: any,
    sessionId: string,
  ) {
    expect((await start(runner, payload.run.id)).status).toBe(200);
    expect(
      (
        await post(runner, payload.run.id, 'complete', {
          summary: 'Reviewed.',
          sessionId,
          handledInputIds: payload.inputs.map(
            (input: { id: string }) => input.id,
          ),
        })
      ).status,
    ).toBe(200);
  }

  it('refreshes the session fingerprint when global skills are added, updated or removed', async () => {
    h = await createHarness();
    const agent = await h.createAgent();
    const runner = await h.registerRunner();
    await enqueue(agent);
    const [initial] = await claim(h, runner);
    await finish(runner, initial, 'before-global');
    const skill = await h.services.skills.create('owner', {
      content: skillMd('team-default', 'First rules.'),
    });
    await h.services.skills.attach({ scope: 'global', scopeId: 'default' }, [
      skill.id,
    ]);
    await enqueue(agent);
    const [added] = await claim(h, runner);
    expect(added.prompt.session).toBe('fresh');
    expect(added.skills).toHaveLength(1);
    await finish(runner, added, 'with-global');
    await enqueue(agent);
    const [stable] = await claim(h, runner);
    expect(stable.prompt.session).toBe('resume');
    await finish(runner, stable, 'with-global');
    await h.services.skills.save(skill.id, 'owner', {
      content: skillMd('team-default', 'Updated rules.'),
      files: [],
      expectedRevision: 1,
    });
    await enqueue(agent);
    const [updated] = await claim(h, runner);
    expect(updated.prompt.session).toBe('fresh');
    expect(updated.skills[0].hash).not.toBe(added.skills[0].hash);
    await finish(runner, updated, 'updated-global');
    await h.services.skills.attach({ scope: 'global', scopeId: 'default' }, []);
    await enqueue(agent);
    const [removed] = await claim(h, runner);
    expect(removed.prompt.session).toBe('fresh');
    expect(removed.skills).toEqual([]);
  });

  it('replaces only the requested agent session and resumes the new session on a comment', async () => {
    h = await createHarness();
    const reviewer = await h.createAgent();
    const developer = await h.createAgent({ name: 'Developer' });
    const runner = await h.registerRunner();
    h.dirs = [
      {
        kind: 'directory',
        path: '/work/sample',
        runnerId: runner.runnerId,
        scopeId: 'sample-work',
      },
    ];
    await enqueue(reviewer);
    const [old] = await claim(h, runner);
    await finish(runner, old, 'old-review');
    await enqueue(developer);
    const [dev] = await claim(h, runner);
    await finish(runner, dev, 'dev-session');
    for (const sessionId of ['new-review', 'next-review']) {
      await enqueue(reviewer, true);
      const [fresh] = await claim(h, runner);
      expect(fresh.prompt.session).toBe('fresh');
      expect(fresh.prompt).not.toHaveProperty('resumeSessionId');
      expect(fresh.workspace).not.toHaveProperty('clean');
      expect(fresh.workspace.dirs).toEqual(old.workspace.dirs);
      await finish(runner, fresh, sessionId);
      await enqueue(reviewer);
      const [comment] = await claim(h, runner);
      expect(comment.prompt).toMatchObject({
        session: 'resume',
        resumeSessionId: sessionId,
      });
      expect(comment.workspace).not.toHaveProperty('clean');
      await finish(runner, comment, sessionId);
    }
    await enqueue(developer);
    const [returned] = await claim(h, runner);
    expect(returned.prompt).toMatchObject({
      session: 'resume',
      resumeSessionId: 'dev-session',
    });
    expect(returned.workspace).not.toHaveProperty('clean');
    expect(returned.workspace.dirs).toEqual(dev.workspace.dirs);
  });

  it("adds the subject's note for a resumed or a fresh session to the turn", async () => {
    h = await createHarness();
    h.sessionNotes = { resumed: 'Nothing new.', fresh: 'Read it all.' };
    const agent = await h.createAgent();
    const runner = await h.registerRunner();
    await enqueue(agent);
    const [first] = await claim(h, runner);
    expect(first.prompt.session).toBe('fresh');
    expect(first.prompt.turn).toContain('Read it all.');
    expect(first.prompt.turn).not.toContain('Nothing new.');
    await finish(runner, first, 'session-1');
    await enqueue(agent);
    const [next] = await claim(h, runner);
    expect(next.prompt.session).toBe('resume');
    expect(next.prompt.turn).toContain('Nothing new.');
    expect(next.prompt.turn).not.toContain('Read it all.');
  });

  it('skips held input and merges into the existing waiting run without losing fresh intent', async () => {
    h = await createHarness();
    const agent = await h.createAgent();
    const runner = await h.registerRunner();
    await enqueue(agent);
    const [held] = await claim(h, runner);
    // Dispatched work must also be skipped.
    const waiting = await enqueue(agent, true);
    expect(waiting).toMatchObject({ outcome: 'created', status: 'queued' });
    expect(waiting.runId).not.toBe(held.run.id);
    await start(runner, held.run.id);
    // Reset this waiting item's choice to exercise upgrading an ordinary queued run.
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({
        filter: { id: waiting.runId },
        values: { freshSession: false },
      });
    const merged = await enqueue(agent, true);
    expect(merged).toMatchObject({ outcome: 'merged', runId: waiting.runId });
    expect((await h.services.runs.get(waiting.runId!)).freshSession).toBe(true);
    expect(
      await h.services.runs.list({ agentId: agent, status: 'queued' }),
    ).toHaveLength(1);
    expect((await h.services.runs.detail(held.run.id)).inputs).toHaveLength(1);
    // An ordinary request merging into the queue keeps its fresh choice.
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({
        filter: { id: held.run.id },
        values: { acceptsInput: false },
      });
    expect(await enqueue(agent)).toMatchObject({
      outcome: 'merged',
      runId: waiting.runId,
    });
    expect((await h.services.runs.get(waiting.runId!)).freshSession).toBe(true);
  });

  it('keeps the flag through automatic and manual retries', async () => {
    h = await createHarness();
    const agent = await h.createAgent({ maxAttempts: 2 });
    const runner = await h.registerRunner();
    await enqueue(agent);
    const [previous] = await claim(h, runner);
    await finish(runner, previous, 'previous-session');
    const queued = await enqueue(agent, true);
    const [first] = await claim(h, runner);
    await start(runner, first.run.id);
    expect(
      (await post(runner, first.run.id, 'fail', { reason: 'toolRateLimit' }))
        .body.data.status,
    ).toBe('queued');
    h.clock.advance(30_000);
    const [automatic] = await claim(h, runner);
    expect(automatic.prompt.session).toBe('fresh');
    expect(automatic.run).toMatchObject({ id: queued.runId, attempt: 2 });
    await start(runner, automatic.run.id);
    await post(runner, automatic.run.id, 'fail', { reason: 'toolNetwork' });
    const manual = await h.services.runs.retry(automatic.run.id, 'owner');
    expect(manual).toMatchObject({
      freshSession: true,
      retryOfRunId: automatic.run.id,
    });
    const [retried] = await claim(h, runner);
    expect(retried.prompt.session).toBe('fresh');
  });

  it('distinguishes pending requests by session choice and preserves it after confirmation and reassignment', async () => {
    h = await createHarness();
    const agent = await h.createAgent();
    const extra = { responsibleUserId: 'alice', requestedByUserId: 'bob' };
    const regular = await enqueue(agent, false, extra);
    const fresh = await enqueue(agent, true, extra);
    expect(regular.outcome).toBe('pending');
    expect(fresh.outcome).toBe('pending');
    if (regular.outcome !== 'pending' || fresh.outcome !== 'pending')
      throw new Error('Expected pending requests');
    expect(fresh.requestId).not.toBe(regular.requestId);
    const reassigned = await h.services.runs.requests.reassign({
      subject: { kind: 'sample', id: '1' },
      toUserId: 'carol',
      byUserId: 'alice',
    });
    const moved = reassigned.created.find((request) => request.freshSession);
    expect(moved).toBeDefined();
    const confirmed = await h.services.runs.requests.confirm(
      moved!.id,
      'carol',
    );
    expect((await h.services.runs.get(confirmed.run.runId)).freshSession).toBe(
      true,
    );
  });
});
