import { afterEach, expect, it } from 'vitest';
import type { AuthorizationContext } from '@nocobase/authorization/core';

import type { OnlineAgentContext } from '../server/online/agent/types.js';
import { runnerUIMessages } from '../server/online/agent/runner/projection.js';
import type { ConversationMessage } from '../shared/conversations.js';
import {
  inputsRepo,
  markDelivered,
  pendingInputs,
} from '../server/core/runs/run.store.js';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  await h?.services.onlineAgent.shutdown();
  await h?.close();
});
const context: OnlineAgentContext = {
  user: { id: 'alice' },
  credentials: { kind: 'test-session', userId: 'alice' },
  authorization: {
    identity: { principal: { type: 'user', id: 'alice' } },
  } as AuthorizationContext,
};

it('queues messages into the run at work, withdraws one the runner has not taken, and answers each in order', async () => {
  h = await createHarness();
  const runner = await h.registerRunner();
  const agentId = await h.createAgent({ source: 'runner', name: 'Helper' });
  const agent = await h.services.onlineAgent.realtime(context, { agentId });
  const report = (runId: string, action: string, body: unknown) =>
    h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
      runnerKey: runner.key,
      body,
    });
  const at = () => h.clock.now().toISOString();

  // Nothing to join before the agent works.
  await expect(
    agent.queue([{ role: 'user', content: 'Too early' }]),
  ).rejects.toThrow(/not working/u);

  await agent.send([{ role: 'user', content: 'First' }]);
  const [claimed] = await claim(h, runner);
  const runId = claimed.run.id;
  await report(runId, 'start', {
    workDir: '/work/chat',
    adapter: { kind: 'claude' },
    acceptsInput: true,
  });
  await report(runId, 'events', {
    events: [{ seq: 1, at: at(), type: 'text', content: 'Answer one' }],
  });

  await agent.queue([{ role: 'user', content: 'Second' }], {
    clientId: 'second',
  });
  await agent.queue([{ role: 'user', content: 'Third' }], {
    clientId: 'third',
  });
  const queued = (await agent.history()).filter(
    (message) => message.role === 'user',
  );
  expect(queued.map((message) => message.metadata?.queue)).toEqual([
    undefined,
    'queued',
    'queued',
  ]);
  const [, second, third] = queued;

  // The runner takes both; one taken back first stays out of its hands.
  await h.services.conversations.withdraw('alice', agent.sessionId, third.id);
  await h.request('GET', `/agents/runners/runs/${runId}/status`, {
    runnerKey: runner.key,
  });
  await expect(
    h.services.conversations.withdraw('alice', agent.sessionId, second.id),
  ).rejects.toThrow(/already has/u);
  const inputs = (await h.services.runs.detail(runId)).inputs;
  const secondInput = inputs.find((input) => input.text.includes('Second'));
  expect(secondInput).toBeDefined();
  expect(
    inputs.find((input) => input.text.includes('Third'))?.handledAt,
  ).toBeTruthy();

  await report(runId, 'events', {
    events: [
      {
        seq: 2,
        at: at(),
        type: 'status',
        content: 'turnCompleted',
        meta: { durationMs: 1000 },
      },
      {
        seq: 3,
        at: at(),
        type: 'input',
        content: 'Second',
        meta: { inputId: secondInput!.id, mode: 'turn' },
      },
      {
        seq: 4,
        at: at(),
        type: 'status',
        content: 'plan',
        meta: {
          plan: [
            { content: 'Look', status: 'completed' },
            { content: 'Answer', status: 'in_progress' },
          ],
        },
      },
      { seq: 5, at: at(), type: 'text', content: 'Answer two' },
      {
        seq: 6,
        at: at(),
        type: 'status',
        content: 'turnCompleted',
        meta: { durationMs: 2000 },
      },
    ],
  });
  expect(
    (
      await report(runId, 'complete', {
        summary: 'Done',
        handledInputIds: (await h.services.runs.detail(runId)).inputs.map(
          (input) => input.id,
        ),
        sessionId: 'session-1',
      })
    ).status,
  ).toBe(200);

  const history = await agent.history();
  expect(
    history.map((message) => [
      message.role,
      message.metadata?.queue,
      message.parts.flatMap((part) =>
        part.type === 'text' ? [part.text] : [part.type],
      ),
    ]),
  ).toEqual([
    ['user', undefined, ['First']],
    ['assistant', undefined, ['Answer one', 'data-turn']],
    ['user', undefined, ['Second']],
    ['assistant', undefined, ['data-plan', 'Answer two', 'data-turn']],
    ['user', 'withdrawn', ['Third']],
  ]);
  const answer = history[3];
  expect(answer.id).toBe(`runner:${runId}:${second.id}`);
  expect(answer.parts[0]).toEqual({
    type: 'data-plan',
    id: `plan:${runId}:1`,
    data: {
      entries: [
        { content: 'Look', status: 'completed' },
        { content: 'Answer', status: 'in_progress' },
      ],
    },
  });
  expect(answer.parts.at(-1)).toMatchObject({
    type: 'data-turn',
    data: { durationMs: 2000, outcome: 'completed' },
  });
  // A page asked for the split response by its id has it, and one asked for the run's response has both.
  const page = await agent.messages!({ ids: [answer.id], limit: 10 });
  expect(page.items.map((message) => message.id)).toEqual([answer.id]);
  const run = await agent.messages!({
    ids: [`runner:${runId}`],
    limit: 10,
  });
  expect(run.items.map((message) => message.id)).toEqual([
    `runner:${runId}`,
    answer.id,
  ]);
  // Newer messages read after the queued one still split the run's response where it was taken.
  const newer = await agent.messages!({
    after: Number(second.metadata!.seq),
    limit: 10,
  });
  expect(newer.items.map((message) => message.id)).toContain(answer.id);
});

