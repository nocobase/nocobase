import { Args, type Interfaces } from '@oclif/core';

import { RunnerCommand, UsageError } from '../../lib/command.ts';
import { readSettings, writeSettings } from '../../lib/config.ts';
import {
  DEFAULT_MIN_FREE_DISK,
  formatFreeSpace,
  parseFreeSpace,
  type FreeSpace,
} from '../../lib/size.ts';

/** The settings `config set` changes, by the name it takes. */
const KEYS = ['min-free-disk'] as const;

export default class ConfigSet extends RunnerCommand {
  static override summary: string = 'Change a runner setting.';
  static override description: string =
    '`min-free-disk` is how much of the disk holding the working directories to keep free: a size (20G, 512M), a ' +
    `share of the disk (10%), or off; ${formatFreeSpace(DEFAULT_MIN_FREE_DISK)} by default. Below it, the runner ` +
    'removes directories whose work is over first, then pushed ones least recently used, until enough is free, and ' +
    'never unpushed work. A running runner reads it at its next collection.';
  static override examples: string[] = [
    '<%= config.bin %> config set min-free-disk 20G',
    '<%= config.bin %> config set min-free-disk 10%',
    '<%= config.bin %> config set min-free-disk off',
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

  async run(): Promise<{ key: string; minFreeDisk: FreeSpace | null }> {
    const { args } = await this.parse(ConfigSet);
    if (!(KEYS as readonly string[]).includes(args.key))
      throw new UsageError(`Unknown setting ${args.key}.`);
    const settings = await readSettings(this.paths);
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
