import { afterEach, describe, expect, it } from 'vitest';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { AgentsEvent } from '../server/kernel/events.js';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import {
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

describe('what conversations need of their owner', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.services.onlineAgent.shutdown();
    await h?.close();
  });
  const domain = () => h.services.conversations;
  const post = (
    runner: RegisteredRunner,
    runId: string,
    action: string,
    body: unknown = {},
  ) =>
    h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
      runnerKey: runner.key,
      body,
    });
  async function turn(
    runner: RegisteredRunner,
    runId: string,
    text: string,
    outcome: 'complete' | 'fail' = 'complete',
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
    const done =
      outcome === 'complete'
        ? await post(runner, runId, 'complete', {
            summary: text,
            handledInputIds: handled,
            sessionId: 'session-1',
          })
        : await post(runner, runId, 'fail', { reason: 'toolAuth' });
    expect(done.status).toBe(200);
  }
  const counts = async () =>
    (await h.request('GET', '/agents/conversationAttention', { user: ALICE }))
      .body.data;

  it('waits for the owner after a turn until they see it, and counts it', async () => {
    h = await createHarness();
    const heard: AgentsEvent[] = [];
    h.services.events.on('conversation.attention', (event) => {
      heard.push(event);
    });
    const agentId = await h.createAgent({ name: 'PM' });
    const runner = await h.registerRunner();
    const id = (await domain().create(ALICE, { agentId })).id;
    const sent = await domain().send(ALICE, id, { content: 'Hello' });
    expect(await counts()).toEqual({ unread: 0, needsYou: 0 });
    await claim(h, runner);
    await turn(runner, sent.run!.id, 'Hi there.');
    const waiting = await domain().get(ALICE, id);
    expect(waiting).toMatchObject({
      read: false,
      lastSeq: 2,
      seenSeq: 1,
      needsYou: { reason: 'reply', seq: 2, text: null },
    });
    expect(heard).toMatchObject([
      {
        type: 'conversation.attention',
        conversationId: id,
        userId: ALICE,
        reason: 'reply',
        seq: 2,
      },
    ]);
    expect(await counts()).toEqual({ unread: 1, needsYou: 1 });
    expect(
      (await h.request('GET', '/agents/conversationAttention', { user: 'bob' }))
        .body.data,
    ).toEqual({ unread: 0, needsYou: 0 });

    const path = `/agents/conversations/${id}/markSeen`;
    expect(
      (await h.request('POST', path, { user: 'bob', body: { seq: 2 } })).status,
    ).toBe(404);
    const seen = await h.request('POST', path, {
      user: ALICE,
      body: { seq: 99 },
    });
    expect(seen.status).toBe(200);
    expect(seen.body.data).toMatchObject({
      read: true,
      seenSeq: 2,
      needsYou: null,
    });
    // Never back.
    expect((await domain().markSeen(ALICE, id, 0)).seenSeq).toBe(2);
    expect(await counts()).toEqual({ unread: 0, needsYou: 0 });

    // Writing after a reply settles it too, announced without a seq so listeners that settle notices act on it.
    const third = await domain().send(ALICE, id, { content: 'Thanks' });
    await claim(h, runner);
    await turn(runner, third.run!.id, 'You are welcome.');
    expect((await domain().get(ALICE, id)).needsYou?.reason).toBe('reply');
    const changed: AgentsEvent[] = [];
    const stop = h.services.events.on('conversation.changed', (event) => {
      changed.push(event);
    });
    const answered = await domain().send(ALICE, id, { content: 'One more' });
    stop();
    expect(await domain().get(ALICE, id)).toMatchObject({ needsYou: null });
    expect(changed).toContainEqual({
      type: 'conversation.changed',
      conversationId: id,
      userId: ALICE,
    });
    await claim(h, runner);
    await turn(runner, answered.run!.id, 'Sure.');
    await domain().markSeen(ALICE, id, 99);

    // A failed turn waits as a failure; the application notes what it told.
    const again = await domain().send(ALICE, id, { content: 'Once more' });
    await claim(h, runner);
    await turn(runner, again.run!.id, 'Trying.', 'fail');
    expect((await domain().get(ALICE, id)).needsYou?.reason).toBe('failed');
    await domain().markNoticed(id, 5);
    await domain().markNoticed(id, 3);
    const row = await h.database
      .connection()
      .repository('agConversations')
      .findOne({ filter: { id } });
    expect(row).toMatchObject({ noticedSeq: 5 });
    // Archiving settles it.
    await domain().update(ALICE, id, { archived: true });
    expect((await domain().get(ALICE, id)).needsYou).toBeNull();
  });

  it("keeps an agent's question waiting until the owner writes", async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ name: 'PM' });
    const runner = await h.registerRunner();
    const id = (await domain().create(ALICE, { agentId })).id;
    const sent = await domain().send(ALICE, id, { content: 'Tidy up.' });
    const [payload] = await claim(h, runner);
    const runToken = payload.cli.credential.content.token as string;
    const asked = await h.request(
      'POST',
      '/agents/runs/current/conversation/askOwner',
      { runToken, body: { question: 'Merge ST-1 into ST-2?' } },
    );
    expect(asked.status).toBe(200);
    await turn(runner, sent.run!.id, 'Shall I merge them?');
    expect((await domain().get(ALICE, id)).needsYou).toEqual({
      reason: 'confirm',
      seq: 2,
      text: 'Merge ST-1 into ST-2?',
    });
    // Seeing it is not answering it.
    await domain().markSeen(ALICE, id, 2);
    expect((await domain().get(ALICE, id)).needsYou?.reason).toBe('confirm');
    const answered = await domain().send(ALICE, id, { content: 'Yes.' });
    expect((await domain().get(ALICE, id)).needsYou).toBeNull();

    // A question asked by a run that then fails is not left waiting: the failure is.
    const [next] = await claim(h, runner);
    await h.request('POST', '/agents/runs/current/conversation/askOwner', {
      runToken: next.cli.credential.content.token as string,
      body: { question: 'Keep both?' },
    });
    await turn(runner, answered.run!.id, 'Stuck.', 'fail');
    expect((await domain().get(ALICE, id)).needsYou?.reason).toBe('failed');
  });

  it('wakes a Runner OnlineAgent conversation with news only when asked', async () => {
    h = await createHarness();
    const runner = await h.registerRunner();
    const agentId = await h.createAgent({
      source: 'runner',
      name: 'Runner helper',
    });
    const context: OnlineAgentContext = {
      user: { id: ALICE },
      credentials: { kind: 'test-session', userId: ALICE },
      authorization: {
        identity: { principal: { type: 'user', id: ALICE } },
      } as AuthorizationContext,
    };
    const agent = await h.services.onlineAgent.realtime(context, { agentId });
    const news = (wake?: boolean) =>
      h.services.tx.run((unit) =>
        domain().deliver(unit, agent.sessionId, {
          notice: { code: 'news', type: 'issue', title: 'ST-1 is done.' },
          input: {
            type: 'signal',
            actor: { kind: 'user', id: ALICE, name: 'Alice' },
            text: 'ST-1 is done.',
          },
          ...(wake === undefined ? {} : { wake }),
        }),
      );
    expect(await news()).toBeNull();
    const woken = await news(true);
    expect(woken).toMatchObject({ outcome: 'created' });
    const [payload] = await claim(h, runner);
    expect(payload.run.id).toBe(woken!.id);
    await turn(runner, woken!.id, 'Noted ST-1.');
    expect(
      (await agent.history()).flatMap((message) =>
        message.parts.flatMap((part) =>
          part.type === 'text' ? [part.text] : [],
        ),
      ),
    ).toContain('Noted ST-1.');
    expect((await domain().get(ALICE, agent.sessionId)).needsYou?.reason).toBe(
      'reply',
    );
    // Restoring finalizes the background turn, so the owner may write again.
    const restored = await h.services.onlineAgent.realtime(context, {
      sessionId: agent.sessionId,
    });
    expect(await restored.status()).toBe('idle');
    await restored.send([{ role: 'user', content: 'Thanks' }]);
  });
});
