import { type Command, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

import { AppCommand } from '../../context.ts';
import {
  collectSecretsStatus,
  DEFAULT_SECRETS_BATCH_SIZE,
  formatVersions,
  requireSecretsService,
  type SecretsStatusResult,
} from '../../lib/secrets-command.ts';

export default class SecretsStatus extends AppCommand {
  static override summary =
    'Report which key sealed the secrets each store holds, and how many need resealing.';
  static override description =
    'Loads the application without starting it and asks every registered secrets store how many values it holds under each key version of secrets.keys, and how many are not sealed with the current key. Nothing is written. Run secrets rotate to reseal what this reports.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %>',
  ];

  static override flags: {
    'batch-size': Interfaces.OptionFlag<number>;
  } = {
    'batch-size': Flags.integer({
      default: DEFAULT_SECRETS_BATCH_SIZE,
      min: 1,
      description: 'Rows read at a time.',
    }),
  };

  public async run(): Promise<SecretsStatusResult> {
    const { flags } = await this.parse(SecretsStatus);
    const result = await this.withApp(async ({ app }) => {
      app.registerProviders();
      return collectSecretsStatus(
        requireSecretsService(app),
        flags['batch-size'],
      );
    });
    this.log(`Current key version: ${result.currentVersion}`);
    if (result.stores.length === 0)
      this.log('No secrets stores are registered.');
    for (const store of result.stores) {
      this.log(
        `${store.name}: ${store.total} sealed (${formatVersions(store.byVersion)}), ${store.needsReseal} to reseal`,
      );
    }
    return result;
  }
}
