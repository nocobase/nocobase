// @vitest-environment node
import { createAppTest } from '@nocobase/app-testing/server';
import { expect, vi } from 'vitest';
import { createStandaloneServer } from './fixtures/indexing-app/server/standalone.js';
import {
  knowledgeAgentFixture,
  startMockOpenAI,
} from './helpers/online-agent.js';

const test = createAppTest({
  scope: 'test',
  createServer: createStandaloneServer,
  config: {
    app: {
      publicBasePath: '/main',
      internalBasePath: '',
      publicApiUrl: '/main/api',
      publicOrigin: 'http://localhost',
    },
    agents: { cli: { name: 'acme' } },
  },
});
for (const kind of ['realtime', 'background'] as const)
  for (const policy of ['on-demand', 'always'] as const) {
    test(`${kind} ${policy}: real native CLI, credentials, ACL and SDK system`, async ({
      app,
      fetch,
    }) => {
      const f = await knowledgeAgentFixture(app, fetch);
      const model = await startMockOpenAI();
      try {
        const saved = await f.agents.models.services.create({
          title: 'Offline',
          provider: 'openai-compatible',
          baseUrl: model.url,
          apiKey: 'fixture-only',
          models: [{ value: 'chat', kind: 'chat' }],
        });
        model.answer(
          {
            toolCalls: [
              {
                id: 'search',
                name: 'bash',
                arguments: JSON.stringify({
                  command: 'acme kb search --q Release --json',
                }),
              },
            ],
          },
          {
            toolCalls: [
              {
                id: 'filtered',
                name: 'bash',
                arguments: JSON.stringify({
                  command:
                    'acme kb search --q Release --scope project --owner one --limit 1 --json',
                }),
              },
            ],
          },
          {
            toolCalls: [
              {
                id: 'read',
                name: 'bash',
                arguments: JSON.stringify({
                  command: `acme kb read ${f.documents[0]!.id} --json`,
                }),
              },
            ],
          },
          {
            text: [
              kind === 'background'
                ? '{"answer":"Verified fixture."}'
                : 'Verified fixture.',
            ],
          },
        );
        const authentication = vi.spyOn(f.auth, 'getSession');
        const get = vi.spyOn(f.knowledge.docs, 'get');
        const search = vi.spyOn(f.knowledge.docs, 'searchAll');
        const scoped = vi.spyOn(f.knowledge.docs, 'search');
        const provider = vi.fn(() => ({}));
        f.agents.onlineAgent.configurator.registerOnlineAgentGlobalScope(
          provider,
        );
        const options = {
          model: [`${saved.name}/chat`],
          ...(policy === 'always'
            ? { context: { variable: { knowledgeRetrieval: policy } } }
            : {}),
        };
        const chat = await f.agents.onlineAgent[kind](f.context, options);
        expect(search).not.toHaveBeenCalled();
        expect(
          authentication.mock.calls.some(([headers]) =>
            headers.get('x-nocobase-run-token')?.startsWith('fgo_'),
          ),
        ).toBe(false);
        if ('send' in chat)
          await chat.send([
            { role: 'user', content: 'Find the release procedure.' },
          ]);
        else {
          await chat.run(
            [{ role: 'user', content: 'Find the release procedure.' }],
            {
              type: 'object',
              properties: { answer: { type: 'string' } },
              required: ['answer'],
              additionalProperties: false,
            },
          );
          expect(await chat.get()).toEqual({ answer: 'Verified fixture.' });
        }
        await expect.poll(() => chat.status(), { timeout: 10000 }).toBe('idle');
        expect(model.requests).toHaveLength(4);
        expect(search).toHaveBeenCalledTimes(1);
        expect(scoped).toHaveBeenCalledWith(
          expect.any(Object),
          { scope: 'project', scopeId: 'one' },
          'Release',
          { limit: 1, explain: false },
        );
        expect(get).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: f.user.id,
            actor: { kind: 'online-agent', id: expect.any(String) },
          }),
          f.documents[0]!.id,
        );
        expect(get.mock.calls[0]?.[0].actor).not.toHaveProperty('runId');
        const evidence = JSON.stringify(model.requests.slice(1));
        expect(evidence).toContain(f.documents[0]!.id);
        expect(evidence).toContain(f.documents[1]!.id);
        expect(evidence).not.toContain(f.documents[2]!.id);
        expect(evidence).not.toContain(f.hidden.id);
        expect(evidence).toContain('Release procedure for one.');
        expect(evidence).toContain('result');
        expect(evidence).toContain('data');
        for (const request of model.requests) {
          const system = request.messages
            .filter((message) => message.role === 'system')
            .map((message) => message.content)
            .join('\n');
          expect(system.match(/Retrieval policy:/gu)).toHaveLength(1);
          expect(system).toContain(`Retrieval policy: ${policy}.`);
        }
        const headers = authentication.mock.calls
          .map(([headers]) => headers)
          .find((headers) =>
            headers.get('x-nocobase-run-token')?.startsWith('fgo_'),
          );
        const nativeTokens = authentication.mock.calls
          .map(([headers]) => headers.get('x-nocobase-run-token'))
          .filter((token) => token?.startsWith('fgo_'));
        expect(nativeTokens.length).toBeGreaterThanOrEqual(3);
        expect(new Set(nativeTokens).size).toBe(1);
        expect(headers).toBeDefined();
        await expect(f.auth.getSession(headers!)).rejects.toMatchObject({
          reason: 'ONLINE_AGENT_TOKEN_INVALID',
        });
        const configuration = await f.agents.onlineAgent.configuration(
          f.context,
          chat.sessionId,
        );
        f.agents.onlineAgent.configurator.registerOnlineAgentGlobalScope({
          systemPromptTemplate: 'changed defaults',
        });
        const restored = await f.agents.onlineAgent[kind](f.context, {
          sessionId: chat.sessionId,
        });
        await restored.history();
        await restored.status();
        if ('receive' in restored) {
          const stream = await restored.receive();
          await stream?.cancel();
        }
        expect(model.requests).toHaveLength(4);
        expect(search).toHaveBeenCalledTimes(1);
        expect(provider).toHaveBeenCalledTimes(1);
        expect(
          await f.agents.onlineAgent.configuration(f.context, chat.sessionId),
        ).toEqual(configuration);
      } finally {
        await model.close();
      }
    });
  }
