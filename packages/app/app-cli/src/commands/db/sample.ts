import { AppCommand, appContextOf } from '../../context.ts';
import { type Command, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

import {
  databaseRunChangedNothing,
  runDatabaseSampleCommand,
  type DatabaseCommandResult,
} from '../../database-command.ts';

export default class AppDbSample extends AppCommand {
  static override summary = 'Load outstanding sample data in development.';
  static override description =
    'Sample data loads automatically when app.sampleData is enabled (APP_SAMPLE_DATA=true). Disabled samples leave seed history untouched. This development command runs outstanding sample seeds on the selected connections, then starts the application without serving it to run outstanding sampleDataToken registrations. Successful runs are recorded as executed. Legacy skipped entries are eligible to run.';

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
