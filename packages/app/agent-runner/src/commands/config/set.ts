import { Args, type Interfaces } from '@oclif/core';

import type { AgentTools } from '../../agent/runner-tools.ts';
import { RunnerCommand, UsageError } from '../../lib/command.ts';
import { readSettings, writeSettings } from '../../lib/config.ts';
import {
  DEFAULT_MIN_FREE_DISK,
  formatFreeSpace,
  parseFreeSpace,
  type FreeSpace,
} from '../../lib/size.ts';

/** The settings `config set` changes, by the name it takes. */
const KEYS = ['min-free-disk', 'agent-tools'] as const;
const AGENT_TOOLS: readonly AgentTools[] = ['runner', 'system'];

export default class ConfigSet extends RunnerCommand {
  static override summary: string = 'Change a runner setting.';
  static override description: string =
    '`min-free-disk` is how much of the disk holding the working directories to keep free: a size (20G, 512M), a ' +
    `share of the disk (10%), or off; ${formatFreeSpace(DEFAULT_MIN_FREE_DISK)} by default. The runner removes only ` +
    'directories whose work is over on its own; below the threshold it warns which are left for `gc` to remove. A ' +
    'running runner reads it at its next collection.\n\n' +
    '`agent-tools` is which Node.js and pnpm agents get: `runner` (the default), the runner’s own, first on their ' +
    'PATH, so a run does not depend on what the machine has installed; or `system`, whatever the machine has on its ' +
    'PATH. Runs started afterwards use it.';
  static override examples: string[] = [
    '<%= config.bin %> config set min-free-disk 20G',
    '<%= config.bin %> config set min-free-disk 10%',
    '<%= config.bin %> config set min-free-disk off',
    '<%= config.bin %> config set agent-tools system',
  ];
  static override args: {
    key: Interfaces.Arg<string>;
    value: Interfaces.Arg<string>;
  } = {
    key: Args.string({
      description: 'The setting.',
      required: true,
      options: [...KEYS],
    }),
    value: Args.string({ description: 'Its new value.', required: true }),
  };

  async run(): Promise<
    | { key: string; minFreeDisk: FreeSpace | null }
    | { key: string; agentTools: AgentTools }
  > {
    const { args } = await this.parse(ConfigSet);
    if (!(KEYS as readonly string[]).includes(args.key))
      throw new UsageError(`Unknown setting ${args.key}.`);
    const settings = await readSettings(this.paths);
    if (args.key === 'agent-tools') {
      const value = args.value as AgentTools;
      if (!AGENT_TOOLS.includes(value))
        throw new UsageError(
          `agent-tools is one of ${AGENT_TOOLS.join(', ')}, not ${args.value}.`,
        );
      settings.agentTools = value;
      await writeSettings(settings, this.paths);
      this.log(
        value === 'runner'
          ? 'Agents get the runner’s own Node.js and pnpm.'
          : 'Agents get the Node.js and pnpm on the machine’s PATH.',
      );
      return { key: args.key, agentTools: value };
    }
    const threshold = parseFreeSpace(args.value, 'min-free-disk');
    settings.minFreeDisk = threshold;
    await writeSettings(settings, this.paths);
    this.log(
      threshold === null
        ? 'The runner removes no working directory for want of disk space.'
        : `The runner keeps ${formatFreeSpace(threshold)} of the disk free.`,
    );
    return { key: args.key, minFreeDisk: threshold };
  }
}
