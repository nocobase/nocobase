import { Args, Command, Flags } from '@oclif/core';
import { getCurrentEnvName, removeEnv } from '../../lib/auth-store.js';
import { formatCliHomeScope, type CliHomeScope } from '../../lib/cli-home.js';
import { confirmAction, isInteractiveTerminal, printVerbose, setVerboseMode } from '../../lib/ui.js';

export default class EnvRemove extends Command {
  static id = 'env remove';
  static summary = 'Remove a configured environment';

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Remove without confirmation',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed progress output',
      default: false,
    }),
    scope: Flags.string({
      char: 's',
      description: 'Config scope',
      options: ['project', 'global'],
    }),
  };

  static args = {
    name: Args.string({
      description: 'Configured environment name',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvRemove);
    setVerboseMode(flags.verbose);
    const scope = flags.scope as Exclude<CliHomeScope, 'auto'> | undefined;
    const currentEnv = await getCurrentEnvName({ scope });

    if (args.name === currentEnv && !flags.force) {
      if (!isInteractiveTerminal()) {
        this.error('Refusing to remove the current env without confirmation. Re-run with `--force`.');
      }

      const confirmed = await confirmAction(`Remove current env "${args.name}"?`, { defaultValue: false });
      if (!confirmed) {
        this.log('Canceled.');
        return;
      }
    }

    printVerbose(`Removing env "${args.name}"`);
    const result = await removeEnv(args.name, { scope });

    this.log(`Removed env "${result.removed}"${scope ? ` from ${formatCliHomeScope(scope)} scope` : ''}.`);

    if (result.hasEnvs) {
      this.log(`Current env: ${result.currentEnv}`);
      return;
    }

    this.log('No envs configured.');
  }
}
