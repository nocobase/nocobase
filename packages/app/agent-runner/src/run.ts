// `nocobase-runner`: the runner's commands on their own (src/commands.ts). The oclif configuration is synthesized here
// rather than read from package.json, so the same code runs from `src/` (Node strips the types) and from `dist/`.
import { Config, Errors, flush, run, type Interfaces } from '@oclif/core';

import { runnerHost } from './host.ts';

const TOPICS: Record<string, { description: string }> = {
  service: { description: 'Run the runner as a user service.' },
};

function pjson(fromSource: boolean): Interfaces.PJSON {
  const host = runnerHost();
  const extension = fromSource ? 'ts' : 'js';
  return {
    name: host.bin,
    version: host.version,
    description:
      'Run this machine as a runtime for NocoBase applications: register it, start it, and run the agent runs they hand out.',
    oclif: {
      bin: host.bin,
      dirname: host.bin,
      topicSeparator: ' ',
      additionalHelpFlags: ['-h'],
      topics: TOPICS,
      commands: {
        strategy: 'explicit',
        target: `${fromSource ? './src' : './dist'}/commands.${extension}`,
        identifier: 'COMMANDS',
      },
    },
  };
}

/** Runs `nocobase-runner` with `argv`, and exits the way oclif does. */
export async function runRunner(
  argv: string[] = process.argv.slice(2),
): Promise<void> {
  try {
    const loaded = await Config.load({
      root: runnerHost().packageRoot,
      pjson: pjson(import.meta.filename.endsWith('.ts')),
    });
    await run(argv, loaded);
    await flush();
  } catch (error) {
    await Errors.handle(error as Error);
  }
}
