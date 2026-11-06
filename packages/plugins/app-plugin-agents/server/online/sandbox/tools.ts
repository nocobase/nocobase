import { z } from 'zod';
import type { OnlineAgentConfigurator } from '../agent/configuration.js';
import { sandboxLimits } from './limits.js';

const registered = new WeakSet<OnlineAgentConfigurator>();
export function registerSandboxTools(
  configurator: OnlineAgentConfigurator,
): void {
  if (registered.has(configurator)) return;
  configurator.registerTool('bash', {
    version: '1',
    definition: {
      description: [
        'Run a shell command in your sandbox (bash syntax; ls, cat, grep, find, sed, awk, jq and the like).',
        'When configured, reach the application with its command line (named in the sandbox instructions); use --help to discover current commands.',
        'Your selected skills are at /skills/<name>/, read-only.',
        `Write scratch files under /tmp only. No network; nothing is installed or run for real, so a skill's scripts cannot be executed. Each command stops after ${sandboxLimits.durationMs / 1000} seconds.`,
      ].join(' '),
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
      description:
        'Read one of your skills: its SKILL.md and the list of its files, which you read with the bash tool. Read a skill when its description matches what you are doing, and follow it.',
      inputSchema: z.object({ name: z.string() }),
      execute: ({ name }, options) => options.context.execution.readSkill(name),
      toModelOutput: ({ output }) => ({ type: 'json', value: output }),
    },
  });
  registered.add(configurator);
}
