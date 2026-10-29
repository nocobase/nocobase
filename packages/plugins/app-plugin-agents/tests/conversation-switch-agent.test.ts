import { asJson, jsonObject } from '../server/kernel/values.js';
import { afterEach, expect, it, vi } from 'vitest';
import type { Knex } from 'knex';
import { appendFile } from 'node:fs/promises';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import {
  appendMessage,
  findConversation,
  lockConversation,
} from '../server/core/conversations/conversation.store.js';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  vi.restoreAllMocks();
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
async function fixture() {
  h = await createHarness();
  const runner = await h.registerRunner();
  const from = await h.createAgent({ source: 'runner', name: 'First' });
  const to = await h.createAgent({ source: 'runner', name: 'Second' });
  const agent = await h.services.onlineAgent.realtime(context, {
    agentId: from,
  });
  const id = agent.sessionId;
  const path = `/agents/conversations/${id}/switchAgent`;
  return { runner, from, to, agent, id, path };
}

it('commits the selected agent, one notice and its target run together on send', async () => {
  const { runner, from, to, agent, id } = await fixture();
  await agent.send([{ role: 'user', content: 'Use the final selection' }], {
    agentId: to,
  });
  const saved = (await findConversation(h.database.connection(), id))!;
  expect(saved.agentId).toBe(to);
  expect(Number(saved.thread)).toBe(1);
  const history = await agent.history();
  const notices = history
    .flatMap((message) => message.parts)
    .filter((part) => part.type === 'data-business');
  expect(notices).toHaveLength(1);
  expect(notices[0]).toMatchObject({
    data: {
      kind: 'switchedAgent',
      payload: { agentId: to, fromAgentId: from },
    },
  });
  const [claimed] = await claim(h, runner);
  expect(await h.services.runs.get(claimed.run.id)).toMatchObject({
    agentId: to,
    threadScope: 't1',
  });
});

it('does not change the thread or add a notice when the final selection is the original agent', async () => {
  const { from, agent, id } = await fixture();
  await agent.send([{ role: 'user', content: 'Stay here' }], { agentId: from });
  expect(
    Number((await findConversation(h.database.connection(), id))!.thread),
  ).toBe(0);
  expect(
    (await agent.history())
      .flatMap((message) => message.parts)
      .filter((part) => part.type === 'data-business'),
  ).toHaveLength(0);
});

it('rolls back the binding and notice when an attachment rejects message admission', async () => {
  const { from, to, agent, id } = await fixture();
  await expect(
    agent.send([{ role: 'user', content: 'Rejected' }], {
      agentId: to,
      attachmentIds: [['missing-file']],
    }),
  ).rejects.toThrow();
  const saved = (await findConversation(h.database.connection(), id))!;
  expect(saved.agentId).toBe(from);
  expect(Number(saved.thread)).toBe(0);
  expect(await agent.history()).toEqual([]);
  await agent.send([{ role: 'user', content: 'Try without the file' }], {
    agentId: to,
  });
  expect((await findConversation(h.database.connection(), id))!.agentId).toBe(
    to,
  );
});

it('rejects unavailable targets without saving a switch or message', async () => {
  const { from, to, agent, id } = await fixture();
  await h.disableAgent(to);
  await expect(
    agent.send([{ role: 'user', content: 'Not allowed' }], { agentId: to }),
  ).rejects.toThrow();
  expect((await findConversation(h.database.connection(), id))!.agentId).toBe(
    from,
  );
  expect(await agent.history()).toEqual([]);
});

it('enforces authentication and ownership on the send selection boundary', async () => {
  const { to, id } = await fixture();
  const path = `/agents/conversations/${id}/messages`;
  const body = {
    message: {
      id: 'selection',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello' }],
    },
    agentId: to,
  };
  expect((await h.request('POST', path, { body })).status).toBe(401);
  expect((await h.request('POST', path, { user: 'bob', body })).status).toBe(
    404,
  );
  await h.disableAgent(to);
  expect((await h.request('POST', path, { user: 'alice', body })).status).toBe(
    403,
  );
});

