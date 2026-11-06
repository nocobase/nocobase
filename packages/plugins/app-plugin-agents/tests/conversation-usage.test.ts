import { afterEach, expect, it } from 'vitest';

import { runnerMessages } from '../server/online/agent/runner/projection.js';
import { toMessage } from '../server/core/conversations/conversation.store.js';
import { claim, createHarness, type Harness } from './harness.js';

const ALICE = 'alice';
let h: Harness;
afterEach(async () => {
  await h?.services.onlineAgent.shutdown();
  await h?.close();
});

it("sums a conversation's tokens over its runs, keeps the latest context window, and closes each response with its turn", async () => {
  h = await createHarness();
  const agentId = await h.createAgent({ name: 'PM' });
  const runner = await h.registerRunner();
  const domain = h.services.conversations;
  const id = (await domain.create(ALICE, { agentId })).id;
  expect(await domain.usage(ALICE, id)).toEqual({
    inputTokens: 0,
    cacheReadTokens: 0,
    outputTokens: 0,
    runs: 0,
    context: null,
    costUsd: null,
  });
  const post = (runId: string, action: string, body: unknown = {}) =>
    h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
      runnerKey: runner.key,
      body,
    });
  const turn = async (
    content: string,
    usage: {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
    },
    context: { used: number; size: number } | null,
    costUsd?: number,
  ) => {
    const sent = await domain.send(ALICE, id, { content });
    await claim(h, runner);
    const runId = sent.run!.id;
    await post(runId, 'start', {
      workDir: '/work/chat',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
    const at = h.clock.now().toISOString();
    await post(runId, 'events', {
      events: [
        { seq: 1, at, type: 'text', content: `Re: ${content}` },
        {
          seq: 2,
          at,
          type: 'status',
          content: 'turnCompleted',
          meta: { durationMs: 4200, ...(costUsd ? { costUsd } : {}) },
        },
        {
          seq: 3,
          at,
          type: 'usage',
          meta: { usage: [{ tool: 'claude', ...usage }] },
        },
        ...(context
          ? [
              {
                seq: 4,
                at,
                type: 'status',
                content: 'context',
                meta: { context },
              },
            ]
          : []),
      ],
    });
    const handled = (await h.services.runs.detail(runId)).inputs.map(
      (input) => input.id,
    );
    expect(
      (
        await post(runId, 'complete', {
          summary: 'Done',
          handledInputIds: handled,
          sessionId: 'session-1',
          usage: [{ tool: 'claude', model: 'claude-x', ...usage }],
        })
      ).status,
    ).toBe(200);
    return runId;
  };
  const first = await turn(
    'One',
    { inputTokens: 100, outputTokens: 20, cacheReadTokens: 1000 },
    { used: 30_000, size: 200_000 },
    0.125,
  );
  await turn(
    'Two',
    { inputTokens: 50, outputTokens: 10, cacheReadTokens: 500 },
    null,
  );
  expect(await domain.usage(ALICE, id)).toEqual({
    inputTokens: 150,
    cacheReadTokens: 1500,
    outputTokens: 30,
    runs: 2,
    context: { used: 30_000, size: 200_000 },
    costUsd: 0.125,
  });
  await expect(domain.usage('bob', id)).rejects.toThrow();

  const rows = await h.database
    .connection()
    .repository('agConversationMessages')
    .findMany({
      filter: { conversationId: id },
      sort: (sort) => sort.field('seq').asc(),
    });
  const messages = await runnerMessages(
    h.services.tx,
    rows.map((row) => toMessage(row as never, '')),
  );
  const response = messages.find((message) => message.id === `runner:${first}`);
  expect(response?.parts.at(-1)).toEqual({
    type: 'data-turn',
    id: `turn:${first}`,
    data: {
      durationMs: 4200,
      inputTokens: 100,
      cacheReadTokens: 1000,
      outputTokens: 20,
      outcome: 'completed',
    },
  });
});
