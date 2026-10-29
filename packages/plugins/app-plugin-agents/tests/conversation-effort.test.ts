import { afterEach, expect, it } from 'vitest';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import { asJson } from '../server/kernel/values.js';
import { chatEffortsFor, chatEffortCapabilities } from '../shared/runners.js';
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
const tools = (efforts: readonly string[] | undefined) => [
  {
    kind: 'claude' as const,
    authenticated: true,
    models: [
      { id: 'test-model', ...(efforts === undefined ? {} : { efforts }) },
    ],
  },
];
async function fixture() {
  h = await createHarness();
  const runner = await h.registerRunner({
    tools: tools(['low', 'medium', 'high']),
  });
  const id = await h.createAgent({
    source: 'runner',
    modelEntries: [{ tool: 'claude', model: 'test-model', effort: 'medium' }],
  });
  return { runner, id };
}

it('intersects exact-model reports with executable efforts and treats unknown and empty as unavailable', () => {
  const entry = { tool: 'claude' as const, model: 'test-model' };
  expect(
    chatEffortsFor(entry, [
      { tools: tools(['low', 'medium', 'unsupported']) },
      { tools: tools(['medium', 'high', 'unsupported']) },
    ]),
  ).toEqual(['medium']);
  expect(chatEffortsFor(entry, [{ tools: tools(undefined) }])).toEqual([]);
  expect(chatEffortsFor(entry, [{ tools: tools([]) }])).toEqual([]);
  expect(chatEffortCapabilities(entry, [])).toBeUndefined();
  expect(
    chatEffortCapabilities(entry, [{ tools: tools(undefined) }]),
  ).toBeUndefined();
  expect(chatEffortCapabilities(entry, [{ tools: tools([]) }])).toEqual([]);
  expect(
    chatEffortCapabilities(entry, [
      { tools: tools([]) },
      { tools: tools(undefined) },
    ]),
  ).toEqual([]);
  expect(
    chatEffortCapabilities(entry, [
      { tools: tools(['low']) },
      { tools: tools(['high']) },
    ]),
  ).toEqual([]);
  expect(
    chatEffortsFor(entry, [
      {
        tools: [
          {
            kind: 'claude',
            authenticated: true,
            models: [{ id: 'other', efforts: ['high'] }],
          },
        ],
      },
    ]),
  ).toEqual([]);
});

it('uses only eligible model reports and excludes another owner personal runner', async () => {
  const { id } = await fixture();
  await h.registerRunner({ tools: tools(['medium', 'high']) });
  await h.registerRunner({
    trust: 'ownerOnly',
    ownerUserId: 'bob',
    tools: tools([]),
  });
  const agent = (await h.services.conversations.chatAgents('alice')).find(
    (agent) => agent.id === id,
  )!;
  expect(agent.efforts).toEqual(['medium', 'high']);
  expect(agent.effort).toBe('medium');
});

it.each([['low', 'medium', 'high'], undefined])(
  'omits an unselected Agent default with capabilities %j',
  async (capabilities) => {
    const { id, runner } = await fixture();
    await h.database
      .connection()
      .repository('agRunners')
      .updateMany({
        filter: { id: runner.runnerId },
        values: { tools: asJson(tools(capabilities)) },
      });
    const session = await h.services.onlineAgent.realtime(context, {
      agentId: id,
    });
    expect(
      (await h.services.conversations.get('alice', session.sessionId)).effort,
    ).toBeNull();
    await session.send([{ role: 'user', content: 'Use the tool default' }]);
    await (await session.receive())!.cancel();
    const [run] = await claim(h, runner);
    expect(run.tool).not.toHaveProperty('effort');
    expect((await h.services.runs.get(run.run.id)).effort).toBeNull();
    const user = (await session.history()).find(
      (message) => message.role === 'user',
    )!;
    expect(user.metadata?.effort).toBeUndefined();
    expect(user.parts.some((part) => part.type === 'data-notice')).toBe(false);
  },
);

