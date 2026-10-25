// @vitest-environment node
import { randomBytes } from 'node:crypto';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.js';
import {
  KNOWLEDGE_CHAT_SCOPE,
  KNOWLEDGE_CHAT_SOURCE,
} from '../../shared/knowledge-chat.js';
import { createOnlineAgentModelFixture } from '../fixtures/online-agent-model.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: randomBytes(32).toString('hex'),
      trustedOrigins: ['http://localhost'],
    },
    secrets: { keys: [{ version: 1, key: randomBytes(32).toString('hex') }] },
    agents: { cli: { name: 'acme' }, vectors: { store: false } },
  },
});
const write = (data: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(data),
});
const config = (policy: string) => ({
  scope: [KNOWLEDGE_CHAT_SCOPE],
  context: { variable: { knowledgeRetrieval: policy } },
});

test('persists both browser policies through real creation HTTP and native search/read without rewriting older sessions', async ({
  testApp,
  request,
}) => {
  expect(
    (
      await request(
        '/agents/conversations',
        write({
          agentId: 'online',
          source: KNOWLEDGE_CHAT_SOURCE,
          config: config('always'),
        }),
      )
    ).status,
  ).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const fixture = await createOnlineAgentModelFixture({ initialText: '' });
  try {
    expect(
      (
        await admin.fetch(
          '/agents/services',
          write({
            title: 'Knowledge local model',
            provider: 'openai-compatible',
            baseUrl: fixture.url,
            apiKey: 'local-fixture-only',
            enabled: true,
            models: [{ value: 'fixture-chat', kind: 'chat' }],
          }),
        )
      ).status,
    ).toBe(201);
    const marker = 'CURRENT-DEFAULT-SOURCE-91';
    const createdDoc = await admin.fetch(
      '/knowledge/docs',
      write({
        scope: 'default',
        scopeId: '',
        kind: 'article',
        title: 'policyfixture source',
        content:
          '# policyfixture\n\nOwner is Noor.\n\n# Appendix\n\n' +
          'Procedure detail: retain both release reviews.\n'.repeat(100) +
          `\nFinal current source marker: ${marker}.`,
      }),
    );
    expect(createdDoc.status).toBe(201);
    const docId: string = (await createdDoc.json()).data.id;
    const snapshots: { endpoint: string; prompt: string; policy: string }[] =
      [];
    for (const policy of ['on-demand', 'always']) {
      const before = fixture.requests.length;
      const created = await admin.fetch(
        '/agents/conversations',
        write({
          agentId: 'online',
          source: KNOWLEDGE_CHAT_SOURCE,
          config: config(policy),
        }),
      );
      expect(created.status).toBe(201);
      const detail = (await created.json()).data;
      expect(detail.source).toBe(KNOWLEDGE_CHAT_SOURCE);
      const endpoint = `/agents/conversations/${detail.id}`;
      const saved = (await (await admin.fetch(`${endpoint}/config`)).json())
        .data;
      expect(saved).toMatchObject({
        scope: [KNOWLEDGE_CHAT_SCOPE],
        variable: { knowledgeRetrieval: policy },
        tool: ['bash', 'skill'],
      });
      expect(saved.systemPrompt).toContain(`Retrieval policy: ${policy}.`);
      expect(saved.systemPrompt.split('Knowledge retrieval')).toHaveLength(2);
      expect(saved.systemPrompt).not.toContain(marker);
      snapshots.push({ endpoint, prompt: saved.systemPrompt, policy });
      expect(fixture.requests).toHaveLength(before); // Choosing a policy never invokes a model.
      const offset = fixture.streams.length;
      const sent = await admin.fetch(
        `${endpoint}/messages`,
        write({
          message: {
            id: `knowledge-${policy}`,
            role: 'user',
            parts: [
              {
                type: 'text',
                text: 'Find policyfixture, read the complete source, and cite it.',
              },
            ],
          },
        }),
      );
      expect(sent.status).toBe(200);
      const stream = sent.text();
      await expect.poll(() => fixture.streams.length).toBe(offset + 1);
      const first = JSON.stringify(fixture.requests.at(-1)?.messages);
      expect(first).toContain(`Retrieval policy: ${policy}.`);
      expect(first).not.toContain(marker);
      fixture.bash(offset, 'acme kb search --q policyfixture --json');
      await expect.poll(() => fixture.streams.length).toBe(offset + 2);
      const searched = JSON.stringify(fixture.requests.at(-1)?.messages);
      expect(searched).toContain(docId);
      expect(searched).toContain('default');
      fixture.bash(
        offset + 1,
        `acme kb search --q policyfixture --scope sales --json; acme kb read ${docId} --json`,
      );
      await expect.poll(() => fixture.streams.length).toBe(offset + 3);
      expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
        marker,
      );
      expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
        'INVALID_SCOPE',
      );
      fixture.append(
        offset + 2,
        'Verified the current default-space source through native search and read.',
      );
      fixture.complete(offset + 2);
      const publicStream = await stream;
      expect(publicStream).toContain(
        'Verified the current default-space source',
      );
      expect(publicStream).not.toContain('tool-output-available');
      await expect
        .poll(
          async () =>
            (await (await admin.fetch(endpoint)).json()).data.execution?.status,
        )
        .toBe('idle');
    }
    for (const snapshot of snapshots) {
      const saved = (
        await (await admin.fetch(`${snapshot.endpoint}/config`)).json()
      ).data;
      expect(saved.systemPrompt).toBe(snapshot.prompt);
      expect(saved.variable.knowledgeRetrieval).toBe(snapshot.policy);
      const offset = fixture.streams.length;
      const later = await admin.fetch(
        `${snapshot.endpoint}/messages`,
        write({
          message: {
            id: `later-${snapshot.policy}`,
            role: 'user',
            parts: [
              {
                type: 'text',
                text: 'Check policyfixture again for this new question.',
              },
            ],
          },
        }),
      );
      expect(later.status).toBe(200);
      const streamed = later.text();
      await expect.poll(() => fixture.streams.length).toBe(offset + 1);
      expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
        `Retrieval policy: ${snapshot.policy}.`,
      );
      fixture.bash(
        offset,
        'acme kb search --q policyfixture --scope default --json',
      );
      await expect.poll(() => fixture.streams.length).toBe(offset + 2);
      expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
        docId,
      );
      fixture.append(offset + 1, 'The saved policy is still active.');
      fixture.complete(offset + 1);
      expect(await streamed).toContain('The saved policy is still active.');
    }
    for (const input of [
      {
        agentId: 'online',
        config: { context: { variable: { knowledgeRetrieval: 'always' } } },
      },
      { agentId: 'online', config: config('invalid') },
      {
        agentId: 'online',
        config: {
          ...config('always'),
          context: {
            variable: { knowledgeRetrieval: 'always', unexpected: true },
          },
        },
      },
    ]) {
      expect(
        (await admin.fetch('/agents/conversations', write(input))).status,
      ).toBe(400);
    }
  } finally {
    await fixture.close();
  }
});