it('keeps one response when a queued message was steered into the running turn', () => {
  const row = (
    id: string,
    seq: number,
    role: 'user' | 'assistant',
    text: string,
    metadata: Record<string, unknown> = {},
  ) =>
    ({
      id,
      conversationId: 'c',
      seq,
      role,
      content: { type: 'text', content: text },
      workContext: null,
      metadata,
      runId: 'r',
      createdAt: '2026-10-26T00:00:00.000Z',
    }) as unknown as ConversationMessage;
  const messages = runnerUIMessages(
    [
      row('u1', 1, 'user', 'First', { inputId: 'i1' }),
      row('a1', 2, 'assistant', 'Working', { runEventSeq: 2 }),
      row('u2', 3, 'user', 'Also this', {
        inputId: 'i2',
        queued: true,
        pickedUp: true,
      }),
      row('a2', 4, 'assistant', 'Both done', { runEventSeq: 3 }),
    ],
    [
      {
        runId: 'r',
        seq: 4,
        at: '2026-10-26T00:00:00.000Z',
        type: 'input',
        content: 'Also this',
        meta: { inputId: 'i2' },
      },
    ],
  );
  expect(messages.map((message) => message.id)).toEqual([
    'u1',
    'runner:r',
    'u2',
  ]);
});

it('never both withdraws and delivers a queued message, whichever comes first', async () => {
  h = await createHarness();
  const runner = await h.registerRunner();
  const agentId = await h.createAgent({ source: 'runner', name: 'Helper' });
  const agent = await h.services.onlineAgent.realtime(context, { agentId });
  await agent.send([{ role: 'user', content: 'First' }]);
  const [claimed] = await claim(h, runner);
  const runId = claimed.run.id;
  await h.request('POST', `/agents/runners/runs/${runId}/start`, {
    runnerKey: runner.key,
    body: { workDir: '/w', adapter: { kind: 'claude' }, acceptsInput: true },
  });
  const conn = h.database.connection();
  const queue = async (text: string) => {
    await agent.queue([{ role: 'user', content: text }]);
    const pending = await pendingInputs(conn, runId);
    return pending.find((input) => input.text.includes(text))!;
  };
  const messageOf = async (text: string) =>
    (await agent.history()).find(
      (message) =>
        message.role === 'user' &&
        message.parts.some(
          (part) => part.type === 'text' && part.text === text,
        ),
    )!;

  // A delivery that read the input before it was withdrawn does not hand it over.
  const stale = await queue('Withdrawn first');
  await h.services.conversations.withdraw(
    'alice',
    agent.sessionId,
    (await messageOf('Withdrawn first')).id,
  );
  expect(await markDelivered(conn, [stale], new Date().toISOString())).toEqual(
    [],
  );

  // A withdrawal after the delivery took it is refused, whatever the message still says.
  const taken = await queue('Delivered first');
  const [delivered] = await markDelivered(
    conn,
    [taken],
    new Date().toISOString(),
  );
  expect(delivered?.id).toBe(taken.id);
  await expect(
    h.services.conversations.withdraw(
      'alice',
      agent.sessionId,
      (await messageOf('Delivered first')).id,
    ),
  ).rejects.toThrow(/already has/u);
  const inputs = await inputsRepo(conn).findMany({ filter: { runId } });
  expect(inputs.find((input) => input.id === taken.id)?.handledAt).toBeFalsy();
});