it('saves only a selected non-default effort and clears it on a later omitted/default send', async () => {
  const { id, runner } = await fixture();
  const selected = await h.services.onlineAgent.realtime(context, {
    agentId: id,
  });
  await selected.send([{ role: 'user', content: 'Use high' }], {
    effort: 'high',
  });
  const stream = (await selected.receive())!;
  const drained = (async () => {
    const reader = stream.getReader();
    while (!(await reader.read()).done) {
      /* Drain the native response. */
    }
  })();
  const [first] = await claim(h, runner);
  expect(first.tool.effort).toBe('high');
  await h.request('POST', `/agents/runners/runs/${first.run.id}/start`, {
    runnerKey: runner.key,
    body: {
      workDir: '/work/chat',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    },
  });
  await h.request('POST', `/agents/runners/runs/${first.run.id}/complete`, {
    runnerKey: runner.key,
    body: {
      summary: 'Done',
      handledInputIds: first.inputs.map((input) => input.id),
    },
  });
  await drained;
  expect(
    (await h.services.conversations.get('alice', selected.sessionId)).effort,
  ).toBe('high');
  await selected.send([{ role: 'user', content: 'Use default now' }]);
  await (await selected.receive())!.cancel();
  const [second] = await claim(h, runner);
  expect(second.tool).not.toHaveProperty('effort');
  expect(
    (await h.services.conversations.get('alice', selected.sessionId)).effort,
  ).toBeNull();
  expect(
    (await selected.history())
      .filter((message) => message.role === 'user')
      .map((message) => message.metadata?.effort),
  ).toEqual(['high', undefined]);
});

it.each(['medium', null])(
  'normalizes an explicit Agent default/reset %s to no preference',
  async (effort) => {
    const { id, runner } = await fixture();
    const session = await h.services.onlineAgent.realtime(context, {
      agentId: id,
      effort: 'high',
    });
    await session.send([{ role: 'user', content: 'Default' }], { effort });
    await (await session.receive())!.cancel();
    expect(
      (await h.services.conversations.get('alice', session.sessionId)).effort,
    ).toBeNull();
    expect((await claim(h, runner))[0].tool).not.toHaveProperty('effort');
  },
);

it('queues a selected effort offline, then omits it when the recovered runtime still reports unknown capabilities', async () => {
  const { id, runner } = await fixture();
  const session = await h.services.onlineAgent.realtime(context, {
    agentId: id,
  });
  const runners = h.database.connection().repository('agRunners');
  await runners.updateMany({
    filter: { id: runner.runnerId },
    values: { lastSeenAt: '2000-01-01T00:00:00.000Z' },
  });
  await session.send([{ role: 'user', content: 'Wait for my runtime' }], {
    effort: 'high',
  });
  await (await session.receive())!.cancel();
  const conversation = await h.services.conversations.get(
    'alice',
    session.sessionId,
  );
  expect(conversation.effort).toBe('high');
  expect(conversation.run?.status).toBe('queued');
  const before = (await session.history()).find(
    (message) => message.role === 'user',
  )!;
  expect(before.parts.some((part) => part.type === 'data-notice')).toBe(false);
  await runners.updateMany({
    filter: { id: runner.runnerId },
    values: {
      lastSeenAt: h.clock.now().toISOString(),
      tools: asJson(tools(undefined)),
    },
  });
  const [run] = await claim(h, runner);
  expect(run.run.id).toBe(conversation.run!.id);
  expect(run.tool).not.toHaveProperty('effort');
  const actual = await h.services.runs.get(run.run.id);
  expect(actual.effort).toBeNull();
  expect(actual.executions?.at(-1)?.effort).toBeNull();
  const user = (await session.history()).find(
    (message) => message.role === 'user',
  )!;
  expect(user.metadata?.effort).toBe('high');
  expect(user.parts).toContainEqual(
    expect.objectContaining({
      type: 'data-notice',
      data: expect.objectContaining({ type: 'effortDefaulted' }),
    }),
  );
});

it('uses the selected effort when the recovered report supports it', async () => {
  const { id, runner } = await fixture();
  const session = await h.services.onlineAgent.realtime(context, {
    agentId: id,
  });
  const runners = h.database.connection().repository('agRunners');
  await runners.updateMany({
    filter: { id: runner.runnerId },
    values: { lastSeenAt: '2000-01-01T00:00:00.000Z' },
  });
  await session.send([{ role: 'user', content: 'Use high after recovery' }], {
    effort: 'high',
  });
  await (await session.receive())!.cancel();
  await runners.updateMany({
    filter: { id: runner.runnerId },
    values: {
      lastSeenAt: h.clock.now().toISOString(),
      tools: asJson(tools(['high'])),
    },
  });
  const [run] = await claim(h, runner);
  expect(run.tool.effort).toBe('high');
  expect(
    (await session.history())
      .find((message) => message.role === 'user')!
      .parts.some((part) => part.type === 'data-notice'),
  ).toBe(false);
});

