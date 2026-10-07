import { Flags } from '@oclif/core';
import type { Command, Interfaces } from '@oclif/core';
import path from 'node:path';

import { AppCommand } from '../../context.ts';
import { readCliApplication, requireCliBrand } from '../../lib/cli-brand.ts';
import { linkCli, type CliLinkResult } from '../../lib/cli-link.ts';

export default class CliLink extends AppCommand {
  static override summary =
    "Make this application's CLI a local command, without packing it.";
  static override description =
    'Links the command line package.json declares under nocobase.cli into node_modules/.bin (so `pnpm exec <bin>` runs it), or into --bin-dir. It runs @nocobase/app-cli-client as this application resolves it, from its sources in a source checkout, and carries a copy of the skills nocobase.cli.skills names, as the packaged CLI would. Link again after changing nocobase.cli or the skills. A runner started from the checkout uses it with `register --cli <bin>=<the link>`.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --bin-dir ~/.local/bin',
  ];

  static override flags: {
    'bin-dir': Interfaces.OptionFlag<string | undefined>;
  } = {
    'bin-dir': Flags.string({
      description:
        'The directory to put the command in. Defaults to node_modules/.bin.',
    }),
  };

  public async run(): Promise<CliLinkResult> {
    const { flags } = await this.parse(CliLink);
    const application = await readCliApplication(this.rootDir);
    const brand = requireCliBrand(application);
    const result = await linkCli(
      application,
      brand,
      path.resolve(
        this.rootDir,
        flags['bin-dir'] ?? path.join('node_modules', '.bin'),
      ),
    );
    this.log(
      `Linked ${result.bin} ${result.version}: ${result.command}${
        result.skills.length > 0 ? ` (skills: ${result.skills.join(', ')})` : ''
      }`,
    );
    return result;
  }
}
