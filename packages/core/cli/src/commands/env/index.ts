import { Command, Flags } from '@oclif/core';
import { getCurrentEnvName, getEnv } from '../../lib/auth-store.js';
import { formatCliHomeScope, type CliHomeScope } from '../../lib/cli-home.js';
import { renderTable } from '../../lib/ui.js';

export default class Env extends Command {
  static summary = 'Show the current environment';
  static id = 'env';

  static flags = {
    scope: Flags.string({
      char: 's',
      description: 'Config scope',
      options: ['project', 'global'],
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Env);
    const scope = flags.scope as Exclude<CliHomeScope, 'auto'> | undefined;
    const envName = await getCurrentEnvName({ scope });
    const env = await getEnv(envName, { scope });

    if (!env?.baseUrl) {
      this.log(`No current env is configured${scope ? ` in ${formatCliHomeScope(scope)} scope` : ''}.`);
      this.log('Run `nb env add --name <name> --base-url <url>` to add one.');
      return;
    }

    this.log(
      renderTable(
        ['Name', 'Base URL', 'Auth', 'Runtime'],
        [[envName, env?.baseUrl ?? '', env?.auth?.type ?? '', env?.runtime?.version ?? '']],
      ),
    );
  }
}
