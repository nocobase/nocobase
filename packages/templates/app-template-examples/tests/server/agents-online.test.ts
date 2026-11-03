import { randomBytes } from 'node:crypto';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { OnlineAgentService } from '@nocobase/app-plugin-agents/server/online-agent';
import type { ConversationDetail } from '@nocobase/app-plugin-agents/shared/conversations';
import {
  appUIMessageText,
  type AppUIMessage,
} from '@nocobase/app-plugin-agents/shared/online-agent';
import type { ModelServiceView } from '@nocobase/app-plugin-agents/shared/models';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.ts';
import { createOnlineAgentModelFixture } from '../fixtures/online-agent-model.ts';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  install: true,
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: randomBytes(32).toString('hex'),
      trustedOrigins: ['http://localhost'],
      emailAndPassword: { enabled: true, disableSignUp: false },
    },
    secrets: { keys: [{ version: 1, key: randomBytes(32).toString('hex') }] },
    agents: { vectors: { store: false } },
  },
});
const headers = {
  'content-type': 'application/json',
  origin: 'http://localhost',
};
const write = (json?: unknown): RequestInit => ({
  method: 'POST',
  headers,
  ...(json === undefined ? {} : { body: JSON.stringify(json) }),
});

// This verifies the REAL Examples composition and provider HTTP adapter, not mock browser responses or plugin internals.
test('configures a chat model and streams, persists, resumes and stops an owned OnlineAgent conversation', async ({
  app,
  request,
  testApp,
}) => {
  expect(app.container.resolve(agentsToken).onlineAgent).toBeInstanceOf(
    OnlineAgentService,
  );
  for (const path of [
    '/agents/models?kind=chat',
    '/agents/services',
    '/agents/conversations',
    '/agents/chatAgents',
  ]) {
    expect((await request(path)).status).toBe(401);
  }
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  expect((await admin.fetch('/agents/chatAgents')).status).toBe(200);
  expect(
    await (await admin.fetch('/agents/models?kind=chat')).json(),
  ).toMatchObject({ data: [] });
  const password = randomBytes(24).toString('hex');
  const email = 'agents-member@example.test';
  expect(
    (
      await request(
        '/auth/sign-up/email',
        write({ name: 'Chat member', email, password }),
      )
    ).status,
  ).toBe(200);
  const member = await signIn(testApp, { email, password });
  expect((await member.fetch('/agents/models?kind=chat')).status).toBe(200);
  expect((await member.fetch('/agents/services')).status).toBe(403);
  expect(
    (
      await member.fetch(
        '/agents/services',
        write({ title: 'Denied', provider: 'openai-compatible' }),
      )
    ).status,
  ).toBe(403);

  const fixture = await createOnlineAgentModelFixture({ scene: 'reasoning' });
  try {
    const apiKey = randomBytes(16).toString('hex'); // Fixture-only token exercises sealed storage and redaction.
    const created = await admin.fetch(
      '/agents/services',
      write({
        title: 'Local Fixture',
        provider: 'openai-compatible',
        baseUrl: fixture.url,
        apiKey,
        enabled: true,
        models: [{ value: 'fixture-chat', kind: 'chat' }],
      }),
    );
    expect(created.status).toBe(201);
    const service = ((await created.json()) as { data: ModelServiceView }).data;
    expect(service.apiKeySet).toBe(true);
    expect(JSON.stringify(service)).not.toContain(apiKey);
    const check = await admin.fetch(
      '/agents/checkConnection',
      write({ service: service.name, model: 'fixture-chat', kind: 'chat' }),
    );
    expect(check.status).toBe(200);
    expect(await check.json()).toMatchObject({ data: { ok: true } });
    expect(
      await (await member.fetch('/agents/models?kind=chat')).json(),
    ).toMatchObject({
      data: [expect.objectContaining({ name: service.name })],
    });

    // No selectedModel/default-model writer: the example uses the first enabled offered chat model.
    const made = await member.fetch(
      '/agents/conversations',
      write({
        agentId: 'online',
        source: 'panel',
        title: 'Fixture conversation',
      }),
    );
    expect(made.status).toBe(201);
    const conversation = ((await made.json()) as { data: ConversationDetail })
      .data;
    const path = `/agents/conversations/${conversation.id}`;
    const detail = async () =>
      (
        (await (await member.fetch(path)).json()) as {
          data: ConversationDetail;
        }
      ).data;
    const history = async () =>
      (
        (await (await member.fetch(`${path}/messages?after=0`)).json()) as {
          data: AppUIMessage[];
        }
      ).data;
    expect(fixture.streams).toHaveLength(0);
    const events = await member.fetch(
      `${path}/messages`,
      write({
        message: {
          id: 'first',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello fixture' }],
        },
      }),
    );
    expect(events.status).toBe(200);
    expect(events.headers.get('x-vercel-ai-ui-message-stream')).toBe('v1');
    await expect.poll(() => fixture.streams.length).toBe(1);
    const streamText = events.text();
    fixture.reasoning(0, 'Local model reasoning');
    fixture.append(0, 'Hello from the local model fixture.');
    fixture.complete(0);
    const output = await streamText;
    expect(output).toContain('"type":"text-delta"');
    expect(output).toContain('"type":"reasoning-start"');
    expect(output).toContain('"type":"reasoning-delta"');
    expect(output).toContain('"type":"reasoning-end"');
    expect(output).toContain('Local model reasoning');
    expect(output).toContain('Hello from the local model fixture.');
    expect(output).toContain('"type":"finish"');
    expect(output).toContain('[DONE]');
    expect(output).toContain('"type":"completed"');
    await expect
      .poll(async () => (await detail()).execution?.status)
      .toBe('idle');
    const saved = await history();
    expect(saved.map((message) => message.role)).toEqual(['user', 'assistant']);
    expect(appUIMessageText(saved[1]!)).toContain(
      'Hello from the local model fixture.',
    );
    expect(saved[1]!.parts).toContainEqual({
      type: 'reasoning',
      text: 'Local model reasoning',
      state: 'done',
    });
    expect(appUIMessageText(saved[1]!)).not.toContain('Local model reasoning');
    expect(saved.every((message) => !('original' in message))).toBe(true);

    // Ownership is a server boundary even for an administrator.
    for (const suffix of ['', '/messages', '/events', '/config']) {
      expect((await admin.fetch(`${path}${suffix}`)).status).toBe(404);
    }
    for (const suffix of ['/messages', '/stop']) {
      expect(
        (
          await admin.fetch(
            `${path}${suffix}`,
            write({
              message: {
                id: 'forged',
                role: 'user',
                parts: [{ type: 'text', text: 'Not mine' }],
              },
            }),
          )
        ).status,
      ).toBe(404);
    }
    const second = await member.fetch(
      `${path}/messages`,
      write({
        message: {
          id: 'second',
          role: 'user',
          parts: [{ type: 'text', text: 'Continue, then stop' }],
        },
      }),
    );
    expect(second.status).toBe(200);
    await expect.poll(() => fixture.streams.length).toBe(2);
    expect(JSON.stringify(fixture.requests.at(-1)!.messages)).toContain(
      'Hello from the local model fixture.',
    );
    expect(JSON.stringify(fixture.requests.at(-1)!.messages)).toContain(
      'Local model reasoning',
    );
    let received = '';
    const cancelledText = (async () => {
      for await (const value of second.body!.pipeThrough(
        new TextDecoderStream(),
      ))
        received += value;
      return received;
    })();
    fixture.append(1, 'Hello from the local model fixture.');
    await expect
      .poll(() => received)
      .toContain('Hello from the local model fixture.');
    expect((await member.fetch(`${path}/stop`, write())).status).toBe(200);
    expect(await cancelledText).toContain('"type":"cancelled"');
    await expect
      .poll(async () => (await detail()).execution?.status)
      .toBe('idle');
    expect(appUIMessageText((await history()).at(-1)!)).toContain(
      'Hello from the local model fixture.',
    );
    expect((await member.fetch(`${path}/events`)).status).toBe(204);
  } finally {
    await fixture.close();
  }
});
