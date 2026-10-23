import { afterEach, expect, it } from 'vitest';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  await h?.services.onlineAgent.shutdown();
  await h?.close();
});

const context = (id = 'alice'): OnlineAgentContext => ({
  user: { id },
  credentials: { kind: 'test-session', userId: id },
  authorization: {
    identity: { principal: { type: 'user', id } },
  } as AuthorizationContext,
});

async function fixture() {
  h = await createHarness();
  const runner = await h.registerRunner();
  const agentId = await h.createAgent({
    source: 'runner',
    name: 'Runner helper',
    modelEntries: [{ tool: 'claude', model: null, effort: 'high' }],
    maxConcurrentRuns: 5,
  });
  const create = (body: Record<string, unknown> = {}) =>
    h.request('POST', '/agents/conversations', {
      user: 'alice',
      body: { agentId, ...body },
    });
  const send = async (id: string, extra: Record<string, unknown> = {}) => {
    const response = await h.app.request(
      `/agents/conversations/${id}/messages`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-test-user': 'alice',
        },
        body: JSON.stringify({
          message: {
            id: `message-${id}`,
            role: 'user',
            parts: [{ type: 'text', text: 'Hello' }],
          },
          ...extra,
        }),
      },
    );
    if (response.ok) await response.body?.cancel();
    else
      return {
        status: response.status,
        body: (await response.json()) as {
          error: { metadata: { reason: string } };
        },
      };
    return { status: response.status, body: null };
  };
  return { runner, agentId, create, send };
}

it('offers the agent tool efforts and its own effort to the composer', async () => {
  const f = await fixture();
  const agents = await h.services.conversations.chatAgents('alice');
  expect(agents.find((agent) => agent.id === f.agentId)).toMatchObject({
    efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
    effort: 'high',
  });
});

it('runs a conversation with the effort its message chose and keeps it with the conversation', async () => {
  const f = await fixture();
  const created = await f.create();
  expect(created.status).toBe(201);
  expect(created.body.data.effort).toBeNull();
  expect((await f.send(created.body.data.id, { effort: 'low' })).status).toBe(
    200,
  );
  const [payload] = await claim(h, f.runner);
  expect(payload.tool).toMatchObject({ kind: 'claude', effort: 'low' });
  expect((await h.services.runs.detail(payload.run.id)).effort).toBe('low');
  expect(
    (await h.services.conversations.get('alice', created.body.data.id)).effort,
  ).toBe('low');
});

it('keeps the effort a conversation was created with for its runs', async () => {
  const f = await fixture();
  const created = await f.create({ effort: 'max' });
  expect(created.status).toBe(201);
  expect(created.body.data.effort).toBe('max');
  expect((await f.send(created.body.data.id)).status).toBe(200);
  const [payload] = await claim(h, f.runner);
  expect(payload.tool.effort).toBe('max');
});

it("uses the agent's own effort without a chosen one, and for its other runs", async () => {
  const f = await fixture();
  const created = await f.create();
  expect((await f.send(created.body.data.id)).status).toBe(200);
  const [payload] = await claim(h, f.runner);
  expect(payload.tool.effort).toBe('high');

  const other = await f.create();
  expect((await f.send(other.body.data.id, { effort: 'low' })).status).toBe(
    200,
  );
  expect((await claim(h, f.runner))[0].tool.effort).toBe('low');
  await h.enqueue(f.agentId, 'issue-1');
  const [issue] = await claim(h, await h.registerRunner({ name: 'Second' }));
  expect((await h.services.runs.detail(issue.run.id)).subject.kind).not.toBe(
    'conversation',
  );
  expect(issue.tool.effort).toBe('high');
});

it('rejects an effort the agent tool does not take, and any effort for the online agent', async () => {
  const f = await fixture();
  const refused = await f.create({ effort: 'turbo' });
  expect(refused.status).toBe(400);
  expect(refused.body.error.metadata.reason).toBe('EFFORT_UNSUPPORTED');
  expect((await h.services.conversations.list('alice', {})).items).toHaveLength(
    0,
  );

  const created = await f.create();
  const sent = await f.send(created.body.data.id, { effort: 'turbo' });
  expect(sent.status).toBe(400);
  expect(sent.body?.error.metadata.reason).toBe('EFFORT_UNSUPPORTED');
  expect(
    (await h.services.conversations.get('alice', created.body.data.id)).effort,
  ).toBeNull();

  await expect(
    h.services.onlineAgent.realtime(context(), {
      agentId: 'online',
      effort: 'medium',
    }),
  ).rejects.toMatchObject({ details: { reason: 'EFFORT_UNSUPPORTED' } });
});
