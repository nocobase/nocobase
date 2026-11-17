import { afterEach, describe, expect, it } from 'vitest';
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import {
  api,
  claim,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';

const ALICE = 'alice';
const start = {
  workDir: '/work/chat',
  adapter: { kind: 'claude' },
  acceptsInput: true,
};

describe('conversations bound to a runner', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.services.onlineAgent.shutdown();
    await h?.close();
  });
  const domain = () => h.services.conversations;
  const post = (
    key: RegisteredRunner,
    runId: string,
    action: string,
    body: unknown = {},
  ) =>
    h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
      runnerKey: key.key,
      body,
    });
  /** Runs the claimed turn to completion on `runner`, answering `text`. */
  async function answer(
    runner: RegisteredRunner,
    runId: string,
    text: string,
    sessionId = 'session-1',
  ) {
    await post(runner, runId, 'start', start);
    await post(runner, runId, 'events', {
      events: [
        {
          seq: 1,
          at: h.clock.now().toISOString(),
          type: 'text',
          content: text,
        },
      ],
    });
    const handled = (await h.services.runs.detail(runId)).inputs.map(
      (input) => input.id,
    );
    const done = await post(runner, runId, 'complete', {
      summary: `Said ${text}`,
      handledInputIds: handled,
      sessionId,
    });
    expect(done.status).toBe(200);
  }
  const setRunner = (id: string, values: Record<string, unknown>) =>
    h.database
      .connection()
      .repository('agRunners')
      .updateMany({ filter: { id }, values });

  it('binds on the first claim, passes other runners over and leaves other work alone', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ name: 'PM' });
    const one = await h.registerRunner({ name: 'one' });
    const two = await h.registerRunner({ name: 'two' });
    const id = (await domain().create(ALICE, { agentId })).id;
    expect((await domain().get(ALICE, id)).runner).toBeNull();
    const first = await domain().send(ALICE, id, { content: 'Hello' });
    const [taken] = await claim(h, one);
    expect(taken.run.id).toBe(first.run!.id);
    expect((await domain().get(ALICE, id)).runner).toEqual({
      id: one.runnerId,
      name: 'one',
      status: 'online',
    });
    await answer(one, first.run!.id, 'Hi.');

    const second = await domain().send(ALICE, id, { content: 'Again' });
    expect(await claim(h, two)).toEqual([]);
    // A run on another subject still goes to any runner.
    const task = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      actorUserId: 'owner',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'Review this.',
      },
    });
    const [other] = await claim(h, two);
    expect(other.run.id).toBe(task.runId);
    const [resumed] = await claim(h, one);
    expect(resumed.run.id).toBe(second.run!.id);
    expect(resumed.prompt).toMatchObject({
      session: 'resume',
      resumeSessionId: 'session-1',
    });
  });

  it('reports a bound runner that is offline, revoked or gone, and switches runner only for the owner', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ name: 'PM' });
    const one = await h.registerRunner({ name: 'one' });
    const id = (await domain().create(ALICE, { agentId })).id;
    const first = await domain().send(ALICE, id, { content: 'Hello' });
    await claim(h, one);
    await answer(one, first.run!.id, 'Hi.');
    await setRunner(one.runnerId, { status: 'revoked' });
    expect((await domain().get(ALICE, id)).runner?.status).toBe('revoked');
    await h.database
      .connection()
      .repository('agRunners')
      .deleteMany({ filter: { id: one.runnerId } });
    expect((await domain().get(ALICE, id)).runner).toEqual({
      id: one.runnerId,
      name: null,
      status: 'missing',
    });
    // Waiting, not failing.
    const queued = await domain().send(ALICE, id, { content: 'Still there?' });
    h.clock.advance(60 * 60_000);
    await h.sweep();
    expect((await h.services.runs.get(queued.run!.id)).status).toBe('queued');

    const path = `/agents/conversations/${id}/switchRunner`;
    expect((await h.request('POST', path, { user: 'bob' })).status).toBe(404);
    const switched = await h.request('POST', path, { user: ALICE });
    expect(switched.status).toBe(200);
    expect(switched.body.data.runner).toBeNull();
    const two = await h.registerRunner({ name: 'two' });
    const [fresh] = await claim(h, two);
    expect(fresh.run.id).toBe(queued.run!.id);
    expect(fresh.prompt.session).toBe('fresh');
    expect(fresh.prompt.system).toContain('Earlier in this conversation');
    expect((await domain().get(ALICE, id)).runner?.id).toBe(two.runnerId);
  });

  it('starts a fresh session with the history when the runner removed the directory', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ name: 'PM' });
    const one = await h.registerRunner({ name: 'one' });
    const id = (await domain().create(ALICE, { agentId })).id;
    const first = await domain().send(ALICE, id, {
      content: 'Remember the number 42.',
    });
    await claim(h, one);
    await answer(one, first.run!.id, 'Noted: 42.');
    const report = (workspaces: unknown[]) =>
      h.request('POST', api(RUNNER_ROUTES.workspaces), {
        runnerKey: one.key,
        body: { workspaces },
      });
    const kept = {
      runId: first.run!.id,
      workDir: start.workDir,
      unpushed: false,
      lastUsedAt: h.clock.now().toISOString(),
    };
    expect((await report([kept])).status).toBe(200);
    h.clock.advance(1000);
    // Still there: the session resumes.
    expect((await report([kept])).status).toBe(200);
    const second = await domain().send(ALICE, id, { content: 'Which one?' });
    const [resumed] = await claim(h, one);
    expect(resumed.prompt.session).toBe('resume');
    await answer(one, second.run!.id, '42.', 'session-2');

    h.clock.advance(1000);
    expect((await report([kept])).status).toBe(200);
    h.clock.advance(1000);
    // An empty report, as a runner that could not read its work root sends, forgets nothing.
    expect((await report([])).status).toBe(200);
    const again = await domain().send(ALICE, id, { content: 'Still 42?' });
    const [still] = await claim(h, one);
    expect(still.prompt.session).toBe('resume');
    await answer(one, again.run!.id, 'Yes.', 'session-2');
    h.clock.advance(1000);
    const other = {
      ...kept,
      workDir: '/work/other',
      lastUsedAt: h.clock.now().toISOString(),
    };
    expect((await report([other])).status).toBe(200);
    h.clock.advance(1000);
    // Cleaned up on the runner: the next run there starts again, with the history.
    expect((await report([other])).status).toBe(200);
    const third = await domain().send(ALICE, id, { content: 'And now?' });
    const [fresh] = await claim(h, one);
    expect(fresh.run.id).toBe(third.run!.id);
    expect(fresh.prompt.session).toBe('fresh');
    expect(fresh.prompt.system).toContain('Noted: 42.');
  });

  it('accepts a Runner OnlineAgent turn while its bound runner is offline, and lets it wait', async () => {
    h = await createHarness();
    const runner = await h.registerRunner();
    const agentId = await h.createAgent({
      source: 'runner',
      name: 'Runner helper',
    });
    const context = (): OnlineAgentContext => ({
      user: { id: ALICE },
      credentials: { kind: 'test-session', userId: ALICE },
      authorization: {
        identity: { principal: { type: 'user', id: ALICE } },
      } as AuthorizationContext,
    });
    const agent = await h.services.onlineAgent.realtime(context(), {
      agentId,
    });
    await agent.send([{ role: 'user', content: 'First' }]);
    const [payload] = await claim(h, runner);
    await answer(runner, payload.run.id, 'One.');
    const stream = await agent.receive();
    if (stream) {
      const reader = stream.getReader();
      while (!(await reader.read()).done);
    }
    expect(await agent.status()).toBe('idle');
    await setRunner(runner.runnerId, { status: 'offline' });
    const restored = await h.services.onlineAgent.realtime(context(), {
      sessionId: agent.sessionId,
    });
    await restored.send([{ role: 'user', content: 'Second' }]);
    const detail = await domain().get(ALICE, agent.sessionId);
    expect(detail.runner).toMatchObject({
      id: runner.runnerId,
      status: 'offline',
    });
    expect(detail.run).toMatchObject({ status: 'queued' });
  });

  async function nativeFixture() {
    h = await createHarness();
    const one = await h.registerRunner({ name: 'rise-vm1' });
    const two = await h.registerRunner({ name: 'dev-2' });
    const agentId = await h.createAgent({ source: 'runner' });
    const context: OnlineAgentContext = {
      user: { id: ALICE },
      credentials: { kind: 'test-session', userId: ALICE },
      authorization: {
        identity: { principal: { type: 'user', id: ALICE } },
      } as AuthorizationContext,
    };
    const agent = await h.services.onlineAgent.realtime(context, { agentId });
    const drain = async () => {
      const reader = (await agent.receive())?.getReader();
      if (reader) while (!(await reader.read()).done);
    };
    await agent.send([{ role: 'user', content: 'Remember 42' }]);
    const [first] = await claim(h, one);
    await answer(one, first.run.id, 'Noted 42');
    await drain();
    const id = agent.sessionId;
    const repo = h.database.connection().repository('agConversations');
    const record = () => repo.findOne({ filter: { id } });
    return { one, two, agent, id, drain, repo, record };
  }

  it('switches only with an accepted message and starts fresh when returning to a previous runtime', async () => {
    const { one, two, agent, id, drain } = await nativeFixture();
    // Reading choices is side-effect free; selection is part of the next message.
    expect(
      (await domain().runners(ALICE, id)).map((runner) => runner.id),
    ).toContain(two.runnerId);
    expect((await domain().get(ALICE, id)).runner?.id).toBe(one.runnerId);
    await agent.send([{ role: 'user', content: 'Remember 99 too' }], {
      runnerId: two.runnerId,
    });
    expect((await domain().get(ALICE, id)).runner?.id).toBe(two.runnerId);
    expect(await claim(h, one)).toEqual([]);
    const [next] = await claim(h, two);
    expect(next.prompt.session).toBe('fresh');
    expect(next.prompt.system).toContain('Noted 42');
    await answer(two, next.run.id, 'Noted 99', 'session-two');
    await drain();
    await agent.send([{ role: 'user', content: 'What do you remember?' }], {
      runnerId: one.runnerId,
    });
    const [back] = await claim(h, one);
    expect(back.prompt.session).toBe('fresh');
    expect(back.prompt.system).toContain('Noted 99');
  });

  it('lists only eligible online runtimes and refuses stale, private and incompatible choices at send', async () => {
    const { one, two, agent, id, record } = await nativeFixture();
    const privateRunner = await h.registerRunner({
      name: 'private',
      trust: 'ownerOnly',
      ownerUserId: 'bob',
    });
    const incompatible = await h.registerRunner({
      name: 'disabled-tool',
      enabledTools: [],
    });
    const path = `/agents/conversations/${id}/runners`;
    expect((await h.request('GET', path)).status).toBe(401);
    expect((await h.request('GET', path, { user: 'bob' })).status).toBe(404);
    const listed = await h.request('GET', path, { user: ALICE });
    expect(listed.status).toBe(200);
    expect(
      listed.body.data.map((runner: { id: string }) => runner.id).sort(),
    ).toEqual([one.runnerId, two.runnerId].sort());
    await setRunner(two.runnerId, { status: 'offline' });
    const sendPath = `/agents/conversations/${id}/messages`;
    const body = {
      runnerId: two.runnerId,
      message: {
        id: 'runtime-selection',
        role: 'user',
        parts: [{ type: 'text', text: 'Switch' }],
      },
    };
    expect((await h.request('POST', sendPath, { body })).status).toBe(401);
    expect(
      (await h.request('POST', sendPath, { user: 'bob', body })).status,
    ).toBe(404);
    expect(
      (await h.request('POST', sendPath, { user: ALICE, body })).status,
    ).toBe(400);
    const before = await record();
    for (const runnerId of [
      two.runnerId,
      privateRunner.runnerId,
      incompatible.runnerId,
      'missing',
    ]) {
      await expect(
        agent.send([{ role: 'user', content: 'Not admitted' }], { runnerId }),
      ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
      const after = await record();
      expect(after).toMatchObject({
        runnerId: before!.runnerId,
        thread: before!.thread,
        lastSeq: before!.lastSeq,
      });
    }
  });

  it('rolls back the runtime and thread if attachment admission fails', async () => {
    const { two, agent, record } = await nativeFixture();
    const before = await record();
    await expect(
      agent.send([{ role: 'user', content: 'Invalid upload' }], {
        runnerId: two.runnerId,
        attachmentIds: [['not-my-upload']],
      }),
    ).rejects.toBeDefined();
    expect(await record()).toMatchObject({
      runnerId: before!.runnerId,
      thread: before!.thread,
      lastSeq: before!.lastSeq,
    });
  });

  it('rejects runtime changes while queued, running, finalizing or archived', async () => {
    const { one, two, agent, id, drain, repo, record } = await nativeFixture();
    const send = () =>
      agent.send([{ role: 'user', content: 'Switch' }], {
        runnerId: two.runnerId,
      });
    await agent.send([{ role: 'user', content: 'Work' }]);
    await expect(send()).rejects.toBeDefined();
    const [work] = await claim(h, one);
    await expect(
      agent.queue([{ role: 'user', content: 'Switch while busy' }], {
        runnerId: two.runnerId,
      }),
    ).rejects.toBeDefined();
    await expect(send()).rejects.toBeDefined();
    await answer(one, work.run.id, 'Done');
    await drain();
    await repo.updateMany({
      filter: { id },
      values: { archivedAt: h.clock.now().toISOString() },
    });
    await expect(send()).rejects.toMatchObject({ code: 'CONFLICT' });
    const metadata = (await record())!.metadata as Record<string, unknown>;
    await repo.updateMany({
      filter: { id },
      values: {
        archivedAt: null,
        metadata: {
          ...metadata,
          runnerOnlineAgent: {
            ...(metadata.runnerOnlineAgent as object),
            closingRunId: 'unfinished',
          },
        },
      },
    });
    await expect(send()).rejects.toMatchObject({ code: 'CONFLICT' });
    expect((await domain().get(ALICE, id)).runner?.id).toBe(one.runnerId);
  });

  it('keeps the native session when sending with the current runtime', async () => {
    const { one, agent, record } = await nativeFixture();
    const before = await record();
    await agent.send([{ role: 'user', content: 'Stay here' }], {
      runnerId: one.runnerId,
    });
    expect((await record())!.thread).toBe(before!.thread);
    const [next] = await claim(h, one);
    expect(next.prompt.session).toBe('resume');
  });
});
