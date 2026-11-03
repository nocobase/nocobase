// @vitest-environment node
import { ServiceContainer } from '@nocobase/service-provider';
import { createAppTest } from '@nocobase/app-testing/server';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { expect, it, vi } from 'vitest';
import { knowledgeOnlineAgent } from '../server/online-agent/integration.js';
import { KnowledgeOnlineAgentProvider } from '../server/providers/online-agent.js';
import { createStandaloneServer } from './fixtures/indexing-app/server/standalone.js';

it('does nothing for an installed peer without a registered host service', async () => {
  expect(await knowledgeOnlineAgent(new ServiceContainer())).toBeNull();
});

it('distinguishes the missing optional peer from an installed broken module', async () => {
  vi.doMock('@nocobase/app-plugin-agents/server/tokens', () => {
    throw Object.assign(
      new Error(
        "Cannot find package '@nocobase/app-plugin-agents' imported from knowledge",
      ),
      { code: 'ERR_MODULE_NOT_FOUND' },
    );
  });
  try {
    expect(await knowledgeOnlineAgent(new ServiceContainer())).toBeNull();
  } finally {
    vi.doUnmock('@nocobase/app-plugin-agents/server/tokens');
  }
  vi.doMock('@nocobase/app-plugin-agents/server/tokens', () => {
    throw Object.assign(
      new Error(
        "Cannot find package 'broken-internal-dependency' imported from Agents",
      ),
      { code: 'ERR_MODULE_NOT_FOUND' },
    );
  });
  try {
    await expect(
      knowledgeOnlineAgent(new ServiceContainer()),
    ).rejects.toThrow();
  } finally {
    vi.doUnmock('@nocobase/app-plugin-agents/server/tokens');
  }
});

const test = createAppTest({
  scope: 'test',
  createServer: createStandaloneServer,
});
for (const name of ['first independent app', 'second independent app'])
  test(name, async ({ app }) => {
    const integration = await knowledgeOnlineAgent(app.container);
    expect(integration?.onlineAgent).toBe(
      app.container.resolve(agentsToken).onlineAgent,
    );
    const register = vi.spyOn(
      app.container.resolve(agentsToken).onlineAgent.configurator,
      'registerOnlineAgentGlobalScope',
    );
    const provider = new KnowledgeOnlineAgentProvider(app);
    await provider.boot();
    await provider.boot();
    expect(register).toHaveBeenCalledTimes(1);
    expect(register.mock.calls[0]![0]).toEqual({
      systemPromptTemplate: expect.any(Object),
    });
  });
