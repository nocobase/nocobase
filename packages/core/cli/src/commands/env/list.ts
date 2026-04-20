import { Command, Flags } from '@oclif/core';
import { listEnvs } from '../../lib/auth-store.js';
import { formatCliHomeScope, type CliHomeScope } from '../../lib/cli-home.js';
import { renderTable } from '../../lib/ui.js';

export default class EnvList extends Command {
  static summary = 'List configured environments';
  static id = 'env list';

  static flags = {
    scope: Flags.string({
      char: 's',
      description: 'Config scope',
      options: ['project', 'global'],
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(EnvList);
    const scope = flags.scope as Exclude<CliHomeScope, 'auto'> | undefined;
    const { currentEnv, envs } = await listEnvs({ scope });
    const names = Object.keys(envs).sort();

    if (!names.length) {
      this.log(`No envs configured${scope ? ` in ${formatCliHomeScope(scope)} scope` : ''}.`);
      this.log('Run `nb env add --name <name> --base-url <url>` to add one.');
      return;
    }

    const rows = names.map((name) => {
      const env = envs[name];
      return [name === currentEnv ? '*' : '', name, env.baseUrl ?? '', env.auth?.type ?? '', env.runtime?.version ?? ''];
    });

    this.log(renderTable(['Current', 'Name', 'Base URL', 'Auth', 'Runtime'], rows));
  }
}
