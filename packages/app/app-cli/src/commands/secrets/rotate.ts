import { type Command, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

import { CommandError } from '../../command/errors.ts';
import { AppCommand } from '../../context.ts';
import {
  DEFAULT_SECRETS_BATCH_SIZE,
  requireSecretsService,
  rotateSecrets,
  type SecretsRotateResult,
} from '../../lib/secrets-command.ts';

export default class SecretsRotate extends AppCommand {
  static override summary =
    'Reseal every stored secret under the current key of secrets.keys.';
  static override description =
    'Put the new key first in secrets.keys with a higher version, keep the old ones after it, and run this: every registered secrets store rewrites the values not sealed with the current key, a batch at a time. Each value is rewritten only if it is unchanged since it was read, so this can run beside the application, and running it again finishes an interrupted run or changes nothing. Values that cannot be opened are left as they are and reported. Once nothing is left to reseal, the old keys can be removed. Changing the current key also signs everyone out, because sign-in cookies are signed with it.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> --dry-run --json',
    '<%= config.bin %> <%= command.id %>',
  ];

  static override flags: {
    'dry-run': Interfaces.BooleanFlag<boolean>;
    'batch-size': Interfaces.OptionFlag<number>;
  } = {
    'dry-run': Flags.boolean({
      default: false,
      description: 'Count what would be resealed and write nothing.',
    }),
    'batch-size': Flags.integer({
      default: DEFAULT_SECRETS_BATCH_SIZE,
      min: 1,
      description: 'Rows read and rewritten at a time.',
    }),
  };

  public async run(): Promise<SecretsRotateResult> {
    const { flags } = await this.parse(SecretsRotate);
    const result = await this.withApp(async ({ app }) => {
      app.registerProviders();
      return rotateSecrets(
        requireSecretsService(app),
        { batchSize: flags['batch-size'], dryRun: flags['dry-run'] },
        (store) =>
          this.log(
            `${store.name}: ${store.resealed} ${flags['dry-run'] ? 'to reseal' : 'resealed'}${
              store.failed ? `, ${store.failed} could not be opened` : ''
            }`,
          ),
      );
    });
    if (result.failed > 0) {
      throw new CommandError(
        `${result.failed} stored secret(s) could not be opened with any configured key and were left as they were.`,
        {
          code: 'SECRETS_RESEAL_FAILED',
          details: result,
          suggestions: [
            'Add the key that sealed them back to secrets.keys, then run secrets rotate again.',
          ],
        },
      );
    }
    if (flags['dry-run'] || result.resealed === 0)
      this.setStatus('success-noop');
    this.log(
      flags['dry-run']
        ? `${result.resealed} value(s) would be resealed under key version ${result.currentVersion}.`
        : `${result.resealed} value(s) resealed under key version ${result.currentVersion}.`,
    );
    return result;
  }
}