it('rejects a known empty intersection even when some reports remain unknown', async () => {
  const { id, runner } = await fixture();
  const session = await h.services.onlineAgent.realtime(context, {
    agentId: id,
  });
  await h.database
    .connection()
    .repository('agRunners')
    .updateMany({
      filter: { id: runner.runnerId },
      values: { tools: asJson(tools(['high'])) },
    });
  await h.registerRunner({ tools: tools(['low']) });
  await h.registerRunner({ tools: tools(undefined) });
  await expect(
    session.send([{ role: 'user', content: 'No common effort' }], {
      effort: 'high',
    }),
  ).rejects.toMatchObject({
    details: { reason: 'EFFORT_UNSUPPORTED', efforts: [] },
  });
  expect(await session.history()).toEqual([]);
});

it('keeps known unsupported claim failures explicit instead of defaulting', async () => {
  const { id, runner } = await fixture();
  const session = await h.services.onlineAgent.realtime(context, {
    agentId: id,
  });
  const runners = h.database.connection().repository('agRunners');
  await runners.updateMany({
    filter: { id: runner.runnerId },
    values: { tools: asJson(tools(undefined)) },
  });
  await session.send([{ role: 'user', content: 'Keep high' }], {
    effort: 'high',
  });
  await (await session.receive())!.cancel();
  const conversation = await h.services.conversations.get(
    'alice',
    session.sessionId,
  );
  await runners.updateMany({
    filter: { id: runner.runnerId },
    values: { tools: asJson(tools(['low'])) },
  });
  for (let attempt = 0; attempt < 3; attempt++)
    expect(await claim(h, runner)).toEqual([]);
  const run = await h.services.runs.get(conversation.run!.id);
  expect(run.status).toBe('failed');
  expect(run.failureDetail).toContain(
    'reasoning effort "high" is not supported',
  );
  expect(
    (await session.history())
      .find((message) => message.role === 'user')!
      .parts.some((part) => part.type === 'data-notice'),
  ).toBe(false);
});

it('enforces authentication, ownership and agent permissions for explicit effort requests', async () => {
  const { id } = await fixture();
  const agent = await h.services.onlineAgent.realtime(context, { agentId: id });
  const path = `/agents/conversations/${agent.sessionId}/messages`;
  const body = {
    message: {
      id: 'turn',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello' }],
    },
    effort: 'high',
  };
  expect((await h.request('POST', path, { body })).status).toBe(401);
  expect((await h.request('POST', path, { user: 'bob', body })).status).toBe(
    404,
  );
  await h.disableAgent(id);
  expect((await h.request('POST', path, { user: 'alice', body })).status).toBe(
    403,
  );
});

it('leaves task run defaults unchanged', async () => {
  const { id, runner } = await fixture();
  const task = await h.enqueue(id);
  const [run] = await claim(h, runner);
  expect(run.run.id).toBe(task);
  expect(run.tool.effort).toBe('medium');
});

it('validates effort on the HTTP create and send boundaries without saving refused input', async () => {
  const { id } = await fixture();
  const denied = await h.request('POST', '/agents/conversations', {
    user: 'alice',
    body: { agentId: id, effort: 'ultra' },
  });
  expect(denied.status).toBe(400);
  const created = await h.request('POST', '/agents/conversations', {
    user: 'alice',
    body: { agentId: id, effort: 'low' },
  });
  expect(created.status).toBe(201);
  expect(created.body.data.effort).toBe('low');
  const path = `/agents/conversations/${created.body.data.id}/messages`;
  const body = {
    message: {
      id: 'http-turn',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello' }],
    },
    effort: 'ultra',
  };
  expect((await h.request('POST', path, { user: 'alice', body })).status).toBe(
    400,
  );
  expect(
    (await h.services.conversations.messages('alice', created.body.data.id, {}))
      .items,
  ).toHaveLength(0);
});

it('does not save an Agent default on a switch', async () => {
  const { id, runner } = await fixture();
  const nextId = await h.createAgent({
    source: 'runner',
    modelEntries: [{ tool: 'claude', model: 'test-model', effort: 'high' }],
  });
  const session = await h.services.onlineAgent.realtime(context, {
    agentId: id,
  });
  await session.send([{ role: 'user', content: 'Use new Agent default' }], {
    agentId: nextId,
    effort: 'high',
  });
  await (await session.receive())!.cancel();
  expect(
    (await h.services.conversations.get('alice', session.sessionId)).effort,
  ).toBeNull();
  expect((await claim(h, runner))[0].tool).not.toHaveProperty('effort');
});
