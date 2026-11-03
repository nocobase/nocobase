// @vitest-environment node
import { databaseManagerToken } from '@nocobase/db';
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
});
for (const kind of ['realtime', 'background'] as const) {
  test(`${kind}: business policy, final override and tool opt-out survive the global Knowledge template`, async ({
    app,
    fetch,
  }) => {
    const f = await knowledgeAgentFixture(app, fetch);
    const saved = await f.agents.models.services.create({
      title: 'Configuration-only offline model',
      provider: 'openai-compatible',
      baseUrl: 'http://127.0.0.1:1/v1',
      apiKey: 'fixture-only',
      models: [{ value: 'chat', kind: 'chat' }],
    });
    const model = [`${saved.name}/chat`];
    f.agents.onlineAgent.configurator.registerOnlineAgentScope('business', {
      tool: [],
      context: {
        variable: {
          knowledgeRetrieval: 'always',
          unrelated: 'private-business-value',
        },
      },
    });
    const selected = await f.agents.onlineAgent[kind](f.context, {
      scope: ['business'],
      model,
    });
    const configuration = await f.agents.onlineAgent.configuration(
      f.context,
      selected.sessionId,
    );
    expect(configuration.tool).toEqual([]);
    expect(configuration.systemPrompt).toContain('Retrieval policy: always.');
    expect(configuration.systemPrompt).not.toContain('private-business-value');
    const override = await f.agents.onlineAgent[kind](f.context, {
      scope: ['business'],
      model,
      context: { variable: { knowledgeRetrieval: 'on-demand' } },
    });
    const final = await f.agents.onlineAgent.configuration(
      f.context,
      override.sessionId,
    );
    expect(final.tool).toEqual([]);
    expect(final.variable).toEqual({ knowledgeRetrieval: 'on-demand' });
    expect(final.systemPrompt).toContain('Retrieval policy: on-demand.');
    expect(final.systemPrompt).not.toContain('Retrieval policy: always.');
    const runner = await f.agents.onlineAgent.configurator.resolve(f.context, {
      agentId: 'fixture-runner',
    });
    expect(runner.tool).toEqual([]);
    expect(runner.systemPrompt).toContain('Retrieval policy: on-demand.');
  });

  test(`${kind}: invalid policy fails before messages, native credentials or model requests are created`, async ({
    app,
    fetch,
  }) => {
    const f = await knowledgeAgentFixture(app, fetch);
    const model = await startMockOpenAI();
    try {
      const saved = await f.agents.models.services.create({
        title: 'Offline policy guard',
        provider: 'openai-compatible',
        baseUrl: model.url,
        apiKey: 'fixture-only',
        models: [{ value: 'chat', kind: 'chat' }],
      });
      const messages = app.container
        .resolve(databaseManagerToken)
        .connection()
        .repository('agConversationMessages');
      const before = await messages.count();
      const authentication = vi.spyOn(f.auth, 'getSession');
      await expect(
        f.agents.onlineAgent[kind](f.context, {
          model: [`${saved.name}/chat`],
          context: { variable: { knowledgeRetrieval: 'invalid' } },
        }),
      ).rejects.toMatchObject({ reason: 'INVALID_KNOWLEDGE_RETRIEVAL' });
      expect(await messages.count()).toBe(before);
      expect(
        authentication.mock.calls.some(([headers]) =>
          headers.get('x-nocobase-run-token')?.startsWith('fgo_'),
        ),
      ).toBe(false);
      expect(model.requests).toEqual([]);
    } finally {
      await model.close();
    }
  });
}
