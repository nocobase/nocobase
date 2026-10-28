import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';
import { createSessionManager } from '../server/online/agent/persistence/manager.js';
import { AgentsProvider } from '../server/providers/agents.js';
import { agentsToken } from '../server/tokens.js';
import { createHarness } from './harness.js';

it.each([undefined, 'stderr'] as const)(
  'preserves occupied sessions in a command host and repairs them on server startup (%s)',
  async (consoleLogStream) => {
    const h = await createHarness();
    const container = new ServiceContainer();
    container.instance(agentsToken, h.services);
    const provider = new AgentsProvider({
      consoleLogStream,
      container,
    } as AppPluginApplication);
    try {
      let next = 0;
      const sessions = createSessionManager({
        tx: h.services.tx,
        ids: { next: () => `startup-${++next}` },
        attachments: { attach: async () => [] },
        now: () => new Date(0).toISOString(),
      });
      const config = {
        scope: [],
        systemPrompt: '',
        tool: [],
        toolVersions: {},
        model: ['fixture/chat'],
      };
      const model = { modelService: 'fixture', model: 'chat' };
      const id = await sessions.create('alice', 'background', config, model);
      await sessions.native.accept(
        'alice',
        id,
        {
          id: 'accepted',
          parts: [{ type: 'text', text: 'Already accepted by the server' }],
          attachments: [],
        },
        config,
        model,
        'startup-execution',
        'startup-answer',
        { config, model },
      );
      await provider.boot();
      await provider.boot();
      expect((await sessions.load('alice', id)).call).toMatchObject(
        consoleLogStream === 'stderr'
          ? { state: 'running' }
          : { state: 'idle', outcome: 'failed' },
      );
      expect(
        await sessions.native.messages.model(
          (await sessions.native.executionSnapshot('alice', id)).replay,
        ),
      ).toHaveLength(1);
      const history = await sessions.native.history('alice', id);
      expect(history).toHaveLength(consoleLogStream === 'stderr' ? 1 : 2);
      if (consoleLogStream !== 'stderr')
        expect(history.at(-1)).toMatchObject({
          id: 'startup-answer',
          role: 'assistant',
        });
    } finally {
      await provider.shutdown();
      await h.close();
    }
  },
);
