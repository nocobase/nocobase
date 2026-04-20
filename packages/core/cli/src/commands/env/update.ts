import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command, Flags } from '@oclif/core';
import { updateEnvRuntime } from '../../lib/bootstrap.js';
import { formatCliHomeScope, type CliHomeScope } from '../../lib/cli-home.js';
import { failTask, startTask, succeedTask } from '../../lib/ui.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class EnvUpdate extends Command {
  static summary = 'Refresh an environment runtime from swagger:get and persist connection overrides';
  static id = 'env update';

  static flags = {
    verbose: Flags.boolean({
      description: 'Show detailed progress output',
      default: false,
    }),
    env: Flags.string({
      char: 'e',
      description: 'Environment name',
    }),
    scope: Flags.string({
      char: 's',
      description: 'Config scope',
      options: ['project', 'global'],
    }),
    'base-url': Flags.string({
      description: 'NocoBase API base URL override. When provided, persist it to the target env before saving the refreshed runtime.',
    }),
    role: Flags.string({
      description: 'Role override, sent as X-Role',
    }),
    token: Flags.string({
      char: 't',
      description: 'API key override. When provided, persist it to the target env before saving the refreshed runtime.',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(EnvUpdate);
    const scope = flags.scope as Exclude<CliHomeScope, 'auto'> | undefined;
    const envLabel = flags.env ?? 'current';

    startTask(`Updating env runtime: ${envLabel}${scope ? ` (${formatCliHomeScope(scope)})` : ''}`);

    try {
      const runtime = await updateEnvRuntime({
        envName: flags.env,
        scope,
        baseUrl: flags['base-url'],
        role: flags.role,
        token: flags.token,
        configFile: path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'nocobase-ctl.config.json'),
        verbose: flags.verbose,
      });

      succeedTask(`Updated env "${envLabel}" to runtime "${runtime.version}"${scope ? ` in ${formatCliHomeScope(scope)} scope` : ''}.`);
    } catch (error) {
      failTask(`Failed to update env "${envLabel}".`);
      throw error;
    }
  }
}
