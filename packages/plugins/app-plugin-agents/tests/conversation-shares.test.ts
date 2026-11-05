import { z } from 'zod';
import { appendFile } from 'node:fs/promises';
import { createSessionManager } from '../server/online/agent/persistence/manager.js';
import { createChatAttachments } from '../server/core/conversations/attachments.js';
import { afterEach, describe, expect, it } from 'vitest';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { OnlineAgentContext } from '../server/online/agent/types.js';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  await h?.services.onlineAgent.shutdown();
  await h?.close();
});
const actor = (id = 'alice'): OnlineAgentContext => ({
  user: { id },
  credentials: { fixture: id },
  authorization: {
    identity: { principal: { type: 'user', id } },
  } as AuthorizationContext,
});
async function setup() {
  h = await createHarness();
  const runner = await h.registerRunner();
  const agentId = await h.createAgent({ source: 'runner' });
  const agent = await h.services.onlineAgent.realtime(actor(), { agentId });
  const id = agent.sessionId;
  h.services.conversations.shares.provideScope(async () => [
    { id: 'bob', name: 'Bob' },
  ]);
  const base = `/agents/conversations/${id}`;
  const read = (suffix = '', user = 'bob') =>
    h.request('GET', base + suffix, { user });
  async function file(name: string) {
    const form = new FormData();
    form.set('file', new File([name], name, { type: 'text/plain' }));
    const response = await h.request('POST', '/agents/chatAttachments', {
      user: 'alice',
      form,
    });
    expect(response.status).toBe(201);
    return response.body.data.id as string;
  }
  async function start(text: string, attachment?: string) {
    await agent.send(
      [{ role: 'user', content: text }],
      attachment ? { attachmentIds: [[attachment]] } : undefined,
    );
    const [payload] = await claim(h, runner);
    expect(payload).toBeTruthy();
    const runId = payload.run.id;
    expect(
      (
        await h.request('POST', `/agents/runners/runs/${runId}/start`, {
          runnerKey: runner.key,
          body: {
            workDir: '/fixture',
            adapter: { kind: 'claude' },
            acceptsInput: true,
          },
        })
      ).status,
    ).toBe(200);
    return runId;
  }
  async function finish(runId: string, text: string) {
    expect(
      (
        await h.request('POST', `/agents/runners/runs/${runId}/events`, {
          runnerKey: runner.key,
          body: {
            events: [
              {
                seq: 1,
                type: 'text',
                content: text,
                at: h.clock.now().toISOString(),
              },
            ],
          },
        })
      ).status,
    ).toBe(200);
    const inputs = (await h.services.runs.detail(runId)).inputs.map(
      (input) => input.id,
    );
    expect(
      (
        await h.request('POST', `/agents/runners/runs/${runId}/complete`, {
          runnerKey: runner.key,
          body: {
            summary: text,
            handledInputIds: inputs,
            sessionId: 'fixture',
          },
        })
      ).status,
    ).toBe(200);
    await agent.retryFinalization();
  }
  const grant = () => h.request('PUT', `${base}/shares/bob`, { user: 'alice' });
  return { id, agent, base, read, start, finish, file, grant, runner };
}

async function readCost(
  name: string,
  read: () => Promise<{ status: number }>,
  maximum: number,
) {
  await read(); // Warm metadata before counting actual statements.
  const client = await h.database.connection().client<{
    on(event: string, listener: (event: { sql: string }) => void): void;
    off(event: string, listener: (event: { sql: string }) => void): void;
  }>();
  const statements: string[] = [];
  const listener = (event: { sql: string }) => {
    statements.push(event.sql);
  };
  client.on('query', listener);
  try {
    expect((await read()).status).toBe(200);
  } finally {
    client.off('query', listener);
  }
  const selects = statements.filter((sql) =>
    /^\s*(select|with)\b/iu.test(sql),
  ).length;
  expect(
    statements.filter((sql) =>
      /^\s*(insert|update|delete|begin)\b|for update/iu.test(sql),
    ),
  ).toEqual([]);
  expect(selects).toBeLessThanOrEqual(maximum);
  if (process.env.SNAPSHOT_COST_REPORT)
    await appendFile(
      process.env.SNAPSHOT_COST_REPORT,
      JSON.stringify({ name, selects, writes: 0, locks: 0, transactions: 0 }) +
        '\n',
    );
}

