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
});
