import { z } from 'zod';
import type { OnlineAgentConfigurator } from '../agent/configuration.js';

const registered = new WeakSet<OnlineAgentConfigurator>();
export function registerSandboxTools(
  configurator: OnlineAgentConfigurator,
): void {
  if (registered.has(configurator)) return;
  configurator.registerTool('bash', {
    version: '1',
    definition: {
      description:
        'Execute a bounded virtual shell command, including the application CLI.',
      inputSchema: z.object({ command: z.string() }),
      async execute({ command }, options) {
        const sandbox = await options.context.execution.getSandbox();
        return sandbox.exec(command, options);
      },
      toModelOutput: ({ output }) => ({ type: 'json', value: output }),
    },
  });
  configurator.registerTool('skill', {
    version: '1',
    definition: {
      description: 'Read a selected skill by its slug.',
      inputSchema: z.object({ name: z.string() }),
      execute: ({ name }, options) => options.context.execution.readSkill(name),
      toModelOutput: ({ output }) => ({ type: 'json', value: output }),
    },
  });
  registered.add(configurator);
}
