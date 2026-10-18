import { z } from 'zod';
import { startNodeAppServer } from '@nocobase/app-server/node';
const { agentsToken } = (await import(
  import.meta.resolve(
    '@nocobase/app-plugin-agents/server/tokens',
    new URL('../../dist/package.json', import.meta.url).href,
  )
)) as typeof import('@nocobase/app-plugin-agents/server/tokens');
const { createStandaloneServer } = (await import(
  new URL('../../dist/server/standalone.js', import.meta.url).href
)) as typeof import('../../server/standalone.js');

// An isolated complete application with deterministic tools registered through its public server SDK.
// Run only against disposable smoke configuration; this fixture never changes installed application source.
const server = await createStandaloneServer({ viteDevUrl: false });
const online = server.application.container.resolve(agentsToken).onlineAgent;
let effects = 0;
online.configurator.registerTool('fixture_action', {
  version: '1',
  definition: {
    inputSchema: z.object({ value: z.string() }),
    needsApproval: true,
    public: {
      input: ({ value }) => ({ value }),
      output: ({ display, calls }) => ({ display, calls }),
    },
    execute: async ({ value }) => {
      if (value === 'uncertain')
        throw new DOMException('Fixture outcome unknown', 'AbortError');
      effects++;
      return { display: 'Action completed', calls: effects };
    },
  },
});
online.configurator.registerOnlineAgentScope('fixture-approval', {
  tool: ['fixture_action'],
});
await startNodeAppServer(server, {
  ...server.listenOptions,
  onListen: (info) =>
    console.log(
      `Local: http://127.0.0.1:${info.port}${server.application.publicBasePath}/`,
    ),
});