it('keeps the accepted switch after response disconnection and execution failure', async () => {
  const { runner, to, agent, id } = await fixture();
  await agent.send([{ role: 'user', content: 'Accepted before disconnect' }], {
    agentId: to,
  });
  await (await agent.receive())!.cancel();
  const [claimed] = await claim(h, runner);
  expect(
    (
      await h.request('POST', `/agents/runners/runs/${claimed.run.id}/start`, {
        runnerKey: runner.key,
        body: {
          workDir: '/work/failure',
          adapter: { kind: 'claude' },
          acceptsInput: true,
        },
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await h.request('POST', `/agents/runners/runs/${claimed.run.id}/fail`, {
        runnerKey: runner.key,
        body: {
          reason: 'toolProcess',
          detail: 'Fixture failure',
          handledInputIds: claimed.inputs.map((input) => input.id),
        },
      })
    ).status,
  ).toBe(200);
  const restored = await h.services.onlineAgent.realtime(context, {
    sessionId: id,
  });
  expect((await findConversation(h.database.connection(), id))!.agentId).toBe(
    to,
  );
  const parts = (await restored.history()).flatMap((message) => message.parts);
  expect(
    parts.filter(
      (part) =>
        part.type === 'data-business' && part.data.kind === 'switchedAgent',
    ),
  ).toHaveLength(1);
  expect(
    parts.some(
      (part) =>
        part.type === 'text' && part.text === 'Accepted before disconnect',
    ),
  ).toBe(true);
});

it.each([false, true])(
  'measures admission cost with a changed selection: %s',
  async (switching) => {
    const { from, to, agent } = await fixture();
    const client = await h.database.connection().client<Knex>();
    const queries: string[] = [];
    const capture = (query: { sql: string }) => queries.push(query.sql);
    client.on('query', capture);
    try {
      await agent.send([{ role: 'user', content: 'Measure admission' }], {
        agentId: switching ? to : from,
      });
    } finally {
      client.off('query', capture);
    }
    const counts = Object.fromEntries(
      ['select', 'insert', 'update', 'begin', 'commit'].map((kind) => [
        kind,
        queries.filter((query) => query.toLowerCase().startsWith(kind)).length,
      ]),
    );
    expect(counts.begin).toBe(1);
    expect(counts.commit).toBe(1);
    if (process.env.AGENT_SELECTION_COST_FILE)
      await appendFile(
        process.env.AGENT_SELECTION_COST_FILE,
        JSON.stringify({ switching, ...counts }) + '\n',
      );
  },
);

it('changes the persisted Runner binding without losing history or task links, and starts only on the next message', async () => {
  const { runner, from, to, agent, id, path } = await fixture();
  h.services.conversations.links.registerKind({
    key: 'issue',
    resolve: async (_conn, _userId, ids) =>
      new Map(
        ids.map((targetId) => [
          targetId,
          { key: targetId, title: 'Task', status: null, url: null },
        ]),
      ),
  });
  await h.services.conversations.links.add('alice', id, {
    kind: 'issue',
    targetId: 'T-1',
  });
  await h.services.tx.run(async ({ conn }) => {
    await lockConversation(conn, id, h.clock.now().toISOString());
    await appendMessage(
      conn,
      { next: () => 'history-message' },
      id,
      { role: 'user', text: 'Keep this history' },
      h.clock.now().toISOString(),
    );
  });
  const response = await h.request('POST', path, {
    user: 'alice',
    body: { agentId: to },
  });
  expect(response.status).toBe(200);
  expect(response.body.data.agent.id).toBe(to);
  expect(response.body.data.runner).toBeNull();
  const saved = (await findConversation(h.database.connection(), id))!;
  expect(Number(saved.thread)).toBe(1);
  expect(
    (await h.services.onlineAgent.configuration(context, id)).agentId,
  ).toBe(to);
  expect(
    (await h.services.conversations.links.list('alice', id)).map(
      (link) => link.targetId,
    ),
  ).toEqual(['T-1']);
  const history = await agent.history();
  expect(history[0]?.parts[0]).toMatchObject({
    type: 'text',
    text: 'Keep this history',
  });
  expect(
    history.some((message) =>
      message.parts.some(
        (part) =>
          part.type === 'data-business' && part.data.kind === 'switchedAgent',
      ),
    ),
  ).toBe(true);
  expect(await claim(h, runner)).toEqual([]);
  await expect(
    agent.send([{ role: 'user', content: 'Stale facade' }]),
  ).rejects.toThrow(/another agent/u);
  const restored = await h.services.onlineAgent.realtime(context, {
    sessionId: id,
  });
  await restored.send([
    { role: 'user', content: 'Continue with the new agent' },
  ]);
  const [claimed] = await claim(h, runner);
  expect(await h.services.runs.get(claimed.run.id)).toMatchObject({
    agentId: to,
    threadScope: 't1',
  });
  await h.request('POST', `/agents/runners/runs/${claimed.run.id}/start`, {
    runnerKey: runner.key,
    body: {
      workDir: '/work/new-agent',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    },
  });
  await expect(
    agent.queue([{ role: 'user', content: 'Stale queued message' }]),
  ).rejects.toThrow(/another agent/u);
  expect(
    (await h.services.runs.detail(claimed.run.id)).inputs.some((input) =>
      input.text.includes('Stale queued message'),
    ),
  ).toBe(false);
  expect(from).not.toBe(to);
});

it('requires the owner, valid input and an enabled callable Runner Agent', async () => {
  const { to, id, path } = await fixture();
  expect(
    (await h.request('POST', path, { body: { agentId: to } })).status,
  ).toBe(401);
  expect(
    (await h.request('POST', path, { user: 'bob', body: { agentId: to } }))
      .status,
  ).toBe(404);
  expect(
    (await h.request('POST', path, { user: 'alice', body: {} })).status,
  ).toBe(400);
  const system = await h.createAgent({ name: 'System only' });
  expect(
    (
      await h.request('POST', path, {
        user: 'alice',
        body: { agentId: system },
      })
    ).status,
  ).toBe(400);
  await h.disableAgent(to);
  expect(
    (await h.request('POST', path, { user: 'alice', body: { agentId: to } }))
      .status,
  ).toBe(403);
  await h.enableAgent(to);
  vi.spyOn(h.services.agents, 'mayInvoke').mockReturnValue(false);
  expect(
    (await h.request('POST', path, { user: 'alice', body: { agentId: to } }))
      .status,
  ).toBe(403);
  expect((await h.services.conversations.get('alice', id)).agent.id).not.toBe(
    to,
  );
});

it('refuses queued and running work without cancelling or reassigning it', async () => {
  const { runner, from, to, id, agent, path } = await fixture();
  await agent.send([{ role: 'user', content: 'Work first' }]);
  expect(
    (await h.request('POST', path, { user: 'alice', body: { agentId: to } }))
      .status,
  ).toBe(409);
  const [claimed] = await claim(h, runner);
  expect((await h.services.runs.get(claimed.run.id)).agentId).toBe(from);
  await h.request('POST', `/agents/runners/runs/${claimed.run.id}/start`, {
    runnerKey: runner.key,
    body: {
      workDir: '/work/chat',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    },
  });
  await agent.queue([{ role: 'user', content: 'Queued follow-up' }]);
  expect(
    (await h.request('POST', path, { user: 'alice', body: { agentId: to } }))
      .status,
  ).toBe(409);
  const work = await h.services.runs.detail(claimed.run.id);
  expect(work.cancelRequestedAt).toBeNull();
  expect(
    work.inputs.some((input) => input.text.includes('Queued follow-up')),
  ).toBe(true);
  expect((await h.services.conversations.get('alice', id)).agent.id).toBe(from);
});

it('is idempotent and uses fresh session threads even when switching back', async () => {
  const { from, to, id, path } = await fixture();
  const change = (agentId: string) =>
    h.request('POST', path, { user: 'alice', body: { agentId } });
  expect((await change(to)).status).toBe(200);
  expect((await change(to)).status).toBe(200);
  expect(
    Number((await findConversation(h.database.connection(), id))!.thread),
  ).toBe(1);
  expect((await change(from)).status).toBe(200);
  expect(
    Number((await findConversation(h.database.connection(), id))!.thread),
  ).toBe(2);
});

it('serializes a switch against an overlapping send without accepting it for the wrong agent', async () => {
  const { from, to, id, agent } = await fixture();
  const results = await Promise.allSettled([
    h.services.conversations.switchAgent('alice', id, to),
    agent.send([{ role: 'user', content: 'Race with switch' }]),
  ]);
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  const changed = results[0].status === 'fulfilled';
  expect((await h.services.conversations.get('alice', id)).agent.id).toBe(
    changed ? to : from,
  );
});

it('keeps a persisted closing execution bound until finalization is confirmed', async () => {
  const { from, to, id, path } = await fixture();
  await h.services.tx.run(async ({ conn }) => {
    const record = (await lockConversation(
      conn,
      id,
      h.clock.now().toISOString(),
    ))!;
    const metadata = jsonObject(record.metadata);
    await conn.repository('agConversations').updateMany({
      filter: { id },
      values: {
        metadata: asJson({
          ...metadata,
          runnerOnlineAgent: {
            ...jsonObject(metadata.runnerOnlineAgent),
            closingRunId: 'finishing-run',
          },
        }),
      },
    });
  });
  expect(
    (await h.request('POST', path, { user: 'alice', body: { agentId: to } }))
      .status,
  ).toBe(409);
  expect((await h.services.conversations.get('alice', id)).agent.id).toBe(from);
});

it('requires an archived conversation to be restored before its agent changes', async () => {
  const { from, to, id, path } = await fixture();
  await h.services.conversations.update('alice', id, { archived: true });
  await expect(
    h.services.conversations.switchAgent('alice', id, to),
  ).rejects.toMatchObject({
    code: 'CONFLICT',
    details: { reason: 'archived' },
  });
  expect(
    (await h.request('POST', path, { user: 'alice', body: { agentId: to } }))
      .status,
  ).toBe(409);
  expect((await h.services.conversations.get('alice', id)).agent.id).toBe(from);
  expect(
    Number((await findConversation(h.database.connection(), id))!.thread),
  ).toBe(0);
  await h.services.conversations.update('alice', id, { archived: false });
  expect(
    (await h.request('POST', path, { user: 'alice', body: { agentId: to } }))
      .status,
  ).toBe(200);
});
