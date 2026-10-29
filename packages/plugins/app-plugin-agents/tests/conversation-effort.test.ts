import { afterEach, expect, it } from 'vitest';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import { asJson } from '../server/kernel/values.js';
import { chatEffortsFor } from '../shared/runners.js';
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

it('saves defaults and selected efforts, dispatches two distinct turns and preserves historical values', async () => {
  const { id, runner } = await fixture();
  const agent = await h.services.onlineAgent.realtime(context, {
    agentId: id,
    effort: 'low',
  });
  expect(
    (await h.services.conversations.get('alice', agent.sessionId)).effort,
  ).toBe('low');
  await agent.send([{ role: 'user', content: 'First' }]);
  const firstStream = (await agent.receive())!;
  const firstDrained = (async () => {
    const reader = firstStream.getReader();
    while (!(await reader.read()).done) {
      /* Consume the native stream through finalization. */
    }
  })();
  const [first] = await claim(h, runner);
  expect(first.tool.effort).toBe('low');
  expect((await h.services.runs.get(first.run.id)).effort).toBe('low');
  await h.request('POST', `/agents/runners/runs/${first.run.id}/start`, {
    runnerKey: runner.key,
    body: {
      workDir: '/work/chat',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    },
  });
  const done = await h.request(
    'POST',
    `/agents/runners/runs/${first.run.id}/complete`,
    {
      runnerKey: runner.key,
      body: {
        summary: 'First complete',
        handledInputIds: first.inputs.map((input) => input.id),
        sessionId: 'session-one',
      },
    },
  );
  expect(done.status).toBe(200);
  await firstDrained;
  const restored = await h.services.onlineAgent.realtime(context, {
    sessionId: agent.sessionId,
  });
  await restored.send([{ role: 'user', content: 'Second' }], {
    effort: 'high',
  });
  await (await restored.receive())!.cancel();
  const [second] = await claim(h, runner);
  expect(second.tool.effort).toBe('high');
  expect(
    (await h.services.conversations.get('alice', agent.sessionId)).effort,
  ).toBe('high');
  const history = (await restored.history()).filter(
    (message) => message.role === 'user',
  );
  expect(history.map((message) => message.metadata?.effort)).toEqual([
    'low',
    'high',
  ]);
  const defaults = await h.services.onlineAgent.realtime(context, {
    agentId: id,
  });
  expect(
    (await h.services.conversations.get('alice', defaults.sessionId)).effort,
  ).toBe('medium');
  expect((await h.services.agents.get(id)).modelEntries[0]?.effort).toBe(
    'medium',
  );
});

it('refuses stale preferences and invalid explicit input without admitting a message, and permits explicit reset when capabilities become unknown', async () => {
  const { id, runner } = await fixture();
  const agent = await h.services.onlineAgent.realtime(context, {
    agentId: id,
    effort: 'high',
  });
  await h.database
    .connection()
    .repository('agRunners')
    .updateMany({
      filter: { id: runner.runnerId },
      values: { tools: asJson(tools(undefined)) },
    });
  await expect(
    agent.send([{ role: 'user', content: 'stale' }]),
  ).rejects.toMatchObject({ details: { reason: 'EFFORT_UNSUPPORTED' } });
  await expect(
    agent.send([{ role: 'user', content: 'explicit' }], { effort: 'ultra' }),
  ).rejects.toMatchObject({ details: { reason: 'EFFORT_UNSUPPORTED' } });
  expect(await agent.history()).toEqual([]);
  await agent.send([{ role: 'user', content: 'Use default deliberately' }], {
    effort: null,
  });
  await (await agent.receive())!.cancel();
  const [run] = await claim(h, runner);
  expect(run.tool.effort).toBe('medium');
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

it('preserves default execution for unknown and empty capabilities, rejects an invalid known default and leaves task runs unchanged', async () => {
  const { id, runner } = await fixture();
  for (const capabilities of [undefined, []]) {
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
    expect(
      (await h.services.conversations.chatAgents('alice')).find(
        (agent) => agent.id === id,
      )?.efforts,
    ).toEqual([]);
  }
  await h.database
    .connection()
    .repository('agRunners')
    .updateMany({
      filter: { id: runner.runnerId },
      values: { tools: asJson(tools(['high'])) },
    });
  await expect(
    h.services.onlineAgent.realtime(context, { agentId: id }),
  ).rejects.toMatchObject({ details: { reason: 'EFFORT_UNSUPPORTED' } });
  const session = await h.services.onlineAgent.realtime(context, {
    agentId: id,
    effort: 'high',
  });
  expect(
    (await h.services.conversations.get('alice', session.sessionId)).effort,
  ).toBe('high');
  const task = await h.enqueue(id);
  const [claimed] = await claim(h, runner);
  expect(claimed.run.id).toBe(task);
  expect(claimed.tool.effort).toBe('medium');
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

it('saves the current default on an explicit reset and uses the new Agent default on a switch', async () => {
  const { id, runner } = await fixture();
  const reset = await h.services.onlineAgent.realtime(context, {
    agentId: id,
    effort: 'high',
  });
  await reset.send([{ role: 'user', content: 'Reset' }], { effort: null });
  await (await reset.receive())!.cancel();
  expect(
    (await h.services.conversations.get('alice', reset.sessionId)).effort,
  ).toBe('medium');
  const nextId = await h.createAgent({
    source: 'runner',
    modelEntries: [{ tool: 'claude', model: 'test-model', effort: 'high' }],
  });
  const switched = await h.services.onlineAgent.realtime(context, {
    agentId: id,
    effort: 'low',
  });
  await switched.send(
    [{ role: 'user', content: 'Use the new Agent default' }],
    { agentId: nextId },
  );
  await (await switched.receive())!.cancel();
  expect(
    (await h.services.conversations.get('alice', switched.sessionId)).effort,
  ).toBe('high');
  const claims = await claim(h, runner, 2);
  expect(claims.map((run) => run.tool.effort).sort()).toEqual([
    'high',
    'medium',
  ]);
});
