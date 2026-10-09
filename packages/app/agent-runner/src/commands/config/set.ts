import { Args, type Interfaces } from '@oclif/core';

import { RunnerCommand, UsageError } from '../../lib/command.ts';
import { readSettings, writeSettings } from '../../lib/config.ts';
import { formatSize, parseSize } from '../../lib/size.ts';

/** The settings `config set` changes, by the name it takes. */
const KEYS = ['workspace-limit'] as const;

export default class ConfigSet extends RunnerCommand {
  static override summary: string = 'Change a runner setting.';
  static override description: string =
    '`workspace-limit` is the most disk the working directories may take, across every application (40G, 512M, or ' +
    'off). Over it, the runner removes directories whose work is over first, then pushed ones least recently used, ' +
    'and never unpushed work. A running runner reads it at its next collection.';
  static override examples: string[] = [
    '<%= config.bin %> config set workspace-limit 40G',
    '<%= config.bin %> config set workspace-limit off',
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

  async run(): Promise<{ key: string; workspaceLimit: number | null }> {
    const { args } = await this.parse(ConfigSet);
    if (!(KEYS as readonly string[]).includes(args.key))
      throw new UsageError(`Unknown setting ${args.key}.`);
    const settings = await readSettings(this.paths);
    const limit = parseSize(args.value, 'workspace-limit');
    if (limit === undefined) delete settings.workspaceLimit;
    else settings.workspaceLimit = limit;
    await writeSettings(settings, this.paths);
    this.log(
      limit === undefined
        ? 'The working directories have no size limit.'
        : `The working directories may take ${formatSize(limit)}.`,
    );
    return { key: args.key, workspaceLimit: limit ?? null };
  }
}