describe('conversation snapshots', () => {
  it('excludes the entire open turn, new messages and files; sharing again advances and revocation applies on the next read', async () => {
    const f = await setup();
    const firstFile = await f.file('finished.txt');
    const firstRun = await f.start('First question', firstFile);
    await f.finish(firstRun, 'First answer');
    h.clock.advance(1000);
    const laterFile = await f.file('later.txt');
    const laterRun = await f.start('Later secret question', laterFile);
    await h.services.conversations.setTitleFromRun(
      { subject: { kind: 'conversation', id: f.id }, actorUserId: 'alice' },
      'Later secret title',
    );
    expect((await f.read()).status).toBe(404);
    const granted = await f.grant();
    expect(granted.status).toBe(200);
    const cutoff = granted.body.data.cutoffSeq;
    await readCost('runner detail', () => f.read(), 2);
    await readCost('runner history', () => f.read('/messages'), 8);
    await readCost(
      'runner file',
      () =>
        h.request('GET', `/agents/chatAttachments/${firstFile}/content`, {
          user: 'bob',
        }),
      4,
    );
    const detail = await f.read();
    expect(detail.body.data.title).not.toContain('Later secret');
    expect(detail.status).toBe(200);
    expect(detail.body.data).toMatchObject({
      snapshot: { cutoffSeq: cutoff },
      run: null,
      showInChatList: false,
    });
    for (const key of ['execution', 'runner', 'wait', 'needsYou', 'projectId'])
      expect(detail.body.data).not.toHaveProperty(key);
    const page = await f.read('/messages');
    expect(page.status).toBe(200);
    expect(page.body.meta.lastSeq).toBe(cutoff);
    expect(JSON.stringify(page.body)).toContain('First answer');
    expect(JSON.stringify(page.body)).not.toContain('Later secret');
    expect((await f.read('/messages?after=99999')).body.data).toEqual([]);
    expect(
      (await f.read(`/messages?ids=runner:${laterRun}`)).body.data,
    ).toEqual([]);
    expect(
      (
        await h.request(
          'GET',
          `/agents/chatAttachments/${firstFile}/content?download=true`,
          { user: 'bob' },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await h.request('GET', `/agents/chatAttachments/${laterFile}/content`, {
          user: 'bob',
        })
      ).status,
    ).toBe(404);
    await f.finish(laterRun, 'Later secret answer');
    expect(JSON.stringify((await f.read('/messages')).body)).not.toContain(
      'Later secret',
    );
    expect(
      (await h.request('GET', '/agents/conversations', { user: 'bob' })).body
        .data,
    ).toEqual([]);
    h.clock.advance(1000);
    const advanced = await f.grant();
    expect(advanced.body.data.cutoffSeq).toBeGreaterThan(cutoff);
    expect(JSON.stringify((await f.read('/messages')).body)).toContain(
      'Later secret answer',
    );
    expect(
      (
        await h.request('GET', `/agents/chatAttachments/${laterFile}/content`, {
          user: 'bob',
        })
      ).status,
    ).toBe(200);
    expect(
      (await h.request('DELETE', `${f.base}/shares/bob`, { user: 'alice' }))
        .status,
    ).toBe(204);
    for (const suffix of ['', '/messages', '/links', '/events'])
      expect((await f.read(suffix)).status).toBe(404);
    expect(
      (
        await h.request('GET', `/agents/chatAttachments/${firstFile}/content`, {
          user: 'bob',
        })
      ).status,
    ).toBe(404);
    expect((await f.read('', 'alice')).status).toBe(200);
  });

  it('cuts application-triggered work at the previous finished run before and during its output', async () => {
    const f = await setup();
    const completed = await f.start('Finished input');
    await f.finish(completed, 'Finished answer');
    const previous = (await h.services.conversations.get('alice', f.id))
      .lastSeq;
    await h.services.tx.run((unit) =>
      h.services.conversations.deliver(unit, f.id, {
        notice: {
          code: 'news',
          type: 'privateFollowUp',
          title: 'In-progress application input',
        },
        input: {
          type: 'signal',
          actor: { kind: 'system', id: 'application', name: 'Application' },
          text: 'In-progress application input',
        },
        wake: true,
      }),
    );
    const shared = await f.grant();
    expect(shared.status).toBe(200);
    expect(shared.body.data.cutoffSeq).toBe(previous);
    expect(JSON.stringify((await f.read('/messages')).body)).not.toContain(
      'In-progress application input',
    );
    const [payload] = await claim(h, f.runner);
    expect(
      (
        await h.request(
          'POST',
          `/agents/runners/runs/${payload.run.id}/start`,
          {
            runnerKey: f.runner.key,
            body: {
              workDir: '/fixture',
              adapter: { kind: 'claude' },
              acceptsInput: true,
            },
          },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await h.request(
          'POST',
          `/agents/runners/runs/${payload.run.id}/events`,
          {
            runnerKey: f.runner.key,
            body: {
              events: [
                {
                  seq: 1,
                  type: 'text',
                  content: 'In-progress automatic output',
                  at: h.clock.now().toISOString(),
                },
              ],
            },
          },
        )
      ).status,
    ).toBe(200);
    expect((await f.grant()).body.data.cutoffSeq).toBe(previous);
    expect(JSON.stringify((await f.read('/messages')).body)).not.toContain(
      'In-progress automatic output',
    );
  });

  it('shares an empty history without the first unfinished input or its automatic title', async () => {
    const f = await setup();
    await f.start('Unfinished private initial title');
    expect((await f.grant()).body.data.cutoffSeq).toBe(0);
    expect((await f.read()).body.data.title).toBeNull();
    expect((await f.read('/messages')).body.data).toEqual([]);
  });

  it('keeps every write and live/status/config read owner-only for recipients, strangers and revoked users', async () => {
    const f = await setup();
    await f.grant();
    const attempts = [
      ['PATCH', '', { title: 'Changed' }],
      ['DELETE', '', undefined],
      [
        'POST',
        '/messages',
        {
          message: {
            id: 'attack',
            role: 'user',
            parts: [{ type: 'text', text: 'secret' }],
          },
        },
      ],
      [
        'POST',
        '/queue',
        {
          message: {
            id: 'attack',
            role: 'user',
            parts: [{ type: 'text', text: 'secret' }],
          },
        },
      ],
      [
        'POST',
        '/approval',
        {
          executionId: 'forged',
          messageId: 'forged',
          approval: { id: 'forged', approved: true },
        },
      ],
      ['POST', '/messages/forged/withdraw', undefined],
      ['DELETE', '/links/forged', undefined],
      ['POST', '/fallback', undefined],
      ['POST', '/restore', undefined],
      ['POST', '/markSeen', { seq: 0 }],
      ['POST', '/markRead', undefined],
      ['POST', '/stop', undefined],
      ['POST', '/switchRunner', undefined],
      ['POST', '/switchAgent', { agentId: 'other' }],
      ['POST', '/links', { kind: 'issue', targetId: 'hidden' }],
      ['PUT', '/shares/charlie', undefined],
      ['DELETE', '/shares/bob', undefined],
      ['GET', '/shares', undefined],
      ['GET', '/shareCandidates', undefined],
      ['GET', '/events', undefined],
      ['GET', '/usage', undefined],
      ['GET', '/config', undefined],
      ['PATCH', '/config', { config: {} }],
      ['POST', '/finalize', {}],
      ['POST', '/resend', {}],
    ] as const;
    for (const user of ['bob', 'charlie', 'revoked']) {
      if (user === 'revoked')
        await h.services.conversations.shares.revoke('alice', f.id, 'bob');
      for (const [method, suffix, body] of attempts) {
        const response = await h.request(method, f.base + suffix, {
          user: user === 'revoked' ? 'bob' : user,
          ...(body ? { body } : {}),
        });
        expect(response.status, `${user}: ${method} ${suffix}`).toBe(404);
      }
    }
    expect((await h.request('GET', `${f.base}/shares`)).status).toBe(401);
    expect(
      (await h.request('PUT', `${f.base}/shares/charlie`, { user: 'alice' }))
        .status,
    ).toBe(400);
    expect(
      (
        await h.request('PATCH', f.base, {
          user: 'alice',
          body: { title: 'Owner title' },
        })
      ).status,
    ).toBe(200);
  });

  it('resolves links and stored page references as the viewer, and never publishes to recipients', async () => {
    const f = await setup();
    const viewers: string[] = [];
    h.services.conversations.contextKinds.register(
      'secret',
      async (_conn, userId) => {
        viewers.push(userId);
        return userId === 'alice'
          ? new Map([
              [
                'private',
                { title: 'Private record', key: 'P-1', url: '/private' },
              ],
            ])
          : new Map();
      },
    );
    h.services.conversations.links.registerKind({
      key: 'secret',
      title: { key: 'secret', ns: 'test' },
      resolve: async (_conn, userId) =>
        new Map([
          ...(userId === 'alice'
            ? [
                [
                  'private',
                  { title: 'Private record', key: 'P-1', url: '/private' },
                ] as const,
              ]
            : []),
          [
            'readable',
            {
              title: userId === 'bob' ? 'Viewer record' : 'Owner record',
              key: 'R-1',
              url: '/readable',
            },
          ],
        ]),
    });
    await h.services.conversations.links.add('alice', f.id, {
      kind: 'secret',
      targetId: 'private',
    });
    await h.services.conversations.links.add('alice', f.id, {
      kind: 'secret',
      targetId: 'readable',
    });
    const runId = await f.start('Shared text');
    await f.finish(runId, 'Shared reply');
    // Ordinary durable context on the user row, resolved again when a recipient reads it.
    const row = await h.services.tx
      .read()
      .repository<{ id: string }>('agConversationMessages')
      .findOne({ filter: { conversationId: f.id, role: 'user' } });
    await h.services.tx
      .read()
      .repository('agConversationMessages')
      .updateMany({
        filter: { id: row!.id },
        values: {
          workContext: JSON.stringify({
            route: '/private',
            items: [
              {
                kind: 'secret',
                id: 'private',
                title: 'Private record',
                key: 'P-1',
                url: '/private',
              },
            ],
            dropped: 0,
          }),
        },
      });
    await f.grant();
    const viewerLinks = (await f.read('/links')).body.data;
    expect(viewerLinks).toHaveLength(1);
    expect(viewerLinks[0]).toMatchObject({
      targetId: 'readable',
      view: { title: 'Viewer record' },
    });
    expect(JSON.stringify(viewerLinks)).not.toContain('Private record');
    const page = await f.read('/messages');
    expect(JSON.stringify(page.body)).not.toContain('Private record');
    expect(viewers).toContain('bob');
    expect((await f.read('/messages', 'charlie')).status).toBe(404);
    // Per-user events retain the real owner; shares never join delivery audiences.
    const notices: string[] = [];
    const off = h.services.events.on('conversation.changed', (event) => {
      notices.push(event.userId);
    });
    await h.services.conversations.update('alice', f.id, {
      title: 'Owner rename',
    });
    off();
    expect(notices).toEqual(['alice']);
    expect((await f.read()).body.data.title).not.toBe('Owner rename');
  });
  it('bounds native history and direct IDs too, and preserves shared messages against resend', async () => {
    h = await createHarness();
    h.services.conversations.shares.provideScope(async () => [
      { id: 'bob', name: 'Bob' },
    ]);
    const attachments = createChatAttachments({
      tx: h.services.tx,
      basePath: () => '/main',
      storage: {
        store: async () => '',
        bytes: async () => new Uint8Array(),
        stream: async () => new ReadableStream(),
        remove: async () => {},
      },
    });
    let next = 0;
    h.services.onlineAgent.configurator.registerTool('snapshotTool', {
      version: '1',
      definition: {
        inputSchema: z.object({ value: z.string() }),
        public: {
          input: (input) => ({ value: input.value }),
          output: (output) => ({ shown: output.shown }),
        },
        execute: async () => ({
          shown: 'Visible tool result',
          secret: 'Private model result',
        }),
      },
    });
    const sessions = createSessionManager({
      tx: h.services.tx,
      ids: { next: () => `snapshot-native-${++next}` },
      attachments: attachments.links,
      now: () => h.clock.now().toISOString(),
    });
    const config = { scope: [], tool: [], toolVersions: {}, systemPrompt: '' };
    const model = { modelService: 'fixture', model: 'chat' };
    const id = await sessions.create('alice', 'realtime', config, model);
    const accept = (n: number) =>
      sessions.native.accept(
        'alice',
        id,
        {
          id: `native-input-${n}`,
          parts: [{ type: 'text', text: `Question ${n}` }],
          attachments: [],
        },
        config,
        model,
        `execution-${n}`,
        `native-answer-${n}`,
        { config, model },
      );
    const finish = (n: number) =>
      sessions.native.save(
        'alice',
        id,
        {
          message: {
            id: `native-answer-${n}`,
            role: 'assistant',
            metadata: {
              conversationId: id,
              createdAt: h.clock.now().toISOString(),
              revision: 0,
              executionId: `execution-${n}`,
            },
            parts: [
              { type: 'text', text: `Answer ${n}` },
              {
                type: 'dynamic-tool',
                toolName: 'snapshotTool',
                toolCallId: `tool-${n}`,
                state: 'output-available',
                input: { value: 'Allowed input' },
                output: {
                  shown: 'Visible tool result',
                  secret: 'Private model result',
                },
              },
            ],
          },
        },
        {
          actorId: 'alice',
          state: 'idle',
          outcome: 'completed',
          executionId: `execution-${n}`,
          messageId: `native-answer-${n}`,
        },
        0,
      );
    await accept(1);
    await finish(1);
    await accept(2);
    const shared = await h.services.conversations.shares.grant(
      'alice',
      id,
      'bob',
    );
    expect(shared.cutoffSeq).toBe(2);
    const base = `/agents/conversations/${id}`;
    const read = (suffix = '') =>
      h.request('GET', base + suffix, { user: 'bob' });
    const nativePage = (await read('/messages')).body;
    expect(JSON.stringify(nativePage)).toContain('Answer 1');
    expect(JSON.stringify(nativePage)).toContain('Visible tool result');
    expect(JSON.stringify(nativePage)).not.toContain('Private model result');
    expect((await read('/messages?ids=native-input-2')).body.data).toEqual([]);
    expect((await read('/messages?after=2')).body.meta.lastSeq).toBe(2);
    expect((await read('/messages?pageSize=1')).body.data).toHaveLength(1);
    await readCost('native history', () => read('/messages'), 3);
    await finish(2);
    expect(JSON.stringify((await read('/messages')).body)).not.toContain(
      'Answer 2',
    );
    await expect(
      sessions.native.resend(
        'alice',
        id,
        { messageId: 'native-input-1' },
        config,
        model,
        'edit',
        'edit-answer',
        { config, model },
      ),
    ).rejects.toThrow('Revoke conversation snapshots');
    await h.services.conversations.shares.revoke('alice', id, 'bob');
    expect((await read('/messages')).status).toBe(404);
    expect(
      (await h.request('GET', base + '/messages', { user: 'charlie' })).status,
    ).toBe(404);
    expect((await h.request('GET', base + '/messages')).status).toBe(401);
  });
});
