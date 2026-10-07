import { AppCommand, appContextOf } from '../../context.ts';
import { type Command, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

import {
  databaseRunChangedNothing,
  runDatabaseSampleCommand,
  type DatabaseCommandResult,
} from '../../database-command.ts';

export default class AppDbSample extends AppCommand {
  static override summary =
    'Load the sample data an installation skipped, for development.';
  static override description =
    'Sample data — seeds declared with sample: true and what plugins register on sampleDataToken — loads by itself only when the database is installed with app.sampleData set (APP_SAMPLE_DATA=true); otherwise each is recorded as skipped. This runs every sample seed recorded as skipped on the selected connections, then starts the application without serving it and builds every registered sample data service recorded as skipped or not at all, recording each as executed. A deployment refuses it: sample data never goes into a production database this way.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static override flags: {
    all: Interfaces.BooleanFlag<boolean>;
    connection: Interfaces.OptionFlag<string | undefined>;
  } = {
    all: Flags.boolean({
      default: false,
      exclusive: ['connection'],
      description:
        'Run all managed connections; report external connections as skipped.',
    }),
    connection: Flags.string({
      exclusive: ['all'],
      description: 'Target a named managed connection, regardless of autoRun.',
    }),
  };

  public async run(): Promise<DatabaseCommandResult> {
    const { flags } = await this.parse(AppDbSample);
    const result = await runDatabaseSampleCommand(
      this,
      flags,
      appContextOf(this),
    );
    if (result.sampleData?.failed.length) this.setStatus('partial-success');
    else if (
      databaseRunChangedNothing(result) &&
      !result.sampleData?.executed.length
    )
      this.setStatus('success-noop');
    return result;
  }
}
